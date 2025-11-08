import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';

@Controller('roles')
@UseGuards(SessionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();
    return { success: true, data: roles };
  }
}
