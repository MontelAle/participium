import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateMunicipalityUserDto,
  MunicipalityUserIdResponseDto,
  MunicipalityUserResponseDto,
  MunicipalityUsersResponseDto,
  UpdateMunicipalityUserDto,
} from '@repo/api';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { UsersService } from './users.service';

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
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   *
   */
  @Get('municipality')
  @Roles('admin', 'pr_officer')
  async getMunicipalityUsers(): Promise<MunicipalityUsersResponseDto> {
    const users = await this.usersService.findMunicipalityUsers();
    return { success: true, data: users };
  }

  /**
   * Retrieves a municipality user by ID. (Admin only)
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Municipality user with specified ID does not exist
   */
  @Get('municipality/user/:id')
  @Roles('admin')
  async getMunicipalityUserById(
    @Param('id') id: string,
  ): Promise<MunicipalityUserResponseDto> {
    const user = await this.usersService.findMunicipalityUserById(id);
    return { success: true, data: user };
  }

  /**
   * Creates a new municipality user. (Admin only)
   *
   * @throws {400} Validation error - Invalid input data
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Specified role does not exist
   * @throws {409} Conflict - User with this username/email already exists
   */
  @Post('municipality')
  @Roles('admin')
  async createMunicipalityUser(
    @Body() dto: CreateMunicipalityUserDto,
  ): Promise<MunicipalityUserResponseDto> {
    const user = await this.usersService.createMunicipalityUser(dto);
    return { success: true, data: user };
  }

  /**
   * Deletes a municipality user by ID. (Admin only)
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Municipality user with specified ID does not exist
   */
  @Delete('municipality/user/:id')
  @Roles('admin')
  async deleteMunicipalityUserById(
    @Param('id') id: string,
  ): Promise<MunicipalityUserIdResponseDto> {
    await this.usersService.deleteMunicipalityUserById(id);
    return { success: true, data: { id } };
  }

  /**
   * Updates a municipality user by ID. (Admin only)
   *
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
  ): Promise<MunicipalityUserIdResponseDto> {
    await this.usersService.updateMunicipalityUserById(id, dto);
    return { success: true, data: { id } };
  }
}
