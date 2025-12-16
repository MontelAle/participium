import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { OfficesResponseDto } from './dto/offices.dto';
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
  @Roles('admin', 'pr_officer', 'tech_officer')
  async findAll(): Promise<OfficesResponseDto> {
    const offices = await this.officesService.findAll();
    return { success: true, data: offices };
  }
}
