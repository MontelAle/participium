import { Profile, TelegramLinkCode } from '@entities';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getBotToken } from 'nestjs-telegraf';
import {
  createMockProfile,
  createMockRepository,
  createMockTelegrafBot,
  createMockUser,
} from './__test-utils__/telegram-mocks';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramFormatterUtil } from './utils/telegram-formatter.util';

jest.mock('nanoid', () => ({
  customAlphabet: jest.fn(() => jest.fn(() => '123456')),
}));

describe('TelegramAuthService', () => {
  let service: TelegramAuthService;
  let mockBot: any;
  let linkCodeRepository: any;
  let profileRepository: any;
  let formatterUtil: jest.Mocked<TelegramFormatterUtil>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockBot = createMockTelegrafBot();
    linkCodeRepository = createMockRepository<TelegramLinkCode>();
    profileRepository = createMockRepository<Profile>();

    const mockFormatterUtil = {
      getFrontendUrl: jest.fn((path?: string) =>
        path ? `https://example.com${path}` : 'https://example.com',
      ),
      isLocalhost: jest.fn(() => false),
      formatLinkMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramAuthService,
        { provide: getBotToken(), useValue: mockBot },
        {
          provide: getRepositoryToken(TelegramLinkCode),
          useValue: linkCodeRepository,
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: profileRepository,
        },
        { provide: TelegramFormatterUtil, useValue: mockFormatterUtil },
      ],
    }).compile();

    service = module.get<TelegramAuthService>(TelegramAuthService);
    formatterUtil = module.get(TelegramFormatterUtil);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateLinkCode', () => {
    const telegramId = '123456789';
    const telegramUsername = 'testuser';

    it('should generate a 6-digit code and save to database', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      linkCodeRepository.save.mockImplementation((entity: any) =>
        Promise.resolve(entity),
      );

      const code = await service.generateLinkCode(telegramId, telegramUsername);

      expect(code).toBe('123456');
      expect(linkCodeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: '123456',
          telegramId,
          telegramUsername,
          used: false,
          userId: null,
        }),
      );
      expect(linkCodeRepository.save).toHaveBeenCalled();
    });

    it('should set expiry to 15 minutes from now', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      const now = Date.now();

      await service.generateLinkCode(telegramId, telegramUsername);

      const savedCode = linkCodeRepository.create.mock.calls[0][0];
      const expiryTime = savedCode.expiresAt.getTime();
      const expectedExpiry = now + 15 * 60 * 1000;

      expect(expiryTime).toBeGreaterThan(now);
      expect(expiryTime).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should throw BadRequestException if Telegram account already linked', async () => {
      const existingProfile = createMockProfile({ telegramId });
      profileRepository.findOne.mockResolvedValue(existingProfile);

      await expect(
        service.generateLinkCode(telegramId, telegramUsername),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('linkAccount', () => {
    const code = '123456';
    const userId = 'user-123';
    const telegramId = '987654321';
    const telegramUsername = 'testuser';

    it('should successfully link account', async () => {
      const linkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        userId: null as string | null,
      };
      const profile = createMockProfile({ userId, telegramId: null });

      linkCodeRepository.findOne.mockResolvedValue(linkCode);
      profileRepository.findOne.mockResolvedValue(profile);
      profileRepository.save.mockImplementation((entity: any) =>
        Promise.resolve(entity),
      );
      linkCodeRepository.save.mockImplementation((entity: any) =>
        Promise.resolve(entity),
      );

      await service.linkAccount(code, userId);

      expect(profile.telegramId).toBe(telegramId);
      expect(profile.telegramUsername).toBe(telegramUsername);
      expect(profileRepository.save).toHaveBeenCalledWith(profile);

      expect(linkCode.used).toBe(true);
      expect(linkCode.userId).toBe(userId);
      expect(linkCodeRepository.save).toHaveBeenCalledWith(linkCode);

      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        telegramId,
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if code not found', async () => {
      linkCodeRepository.findOne.mockResolvedValue(null);
      await expect(service.linkAccount(code, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if code expired', async () => {
      const expiredLinkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() - 1000),
        used: false,
        userId: null as string | null,
      };
      linkCodeRepository.findOne.mockResolvedValue(expiredLinkCode);
      await expect(service.linkAccount(code, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if code already used', async () => {
      const usedLinkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: true,
        userId: 'other-user',
      };
      linkCodeRepository.findOne.mockResolvedValue(usedLinkCode);
      await expect(service.linkAccount(code, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if profile not found', async () => {
      const linkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        userId: null as string | null,
      };
      linkCodeRepository.findOne.mockResolvedValue(linkCode);
      profileRepository.findOne.mockResolvedValue(null);

      await expect(service.linkAccount(code, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if profile already has telegramId', async () => {
      const linkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        userId: null as string | null,
      };
      const profileWithTelegram = createMockProfile({
        userId,
        telegramId: '111111111',
      });

      linkCodeRepository.findOne.mockResolvedValue(linkCode);
      profileRepository.findOne.mockResolvedValue(profileWithTelegram);

      await expect(service.linkAccount(code, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle localhost URL formatting in success message', async () => {
      const linkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        userId: null as string | null,
      };
      const profile = createMockProfile({ userId, telegramId: null });

      linkCodeRepository.findOne.mockResolvedValue(linkCode);
      profileRepository.findOne.mockResolvedValue(profile);
      linkCodeRepository.save.mockImplementation((e: any) =>
        Promise.resolve(e),
      );
      profileRepository.save.mockImplementation((e: any) => Promise.resolve(e));

      formatterUtil.isLocalhost.mockReturnValue(true);
      formatterUtil.getFrontendUrl.mockReturnValue(
        'http://localhost:3000/reports/map',
      );

      await service.linkAccount(code, userId);

      expect(mockBot.telegram.sendMessage).toHaveBeenCalledWith(
        telegramId,
        expect.stringContaining('localhost'),
        expect.any(Object),
      );
    });

    it('should catch error if sendMessage fails', async () => {
      const linkCode = {
        code,
        telegramId,
        telegramUsername,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        used: false,
        userId: null as string | null,
      };
      const profile = createMockProfile({ userId, telegramId: null });

      linkCodeRepository.findOne.mockResolvedValue(linkCode);
      profileRepository.findOne.mockResolvedValue(profile);
      linkCodeRepository.save.mockImplementation((e: any) =>
        Promise.resolve(e),
      );
      profileRepository.save.mockImplementation((e: any) => Promise.resolve(e));

      mockBot.telegram.sendMessage.mockRejectedValue(
        new Error('Telegram down'),
      );

      await expect(service.linkAccount(code, userId)).resolves.not.toThrow();
    });
  });

  describe('getLinkedUser', () => {
    it('should return user with relations if profile found', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile({ user: mockUser });
      profileRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.getLinkedUser('123456789');

      expect(result).toEqual(mockUser);
      expect(profileRepository.findOne).toHaveBeenCalledWith({
        where: { telegramId: '123456789' },
        relations: ['user'],
      });
    });

    it('should return null if profile not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      const result = await service.getLinkedUser('999999999');
      expect(result).toBeNull();
    });
  });

  describe('getUserId', () => {
    it('should return userId from profile', async () => {
      const mockProfile = createMockProfile({ userId: 'user-123' });
      profileRepository.findOne.mockResolvedValue(mockProfile);
      const result = await service.getUserId('123456789');
      expect(result).toBe('user-123');
    });

    it('should return null if profile not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      const result = await service.getUserId('999999999');
      expect(result).toBeNull();
    });
  });

  describe('isLinked', () => {
    it('should return true if profile exists', async () => {
      const mockProfile = createMockProfile();
      profileRepository.findOne.mockResolvedValue(mockProfile);
      const result = await service.isLinked('123456789');
      expect(result).toBe(true);
    });

    it('should return false if profile not found', async () => {
      profileRepository.findOne.mockResolvedValue(null);
      const result = await service.isLinked('999999999');
      expect(result).toBe(false);
    });
  });
});
