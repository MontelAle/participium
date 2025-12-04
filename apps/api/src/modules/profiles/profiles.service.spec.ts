import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { User } from '../../common/entities/user.entity';
import { Profile } from '../../common/entities/profile.entity';
import { Repository } from 'typeorm';
import { UpdateProfileDto } from '../../common/dto/user.dto';
import { NotFoundException } from '@nestjs/common';

import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('ProfilesService', () => {
  let service: ProfilesService;
  let minioProvider: jest.Mocked<MinioProvider>;
  let profileRepository: jest.Mocked<Repository<Profile>>;

  const mockManager = {
    getRepository: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@test.com',
    role: { isMunicipal: true },
  } as User;

  const mockProfile = {
    id: 'profile-1',
    user: mockUser,
    userId: 'user-1',
    telegramUsername: '@testuser',
    emailNotificationsEnabled: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            manager: {
              transaction: jest.fn((cb) => cb(mockManager)),
            },
          },
        },
        {
          provide: MinioProvider,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            extractFileNameFromUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    minioProvider = module.get(MinioProvider);

    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === Profile) return profileRepository;
      return null;
    });

    profileRepository = module.get(getRepositoryToken(Profile));
  });

  describe('updateProfile', () => {
    const profileDto: UpdateProfileDto = {
      telegramUsername: '@tele',
      emailNotificationsEnabled: 'true',
    };
    const mockFile = {
      originalname: 'pic.jpg',
      buffer: Buffer.from('img'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('should update profile fields and upload picture', async () => {
      const profileWithOldPic = {
        user: mockUser,
        profilePictureUrl: 'old_url',
      } as Profile;

      profileRepository.findOne.mockResolvedValue(profileWithOldPic);
      minioProvider.uploadFile.mockResolvedValue('new_url');
      minioProvider.extractFileNameFromUrl.mockReturnValue('old_filename');
      minioProvider.deleteFile.mockResolvedValue(undefined);

      await service.updateProfile('user-1', profileDto, mockFile);

      expect(minioProvider.deleteFile).toHaveBeenCalledWith('old_filename');
      expect(minioProvider.uploadFile).toHaveBeenCalled();
      expect(profileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramUsername: '@tele',
          emailNotificationsEnabled: true,
          profilePictureUrl: 'new_url',
        }),
      );
    });

    it('should ignore error if deleting old profile picture fails', async () => {
      const profileWithOldPic = {
        user: mockUser,
        profilePictureUrl: 'old_url',
      } as Profile;

      profileRepository.findOne.mockResolvedValue(profileWithOldPic);
      minioProvider.uploadFile.mockResolvedValue('new_url');
      minioProvider.deleteFile.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.updateProfile('user-1', {}, mockFile),
      ).resolves.not.toThrow();

      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should handle optional fields correctly (set null/false)', async () => {
      profileRepository.findOne.mockResolvedValue(mockProfile as Profile);

      await service.updateProfile('user-1', {
        telegramUsername: '',
        emailNotificationsEnabled: 'false',
      });

      expect(profileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramUsername: null,
          emailNotificationsEnabled: false,
        }),
      );
    });

    it('should throw NotFoundException if profile user not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      await expect(service.updateProfile('bad', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserById', () => {
    it('should return user', async () => {
      profileRepository.findOne.mockResolvedValue(mockProfile as Profile);
      expect(await service.findProfileById('profile-1')).toEqual(mockProfile);
    });

    it('should throw NotFoundException', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      await expect(service.findProfileById('profile-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
