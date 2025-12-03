import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { Profile } from '../../common/entities/profile.entity';
import { ForbiddenException } from '@nestjs/common';

jest.mock('nanoid', () => ({ nanoid: () => 'mocked-id' }));

const mockSessionGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let profilesService: jest.Mocked<ProfilesService>;

  beforeEach(async () => {
    const mockProfilesServce: Partial<jest.Mocked<ProfilesService>> = {
      updateProfile: jest.fn(),
      findProfileById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [{ provide: ProfilesService, useValue: mockProfilesServce }],
    })
      .overrideGuard(require('../auth/guards/session-auth.guard').SessionGuard)
      .useValue(mockSessionGuard)
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<ProfilesController>(ProfilesController);
    profilesService = module.get(ProfilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUser = {
        id: 'user-1',
        telegramUsername: '@newusername',
        emailNotificationsEnabled: true,
        profilePictureUrl: null,
      } as Profile;

      const req = { user: { id: 'user-1' } } as any;
      const dto = { telegramUsername: '@newusername' };

      profilesService.updateProfile.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(req, dto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('user-1');
      expect(result.data.telegramUsername).toBe('@newusername');
      expect(profilesService.updateProfile).toHaveBeenCalledWith(
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
      } as Profile;

      const req = { user: { id: 'user-1' } } as any;
      const dto = {};
      const file = {
        buffer: Buffer.from('test'),
        originalname: 'profile.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      profilesService.updateProfile.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(req, dto, file);

      expect(result.success).toBe(true);
      expect(result.data.profilePictureUrl).toBe(
        'http://minio.test/profile.jpg',
      );
      expect(profilesService.updateProfile).toHaveBeenCalledWith(
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
      const mockUser = { id: 'user-1', telegramUsername: 'me' } as Profile;
      const req = { user: { id: 'user-1' } } as any;

      profilesService.findProfileById.mockResolvedValue(mockUser);

      const result = await controller.getUserProfileById(req);

      expect(profilesService.findProfileById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ success: true, data: mockUser });
    });
  });
});
