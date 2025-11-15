import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Retrieves a list of all available roles in the system. (Admin only)
   *
   * @throws {200} List of roles retrieved successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   */
  @Get()
  @Roles('admin')
  async findAll() {
    const roles = await this.rolesService.findAll();
    return { success: true, data: roles };
  }
}
