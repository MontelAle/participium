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
  Patch,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiCookieAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SessionGuard } from '../auth/guards/session-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreateMunicipalityUserDto,
  UpdateMunicipalityUserDto,
  MunicipalityUserResponseDto,
  MunicipalityUsersResponseDto,
  MunicipalityUserIdResponseDto,
} from '../../common/dto/municipality-user.dto';
import {
  UpdateProfileDto,
  UpdateProfileResponseDto,
} from '../../common/dto/user.dto';
import type { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import {
  USER_ERROR_MESSAGES,
  ALLOWED_PROFILE_PICTURE_MIMETYPES,
  MAX_PROFILE_PICTURE_SIZE,
} from './constants/error-messages';

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
  @Roles('admin')
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

  /**
   * Updates the current user's profile.
   *
   * @throws {400} Bad Request - Invalid data or file type
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @Patch('profile')
  @UseGuards(SessionGuard)
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        telegramUsername: { type: 'string', example: '@username' },
        emailNotificationsEnabled: { type: 'boolean', example: true },
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture (JPEG, PNG, or WebP, max 5MB)',
        },
      },
    },
  })
  async updateProfile(
    @Req() req: RequestWithUserSession,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UpdateProfileResponseDto> {
    if (file) {
      if (!ALLOWED_PROFILE_PICTURE_MIMETYPES.includes(file.mimetype as any)) {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.INVALID_PROFILE_PICTURE_TYPE(file.mimetype),
        );
      }
      if (file.size > MAX_PROFILE_PICTURE_SIZE) {
        throw new BadRequestException(
          USER_ERROR_MESSAGES.PROFILE_PICTURE_SIZE_EXCEEDED,
        );
      }
    }

    const updatedUser = await this.usersService.updateProfile(
      req.user.id,
      dto,
      file,
    );

    return {
      success: true,
      data: {
        id: updatedUser.id,
        telegramUsername: updatedUser.telegramUsername,
        emailNotificationsEnabled: updatedUser.emailNotificationsEnabled,
        profilePictureUrl: updatedUser.profilePictureUrl,
      },
    };
  }
}
