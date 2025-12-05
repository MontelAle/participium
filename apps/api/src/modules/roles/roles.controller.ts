import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { RolesResponseDto } from '@repo/api';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Retrieves a list of all available roles in the system. (Admin only)
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   */
  @Get()
  @Roles('admin')
  async findAll(): Promise<RolesResponseDto> {
    const roles = await this.rolesService.findAll();
    return { success: true, data: roles };
  }
}
