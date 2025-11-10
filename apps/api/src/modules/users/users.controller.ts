import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Param, Delete } from '@nestjs/common';
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
  CreateMunicipalityUserDto,
  UpdateMunicipalityUserDto
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

  @Get('municipality/user/:id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get municipality user by ID (Admin only)',
    description: `Returns the municipality user with its role.
      **Access:** Requires admin role.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality user retrieved successfully'
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
  async getMunicipalityUserById(@Param('id') id: string) {
    const users = await this.usersService.findMunicipalityUserById(id);
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
          'Role must be admin or moderator',
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

  @Delete('municipality/user/:id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete municipality user by ID (Admin only)',
    description: `Deletes the municipality user with the specified ID.
      **Access:** Requires admin role.`,
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality user deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'User deleted successfully',
        data: {
          id: '123',
        },
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
    description: 'Not Found - User with specified ID does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  async deleteMunicipalityUserById(@Param('id') id: string) {
    await this.usersService.deleteMunicipalityUserById(id);
    return { success: true, message: 'User deleted successfully', data: { id } };
  }

  @Post('municipality/user/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update municipality user by ID (Admin only)',
    description: `Updates the municipality user with the specified ID.
      **Access:** Requires admin role.`,
  })
  @ApiBody({ 
    type: UpdateMunicipalityUserDto,
    examples: {
      updateUser: {
        summary: 'Update user information',
        value: {
          email: 'updated@municipality.gov',
          username: 'updated_user',
          firstName: 'Updated',
          lastName: 'Name',
          role: 'municipal_administrator',
        },
      }
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Municipality user updated successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: '123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error - Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Invalid email format',
          'Role must be a valid role name',
        ],
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
    description: 'Not Found - User with specified ID does not exist',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Email already in use by another user',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already in use',
        error: 'Conflict',
      },
    },
  })
  // params and body as requested
  async updateMunicipalityUserById(@Param('id') id: string, @Body() dto: UpdateMunicipalityUserDto) {
    await this.usersService.updateMunicipalityUserById(id, dto);
    // returns only Id of the updated user
    return { success: true, data: { id } };
  }
}
