import { Injectable, Logger } from '@nestjs/common';
import { Action, Command, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { ACTIONS, BUTTONS, MESSAGES } from '../constants/telegram-ui.constants';
import { BotContext } from '../interfaces/bot-context.interface';
import { ReportSessionData } from '../interfaces/report-session.interface';
import { TelegramAuthService } from '../telegram-auth.service';
import { TelegramGeocodingService } from '../telegram-geocoding.service';
import { TelegramService } from '../telegram.service';
import { LocationValidatorUtil } from '../utils/location-validator.util';
import { TelegramFormatterUtil } from '../utils/telegram-formatter.util';

@Scene('newreport')
@Injectable()
export class NewReportScene {
  private readonly logger = new Logger(NewReportScene.name);

  constructor(
    private readonly telegramAuthService: TelegramAuthService,
    private readonly telegramService: TelegramService,
    private readonly geocodingService: TelegramGeocodingService,
    private readonly locationValidator: LocationValidatorUtil,
    private readonly formatterUtil: TelegramFormatterUtil,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const telegramId = ctx.from.id.toString();

    const user = await this.telegramAuthService.getLinkedUser(telegramId);

    if (!user) {
      await ctx.reply(MESSAGES.ERR_NOT_LINKED);
      await ctx.scene.leave();
      return;
    }

    if (!user.isEmailVerified) {
      await ctx.reply(MESSAGES.ERR_EMAIL_VERIFY);
      await ctx.scene.leave();
      return;
    }

    ctx.session.reportData = {
      step: 'location',
      photos: [],
    } as ReportSessionData;

    await this.requestLocation(ctx);
  }

  private async requestLocation(ctx: BotContext) {
    await ctx.reply(MESSAGES.STEP_LOCATION, {
      parse_mode: 'HTML',
      ...Markup.keyboard([[BUTTONS.CANCEL]])
        .resize()
        .oneTime(),
    });
  }

  @On('location')
  async onLocation(@Ctx() ctx: BotContext) {
    if (!ctx.session.reportData || ctx.session.reportData.step !== 'location') {
      return;
    }

    const location = (ctx.message as any).location;
    const { latitude, longitude } = location;

    const isValid = await this.locationValidator.validateTurinBoundary(
      latitude,
      longitude,
    );

    if (!isValid) {
      await ctx.reply(MESSAGES.ERR_OUTSIDE_BOUNDARIES);
      return;
    }

    ctx.session.reportData.location = { latitude, longitude };

    const address = await this.geocodingService.reverseGeocode(
      latitude,
      longitude,
    );
    if (address) {
      ctx.session.reportData.address = address;
    }

    ctx.session.reportData.step = 'title';

    await this.requestTitle(ctx);
  }

  private async requestTitle(ctx: BotContext) {
    await ctx.reply(MESSAGES.STEP_TITLE, {
      parse_mode: 'HTML',
      ...Markup.keyboard([[BUTTONS.CANCEL]])
        .resize()
        .oneTime(),
    });
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    if (!ctx.session.reportData) {
      return;
    }

    const text = (ctx.message as any).text;

    if (text === BUTTONS.CANCEL || text === '/cancel') {
      await this.cancelOperation(ctx);
      return;
    }

    if (
      (text === BUTTONS.DONE || text === '/done') &&
      ctx.session.reportData.step === 'photos'
    ) {
      await this.onPhotosDone(ctx);
      return;
    }

    switch (ctx.session.reportData.step) {
      case 'location':
        await this.handleLocationText(ctx);
        break;
      case 'title':
        await this.handleTitle(ctx, text);
        break;
      case 'description':
        await this.handleDescription(ctx, text);
        break;
      default:
        break;
    }
  }

  private async handleLocationText(ctx: BotContext) {
    await ctx.reply(MESSAGES.ERR_TEXT_LOCATION, {
      ...Markup.keyboard([[BUTTONS.CANCEL]])
        .resize()
        .oneTime(),
    });
  }

  private async handleTitle(ctx: BotContext, title: string) {
    if (title.length < 1 || title.length > 100) {
      await ctx.reply(MESSAGES.ERR_INVALID_TITLE);
      return;
    }

    ctx.session.reportData.title = title;
    ctx.session.reportData.step = 'description';

    await this.requestDescription(ctx);
  }

  private async requestDescription(ctx: BotContext) {
    await ctx.reply(MESSAGES.STEP_DESC, {
      parse_mode: 'HTML',
      ...Markup.keyboard([[BUTTONS.CANCEL]])
        .resize()
        .oneTime(),
    });
  }

  private async handleDescription(ctx: BotContext, description: string) {
    if (description.length < 10 || description.length > 1000) {
      await ctx.reply(MESSAGES.ERR_INVALID_DESC);
      return;
    }

    ctx.session.reportData.description = description;
    ctx.session.reportData.step = 'category';

    await this.requestCategory(ctx);
  }

  private async requestCategory(ctx: BotContext) {
    const categories = await this.telegramService.getCategories();

    const buttons = categories.map((category) => [
      Markup.button.callback(
        category.name,
        `${ACTIONS.CATEGORY_PREFIX}${category.id}`,
      ),
    ]);
    buttons.push([Markup.button.callback(BUTTONS.CANCEL, ACTIONS.CANCEL)]);

    await ctx.reply(MESSAGES.STEP_CATEGORY, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons),
    });
  }

  @Action(new RegExp(`^${ACTIONS.CATEGORY_PREFIX}(.+)`))
  async onCategorySelect(@Ctx() ctx: BotContext) {
    if (!ctx.session.reportData || ctx.session.reportData.step !== 'category') {
      return;
    }

    const categoryId = ctx.match?.[1];

    const categories = await this.telegramService.getCategories();
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      await ctx.answerCbQuery('Category not found');
      return;
    }

    ctx.session.reportData.categoryId = categoryId;
    ctx.session.reportData.categoryName = category.name;
    ctx.session.reportData.step = 'photos';

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);

    await this.requestPhotos(ctx);
  }

  private async requestPhotos(ctx: BotContext) {
    await ctx.reply(MESSAGES.STEP_PHOTOS, {
      parse_mode: 'HTML',
      ...Markup.keyboard([[BUTTONS.DONE], [BUTTONS.CANCEL]])
        .resize()
        .oneTime(),
    });
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: BotContext) {
    if (!ctx.session.reportData || ctx.session.reportData.step !== 'photos') {
      return;
    }

    const photos = (ctx.message as any).photo;
    const largestPhoto = photos[photos.length - 1];

    if (ctx.session.reportData.photos.length >= 3) {
      await ctx.reply(MESSAGES.ERR_PHOTO_LIMIT);
      return;
    }

    ctx.session.reportData.photos.push(largestPhoto.file_id);
    const count = ctx.session.reportData.photos.length;

    await ctx.reply(
      `✅ Photo ${count}/3 received.\n\n` +
        (count < 3
          ? 'Send more photos or type /done to continue.'
          : 'Type /done to continue.'),
    );
  }

  private async onPhotosDone(ctx: BotContext) {
    if (ctx.session.reportData.photos.length < 1) {
      await ctx.reply(MESSAGES.ERR_NO_PHOTOS);
      return;
    }

    ctx.session.reportData.step = 'anonymity';

    await this.requestAnonymity(ctx);
  }

  private async requestAnonymity(ctx: BotContext) {
    await ctx.reply(MESSAGES.STEP_ANONYMITY, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(BUTTONS.ANONYMOUS_YES, ACTIONS.ANONYMOUS_YES),
          Markup.button.callback(BUTTONS.ANONYMOUS_NO, ACTIONS.ANONYMOUS_NO),
        ],
        [Markup.button.callback(BUTTONS.CANCEL, ACTIONS.CANCEL)],
      ]),
    });
  }

  @Action(new RegExp(`^(${ACTIONS.ANONYMOUS_YES}|${ACTIONS.ANONYMOUS_NO})`))
  async onAnonymitySelect(@Ctx() ctx: BotContext) {
    if (
      !ctx.session.reportData ||
      ctx.session.reportData.step !== 'anonymity'
    ) {
      return;
    }

    const choice = ctx.match[0];
    const isAnonymous = choice === ACTIONS.ANONYMOUS_YES;

    ctx.session.reportData.isAnonymous = isAnonymous;
    ctx.session.reportData.step = 'confirm';

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);

    await this.requestConfirmation(ctx);
  }

  private async requestConfirmation(ctx: BotContext) {
    const data = ctx.session.reportData;

    const locationText = data.address
      ? `📍 <b>Location:</b> ${data.address}\n`
      : `📍 <b>Location:</b> ${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}\n`;

    const summary =
      MESSAGES.STEP_CONFIRM +
      '\n\n' +
      '<b>Report Summary:</b>\n\n' +
      locationText +
      `📝 <b>Title:</b> ${data.title}\n` +
      `📄 <b>Description:</b> ${data.description}\n` +
      `🗂️ <b>Category:</b> ${data.categoryName}\n` +
      `📷 <b>Photos:</b> ${data.photos.length} attached\n` +
      `👤 <b>Anonymous:</b> ${data.isAnonymous ? 'Yes' : 'No'}\n\n` +
      'Confirm submission?';

    await ctx.reply(summary, {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback(BUTTONS.CONFIRM, ACTIONS.CONFIRM_YES),
          Markup.button.callback(BUTTONS.CANCEL, ACTIONS.CANCEL),
        ],
      ]),
    });
  }

  @Action(ACTIONS.CONFIRM_YES)
  async onConfirm(@Ctx() ctx: BotContext) {
    if (!ctx.session.reportData || ctx.session.reportData.step !== 'confirm') {
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(MESSAGES.CREATING_REPORT);

    try {
      const telegramId = ctx.from.id.toString();
      const data = ctx.session.reportData;

      const report = await this.telegramService.createReport(
        telegramId,
        {
          title: data.title,
          description: data.description,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.address,
          categoryId: data.categoryId,
          isAnonymous: data.isAnonymous,
        },
        data.photos,
      );

      const reportUrl = this.formatterUtil.getFrontendUrl(
        `/reports/view/${report.id}`,
      );
      const mapUrl = this.formatterUtil.getFrontendUrl('/reports/map');
      const isLocal = this.formatterUtil.isLocalhost(reportUrl);

      const message =
        MESSAGES.SUCCESS_REPORT +
        '\n\n' +
        `<b>Report ID:</b> <code>${report.id}</code>\n` +
        `<b>Status:</b> ${report.status}`;

      const buttons: any[] = [];

      if (!isLocal) {
        buttons.push([Markup.button.url(BUTTONS.VIEW_REPORT, reportUrl)]);
        buttons.push([Markup.button.url(BUTTONS.VIEW_MAP, mapUrl)]);
      } else {
        await ctx.reply(
          `👉 <b>Report Link:</b>\n<code>${reportUrl}</code>\n\n👉 <b>Map:</b>\n<code>${mapUrl}</code>`,
          { parse_mode: 'HTML' },
        );
      }

      await ctx.reply(message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard(buttons),
      });

      this.logger.log(`Report ${report.id} created via bot by ${telegramId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Report creation error: ${errorMessage}`);
      await ctx.reply(MESSAGES.ERR_GENERIC + `\n${errorMessage}`, {
        parse_mode: 'HTML',
      });
    } finally {
      ctx.session.reportData = null;
      await ctx.scene.leave();
    }
  }

  @Action(ACTIONS.CANCEL)
  async onCancel(@Ctx() ctx: BotContext) {
    await this.cancelOperation(ctx);
  }

  @Command('cancel')
  async onCancelCommand(@Ctx() ctx: BotContext) {
    await this.cancelOperation(ctx);
  }

  private async cancelOperation(ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
      await ctx.editMessageReplyMarkup(undefined);
    }
    await ctx.reply(MESSAGES.CANCELLED, Markup.removeKeyboard());
    ctx.session.reportData = null;
    await ctx.scene.leave();
  }
}
