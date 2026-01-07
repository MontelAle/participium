import { Injectable, Logger } from '@nestjs/common';
import { Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { MESSAGES } from '../constants/telegram-ui.constants';
import { BotContext } from '../interfaces/bot-context.interface';
import { TelegramAuthService } from '../telegram-auth.service';
import { TelegramFormatterUtil } from '../utils/telegram-formatter.util';

@Scene('link-account')
@Injectable()
export class LinkAccountScene {
  private readonly logger = new Logger(LinkAccountScene.name);

  constructor(
    private readonly telegramAuthService: TelegramAuthService,
    private readonly formatterUtil: TelegramFormatterUtil,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();
    const telegramUsername = ctx.from.username || 'Unknown';

    try {
      const isLinked = await this.telegramAuthService.isLinked(telegramId);

      if (isLinked) {
        const user = await this.telegramAuthService.getLinkedUser(telegramId);
        const msg = MESSAGES.LINK_ALREADY_LINKED.replace(
          '{username}',
          user.username,
        );
        await ctx.reply(msg, { parse_mode: 'HTML' });
        await ctx.scene.leave();
        return;
      }

      const code = await this.telegramAuthService.generateLinkCode(
        telegramId,
        telegramUsername,
      );

      const linkUrl = this.formatterUtil.getFrontendUrl('/settings/telegram');
      const registerUrl = this.formatterUtil.getFrontendUrl('/auth/register');

      let message = MESSAGES.LINK_INSTRUCTIONS.replace('{code}', code);

      message = this.formatterUtil.formatLinkMessage(
        message,
        linkUrl,
        MESSAGES.LBL_LINKING_PAGE,
      );

      const buttons = [];

      if (!this.formatterUtil.isLocalhost(linkUrl)) {
        buttons.push([Markup.button.url(MESSAGES.LBL_LINKING_PAGE, linkUrl)]);
      }

      if (!this.formatterUtil.isLocalhost(registerUrl)) {
        buttons.push([Markup.button.url(MESSAGES.LBL_REGISTER, registerUrl)]);
      }

      await ctx.reply(message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard(buttons),
      });

      this.logger.log(`Link code generated for Telegram user ${telegramId}`);
      await ctx.scene.leave();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Link account scene error: ${errorMessage}`);
      await ctx.reply(MESSAGES.ERR_GENERIC);
      await ctx.scene.leave();
    }
  }
}
