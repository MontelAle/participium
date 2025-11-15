import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateMunicipalityUserDto,
  UpdateMunicipalityUserDto,
} from '../../common/dto/municipality-user.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(SessionGuard, RolesGuard)
@ApiCookieAuth('session_token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Retrieves a list of all users with municipality roles. (Admin only)
   *
   *
   * @throws {200} List of municipality users retrieved successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   *
   */
  @Get('municipality')
  @Roles('admin')
  async getMunicipalityUsers() {
    const users = await this.usersService.findMunicipalityUsers();
    return { success: true, data: users };
  }

  /**
   * Retrieves a municipality user by ID. (Admin only)
   *
   * @throws {200} Municipality user retrieved successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Municipality user with specified ID does not exist
   */
  @Get('municipality/user/:id')
  @Roles('admin')
  async getMunicipalityUserById(@Param('id') id: string) {
    const users = await this.usersService.findMunicipalityUserById(id);
    return { success: true, data: users };
  }

  /**
   * Creates a new municipality user. (Admin only)
   *
   * @throws {201} Municipality user created successfully
   * @throws {400} Validation error - Invalid input data
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Specified role does not exist
   * @throws {409} Conflict - User with this username/email already exists
   */
  @Post('municipality')
  @Roles('admin')
  async createMunicipalityUser(@Body() dto: CreateMunicipalityUserDto) {
    const user = await this.usersService.createMunicipalityUser(dto);
    return { success: true, data: user };
  }

  /**
   * Deletes a municipality user by ID. (Admin only)
   *
   * @throws {200} Municipality user deleted successfully
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Municipality user with specified ID does not exist
   */
  @Delete('municipality/user/:id')
  @Roles('admin')
  async deleteMunicipalityUserById(@Param('id') id: string) {
    await this.usersService.deleteMunicipalityUserById(id);
    return { success: true, data: { id } };
  }

  /**
   * Updates a municipality user by ID. (Admin only)
   *
   * @throws {200} Municipality user updated successfully
   * @throws {400} Validation error - Invalid input data
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - User with specified ID does not exist
   * @throws {409} Conflict - username already in use by another user
   */
  @Post('municipality/user/:id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin')
  async updateMunicipalityUserById(
    @Param('id') id: string,
    @Body() dto: UpdateMunicipalityUserDto,
  ) {
    await this.usersService.updateMunicipalityUserById(id, dto);
    return { success: true, data: { id } };
  }
}
