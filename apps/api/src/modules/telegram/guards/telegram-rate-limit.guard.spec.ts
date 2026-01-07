import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockBotContext,
  createMockExecutionContext,
} from '../__test-utils__/telegram-mocks';
import { TelegramRateLimitGuard } from './telegram-rate-limit.guard';

describe('TelegramRateLimitGuard', () => {
  let guard: TelegramRateLimitGuard;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'telegram.maxReportsPerHour') {
          return 5;
        }
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramRateLimitGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<TelegramRateLimitGuard>(TelegramRateLimitGuard);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return false if telegramId is missing', async () => {
      const ctx = createMockBotContext({ from: null } as any);
      const executionContext = createMockExecutionContext(ctx);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
    });

    it('should allow first request from new user', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(true);
      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it('should track timestamp in rateLimits Map', async () => {
      const ctx = createMockBotContext({ from: { id: 123456789 } as any });
      const executionContext = createMockExecutionContext(ctx);

      await guard.canActivate(executionContext as any);

      const rateLimits = (guard as any).rateLimits;
      expect(rateLimits.has('123456789')).toBe(true);
      expect(rateLimits.get('123456789')).toHaveLength(1);
    });

    it('should allow requests under limit (request 1-5)', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      for (let i = 0; i < 5; i++) {
        const result = await guard.canActivate(executionContext as any);
        expect(result).toBe(true);
        jest.advanceTimersByTime(1000);
      }

      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it('should reject 6th request within one hour', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      for (let i = 0; i < 5; i++) {
        await guard.canActivate(executionContext as any);
        jest.advanceTimersByTime(1000);
      }

      const result = await guard.canActivate(executionContext as any);

      expect(result).toBe(false);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('maximum number of reports per hour'),
      );
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('(5)'));
    });

    it('should send rate limit message on rejection', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      for (let i = 0; i < 5; i++) {
        await guard.canActivate(executionContext as any);
      }

      await guard.canActivate(executionContext as any);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('⏰'));
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Please try again later'),
      );
    });

    it('should clean old timestamps and allow request after one hour', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      await guard.canActivate(executionContext as any);

      jest.advanceTimersByTime(61 * 60 * 1000);

      const result = await guard.canActivate(executionContext as any);
      expect(result).toBe(true);

      const rateLimits = (guard as any).rateLimits;
      const timestamps = rateLimits.get('123456789');
      expect(timestamps).toHaveLength(1);
    });

    it('should allow request exactly at 1 hour boundary', async () => {
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      for (let i = 0; i < 5; i++) {
        await guard.canActivate(executionContext as any);
      }

      jest.advanceTimersByTime(60 * 60 * 1000 + 1);

      const result = await guard.canActivate(executionContext as any);
      expect(result).toBe(true);
    });

    it('should trigger cleanup when Map size exceeds 100', async () => {
      for (let i = 0; i < 101; i++) {
        const ctx = createMockBotContext({
          from: { id: 1000000 + i } as any,
        });
        const executionContext = createMockExecutionContext(ctx);
        await guard.canActivate(executionContext as any);
      }

      const rateLimits = (guard as any).rateLimits;
      expect(rateLimits.size).toBe(101);
    });

    it('should remove entries with no recent timestamps during cleanup', async () => {
      for (let i = 0; i < 50; i++) {
        const ctx = createMockBotContext({
          from: { id: 1000000 + i } as any,
        });
        const executionContext = createMockExecutionContext(ctx);
        await guard.canActivate(executionContext as any);
      }

      jest.advanceTimersByTime(61 * 60 * 1000);

      for (let i = 50; i < 101; i++) {
        const ctx = createMockBotContext({
          from: { id: 1000000 + i } as any,
        });
        const executionContext = createMockExecutionContext(ctx);
        await guard.canActivate(executionContext as any);
      }

      const rateLimits = (guard as any).rateLimits;
      expect(rateLimits.size).toBe(51);
    });

    it('should keep entries with recent timestamps during cleanup', async () => {
      const recentUserId = '999999999';
      const ctx = createMockBotContext({ from: { id: recentUserId } as any });
      const executionContext = createMockExecutionContext(ctx);
      await guard.canActivate(executionContext as any);

      for (let i = 0; i < 100; i++) {
        const oldCtx = createMockBotContext({
          from: { id: 1000000 + i } as any,
        });
        const oldExecutionContext = createMockExecutionContext(oldCtx);
        await guard.canActivate(oldExecutionContext as any);
      }

      const rateLimits = (guard as any).rateLimits;
      expect(rateLimits.has(recentUserId)).toBe(true);
    });

    it('should handle multiple users concurrently', async () => {
      const ctx1 = createMockBotContext({ from: { id: 111111111 } as any });
      const ctx2 = createMockBotContext({ from: { id: 222222222 } as any });
      const execCtx1 = createMockExecutionContext(ctx1);
      const execCtx2 = createMockExecutionContext(ctx2);

      for (let i = 0; i < 5; i++) {
        await guard.canActivate(execCtx1 as any);
        await guard.canActivate(execCtx2 as any);
      }

      const result1 = await guard.canActivate(execCtx1 as any);
      const result2 = await guard.canActivate(execCtx2 as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });

    it('should respect custom maxReportsPerHour config', async () => {
      configService.get.mockReturnValue(3);

      const newGuard = new TelegramRateLimitGuard(configService);
      const ctx = createMockBotContext();
      const executionContext = createMockExecutionContext(ctx);

      for (let i = 0; i < 3; i++) {
        const result = await newGuard.canActivate(executionContext as any);
        expect(result).toBe(true);
      }

      const result = await newGuard.canActivate(executionContext as any);
      expect(result).toBe(false);
    });
  });
});
