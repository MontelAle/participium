import { Account, Profile, User } from '@entities';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { UpdateProfileDto } from './dto/profiles.dto';
import { ProfilesService } from './profiles.service';

import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('ProfilesService', () => {
  let service: ProfilesService;
  let minioProvider: jest.Mocked<MinioProvider>;
  let profileRepository: jest.Mocked<Repository<Profile>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let accountRepository: jest.Mocked<Repository<Account>>;

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
    telegramId: null as string | null,
    telegramLinkedAt: null as Date | null,
    emailNotificationsEnabled: true,
    profilePictureUrl: 'old_url',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Profile;

  const mockAccount = {
    id: 'account-1',
    userId: 'user-1',
    providerId: 'local',
    accountId: 'testuser',
    user: mockUser,
  } as Account;

  const createMockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    manager: {
      transaction: jest.fn((cb) => cb(mockManager)),
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Account),
          useValue: createMockRepository(),
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
    profileRepository = module.get(getRepositoryToken(Profile));
    userRepository = module.get(getRepositoryToken(User));
    accountRepository = module.get(getRepositoryToken(Account));

    userRepository.findOne.mockResolvedValue(mockUser);
    accountRepository.findOne.mockResolvedValue(mockAccount);
    profileRepository.findOne.mockResolvedValue(mockProfile);

    userRepository.save.mockResolvedValue(mockUser);
    accountRepository.save.mockResolvedValue(mockAccount);
    profileRepository.save.mockImplementation(async (p) => p as Profile);

    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === Profile) return profileRepository;
      if (entity === User) return userRepository;
      if (entity === Account) return accountRepository;
      return null;
    });
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

    it('should update firstName, lastName and email successfully', async () => {
      const dto: UpdateProfileDto = {
        firstName: 'NewName',
        lastName: 'NewLast',
        email: 'new@email.com',
      };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      accountRepository.findOne.mockResolvedValue(mockAccount);

      await service.updateProfile('user-1', dto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'NewName',
          lastName: 'NewLast',
          email: 'new@email.com',
        }),
      );

      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            firstName: 'NewName',
            email: 'new@email.com',
          }),
        }),
      );
    });

    it('should update username and accountId successfully when no conflicts exist', async () => {
      const dto = { username: 'brand_new_username' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      accountRepository.findOne
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce(null);

      await service.updateProfile('user-1', dto);

      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'brand_new_username',
          user: expect.objectContaining({
            username: 'brand_new_username',
          }),
        }),
      );
    });

    it('should ignore error if deleting old profile picture fails', async () => {
      minioProvider.uploadFile.mockResolvedValue('new_url');
      minioProvider.extractFileNameFromUrl.mockReturnValue('old_filename');
      minioProvider.deleteFile.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.updateProfile('user-1', {}, mockFile),
      ).resolves.not.toThrow();

      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should handle optional fields correctly (set null/false)', async () => {
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

    it('should throw NotFoundException if profile not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('bad', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if account is not found', async () => {
      profileRepository.findOne.mockResolvedValue(mockProfile);
      userRepository.findOne.mockResolvedValue(mockUser);
      accountRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile('user-1', {})).rejects.toThrow(
        new NotFoundException('Account not found'),
      );
    });

    it('should throw ConflictException if new username is already taken', async () => {
      const dto = { username: 'taken_user' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'other-user' } as User);

      await expect(service.updateProfile('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if new email is already taken', async () => {
      const dto: UpdateProfileDto = { email: 'taken@test.com' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          id: 'other-user',
          email: 'taken@test.com',
        } as User);

      accountRepository.findOne.mockResolvedValue(mockAccount);

      await expect(service.updateProfile('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if accountId is already taken (even if username is free)', async () => {
      const dto: UpdateProfileDto = { username: 'sneaky_user' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      accountRepository.findOne
        .mockResolvedValueOnce(mockAccount)
        .mockResolvedValueOnce({
          id: 'other-account-id',
          accountId: 'sneaky_user',
        } as Account);

      await expect(service.updateProfile('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findUserById', () => {
    it('should return profile', async () => {
      expect(await service.findProfileById('user-1')).toEqual(mockProfile);
    });

    it('should throw NotFoundException', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      await expect(service.findProfileById('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
