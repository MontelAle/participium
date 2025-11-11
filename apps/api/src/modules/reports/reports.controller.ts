import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto, UpdateReportDto, FilterReportsDto } from '@repo/api';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new report',
    description: `Create a new report with geolocation data.
      **Access:** Any authenticated user can create a report.`,
  })
  @ApiBody({ type: CreateReportDto })
  @ApiResponse({
    status: 201,
    description: 'Report created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
    schema: {
      example: {
        statusCode: 400,
        message: ['longitude must not be less than -180', 'latitude must not be greater than 90'],
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
  async create(@Body() createReportDto: CreateReportDto, @Request() req) {
    const report = await this.reportsService.create(
      createReportDto,
      req.user.id,
    );
    return { success: true, data: report };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all reports with optional filters',
    description: `Returns a list of reports. Supports filtering by status, category, user, and geographical area.
      **Access:** All authenticated users.`,
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'resolved', 'rejected'] })
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
  async findAll(@Query() filters: FilterReportsDto) {
    const reports = await this.reportsService.findAll(filters);
    return { success: true, data: reports };
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Find nearby reports',
    description: `Returns reports near a specific location, ordered by distance.
      **Access:** All authenticated users.`,
  })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in meters (default: 5000)' })
  @ApiResponse({
    status: 200,
    description: 'Nearby reports retrieved successfully',
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
    description: `Returns a specific report with its relations.
      **Access:** All authenticated users.`,
  })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({
    status: 200,
    description: 'Report retrieved successfully',
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
  @Roles('admin', 'operator')
  @ApiOperation({
    summary: 'Update a report (Admin/Operator only)',
    description: `Update report details including status and location.
      **Access:** Requires admin or operator role.`,
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
    description: 'Forbidden - Insufficient permissions (admin or operator role required)',
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
  async update(@Param('id') id: string, @Body() updateReportDto: UpdateReportDto) {
    const report = await this.reportsService.update(id, updateReportDto);
    return { success: true, data: report };
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a report (Admin only)',
    description: `Permanently delete a report.
      **Access:** Requires admin role.`,
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