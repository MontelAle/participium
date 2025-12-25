import { Account, Profile, User } from '@entities';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import path from 'node:path';
import { Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { USER_ERROR_MESSAGES } from '../users/constants/error-messages';
import { UpdateProfileDto } from './dto/profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    private readonly minioProvider: MinioProvider,
  ) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId: userId },
      relations: ['user'],
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
        .replaceAll(/[^a-zA-Z0-9.-]/g, '_');
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

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const account = await this.accountRepository.findOne({
      where: { userId: userId, providerId: 'local' },
      relations: ['user'],
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new ConflictException('Username already in use');
      }

      user.username = dto.username;
      profile.user.username = dto.username;
      account.user.username = dto.username;

      const existingAccountId = await this.accountRepository.findOne({
        where: { accountId: dto.username },
      });

      if (existingAccountId && existingAccountId.id !== account.id) {
        throw new ConflictException('AccountId already in use');
      }

      account.accountId = dto.username;
    }

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already in use');
      }

      user.email = dto.email;
      profile.user.email = dto.email;
      account.user.email = dto.email;
    }

    if (dto.firstName && dto.firstName !== user.firstName) {
      user.firstName = dto.firstName;
      profile.user.firstName = dto.firstName;
      account.user.firstName = dto.firstName;
    }
    if (dto.lastName && dto.lastName !== user.lastName) {
      user.lastName = dto.lastName;
      profile.user.lastName = dto.lastName;
      account.user.lastName = dto.lastName;
    }

    await this.accountRepository.save(account);

    await this.userRepository.save(user);

    return this.profileRepository.save(profile);
  }

  async findProfileById(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId: userId },
      relations: ['user', 'user.role'],
    });

    if (!profile) {
      throw new NotFoundException(USER_ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return profile;
  }
}
