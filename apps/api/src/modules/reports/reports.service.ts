import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point, Repository } from 'typeorm';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportsDto,
} from '../../common/dto/report.dto';
import { Report } from '../../common/entities/report.entity';
import { nanoid } from 'nanoid';
import { MinioProvider } from '../../providers/minio/minio.provider';
import path from 'path';
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';
import { Category } from '../../common/entities/category.entity';
import { User } from '../../common/entities/user.entity';
const PRIVILEGED_ROLES = ['pr_officer', 'officer'];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly minioProvider: MinioProvider,
  ) {}

  private createPointGeometry(longitude: number, latitude: number): Point {
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }

  private async findReportEntity(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['user', 'user.role', 'category', 'assignedOfficer'],
    });

    if (!report) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    return report;
  }

  private sanitizeReport(report: Report, viewer: User): Report {
    if (!report.isAnonymous) {
      return report;
    }

    if (viewer.id === report.userId) {
      return report;
    }

    if (viewer.role && PRIVILEGED_ROLES.includes(viewer.role.name)) {
      return report;
    }

    const sanitized = { ...report };
    sanitized.user = null;
    return sanitized as Report;
  }

  async create(
    createReportDto: CreateReportDto,
    userId: string,
    images: Express.Multer.File[],
  ): Promise<Report> {
    const { longitude, latitude, isAnonymous, ...reportData } = createReportDto;

    const reportId = nanoid();
    const imageUrls: string[] = [];
    try {
      for (const image of images) {
        const timestamp = Date.now();
        const sanitizedFilename = path
          .basename(image.originalname)
          .replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `reports/${reportId}/${timestamp}-${sanitizedFilename}`;

        const imageUrl = await this.minioProvider.uploadFile(
          fileName,
          image.buffer,
          image.mimetype,
        );
        imageUrls.push(imageUrl);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        REPORT_ERROR_MESSAGES.IMAGE_UPLOAD_FAILED,
      );
    }

    const report = this.reportRepository.create({
      id: reportId,
      ...reportData,
      location: this.createPointGeometry(longitude, latitude),
      userId,
      images: imageUrls,
      isAnonymous: isAnonymous ?? false,
    });

    return await this.reportRepository.save(report);
  }

  async findAll(viewer: User, filters?: FilterReportsDto): Promise<Report[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('report.category', 'category')
      .leftJoinAndSelect('report.assignedOfficer', 'assignedOfficer');

    if (filters?.status) {
      query.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters?.categoryId) {
      query.andWhere('report.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.userId) {
      query.andWhere('report.userId = :userId', { userId: filters.userId });
    }

    if (
      filters?.minLongitude !== undefined &&
      filters?.maxLongitude !== undefined &&
      filters?.minLatitude !== undefined &&
      filters?.maxLatitude !== undefined
    ) {
      query.andWhere(
        `ST_Contains(
          ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326),
          report.location
        )`,
        {
          minLng: filters.minLongitude,
          minLat: filters.minLatitude,
          maxLng: filters.maxLongitude,
          maxLat: filters.maxLatitude,
        },
      );
    }

    if (
      filters?.searchLongitude !== undefined &&
      filters?.searchLatitude !== undefined &&
      filters?.radiusMeters !== undefined
    ) {
      query.andWhere(
        `ST_DWithin(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:searchLng, :searchLat), 4326)::geography,
          :radius
        )`,
        {
          searchLng: filters.searchLongitude,
          searchLat: filters.searchLatitude,
          radius: filters.radiusMeters,
        },
      );
    }

    query.orderBy('report.createdAt', 'DESC');

    const reports = await query.getMany();

    return reports.map((report) => this.sanitizeReport(report, viewer));
  }

  async findOne(id: string, viewer: User): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['user', 'user.role', 'category', 'assignedOfficer'],
    });

    if (!report) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    return this.sanitizeReport(report, viewer);
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findReportEntity(id);

    const {
      longitude,
      latitude,
      title,
      description,
      status,
      address,
      images,
      categoryId,
      explanation,
      assignedOfficerId,
    } = updateReportDto;

    if (longitude !== undefined && latitude !== undefined) {
      report.location = this.createPointGeometry(longitude, latitude);
    }

    if (categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateReportDto.categoryId },
        relations: ['office'],
      });

      report.category = category;
    }

    if (status === 'assigned') {
      if (assignedOfficerId !== undefined && assignedOfficerId !== '') {
        const officer = await this.userRepository.findOne({
          where: { id: assignedOfficerId },
        });
        if (officer) {
          report.assignedOfficer = officer;
          report.assignedOfficerId = officer.id;
        }
      } else {
        const category =
          report.category ||
          (await this.categoryRepository.findOne({
            where: { id: report.categoryId },
            relations: ['office'],
          }));

        if (category?.office?.id) {
          const officerWithFewestReports =
            await this.findOfficerWithFewestReports(category.office.id);

          if (officerWithFewestReports) {
            report.assignedOfficer = officerWithFewestReports;
            report.assignedOfficerId = officerWithFewestReports.id;
          }
        }
      }
    }

    Object.entries({
      title,
      description,
      status,
      address,
      images,
      explanation,
    }).forEach(([key, value]) => {
      if (value !== undefined) {
        (report as any)[key] = value;
      }
    });

    return await this.reportRepository.save(report);
  }

  private async findOfficerWithFewestReports(
    officeId: string,
  ): Promise<User | null> {
    const officers = await this.userRepository.find({
      where: { officeId },
      relations: ['role'],
    });

    const technicalOfficers = officers.filter(
      (officer) =>
        officer.role?.name === 'officer' ||
        officer.role?.name === 'tech_officer',
    );

    if (technicalOfficers.length === 0) {
      return null;
    }

    const officerReportCounts = await Promise.all(
      technicalOfficers.map(async (officer) => {
        const count = await this.reportRepository.count({
          where: {
            assignedOfficerId: officer.id,
            status: 'assigned' as any,
          },
        });
        return { officer, count };
      }),
    );

    officerReportCounts.sort((a, b) => a.count - b.count);
    return officerReportCounts[0].officer;
  }

  async findNearby(
    longitude: number,
    latitude: number,
    radiusMeters: number = 5000,
    viewer: User,
  ): Promise<Array<Report & { distance: number }>> {
    const reports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.category', 'category')
      .leftJoinAndSelect('report.assignedOfficer', 'assignedOfficer')
      .addSelect(
        `ST_Distance(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )`,
        'distance',
      )
      .where(
        `ST_DWithin(
          report.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lng: longitude, lat: latitude, radius: radiusMeters },
      )
      .orderBy('distance', 'ASC')
      .getRawAndEntities();

    return reports.entities.map((entity, index) => {
      const sanitizedEntity = this.sanitizeReport(entity, viewer);
      return {
        ...sanitizedEntity,
        distance: parseFloat(reports.raw[index].distance),
      };
    });
  }

  async findByUserId(targetUserId: string, viewer: User): Promise<Report[]> {
    const reports = await this.reportRepository.find({
      where: { assignedOfficerId: targetUserId },
      relations: ['user', 'category', 'assignedOfficer'],
      order: { createdAt: 'DESC' },
    });
    return reports.map((report) => this.sanitizeReport(report, viewer));
  }
}
