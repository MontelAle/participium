import { Controller, Get, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiCookieAuth,
} from '@nestjs/swagger';
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

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Get all roles (Admin only)',
    description: `Returns a list of all available roles in the system.
                  **Access:** Requires admin role.`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
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
  async findAll() {
    const roles = await this.rolesService.findAll();
    return { success: true, data: roles };
  }
}
