import {
  Boundary,
  Category,
  Comment,
  Message,
  Report,
  ReportStatus,
  User,
} from '@entities';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import path from 'node:path';
import { Point, Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { REPORT_ERROR_MESSAGES } from './constants/error-messages';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  CreateReportDto,
  DashboardStatsDto,
  FilterReportsDto,
  UpdateReportDto,
} from './dto/reports.dto';

const PRIVILEGED_ROLES = ['pr_officer', 'tech_officer'];

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Boundary)
    private readonly boundaryRepository: Repository<Boundary>,
    private readonly minioProvider: MinioProvider,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
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
      relations: [
        'user',
        'user.role',
        'category',
        'assignedOfficer',
        'assignedExternalMaintainer',
      ],
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

  private async validateCoordinatesWithinBoundary(
    longitude: number,
    latitude: number,
  ): Promise<void> {
    const result = await this.boundaryRepository
      .createQueryBuilder('boundary')
      .where(
        `ST_Contains(boundary.geometry, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))`,
        { longitude, latitude },
      )
      .getOne();

    if (!result) {
      throw new BadRequestException(
        REPORT_ERROR_MESSAGES.COORDINATES_OUTSIDE_BOUNDARY,
      );
    }
  }

  async create(
    createReportDto: CreateReportDto,
    userId: string,
    images: Express.Multer.File[],
  ): Promise<Report> {
    const { longitude, latitude, isAnonymous, ...reportData } = createReportDto;

    await this.validateCoordinatesWithinBoundary(longitude, latitude);

    const reportId = nanoid();
    const imageUrls: string[] = [];
    try {
      for (const image of images) {
        const timestamp = Date.now();
        const sanitizedFilename = path
          .basename(image.originalname)
          .replaceAll(/[^a-zA-Z0-9.-]/g, '_');
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
      .leftJoinAndSelect('report.assignedOfficer', 'assignedOfficer')
      .leftJoinAndSelect(
        'report.assignedExternalMaintainer',
        'assignedExternalMaintainer',
      );

    if (viewer.role?.name === 'user') {
      query.andWhere(
        `(report.status != 'rejected' OR report.userId = :viewerId)`,
        { viewerId: viewer.id },
      );
    }

    if (viewer.role?.name === 'external_maintainer') {
      query.andWhere('report.assignedExternalMaintainerId = :viewerId', {
        viewerId: viewer.id,
      });
    }

    if (viewer.role?.name === 'pr_officer') {
      query.andWhere('report.status = :forcedStatus', {
        forcedStatus: 'pending',
      });
    } else if (filters?.status) {
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

  async findAllPublic(filters?: FilterReportsDto): Promise<Report[]> {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('report.category', 'category')
      .leftJoinAndSelect('report.assignedOfficer', 'assignedOfficer')
      .leftJoinAndSelect(
        'report.assignedExternalMaintainer',
        'assignedExternalMaintainer',
      );

    // For public users, only show reports that are not rejected
    query.andWhere(`report.status != 'rejected'`);

    if (filters?.status) {
      query.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters?.categoryId) {
      query.andWhere('report.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
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

    // For public view, always sanitize anonymous reports (no viewer to compare against)
    return reports.map((report) => {
      if (!report.isAnonymous) {
        return report;
      }
      const sanitized = { ...report };
      sanitized.user = null;
      return sanitized as Report;
    });
  }

  async findOne(id: string, viewer: User): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: [
        'user',
        'user.role',
        'category',
        'assignedOfficer',
        'assignedExternalMaintainer',
      ],
    });

    if (!report) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    if (
      viewer.role?.name === 'user' &&
      report.status === 'rejected' &&
      report.userId !== viewer.id
    ) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    if (
      viewer.role?.name === 'external_maintainer' &&
      report.assignedExternalMaintainerId !== viewer.id
    ) {
      throw new NotFoundException(REPORT_ERROR_MESSAGES.REPORT_NOT_FOUND(id));
    }

    return this.sanitizeReport(report, viewer);
  }

  async update(
    id: string,
    updateReportDto: UpdateReportDto,
    actor?: User,
  ): Promise<Report> {
    const report = await this.findReportEntity(id);

    if (actor?.role?.name === 'external_maintainer') {
      if (report.assignedExternalMaintainerId !== actor.id) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NOT_ASSIGNED_TO_REPORT,
        );
      }
      this.validateExternalMaintainerStatusChange(report, updateReportDto);
    }

    // Allow privileged officers to change status following allowed transitions
    if (
      actor?.role?.name === 'pr_officer' ||
      actor?.role?.name === 'tech_officer'
    ) {
      this.validateOfficerStatusChange(report, updateReportDto, actor);
    }

    this.updateReportLocation(report, updateReportDto);

    await this.updateReportCategory(report, updateReportDto);

    if (updateReportDto.status === 'assigned') {
      await this.assignOfficerToReport(
        report,
        updateReportDto.assignedOfficerId,
      );
    }

    if (updateReportDto.assignedExternalMaintainerId !== undefined) {
      await this.assignExternalMaintainerToReport(
        report,
        updateReportDto.assignedExternalMaintainerId,
      );
    }

    if (
      actor &&
      (updateReportDto.status === 'assigned' ||
        updateReportDto.status === 'rejected')
    ) {
      report.processedById = actor.id;
    }
    this.applyBasicUpdates(report, updateReportDto);

    return await this.reportRepository.save(report);
  }

  private updateReportLocation(report: Report, dto: UpdateReportDto): void {
    if (dto.longitude !== undefined && dto.latitude !== undefined) {
      report.location = this.createPointGeometry(dto.longitude, dto.latitude);
    }
  }

  private async updateReportCategory(
    report: Report,
    dto: UpdateReportDto,
  ): Promise<void> {
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
        relations: ['office'],
      });
      report.category = category;
    }
  }

  private applyBasicUpdates(report: Report, dto: UpdateReportDto): void {
    const { title, description, status, address, images, explanation } = dto;
    const fieldsToUpdate = {
      title,
      description,
      status,
      address,
      images,
      explanation,
    };

    Object.entries(fieldsToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        (report as any)[key] = value;
      }
    });
  }

  private async assignOfficerToReport(
    report: Report,
    assignedOfficerId?: string,
  ): Promise<void> {
    if (assignedOfficerId !== undefined && assignedOfficerId !== '') {
      await this.assignSpecificOfficer(report, assignedOfficerId);
    } else {
      await this.assignOfficerAutomatically(report);
    }
  }

  private async assignSpecificOfficer(
    report: Report,
    officerId: string,
  ): Promise<void> {
    const officer = await this.userRepository.findOne({
      where: { id: officerId },
      relations: ['office'],
    });

    if (!officer) {
      throw new NotFoundException(
        REPORT_ERROR_MESSAGES.OFFICER_NOT_FOUND(officerId),
      );
    }

    // Validate officer belongs to the correct office for the report's category
    const category =
      report.category ||
      (await this.categoryRepository.findOne({
        where: { id: report.categoryId },
        relations: ['office'],
      }));

    if (category?.office && officer.officeId !== category.office.id) {
      throw new BadRequestException(
        REPORT_ERROR_MESSAGES.OFFICER_NOT_FOR_CATEGORY(
          officerId,
          report.categoryId,
        ),
      );
    }

    report.assignedOfficer = officer;
    report.assignedOfficerId = officer.id;
  }

  private async assignOfficerAutomatically(report: Report): Promise<void> {
    const category =
      report.category ||
      (await this.categoryRepository.findOne({
        where: { id: report.categoryId },
        relations: ['office'],
      }));

    if (category?.office?.id) {
      const officerWithFewestReports = await this.findOfficerWithFewestReports(
        category.office.id,
      );

      if (officerWithFewestReports) {
        report.assignedOfficer = officerWithFewestReports;
        report.assignedOfficerId = officerWithFewestReports.id;
      }
    }
  }

  private async assignExternalMaintainerToReport(
    report: Report,
    assignedExternalMaintainerId?: string,
  ): Promise<void> {
    if (assignedExternalMaintainerId) {
      const externalMaintainer = await this.userRepository.findOne({
        where: { id: assignedExternalMaintainerId },
        relations: ['role', 'office'],
      });

      if (
        !externalMaintainer ||
        externalMaintainer.role?.name !== 'external_maintainer'
      ) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_INVALID_USER,
        );
      }

      // Validate external maintainer belongs to the correct office for the report's category
      const category =
        report.category ||
        (await this.categoryRepository.findOne({
          where: { id: report.categoryId },
          relations: ['externalOffice'],
        }));

      if (
        category?.externalOffice &&
        externalMaintainer.officeId !== category.externalOffice.id
      ) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_NOT_FOR_CATEGORY(
            assignedExternalMaintainerId,
            report.categoryId,
          ),
        );
      }

      report.assignedExternalMaintainer = externalMaintainer;
      report.assignedExternalMaintainerId = externalMaintainer.id;
    } else {
      report.assignedExternalMaintainer = null;
      report.assignedExternalMaintainerId = null;
    }
  }

  private validateExternalMaintainerStatusChange(
    report: Report,
    updateDto: UpdateReportDto,
  ): void {
    if (!updateDto.status) {
      return;
    }

    const allowedTransitions: Record<ReportStatus, string[]> = {
      pending: [],
      assigned: ['in_progress'],
      in_progress: ['resolved'],
      resolved: [],
      rejected: [],
    };

    const allowedNextStatuses = allowedTransitions[report.status];

    if (
      !allowedNextStatuses ||
      !allowedNextStatuses.includes(updateDto.status)
    ) {
      throw new BadRequestException(
        REPORT_ERROR_MESSAGES.EXTERNAL_MAINTAINER_INVALID_STATUS_TRANSITION(
          report.status,
          updateDto.status,
        ),
      );
    }

    private validateOfficerStatusChange(
      report: Report,
      updateDto: UpdateReportDto,
      actor: User,
    ): void {
      if (!updateDto.status) return;

      // Define allowed transitions per officer role
      const prOfficerTransitions: Record<ReportStatus, ReportStatus[]> = {
        pending: [ReportStatus.IN_PROGRESS, ReportStatus.ASSIGNED, ReportStatus.REJECTED],
        assigned: [ReportStatus.IN_PROGRESS, ReportStatus.REJECTED],
        in_progress: [ReportStatus.RESOLVED, ReportStatus.REJECTED],
        resolved: [],
        rejected: [],
      };

      const techOfficerTransitions: Record<ReportStatus, ReportStatus[]> = {
        pending: [ReportStatus.ASSIGNED],
        assigned: [ReportStatus.IN_PROGRESS, ReportStatus.REJECTED],
        in_progress: [ReportStatus.RESOLVED],
        resolved: [],
        rejected: [],
      };

      const roleName = actor.role?.name;
      let allowedNext: ReportStatus[] | undefined;

      if (roleName === 'pr_officer') {
        allowedNext = prOfficerTransitions[report.status];
      } else if (roleName === 'tech_officer') {
        allowedNext = techOfficerTransitions[report.status];
      }

      if (!allowedNext || !allowedNext.includes(updateDto.status as ReportStatus)) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.OFFICER_INVALID_STATUS_TRANSITION(
            report.status,
            updateDto.status,
            roleName,
          ),
        );
      }
    }
  }

  private async findOfficerWithFewestReports(
    officeId: string,
  ): Promise<User | null> {
    const officers = await this.userRepository.find({
      where: { officeId },
      relations: ['role'],
    });

    const technicalOfficers = officers.filter(
      (officer) => officer.role?.name === 'tech_officer',
    );

    if (technicalOfficers.length === 0) {
      return null;
    }

    const officerIds = technicalOfficers.map((o) => o.id);
    const rawCounts = await this.reportRepository
      .createQueryBuilder('report')
      .select('report.assignedOfficerId', 'id')
      .addSelect('COUNT(report.id)', 'count')
      .where('report.assignedOfficerId IN (:...ids)', { ids: officerIds })
      .andWhere('report.status = :status', { status: 'assigned' })
      .groupBy('report.assignedOfficerId')
      .getRawMany();

    const countsMap = new Map<string, number>(
      rawCounts.map((r) => [r.id, Number.parseInt(r.count, 10)]),
    );

    const officerReportCounts = technicalOfficers.map((officer) => ({
      officer,
      count: countsMap.get(officer.id) || 0,
    }));

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
      .andWhere('report.status != :rejectedStatus', {
        rejectedStatus: 'rejected',
      })
      .orderBy('distance', 'ASC')
      .getRawAndEntities();

    return reports.entities.map((entity, index) => {
      const sanitizedEntity = this.sanitizeReport(entity, viewer);
      return {
        ...sanitizedEntity,
        distance: Number.parseFloat(reports.raw[index].distance),
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

  async getDashboardStats(user: User): Promise<DashboardStatsDto> {
    const qb = this.reportRepository.createQueryBuilder('report');

    const stats = await qb
      .select('COUNT(report.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN report.status = 'pending' THEN 1 ELSE 0 END)`,
        'pending',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'in_progress' THEN 1 ELSE 0 END)`,
        'in_progress',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'resolved' THEN 1 ELSE 0 END)`,
        'resolved',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'assigned' THEN 1 ELSE 0 END)`,
        'assigned_global',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'rejected' THEN 1 ELSE 0 END)`,
        'rejected_global',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'assigned' AND (report.assignedOfficerId = :userId OR report.processedById = :userId OR report.assignedExternalMaintainerId = :userId) THEN 1 ELSE 0 END)`,
        'user_assigned',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'rejected' AND (report.assignedOfficerId = :userId OR report.processedById = :userId OR report.assignedExternalMaintainerId = :userId) THEN 1 ELSE 0 END)`,
        'user_rejected',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'in_progress' AND (report.assignedOfficerId = :userId OR report.assignedExternalMaintainerId = :userId) THEN 1 ELSE 0 END)`,
        'user_in_progress',
      )
      .addSelect(
        `SUM(CASE WHEN report.status = 'resolved' AND (report.assignedOfficerId = :userId OR report.assignedExternalMaintainerId = :userId) THEN 1 ELSE 0 END)`,
        'user_resolved',
      )
      .setParameters({ userId: user.id })
      .getRawOne();

    return {
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      in_progress: Number(stats.in_progress || 0),
      resolved: Number(stats.resolved || 0),
      assigned: Number(stats.assigned_global || 0),
      rejected: Number(stats.rejected_global || 0),
      user_assigned: Number(stats.user_assigned || 0),
      user_rejected: Number(stats.user_rejected || 0),
      user_in_progress: Number(stats.user_in_progress || 0),
      user_resolved: Number(stats.user_resolved || 0),
    };
  }

  async getCommentsForReport(
    reportId: string,
    viewer: User,
  ): Promise<Comment[]> {
    // Optionally: check report exists and user can view
    await this.findOne(reportId, viewer);
    return this.commentRepository.find({
      where: { reportId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async getMessagesForReport(
    reportId: string,
    viewer: User,
  ): Promise<Message[]> {
    // Ensure report exists and viewer can view
    await this.findOne(reportId, viewer);
    return this.messageRepository.find({
      where: { reportId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async addCommentToReport(
    reportId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // Optionally: check report exists
    const comment = this.commentRepository.create({
      content: dto.content,
      reportId,
      userId,
    });
    return this.commentRepository.save(comment);
  }

  async addMessageToReport(
    reportId: string,
    userId: string,
    dto: CreateMessageDto,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      content: dto.content,
      reportId,
      userId,
    });
    return this.messageRepository.save(message);
  }
}
