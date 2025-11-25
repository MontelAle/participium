import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OfficesService } from './offices.service';

@ApiTags('Offices')
@Controller('offices')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  /**
   * Retrieves a list of all available offices in the system. (Admin only)
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   */
  @Get()
  @Roles('admin','pr_officer')
  async findAll() {
    const offices = await this.officesService.findAll();
    return { success: true, data: offices };
  }
}
