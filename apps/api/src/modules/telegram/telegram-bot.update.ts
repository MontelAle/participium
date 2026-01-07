import { Injectable, Logger } from '@nestjs/common';
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { ACTIONS, BUTTONS, MESSAGES } from './constants/telegram-ui.constants';
import { BotContext } from './interfaces/bot-context.interface';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramFormatterUtil } from './utils/telegram-formatter.util';

@Update()
@Injectable()
export class TelegramBotUpdate {
  private readonly logger = new Logger(TelegramBotUpdate.name);

  constructor(
    private readonly telegramAuthService: TelegramAuthService,
    private readonly formatterUtil: TelegramFormatterUtil,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();
    const linked = await this.telegramAuthService.isLinked(telegramId);
    const frontendUrl = this.formatterUtil.getFrontendUrl();
    const isLocal = this.formatterUtil.isLocalhost(frontendUrl);

    if (linked) {
      await ctx.reply(MESSAGES.WELCOME_LINKED, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              BUTTONS.NEW_REPORT,
              ACTIONS.START_NEW_REPORT,
            ),
          ],
        ]),
      });
    } else {
      let message = MESSAGES.WELCOME_UNLINKED;

      if (isLocal) {
        message += `\n\n🌐 <b>Register at:</b>\n<code>${frontendUrl}/auth/register</code>`;
      }

      const buttons: any[] = [
        [Markup.button.callback(BUTTONS.LINK_ACCOUNT, ACTIONS.LINK_ACCOUNT)],
      ];

      if (!isLocal) {
        buttons.push([
          Markup.button.url(BUTTONS.REGISTER, `${frontendUrl}/auth/register`),
        ]);
      }

      await ctx.reply(message, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons),
      });
    }

    this.logger.log(`User ${telegramId} started the bot`);
  }

  @Command('link')
  async onLink(@Ctx() ctx: BotContext) {
    await ctx.scene.enter('link-account');
  }

  @Action(ACTIONS.LINK_ACCOUNT)
  async onLinkAccountButton(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('link-account');
  }

  @Action(ACTIONS.START_NEW_REPORT)
  async onStartNewReportButton(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('newreport');
  }

  @Command('newreport')
  async onNewReport(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();
    const linked = await this.telegramAuthService.isLinked(telegramId);

    if (!linked) {
      await ctx.reply(MESSAGES.ERR_NOT_LINKED);
      return;
    }

    await ctx.scene.enter('newreport');
  }

  @Command('help')
  async onHelp(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();
    const isLinked = await this.telegramAuthService.isLinked(telegramId);
    const frontendUrl = this.formatterUtil.getFrontendUrl();
    const isLocal = this.formatterUtil.isLocalhost(frontendUrl);

    let helpText = '<b>Participium Bot Help</b> 📖\n\n';

    if (isLinked) {
      helpText +=
        '<b>🤖 AVAILABLE COMMANDS</b>\n' +
        `/newreport - ${BUTTONS.NEW_REPORT}\n` +
        '/help - Show this usage guide\n';
    } else {
      helpText +=
        '<b>🤖 AVAILABLE COMMANDS</b>\n' +
        '/start - Start Participium Bot\n' +
        `/link - ${BUTTONS.LINK_ACCOUNT}\n` +
        '/help - Show this usage guide\n';
    }

    helpText +=
      '\n<b>📝 HOW TO CREATE A REPORT</b>\n' +
      '1. Type /newreport to start\n' +
      '2. 📍Location: Share your position using the attachment paperclip\n' +
      '3. ✏️Details: Enter a clear Title and Description\n' +
      '4. 📂Category: Choose from the list\n' +
      '5. 📸Photos: Upload 1 to 3 photos (Required)\n' +
      '6. 🕵️Privacy: Choose if you want to remain Anonymous\n' +
      `7. ${BUTTONS.CONFIRM} submission \n\n` +
      '⚠️ Note: You must link your account before submitting reports';

    if (isLocal) {
      helpText += `\n\n🌐 <b>Web Portal:</b>\n<code>${frontendUrl}</code>`;
    }

    const buttons: any[] = [];
    if (!isLocal) {
      buttons.push([Markup.button.url('🌐 Web Portal', frontendUrl)]);
    }

    await ctx.reply(helpText, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
      ...Markup.inlineKeyboard(buttons),
    });
  }
}
