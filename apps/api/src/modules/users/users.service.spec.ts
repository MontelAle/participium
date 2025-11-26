import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../common/entities/user.entity';
import { Account } from '../../common/entities/account.entity';
import { Role } from '../../common/entities/role.entity';
import { Office } from '../../common/entities/office.entity';
import { MinioProvider } from '../../providers/minio/minio.provider';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMunicipalityUserDto } from '../../common/dto/municipality-user.dto';
import { UpdateProfileDto } from '../../common/dto/user.dto';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let officeRepository: jest.Mocked<Repository<Office>>;
  let minioProvider: jest.Mocked<MinioProvider>;

  const mockManager = {
    getRepository: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@test.com',
    role: { isMunicipal: true },
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
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
          provide: getRepositoryToken(Account),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Office),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    accountRepository = module.get(getRepositoryToken(Account));
    roleRepository = module.get(getRepositoryToken(Role));
    officeRepository = module.get(getRepositoryToken(Office));
    minioProvider = module.get(MinioProvider);

    mockManager.getRepository.mockImplementation((entity) => {
      if (entity === User) return userRepository;
      if (entity === Account) return accountRepository;
      if (entity === Role) return roleRepository;
      if (entity === Office) return officeRepository;
      return null;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findMunicipalityUsers', () => {
    it('should return users with municipal role', async () => {
      const users = [mockUser];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findMunicipalityUsers();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role', 'office'],
        where: { role: { isMunicipal: true } },
      });
      expect(result).toEqual(users);
    });
  });

  describe('findMunicipalityUserById', () => {
    it('should return a user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findMunicipalityUserById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMunicipalityUserById('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMunicipalityUser', () => {
    const createDto: CreateMunicipalityUserDto = {
      email: 'new@test.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password',
      roleId: 'role-1',
      officeId: 'office-1',
    };

    it('should successfully create a user and account in transaction', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue({ id: 'office-1' } as Office);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const createdUser = { ...mockUser, id: 'new-id' };
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);
      accountRepository.create.mockReturnValue({} as Account);

      const result = await service.createMunicipalityUser(createDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(accountRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('should throw NotFoundException if role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if username exists', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if email exists', async () => {
      roleRepository.findOne.mockResolvedValue({ id: 'role-1' } as Role);
      officeRepository.findOne.mockResolvedValue(null);
      userRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      await expect(service.createMunicipalityUser(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete user and account in transaction', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      await service.deleteMunicipalityUserById('user-1');

      expect(accountRepository.delete).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(userRepository.delete).toHaveBeenCalledWith({ id: 'user-1' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteMunicipalityUserById('bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMunicipalityUserById', () => {
    const updateDto: Partial<CreateMunicipalityUserDto> = {
      username: 'updated',
      email: 'updated@test.com',
      roleId: 'role-2',
      officeId: 'office-2',
      firstName: 'Updated',
    };

    it('should update user fields and account username in transaction', async () => {
      const existingUser = {
        ...mockUser,
        username: 'old',
        email: 'old@test.com',
      } as User;

      userRepository.findOne.mockReset();

      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      roleRepository.findOne.mockResolvedValue({ id: 'role-2' } as Role);
      officeRepository.findOne.mockResolvedValue({ id: 'office-2' } as Office);
      accountRepository.findOne.mockResolvedValue({ id: 'acc-1' } as Account);

      await service.updateMunicipalityUserById('user-1', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Updated',
          roleId: 'role-2',
          officeId: 'office-2',
        }),
      );
      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ accountId: 'updated' }),
      );
    });

    it('should handle officeId set to non-existent office (set null)', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      officeRepository.findOne.mockResolvedValue(null);

      await service.updateMunicipalityUserById('user-1', {
        officeId: 'bad-office',
      });

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          officeId: null,
        }),
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(
        service.updateMunicipalityUserById('bad', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new username taken', async () => {
      const existingUser = { ...mockUser, username: 'old' };
      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other' } as User);

      await expect(
        service.updateMunicipalityUserById('user-1', { username: 'taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if new email taken', async () => {
      const existingUser = { ...mockUser, email: 'old@test.com' };
      userRepository.findOne
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({ id: 'other' } as User);

      await expect(
        service.updateMunicipalityUserById('user-1', {
          email: 'taken@test.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if new role not found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMunicipalityUserById('user-1', { roleId: 'bad-role' }),
      ).rejects.toThrow(NotFoundException);
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

    it('should update profile fields and upload picture', async () => {
      const userWithOldPic = { ...mockUser, profilePictureUrl: 'old_url' };
      userRepository.findOne.mockResolvedValue(userWithOldPic as User);
      minioProvider.uploadFile.mockResolvedValue('new_url');
      minioProvider.extractFileNameFromUrl.mockReturnValue('old_filename');
      minioProvider.deleteFile.mockResolvedValue(undefined);

      const result = await service.updateProfile(
        'user-1',
        profileDto,
        mockFile,
      );

      expect(minioProvider.deleteFile).toHaveBeenCalledWith('old_filename');
      expect(minioProvider.uploadFile).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramUsername: '@tele',
          emailNotificationsEnabled: true,
          profilePictureUrl: 'new_url',
        }),
      );
    });

    it('should ignore error if deleting old profile picture fails', async () => {
      const userWithOldPic = { ...mockUser, profilePictureUrl: 'old_url' };
      userRepository.findOne.mockResolvedValue(userWithOldPic as User);
      minioProvider.uploadFile.mockResolvedValue('new_url');
      minioProvider.deleteFile.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.updateProfile('user-1', {}, mockFile),
      ).resolves.not.toThrow();

      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should handle optional fields correctly (set null/false)', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await service.updateProfile('user-1', {
        telegramUsername: '',
        emailNotificationsEnabled: 'false',
      });

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          telegramUsername: null,
          emailNotificationsEnabled: false,
        }),
      );
    });

    it('should throw NotFoundException if profile user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.updateProfile('bad', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findUserById', () => {
    it('should return user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      expect(await service.findUserById('1')).toEqual(mockUser);
    });

    it('should throw NotFoundException', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.findUserById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
