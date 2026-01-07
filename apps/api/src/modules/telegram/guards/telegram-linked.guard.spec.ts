import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockBotContext,
  createMockExecutionContext,
  createMockUser,
} from '../__test-utils__/telegram-mocks';
import { TelegramAuthService } from '../telegram-auth.service';
import { TelegramLinkedGuard } from './telegram-linked.guard';

describe('TelegramLinkedGuard', () => {
  let guard: TelegramLinkedGuard;
  let telegramAuthService: jest.Mocked<TelegramAuthService>;

  beforeEach(async () => {
    const mockTelegramAuthService = {
      getLinkedUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramLinkedGuard,
        { provide: TelegramAuthService, useValue: mockTelegramAuthService },
      ],
    }).compile();

    guard = module.get<TelegramLinkedGuard>(TelegramLinkedGuard);
    telegramAuthService = module.get(TelegramAuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return false if telegramId is undefined', async () => {
      const ctx = createMockBotContext({ from: null } as any);
      const executionContext = createMockExecutionContext(ctx);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
      expect(telegramAuthService.getLinkedUser).not.toHaveBeenCalled();
    });

    it('should return false if from.id is null', async () => {
      const ctx = createMockBotContext({ from: { id: null } as any });
      const executionContext = createMockExecutionContext(ctx);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
      expect(telegramAuthService.getLinkedUser).not.toHaveBeenCalled();
    });

    it('should return false and send message if user not linked', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);
      telegramAuthService.getLinkedUser.mockResolvedValue(null);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
      expect(telegramAuthService.getLinkedUser).toHaveBeenCalledWith(
        '123456789',
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        '🔗 Link your account first: /link',
      );
    });

    it('should return false and send message if email not verified', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);
      const unverifiedUser = createMockUser({ isEmailVerified: false });
      telegramAuthService.getLinkedUser.mockResolvedValue(unverifiedUser);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
      expect(ctx.reply).toHaveBeenCalledWith(
        '📧 Please verify your email first.',
      );
    });

    it('should return true if user linked and email verified', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);
      const verifiedUser = createMockUser({ isEmailVerified: true });
      telegramAuthService.getLinkedUser.mockResolvedValue(verifiedUser);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(true);
      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it('should call ctx.reply with correct messages', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);
      telegramAuthService.getLinkedUser.mockResolvedValue(null);

      await guard.canActivate(executionContext as any);

      expect(ctx.reply).toHaveBeenCalledTimes(1);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Link'));
    });

    it('should convert telegramId to string', async () => {
      const ctx = createMockBotContext({ from: { id: 987654321 } as any });
      const executionContext = createMockExecutionContext(ctx);
      telegramAuthService.getLinkedUser.mockResolvedValue(null);

      await guard.canActivate(executionContext as any);

      expect(telegramAuthService.getLinkedUser).toHaveBeenCalledWith(
        '987654321',
      );
    });
  });
});
