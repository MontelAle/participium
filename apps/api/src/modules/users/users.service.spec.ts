import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Account, Role, CreateMunicipalityUserDto } from '@repo/api';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

// Mock nanoid per avere id prevedibili
jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let accountRepository: jest.Mocked<Repository<Account>>;
  let roleRepository: jest.Mocked<Repository<Role>>;

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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    accountRepository = module.get(getRepositoryToken(Account));
    roleRepository = module.get(getRepositoryToken(Role));

    // Castiamo transaction come Jest mock per usarlo nei test
    (userRepository.manager.transaction as unknown as jest.Mock) =
      mockTransaction;
  });

  describe('findMunicipalityUsers', () => {
    it('should return users whose role is not "user"', async () => {
      const mockUsers = [
        { id: '1', role: { name: 'municipal_pr_officer' } },
      ] as User[];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findMunicipalityUsers();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        where: { role: { name: expect.anything() } }, // Not('user') è ignorato nel mock
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findMunicipalityUserById', () => {
    it('should return a municipality user by id', async () => {
      const mockUser = {
        id: '1',
        username: 'officier1',
        role: { id: 'role-id', name: 'municipal_pr_officer' } as Role,
      } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findMunicipalityUserById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        relations: ['role'],
        where: { id: '1', role: { name: expect.anything() } },
      });
      expect(result).toEqual(mockUser);
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
              findOne: async () => null, // role non trovato
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
                if (entity === User) return { username: dto.username }; // user esiste
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
      });
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete a municipality user and their account', async () => {
      const mockUser = {
        id: '1',
        role: { id: 'role-id', name: 'municipal_pr_officer' },
      } as User;
      userRepository.findOne.mockResolvedValue(mockUser);

      (userRepository.manager.transaction as jest.Mock).mockImplementation(
        async (fn) =>
          fn({
            getRepository: () => ({
              delete: jest.fn().mockResolvedValue({ affected: 1 }),
            }),
          }),
      );

      await service.deleteMunicipalityUserById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        relations: ['role'],
        where: { id: '1', role: { name: expect.anything() } },
      });
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

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      await service.updateMunicipalityUserById('1', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        email: updateDto.email,
        username: updateDto.username,
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
      });
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
      userRepository.save.mockResolvedValue({
        ...mockUser,
        roleId: mockRole.id,
      });

      await service.updateMunicipalityUserById('1', {
        roleId: 'new-role-id',
      });

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-role-id' },
      });
      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        roleId: mockRole.id,
      });
    });

    it('should throw NotFoundException if role is not found', async () => {
      const mockUser = { id: '1', username: 'user' } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      roleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateMunicipalityUserById('1', {
          roleId: 'invalid-role-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields (partial update)', async () => {
      const mockUser = {
        id: '1',
        email: 'user',
        username: 'username',
        firstName: 'First',
        lastName: 'Last',
      } as User;

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: 'NewFirst',
      });

      await service.updateMunicipalityUserById('1', { firstName: 'NewFirst' });

      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        firstName: 'NewFirst',
      });
    });
  });
});
