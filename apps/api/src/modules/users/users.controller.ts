import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiCookieAuth, 
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  CreateMunicipalityUserDto
} from '@repo/api';

@ApiTags('Users')
@Controller('users')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('municipality')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get all municipality users (Admin only)',
    description: `Returns a list of all users with municipality roles.
      **Access:** Requires admin role.`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of municipality users retrieved successfully'
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
  async getMunicipalityUsers() {
    const users = await this.usersService.findMunicipalityUsers();
    return { success: true, data: users };
  }

  @Post('municipality')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create municipality user (Admin only)',
    description: `Creates a new user account with a municipality role
                  **Access:** Requires admin role`,
  })
  @ApiBody({ 
    type: CreateMunicipalityUserDto,
    examples: {
      adminUser: {
        summary: 'Create admin user',
        value: {
          email: 'admin@municipality.gov',
          username: 'admin_user',
          firstName: 'Admin',
          lastName: 'User',
          password: 'SecureAdminPass123',
          role: 'admin',
        },
      }
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Municipality user created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Invalid email format',
          'Role must be admin',
          'Password must be at least 6 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing session',
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
    description: 'Not Found - Specified role does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'Role not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User with this email already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with this email already exists',
        error: 'Conflict',
      },
    },
  })
  async createMunicipalityUser(@Body() dto: CreateMunicipalityUserDto) {
    const user = await this.usersService.createMunicipalityUser(dto);
    return { success: true, data: user };
  }
}
