import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../../common/entities/user.entity';
import { Account } from '../../common/entities/account.entity';
import { Role } from '../../common/entities/role.entity';
import { CreateMunicipalityUserDto } from '../../common/dto/municipality-user.dto';
import { UpdateProfileDto } from '../../common/dto/user.dto';
import { Office } from '../../common/entities/office.entity';

import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { MinioProvider } from '../../providers/minio/minio.provider';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let officeRepository: jest.Mocked<Repository<Office>>;
  let minioProvider: jest.Mocked<MinioProvider>;

  beforeEach(async () => {
    const mockTransaction = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            manager: { transaction: mockTransaction },
          },
        },
        {
          provide: getRepositoryToken(Account),
          useValue: { create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Office),
          useValue: { findOne: jest.fn(), find: jest.fn() },
        },
        {
          provide: MinioProvider,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
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

    (userRepository.manager.transaction as unknown as jest.Mock) =
      mockTransaction;
  });

  describe('findMunicipalityUsers', () => {
    it('should return users whose role is not "user"', async () => {
      const mockUsers = [
        { id: '1', role: { name: 'municipal_pr_officer', isMunicipal: true } },
      ] as User[];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findMunicipalityUsers();

      expect(userRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['role', 'office'],
          where: { role: { isMunicipal: true } },
        }),
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findMunicipalityUserById', () => {
    it('should return a municipality user by id', async () => {
      const mockUser = {
        id: '1',
        username: 'officier1',
        role: {
          id: 'role-id',
          name: 'municipal_pr_officer',
          isMunicipal: true,
        } as Role,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findMunicipalityUserById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['role', 'office'],
          where: { id: '1', role: { isMunicipal: true } },
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMunicipalityUserById('missing')).rejects.toThrow(
        'Municipality user not found',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['role', 'office'],
          where: { id: 'missing', role: { isMunicipal: true } },
        }),
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findMunicipalityUserById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMunicipalityUser', () => {
    const dto: CreateMunicipalityUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
      roleId: 'role-id',
    };

    it('should throw NotFoundException if role does not exist', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: () => ({
              findOne: async () => null,
            }),
          }),
      );

      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user with username already exists', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: (entity) => ({
              findOne: async () => {
                if (entity === Role)
                  return { id: 'role-id', name: 'municipal_pr_officer' };
                if (entity === User) return { username: dto.username };
                return null;
              },
              create: jest.fn(),
              save: jest.fn(),
            }),
          }),
      );

      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if user with email already exists', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: (entity) => ({
              findOne: async (options) => {
                if (entity === Role) {
                  return { id: 'role-id', name: 'municipal_pr_officer' };
                }
                if (entity === User) {
                  if (options?.where?.username) {
                    return null;
                  }
                  if (options?.where?.email) {
                    return { id: 'existing-user-id', email: dto.email };
                  }
                  return null;
                }
                return null;
              },
              create: jest.fn(),
              save: jest.fn(),
            }),
          }),
      );

      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should create a new user and account successfully', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: (entity) => ({
              findOne: async (options) => {
                if (entity === Role)
                  return { id: 'role-id', name: 'municipal_pr_officer' };
                if (entity === User) return null;
                return null;
              },
              create: (data) => data,
              save: async (data) => data,
            }),
          }),
      );

      const user = await service.createMunicipalityUser(dto);

      expect(user).toEqual({
        id: 'mocked-id',
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: { id: 'role-id', name: 'municipal_pr_officer' },
        office: null,
      });
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete a municipality user and their account', async () => {
      const mockUser = {
        id: '1',
        role: {
          id: 'role-id',
          name: 'municipal_pr_officer',
          isMunicipal: true,
        } as Role,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const mockDelete = jest.fn().mockResolvedValue({ affected: 1 });
      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn: any) =>
          fn({
            getRepository: (entity: any) => ({
              delete: mockDelete,
            }),
          }),
      );

      await service.deleteMunicipalityUserById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['role'],
          where: { id: '1', role: { isMunicipal: true } },
        }),
      );

      expect(mockDelete).toHaveBeenCalledWith({ userId: '1' });
      expect(mockDelete).toHaveBeenCalledWith({ id: '1' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteMunicipalityUserById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMunicipalityUserById', () => {
    const updateDto = {
      email: 'updated@example.com',
      username: 'updateduser',
      firstName: 'Updated',
      lastName: 'User',
    };

    it('should update a municipality user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'old@example.com',
        username: 'olduser',
        firstName: 'Old',
        lastName: 'User',
        role: { id: 'role-id', name: 'municipal_pr_officer' },
      } as User;

      const mockAccount = {
        id: 'account-id',
        accountId: 'olduser',
        userId: '1',
        providerId: 'local',
      } as Account;

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({ ...mockUser, ...updateDto }),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(mockAccount),
              save: jest.fn().mockResolvedValue({
                ...mockAccount,
                accountId: updateDto.username,
              }),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockManager.getRepository).toHaveBeenCalledWith(User);
      expect(mockManager.getRepository).toHaveBeenCalledWith(Account);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMunicipalityUserById('999', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if username is already in use', async () => {
      const mockUser = { id: '1', username: 'old_officier' } as User;
      const existingUser = { id: '2', email: 'updated_officier' } as User;

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(
        service.updateMunicipalityUserById('1', {
          username: 'updated_officier',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email is already in use', async () => {
      const mockUser = {
        id: '1',
        email: 'old@example.com',
        username: 'olduser',
      } as User;
      const existingUser = {
        id: '2',
        email: 'updated@example.com',
        username: 'existinguser',
      } as User;

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(existingUser);

      await expect(
        service.updateMunicipalityUserById('1', {
          email: 'updated@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update user role if role is provided', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        roleId: 'old-role-id',
        role: { id: 'old-role-id', name: 'municipal_pr_officer' },
      } as User;
      const mockRole = {
        id: 'new-role-id',
        name: 'technical_officer',
      } as Role;

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(mockRole);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({
                ...mockUser,
                roleId: mockRole.id,
              }),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', {
        roleId: 'new-role-id',
      });

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-role-id' },
      });
    });

    it('should throw NotFoundException if role is not found', async () => {
      const mockUser = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn(),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await expect(
        service.updateMunicipalityUserById('1', {
          roleId: 'invalid-role-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields (partial update)', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        username: 'username',
        firstName: 'First',
        lastName: 'Last',
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({
                ...mockUser,
                firstName: 'NewFirst',
              }),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', { firstName: 'NewFirst' });

      expect(mockManager.getRepository).toHaveBeenCalledWith(User);
    });

    it('should update account accountId when username is changed', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        username: 'oldusername',
        firstName: 'First',
        lastName: 'Last',
      } as User;

      const mockAccount = {
        id: 'account-id',
        accountId: 'oldusername',
        userId: '1',
        providerId: 'local',
      } as Account;

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);

      const mockAccountRepo = {
        findOne: jest.fn().mockResolvedValue(mockAccount),
        save: jest.fn().mockResolvedValue({
          ...mockAccount,
          accountId: 'newusername',
        }),
      };

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({
                ...mockUser,
                username: 'newusername',
              }),
            };
          }
          if (entity === Account) {
            return mockAccountRepo;
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', {
        username: 'newusername',
      });

      expect(mockAccountRepo.findOne).toHaveBeenCalledWith({
        where: { userId: '1', providerId: 'local' },
      });
      expect(mockAccountRepo.save).toHaveBeenCalledWith({
        ...mockAccount,
        accountId: 'newusername',
      });
    });

    it('should update office when officeId is provided', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        username: 'username',
        officeId: 'old-office-id',
      } as User;

      const mockOffice = {
        id: 'new-office-id',
        name: 'New Office',
      } as Office;

      userRepository.findOne.mockResolvedValue(mockUser);
      officeRepository.findOne.mockResolvedValue(mockOffice);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({
                ...mockUser,
                officeId: mockOffice.id,
              }),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', {
        officeId: 'new-office-id',
      });

      expect(officeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-office-id' },
      });
    });

    it('should set office to null when officeId is provided but office not found', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        username: 'username',
        officeId: 'old-office-id',
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      officeRepository.findOne.mockResolvedValue(null);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === User) {
            return {
              save: jest.fn().mockResolvedValue({
                ...mockUser,
                officeId: null,
              }),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            };
          }
        }),
      };

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (cb) => cb(mockManager),
      );

      await service.updateMunicipalityUserById('1', {
        officeId: 'non-existent-office-id',
      });

      expect(officeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-office-id' },
      });
    });
  });

  describe('createMunicipalityUser with office', () => {
    it('should create a municipality user with an office', async () => {
      const dto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        roleId: 'role-id',
        officeId: 'office-id',
      };

      const mockOffice = {
        id: 'office-id',
        name: 'Test Office',
      } as Office;

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: (entity) => ({
              findOne: async (options) => {
                if (entity === Role) {
                  return { id: 'role-id', name: 'municipal_pr_officer' };
                }
                if (entity === Office) {
                  return mockOffice;
                }
                if (entity === User) {
                  return null;
                }
                return null;
              },
              create: (data) => data,
              save: async (data) => data,
            }),
          }),
      );

      const user = await service.createMunicipalityUser(dto);

      expect(user).toEqual({
        id: 'mocked-id',
        email: dto.email,
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: { id: 'role-id', name: 'municipal_pr_officer' },
        office: mockOffice,
      });
    });
  });

  describe('updateProfile', () => {
    it('should update telegram username', async () => {
      const userId = 'user-id';
      const dto: UpdateProfileDto = {
        telegramUsername: '@newusername',
      };

      const mockUser = {
        id: userId,
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: null,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        telegramUsername: dto.telegramUsername,
      } as User);

      const result = await service.updateProfile(userId, dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        telegramUsername: dto.telegramUsername,
      });
      expect(result.telegramUsername).toBe(dto.telegramUsername);
    });

    it('should update email notifications setting', async () => {
      const userId = 'user-id';
      const dto: UpdateProfileDto = {
        emailNotificationsEnabled: true,
      };

      const mockUser = {
        id: userId,
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: null,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        emailNotificationsEnabled: true,
      } as User);

      const result = await service.updateProfile(userId, dto);

      expect(result.emailNotificationsEnabled).toBe(true);
    });

    it('should upload profile picture and delete old one', async () => {
      const userId = 'user-id';
      const dto: UpdateProfileDto = {};
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockUser = {
        id: userId,
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: 'http://minio.test/old-file.jpg',
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      minioProvider.uploadFile.mockResolvedValue('http://minio.test/new-file.jpg');
      minioProvider.deleteFile.mockResolvedValue(undefined);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        profilePictureUrl: 'http://minio.test/new-file.jpg',
      } as User);

      const result = await service.updateProfile(userId, dto, mockFile);

      expect(minioProvider.uploadFile).toHaveBeenCalledWith(
        `profile-pictures/${userId}/mocked-id-${mockFile.originalname}`,
        mockFile.buffer,
        mockFile.mimetype,
      );
      expect(minioProvider.deleteFile).toHaveBeenCalledWith(
        `profile-pictures/${userId}/old-file.jpg`,
      );
      expect(result.profilePictureUrl).toBeDefined();
      expect(result.profilePictureUrl).not.toBeNull();
    });

    it('should ignore error when deleting old profile picture fails', async () => {
      const userId = 'user-id';
      const dto: UpdateProfileDto = {};
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockUser = {
        id: userId,
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: 'http://minio.test/old-file.jpg',
      } as User;

      const savedUser = {
        ...mockUser,
        profilePictureUrl: 'http://minio.test/new-file.jpg',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      minioProvider.uploadFile.mockResolvedValue('http://minio.test/new-file.jpg');
      minioProvider.deleteFile.mockRejectedValue(new Error('File not found'));
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.updateProfile(userId, dto, mockFile);

      expect(minioProvider.deleteFile).toHaveBeenCalledWith(
        `profile-pictures/${userId}/old-file.jpg`,
      );
      expect(result.profilePictureUrl).toBe('http://minio.test/new-file.jpg');
    });

    it('should upload profile picture without deleting when no old picture exists', async () => {
      const userId = 'user-id';
      const dto: UpdateProfileDto = {};
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const mockUser = {
        id: userId,
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: null,
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      minioProvider.uploadFile.mockResolvedValue('http://minio.test/new-file.jpg');
      userRepository.save.mockResolvedValue({
        ...mockUser,
        profilePictureUrl: 'http://minio.test/new-file.jpg',
      } as User);

      const result = await service.updateProfile(userId, dto, mockFile);

      expect(minioProvider.uploadFile).toHaveBeenCalled();
      expect(minioProvider.deleteFile).not.toHaveBeenCalled();
      expect(result.profilePictureUrl).toBeDefined();
      expect(result.profilePictureUrl).not.toBeNull();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      const dto: UpdateProfileDto = {};

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
