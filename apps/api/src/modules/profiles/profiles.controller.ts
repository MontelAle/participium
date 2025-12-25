import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { RequestWithUserSession } from '../../common/types/request-with-user-session.type';
import { SessionGuard } from '../../modules/auth/guards/session-auth.guard';
import {
  ALLOWED_PROFILE_PICTURE_MIMETYPES,
  MAX_PROFILE_PICTURE_SIZE,
  USER_ERROR_MESSAGES,
} from '../../modules/users/constants/error-messages';
import { ProfileResponseDto, UpdateProfileDto } from './dto/profiles.dto';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}
  /**
   * Updates the current user's profile.
   *
   * @throws {400} Bad Request - Invalid data or file type
   * @throws {401} Unauthorized - Invalid or missing session
   */
  @Patch('profile/me')
  @UseGuards(SessionGuard)
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiConsumes('multipart/form-data')
  async updateProfile(
    @Req() req: RequestWithUserSession,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    // Only regular users (not municipality users) can edit their profile
    if (req.user.role?.isMunicipal) {
      throw new ForbiddenException(
        USER_ERROR_MESSAGES.MUNICIPALITY_USER_CANNOT_EDIT_PROFILE,
      );
    }

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

    const updatedUser = await this.profilesService.updateProfile(
      req.user.id,
      dto,
      file,
    );

    return {
      success: true,
      data: updatedUser,
    };
  }

  /**
   * Retrieves the profile of the current user by ID.
   *
   * @throws {401} Unauthorized - Invalid or missing session
   * @throws {403} Forbidden - Accessing another user's profile
   */
  @Get('profile/me')
  @UseGuards(SessionGuard)
  async getUserProfileById(
    @Req() req: RequestWithUserSession,
  ): Promise<ProfileResponseDto> {
    const id = req.user.id;

    const user = await this.profilesService.findProfileById(id);

    return {
      success: true,
      data: user,
    };
  }
}
