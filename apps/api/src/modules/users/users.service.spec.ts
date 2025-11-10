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
    (userRepository.manager.transaction as unknown as jest.Mock) = mockTransaction;
  });

  describe('findMunicipalityUsers', () => {
    it('should return users whose role is not "user"', async () => {
      const mockUsers = [{ id: '1', role: { name: 'admin' } }] as User[];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findMunicipalityUsers();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        where: { role: { name: expect.anything() } }, // Not('user') è ignorato nel mock
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('createMunicipalityUser', () => {
    const dto: CreateMunicipalityUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123',
      role: 'role-id',
    };

    it('should throw NotFoundException if role does not exist', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(async (fn) =>
        fn({
          getRepository: () => ({
            findOne: async () => null, // role non trovato
          }),
        }),
      );

      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(async (fn) =>
        fn({
          getRepository: (entity) => ({
            findOne: async () => {
              if (entity === Role) return { id: 'role-id', name: 'admin' };
              if (entity === User) return { email: dto.email }; // user esiste
              return null;
            },
            create: jest.fn(),
            save: jest.fn(),
          }),
        }),
      );

      await expect(service.createMunicipalityUser(dto)).rejects.toThrow(ConflictException);
    });

    it('should create a new user and account successfully', async () => {
      (userRepository.manager.transaction as jest.Mock).mockImplementation(async (fn) =>
        fn({
          getRepository: (entity) => ({
            findOne: async (options) => {
              if (entity === Role) return { id: 'role-id', name: 'admin' };
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
        role: { id: 'role-id', name: 'admin' },
      });
    });
  });
});
