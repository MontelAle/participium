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
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportsDto,
} from '../../common/dto/report.dto';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reports')
@Controller('reports')
@ApiCookieAuth('session_token')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Creates a new report.
   *
   *
   * @throws {201} Report created successfully
   * @throws {400} Bad Request - Invalid data
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @Post()
  @UseGuards(SessionGuard, RolesGuard)
  async create(@Body() createReportDto: CreateReportDto, @Request() req) {
    const report = await this.reportsService.create(
      createReportDto,
      req.user.id,
    );
    return { success: true, data: report };
  }

  /**
   * Retrieves all reports with optional filters.
   *
   *
   * @throws {200} List of reports retrieved successfully
   */
  @Get()
  async findAll(@Query() filters: FilterReportsDto) {
    const reports = await this.reportsService.findAll(filters);
    return { success: true, data: reports };
  }

  /**
   * Finds nearby reports based on location and radius.
   *
   * @throws {200} Nearby reports retrieved successfully
   */
  @Get('nearby')
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

  /**
   * Retrieves a report by its ID.
   *
   *
   * @throws {200} Report retrieved successfully
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const report = await this.reportsService.findOne(id);
    return { success: true, data: report };
  }

  /**
   * Updates a report by its ID.
   *
   *
   * @throws {200} Report updated successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (officier or user role required)
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Patch(':id')
  @UseGuards(SessionGuard, RolesGuard)
  @Roles('officier', 'user')
  async update(
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    const report = await this.reportsService.update(id, updateReportDto);
    return { success: true, data: report };
  }

  /**
   * Deletes a report by its ID.
   *
   *
   * @throws {204} Report deleted successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Report with specified ID does not exist
   */
  @Delete(':id')
  @Roles('Officier')
  async remove(@Param('id') id: string) {
    await this.reportsService.remove(id);
  }
}
