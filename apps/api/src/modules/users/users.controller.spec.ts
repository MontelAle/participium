import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../common/entities/user.entity';
import {
  CreateMunicipalityUserDto,
  UpdateMunicipalityUserDto,
} from '../../common/dto/municipality-user.dto';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

const mockSessionGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService: Partial<jest.Mocked<UsersService>> = {
      findMunicipalityUsers: jest.fn(),
      findMunicipalityUserById: jest.fn(),
      createMunicipalityUser: jest.fn(),
      deleteMunicipalityUserById: jest.fn(),
      updateMunicipalityUserById: jest.fn(),
      updateProfile: jest.fn(),
      findUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    })
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
        { id: '1', username: 'officier1' },
        { id: '2', username: 'officier2' },
      ];

      usersService.findMunicipalityUsers.mockResolvedValue(mockUsers as User[]);

      const result = await controller.getMunicipalityUsers();

      expect(usersService.findMunicipalityUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true, data: mockUsers });
    });
  });

  describe('getMunicipalityUserById', () => {
    it('should return a municipality user by id', async () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'officier1',
        role: {
          id: 'role-id',
          name: 'municipal_pr_officer',
          label: 'Municipal PR Officer',
          isMunicipal: true,
        },
      };

      usersService.findMunicipalityUserById.mockResolvedValue(mockUser as User);

      const result = await controller.getMunicipalityUserById('1');

      expect(usersService.findMunicipalityUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, data: mockUser });
    });

    it('should throw if UsersService.findMunicipalityUserById throws', async () => {
      usersService.findMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(controller.getMunicipalityUserById('999')).rejects.toThrow(
        NotFoundException,
      );
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
        roleId: 'role-id',
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
        roleId: 'role-id',
      };

      usersService.createMunicipalityUser.mockRejectedValue(
        new ConflictException('User with this username already exists'),
      );

      await expect(controller.createMunicipalityUser(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteMunicipalityUserById', () => {
    it('should delete a municipality user and return success', async () => {
      usersService.deleteMunicipalityUserById.mockResolvedValue(undefined);

      const result = await controller.deleteMunicipalityUserById('1');

      expect(usersService.deleteMunicipalityUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true, data: { id: '1' } });
    });

    it('should throw if UsersService.deleteMunicipalityUserById throws', async () => {
      usersService.deleteMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(
        controller.deleteMunicipalityUserById('999'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMunicipalityUserById', () => {
    it('should update a municipality user and return success', async () => {
      const dto: UpdateMunicipalityUserDto = {
        email: 'updated@municipality.gov',
        username: 'updated_user',
      };

      usersService.updateMunicipalityUserById.mockResolvedValue(undefined);

      const result = await controller.updateMunicipalityUserById('1', dto);

      expect(usersService.updateMunicipalityUserById).toHaveBeenCalledWith(
        '1',
        dto,
      );
      expect(result).toEqual({ success: true, data: { id: '1' } });
    });

    it('should throw if UsersService.updateMunicipalityUserById throws NotFoundException', async () => {
      const dto: UpdateMunicipalityUserDto = {
        email: 'updated@municipality.gov',
        username: 'updated_user',
      };

      usersService.updateMunicipalityUserById.mockRejectedValue(
        new NotFoundException('Municipality user not found'),
      );

      await expect(
        controller.updateMunicipalityUserById('999', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if UsersService.updateMunicipalityUserById throws ConflictException', async () => {
      const dto: UpdateMunicipalityUserDto = {
        username: 'duplicate_user',
      };

      usersService.updateMunicipalityUserById.mockRejectedValue(
        new ConflictException('Username already in use'),
      );

      await expect(
        controller.updateMunicipalityUserById('1', dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        telegramUsername: '@newusername',
        emailNotificationsEnabled: true,
        profilePictureUrl: null,
      } as User;

      const req = { user: { id: 'user-1' } } as any;
      const dto = { telegramUsername: '@newusername' };

      usersService.updateProfile.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(req, dto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-1');
      expect(result.data.telegramUsername).toBe('@newusername');
      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        dto,
        undefined,
      );
    });

    it('should update profile with file upload', async () => {
      const mockUser = {
        id: 'user-1',
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: 'http://minio.test/profile.jpg',
      } as User;

      const req = { user: { id: 'user-1' } } as any;
      const dto = {};
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      usersService.updateProfile.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(req, dto, file);

      expect(result.success).toBe(true);
      expect(result.data.profilePictureUrl).toBe(
        'http://minio.test/profile.jpg',
      );
      expect(usersService.updateProfile).toHaveBeenCalledWith(
        'user-1',
        dto,
        file,
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const dto = {};
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'file.txt',
        mimetype: 'text/plain',
        size: 1024,
      } as Express.Multer.File;

      await expect(controller.updateProfile(req, dto, file)).rejects.toThrow();
    });

    it('should throw BadRequestException for file size exceeded', async () => {
      const req = { user: { id: 'user-1' } } as any;
      const dto = {};
      const file = {
        buffer: Buffer.alloc(6 * 1024 * 1024),
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(controller.updateProfile(req, dto, file)).rejects.toThrow();
    });

    it('should throw ForbiddenException for municipality users', async () => {
      const req = {
        user: {
          id: 'user-1',
          role: { isMunicipal: true, name: 'officer' },
        },
      } as any;
      const dto = { telegramUsername: '@newusername' };

      await expect(controller.updateProfile(req, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getUserProfileById', () => {
    it('should return user profile for current user', async () => {
      const mockUser = { id: 'user-1', username: 'me' } as User;
      const req = { user: { id: 'user-1' } } as any;

      usersService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserProfileById(req);

      expect(usersService.findUserById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ success: true, data: mockUser });
    });
  });
});
