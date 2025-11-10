import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateMunicipalityUserDto, User } from '@repo/api';

// Mock "nanoid" per evitare problemi ESM
jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

// Mock finto per i guard
const mockSessionGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService: Partial<jest.Mocked<UsersService>> = {
      findMunicipalityUsers: jest.fn(),
      createMunicipalityUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
      // sovrascrive i guard globali usati nel controller
      .overrideGuard(require('../auth/guards/session-auth.guard').SessionGuard)
      .useValue(mockSessionGuard)
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  describe('getMunicipalityUsers', () => {
    it('should return a list of municipality users', async () => {
      const mockUsers: Partial<User>[] = [
        { id: '1', email: 'admin1@city.gov' },
        { id: '2', email: 'admin2@city.gov' },
      ];

      usersService.findMunicipalityUsers.mockResolvedValue(mockUsers as User[]);

      const result = await controller.getMunicipalityUsers();

      expect(usersService.findMunicipalityUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true, data: mockUsers });
    });
  });

  describe('createMunicipalityUser', () => {
    it('should create and return a municipality user', async () => {
      const dto: CreateMunicipalityUserDto = {
        email: 'new@municipality.gov',
        username: 'new_user',
        firstName: 'New',
        lastName: 'User',
        password: 'SecurePass123',
        role: 'admin',
      };

      const mockUser: Partial<User> = {
        id: 'mocked-id',
        email: dto.email,
        username: dto.username,
      };

      usersService.createMunicipalityUser.mockResolvedValue(mockUser as User);

      const result = await controller.createMunicipalityUser(dto);

      expect(usersService.createMunicipalityUser).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true, data: mockUser });
    });

    it('should throw if UsersService.createMunicipalityUser throws', async () => {
      const dto: CreateMunicipalityUserDto = {
        email: 'duplicate@municipality.gov',
        username: 'dup_user',
        firstName: 'Dup',
        lastName: 'User',
        password: 'SecurePass123',
        role: 'admin',
      };

      usersService.createMunicipalityUser.mockRejectedValue(
        new Error('User with this email already exists'),
      );

      await expect(controller.createMunicipalityUser(dto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });
});
