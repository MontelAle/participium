import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportsDto,
  ReportResponseDto,
  ReportsResponseDto,
} from '../../common/dto/report.dto';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  REPORT_ERROR_MESSAGES,
  ALLOWED_IMAGE_MIMETYPES,
  MAX_IMAGE_SIZE,
  MIN_IMAGES,
  MAX_IMAGES,
} from './constants/error-messages';

@ApiTags('Reports')
@Controller('reports')
@ApiCookieAuth('session_token')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Creates a new report.
   *
   *
   * @throws {400} Bad Request - Invalid data
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @Post()
  @UseGuards(SessionGuard, RolesGuard)
  @UseInterceptors(FilesInterceptor('images', 3))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFiles() images: Express.Multer.File[],
    @Request() req,
  ): Promise<ReportResponseDto> {
    if (!images || images.length < MIN_IMAGES || images.length > MAX_IMAGES) {
      throw new BadRequestException(REPORT_ERROR_MESSAGES.IMAGES_REQUIRED);
    }
    for (const image of images) {
      if (!ALLOWED_IMAGE_MIMETYPES.includes(image.mimetype as any)) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.INVALID_FILE_TYPE(image.mimetype),
        );
      }
      if (image.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.FILE_SIZE_EXCEEDED(image.originalname),
        );
      }
    }

    const report = await this.reportsService.create(
      createReportDto,
      req.user.id,
      images,
    );
    return { success: true, data: report };
  }

  /**
   * Retrieves all reports with optional filters.
   *
   */
  @Get()
  @UseGuards(SessionGuard)
  async findAll(
    @Request() req,
    @Query() filters: FilterReportsDto,
  ): Promise<ReportsResponseDto> {
    const reports = await this.reportsService.findAll(req.user, filters);
    return { success: true, data: reports };
  }

  /**
   * Finds nearby reports based on location and radius.
   */
  @Get('nearby')
  @UseGuards(SessionGuard)
  async findNearby(
    @Request() req,
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('radius') radius?: string,
  ): Promise<ReportsResponseDto> {
    const radiusMeters = radius ? Number.parseFloat(radius) : 5000;
    const reports = await this.reportsService.findNearby(
      Number.parseFloat(longitude),
      Number.parseFloat(latitude),
      radiusMeters,
      req.user,
    );
    return { success: true, data: reports };
  }

  /**
   * Retrieves a report by its ID.
   *
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Get(':id')
  @UseGuards(SessionGuard)
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.findOne(id, req.user);
    return { success: true, data: report };
  }

  /**
   * Updates a report by its ID.
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (officier or user role required)
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Patch(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('pr_officer', 'officer')
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.update(id, updateReportDto);
    return { success: true, data: report };
  }

  /**
   * Finds reports assigned to a specific user (officer).
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (pr_officer, or officer role required)
   * */
  @Get('/user/:userId')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('pr_officer', 'officer')
  async findByUserId(
    @Param('userId') userId: string,
    @Request() req,
  ): Promise<ReportsResponseDto> {
    const reports = await this.reportsService.findByUserId(userId, req.user);
    return { success: true, data: reports };
  }
}
