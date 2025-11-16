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
  HttpCode,
  HttpStatus,
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
import { CreateReportDto, UpdateReportDto, FilterReportsDto } from '@repo/api';
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
          example: 'The streetlight in front of building number 42 has been broken for 3 days',
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
  ) {
    // Valida il numero di immagini
    if (!images || images.length < MIN_IMAGES || images.length > MAX_IMAGES) {
      throw new BadRequestException(REPORT_ERROR_MESSAGES.IMAGES_REQUIRED);
    }

    // Valida il tipo di file
    for (const image of images) {
      if (!ALLOWED_IMAGE_MIMETYPES.includes(image.mimetype as any)) {
        throw new BadRequestException(
          REPORT_ERROR_MESSAGES.INVALID_FILE_TYPE(image.mimetype),
        );
      }
      // Valida la dimensione
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

  @Get()
  @ApiOperation({
    summary: 'Get all reports with optional filters',
    description: `Returns a list of reports. Supports filtering by status, category, user, and geographical area.`,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
  })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'minLongitude', required: false, type: Number })
  @ApiQuery({ name: 'maxLongitude', required: false, type: Number })
  @ApiQuery({ name: 'minLatitude', required: false, type: Number })
  @ApiQuery({ name: 'maxLatitude', required: false, type: Number })
  @ApiQuery({ name: 'searchLongitude', required: false, type: Number })
  @ApiQuery({ name: 'searchLatitude', required: false, type: Number })
  @ApiQuery({ name: 'radiusMeters', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of reports retrieved successfully',
  })
  async findAll(@Query() filters: FilterReportsDto) {
    const reports = await this.reportsService.findAll(filters);
    return { success: true, data: reports };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby reports',
    description: `Returns reports near a specific location, ordered by distance.`,
  })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Search radius in meters (default: 5000)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby reports retrieved successfully',
  })
  async findNearby(
    @Query('longitude') longitude: string,
    @Query('latitude') latitude: string,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseFloat(radius) : 5000;
    const reports = await this.reportsService.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      radiusMeters,
    );
    return { success: true, data: reports };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a report by ID',
    description: `Returns a specific report with its relations.`,
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Report with specified ID does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'Report with ID abc123 not found',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id') id: string) {
    const report = await this.reportsService.findOne(id);
    return { success: true, data: report };
  }

  @Patch(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('officier', 'user')
  @ApiOperation({
    summary: 'Update a report (Officier/User only)',
    description:
      'Update report details including status and location. **Access:** Requires officier or User role.',
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiBody({ type: UpdateReportDto })
  @ApiResponse({
    status: 200,
    description: 'Report updated successfully',
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
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Insufficient permissions (officier or user role required)',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Report with specified ID does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'Report with ID abc123 not found',
        error: 'Not Found',
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    const report = await this.reportsService.update(id, updateReportDto);
    return { success: true, data: report };
  }

  @Delete(':id')
  @Roles('Officier')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a report (Officier only)',
    description: `Permanently delete a report.
      **Access:** Requires Officier role.`,
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 204,
    description: 'Report deleted successfully',
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
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (admin role required)',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Report with specified ID does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'Report with ID abc123 not found',
        error: 'Not Found',
      },
    },
  })
  async remove(@Param('id') id: string) {
    await this.reportsService.remove(id);
  }
}
