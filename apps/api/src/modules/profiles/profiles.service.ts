import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateProfileDto } from '@repo/api';
import { nanoid } from 'nanoid';
import path from 'path';
import { Profile } from '../../common/entities/profile.entity';
import { Repository } from 'typeorm';
import { USER_ERROR_MESSAGES } from '../users/constants/error-messages';
import { MinioProvider } from '../../providers/minio/minio.provider';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    private readonly minioProvider: MinioProvider,
  ) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException(USER_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    if (dto.telegramUsername !== undefined) {
      profile.telegramUsername = dto.telegramUsername || null;
    }

    if (dto.emailNotificationsEnabled !== undefined) {
      profile.emailNotificationsEnabled =
        dto.emailNotificationsEnabled === 'true';
    }

    if (file) {
      const sanitizedFilename = path
        .basename(file.originalname)
        .replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `profile-pictures/${userId}/${nanoid()}-${sanitizedFilename}`;
      const fileUrl = await this.minioProvider.uploadFile(
        fileName,
        file.buffer,
        file.mimetype,
      );

      if (profile.profilePictureUrl) {
        try {
          const oldFileName = this.minioProvider.extractFileNameFromUrl(
            profile.profilePictureUrl,
          );
          await this.minioProvider.deleteFile(oldFileName);
        } catch {
          // Ignore errors if old file doesn't exist
        }
      }

      profile.profilePictureUrl = fileUrl;
    }

    return this.profileRepository.save(profile);
  }

  async findProfileById(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return profile;
  }
}
