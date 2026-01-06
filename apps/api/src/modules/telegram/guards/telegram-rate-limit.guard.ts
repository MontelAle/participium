import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotContext } from '../interfaces/bot-context.interface';

@Injectable()
export class TelegramRateLimitGuard implements CanActivate {
  private readonly rateLimits = new Map<string, number[]>();
  private readonly maxReportsPerHour: number;

  constructor(private readonly configService: ConfigService) {
    this.maxReportsPerHour = configService.get<number>(
      'telegram.maxReportsPerHour',
      5,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getArgByIndex(0) as BotContext;
    const telegramId = ctx.from?.id?.toString();

    if (!telegramId) {
      return false;
    }

    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const timestamps = this.rateLimits.get(telegramId) || [];
    const recentTimestamps = timestamps.filter((t) => t > oneHourAgo);

    if (recentTimestamps.length >= this.maxReportsPerHour) {
      await ctx.reply(
        `⏰ You have reached the maximum number of reports per hour (${this.maxReportsPerHour}).\n\n` +
          'Please try again later.',
      );
      return false;
    }

    recentTimestamps.push(now);
    this.rateLimits.set(telegramId, recentTimestamps);

    if (this.rateLimits.size > 100) {
      this.cleanupOldEntries(oneHourAgo);
    }

    return true;
  }

  private cleanupOldEntries(oneHourAgo: number): void {
    for (const [telegramId, timestamps] of this.rateLimits.entries()) {
      const recentTimestamps = timestamps.filter((t) => t > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.rateLimits.delete(telegramId);
      } else {
        this.rateLimits.set(telegramId, recentTimestamps);
      }
    }
  }
}
