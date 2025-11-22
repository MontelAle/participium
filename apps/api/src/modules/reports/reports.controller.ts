import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
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
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new report with images',
    description: `Create a new report with geolocation data and up to 3 images (min 1, max 3).
      **Access:** Any authenticated user can create a report.
      **Images:** Must be JPEG, PNG, or WebP. Max 5MB per image.`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['longitude', 'latitude', 'images'],
      properties: {
        title: { type: 'string', example: 'Broken streetlight on Main Street' },
        description: {
          type: 'string',
          example:
            'The streetlight in front of building number 42 has been broken for 3 days',
        },
        longitude: { type: 'number', example: 7.686864 },
        latitude: { type: 'number', example: 45.070312 },
        address: { type: 'string', example: 'Via Roma 42, 10100 Torino' },
        categoryId: { type: 'string', example: 'cat_streetlight' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          minItems: 1,
          maxItems: 3,
          description: 'Images (min 1, max 3)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or missing images',
    schema: {
      example: {
        statusCode: 400,
        message: 'You must upload between 1 and 3 images',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing session',
    schema: {
      example: {
        statusCode: 401,
        message: 'No session token',
        error: 'Unauthorized',
      },
    },
  })
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
  async findAll(
    @Query() filters: FilterReportsDto,
  ): Promise<ReportsResponseDto> {
    const reports = await this.reportsService.findAll(filters);
    return { success: true, data: reports };
  }

  /**
   * Finds nearby reports based on location and radius.
   */
  @Get('nearby')
  async findNearby(
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('radius') radius?: string,
  ): Promise<ReportsResponseDto> {
    const radiusMeters = radius ? parseFloat(radius) : 5000;
    const reports = await this.reportsService.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      radiusMeters,
    );
    return { success: true, data: reports };
  }

  /**
   * Retrieves a report by its ID.
   *
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReportResponseDto> {
    const report = await this.reportsService.findOne(id);
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
  @Roles('officier', 'user', 'municipal_pr_officer')
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    const report = await this.reportsService.update(id, updateReportDto);
    return { success: true, data: report };
  }

  /**
   * Deletes a report by its ID.
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('Officier')
  async remove(@Param('id') id: string) {
    await this.reportsService.remove(id);
  }
}
