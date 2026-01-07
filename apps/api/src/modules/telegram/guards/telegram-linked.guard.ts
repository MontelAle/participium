import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegramAuthService } from '../telegram-auth.service';
import { BotContext } from '../interfaces/bot-context.interface';

@Injectable()
export class TelegramLinkedGuard implements CanActivate {
  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.getArgByIndex(0) as BotContext;
    const telegramId = ctx.from?.id?.toString();

    if (!telegramId) {
      return false;
    }

    const user = await this.telegramAuthService.getLinkedUser(telegramId);

    if (!user) {
      await ctx.reply('🔗 Link your account first: /link');
      return false;
    }

    if (!user.isEmailVerified) {
      await ctx.reply('📧 Please verify your email first.');
      return false;
    }

    return true;
  }
}
