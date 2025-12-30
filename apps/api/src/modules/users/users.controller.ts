import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import {
  CreateMunicipalityUserDto,
  ExternalMaintainersResponseDto,
  MunicipalityUserIdResponseDto,
  MunicipalityUserResponseDto,
  MunicipalityUsersResponseDto,
  OfficeRoleAssignmentDto,
  UpdateMunicipalityUserDto,
  UserOfficeRolesResponseDto,
} from './dto/municipality-users.dto';
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
  async getMunicipalityUsers(
    @Query('categoryId') categoryId?: string,
  ): Promise<MunicipalityUsersResponseDto> {
    const users = await this.usersService.findMunicipalityUsers(categoryId);
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

  /**
   * Retrieves a list of external maintainers, optionally filtered by category.
   *
   * @throws {400} Bad Request - Category has no external office assigned
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin or tech_officer role required)
   * @throws {404} Not Found - Category not found or no external maintainers for category
   */
  @Get('external-maintainers')
  @Roles('admin', 'tech_officer')
  async getExternalMaintainers(
    @Query('categoryId') categoryId?: string,
  ): Promise<ExternalMaintainersResponseDto> {
    const maintainers =
      await this.usersService.findExternalMaintainers(categoryId);
    return { success: true, data: maintainers };
  }

  /**
   * Get all office role assignments for a user. (Admin only)
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   */
  @Get('municipality/user/:id/office-roles')
  @Roles('admin')
  async getUserOfficeRoles(
    @Param('id') userId: string,
  ): Promise<UserOfficeRolesResponseDto> {
    const assignments = await this.usersService.getUserOfficeRoles(userId);
    return { success: true, data: assignments };
  }

  /**
   * Assign a user to an office with a specific role. (Admin only)
   *
   * @throws {400} Bad Request - Invalid assignment (wrong office type, role mixing, etc.)
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - User, role, or office not found
   * @throws {409} Conflict - Assignment already exists
   */
  @Post('municipality/user/:id/office-roles')
  @Roles('admin')
  async assignUserToOffice(
    @Param('id') userId: string,
    @Body() dto: OfficeRoleAssignmentDto,
  ): Promise<UserOfficeRolesResponseDto> {
    const assignment = await this.usersService.assignUserToOffice(
      userId,
      dto.officeId,
      dto.roleId,
    );
    return { success: true, data: [assignment] };
  }

  /**
   * Remove a user's assignment from an office. (Admin only)
   *
   * @throws {400} Bad Request - Cannot remove last role
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Insufficient permissions (admin role required)
   * @throws {404} Not Found - Assignment not found
   */
  @Delete('municipality/user/:id/office-roles/:officeId')
  @Roles('admin')
  async removeUserFromOffice(
    @Param('id') userId: string,
    @Param('officeId') officeId: string,
  ): Promise<MunicipalityUserIdResponseDto> {
    await this.usersService.removeUserFromOffice(userId, officeId);
    return { success: true, data: { id: userId } };
  }
}
