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
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly minioProvider: MinioProvider,
  ) {}

  private createPointGeometry(longitude: number, latitude: number): Point {
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }

  /**
   * Extract coordinates from a Point geometry
   *
   * NOTE: This method is currently unused but will be useful for future features
   * such as extracting coordinates for display, coordinate-based filtering,
   * or returning coordinate data in specific API responses.
   *
   * @param location - WKT format string: POINT(longitude latitude)
   * @returns Object with longitude and latitude values
   */
  // private extractCoordinates(location: string): {
  //   longitude: number;
  //   latitude: number;
  // } {
  //   // Parse WKT format: POINT(longitude latitude)
  //   const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  //   if (match) {
  //     return {
  //       longitude: parseFloat(match[1]),
  //       latitude: parseFloat(match[2]),
  //     };
  //   }
  //   return { longitude: 0, latitude: 0 };
  // }

  async create(
    createReportDto: CreateReportDto,
    userId: string,
    images: Express.Multer.File[],
  ): Promise<Report> {
    const { longitude, latitude, ...reportData } = createReportDto;

    // Upload images to MinIO (always required, validated in controller)
    const imageUrls: string[] = [];
    try {
      for (const image of images) {
        const reportId = nanoid();
        const timestamp = Date.now();
        const fileName = `reports/${reportId}/${timestamp}-${image.originalname}`;
        
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
      id: nanoid(),
      ...reportData,
      location: this.createPointGeometry(longitude, latitude),
      userId,
      images: imageUrls,
    });

    return await this.reportRepository.save(report);
  }

  async findAll(filters?: FilterReportsDto): Promise<Report[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.category', 'category');

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

    // Bounding box filter (geographical area)
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

    // Radius filter (distance from a point)
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

    return await query.getMany();
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['user', 'category'],
    });

    if (!report) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    return report;
  }

  async update(id: string, updateReportDto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);

    const { longitude, latitude, ...updateData } = updateReportDto;

    // Update location if coordinates are provided
    if (longitude !== undefined && latitude !== undefined) {
      report.location = this.createPointGeometry(longitude, latitude);
    }

    Object.assign(report, updateData);

    return await this.reportRepository.save(report);
  }

  async remove(id: string): Promise<void> {
    const report = await this.findOne(id);
    
    // Delete images from MinIO before deleting the report
    if (report.images && report.images.length > 0) {
      try {
        const fileNames = report.images.map(url =>
          this.minioProvider.extractFileNameFromUrl(url),
        );
        await this.minioProvider.deleteFiles(fileNames);
      } catch (error) {
        throw new InternalServerErrorException(
          REPORT_ERROR_MESSAGES.IMAGE_DELETE_FAILED,
        );
      }
    }
    
    await this.reportRepository.remove(report);
  }

  /**
   * Get reports with their distance from a specific point
   */
  async findNearby(
    longitude: number,
    latitude: number,
    radiusMeters: number = 5000,
  ): Promise<Array<Report & { distance: number }>> {
    const reports = await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.category', 'category')
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

    return reports.entities.map((entity, index) => ({
      ...entity,
      distance: parseFloat(reports.raw[index].distance),
    }));
  }
}
