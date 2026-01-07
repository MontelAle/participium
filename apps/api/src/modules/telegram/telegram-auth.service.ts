import type { User } from '@entities';
import { Profile, TelegramLinkCode } from '@entities';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { customAlphabet } from 'nanoid';
import { InjectBot } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import { Repository } from 'typeorm';
import { ACTIONS, BUTTONS, MESSAGES } from './constants/telegram-ui.constants';
import { TelegramFormatterUtil } from './utils/telegram-formatter.util';

const nanoid6 = customAlphabet('0123456789', 6);

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf,
    @InjectRepository(TelegramLinkCode)
    private readonly telegramLinkCodeRepository: Repository<TelegramLinkCode>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly formatterUtil: TelegramFormatterUtil,
  ) {}

  async generateLinkCode(
    telegramId: string,
    telegramUsername: string,
  ): Promise<string> {
    const existingProfile = await this.profileRepository.findOne({
      where: { telegramId },
    });

    if (existingProfile) {
      throw new BadRequestException(
        'This Telegram account is already linked to a user account',
      );
    }

    const code = nanoid6();

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const linkCode = this.telegramLinkCodeRepository.create({
      code,
      telegramId,
      telegramUsername,
      expiresAt,
      used: false,
      userId: null,
    });

    await this.telegramLinkCodeRepository.save(linkCode);

    return code;
  }

  async linkAccount(code: string, userId: string): Promise<void> {
    const linkCode = await this.telegramLinkCodeRepository.findOne({
      where: { code },
    });

    if (!linkCode) {
      throw new NotFoundException('Invalid link code');
    }

    if (linkCode.expiresAt < new Date()) {
      throw new BadRequestException('Link code has expired');
    }

    if (linkCode.used) {
      throw new BadRequestException('Link code has already been used');
    }

    const profile = await this.profileRepository.findOne({ where: { userId } });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    if (profile.telegramId) {
      throw new BadRequestException(
        'Your account is already linked to a Telegram account',
      );
    }

    profile.telegramId = linkCode.telegramId;
    profile.telegramUsername = linkCode.telegramUsername;
    profile.telegramLinkedAt = new Date();

    await this.profileRepository.save(profile);

    linkCode.used = true;
    linkCode.userId = userId;
    await this.telegramLinkCodeRepository.save(linkCode);

    await this.sendLinkSuccessMessage(linkCode.telegramId);
  }

  private async sendLinkSuccessMessage(telegramId: string): Promise<void> {
    try {
      const mapUrl = this.formatterUtil.getFrontendUrl('/reports/map');
      const isLocal = this.formatterUtil.isLocalhost(mapUrl);

      let message = MESSAGES.LINK_SUCCESS;

      if (isLocal) {
        message += `\n\n👉 <b>${BUTTONS.VIEW_MAP}:</b>\n<code>${mapUrl}</code>`;
      }

      const buttons: any[] = [
        [Markup.button.callback(BUTTONS.NEW_REPORT, ACTIONS.START_NEW_REPORT)],
      ];

      if (!isLocal) {
        buttons.push([Markup.button.url(BUTTONS.VIEW_MAP, mapUrl)]);
      }

      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        ...Markup.inlineKeyboard(buttons),
      });

      this.logger.log(
        `Link success message sent to Telegram user ${telegramId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send link success message to ${telegramId}:`,
        error,
      );
    }
  }

  async getLinkedUser(telegramId: string): Promise<User | null> {
    const profile = await this.profileRepository.findOne({
      where: { telegramId },
      relations: ['user'],
    });

    if (!profile) {
      return null;
    }

    return profile.user;
  }

  async getUserId(telegramId: string): Promise<string | null> {
    const profile = await this.profileRepository.findOne({
      where: { telegramId },
      select: ['id', 'userId'],
    });

    return profile?.userId || null;
  }

  async isLinked(telegramId: string): Promise<boolean> {
    const profile = await this.profileRepository.findOne({
      where: { telegramId },
      select: ['id'],
    });

    return !!profile;
  }
}
