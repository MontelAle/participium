import {
  Boundary,
  Category,
  Profile,
  Report,
  TelegramLinkCode,
  User,
} from '@entities';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { CategoriesModule } from '../categories/categories.module';
import { ReportsModule } from '../reports/reports.module';
import { TelegramLinkedGuard } from './guards/telegram-linked.guard';
import { TelegramRateLimitGuard } from './guards/telegram-rate-limit.guard';
import { LinkAccountScene } from './scenes/link-account.scene';
import { NewReportScene } from './scenes/newreport.scene';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramGeocodingService } from './telegram-geocoding.service';
import { TelegramImageService } from './telegram-image.service';
import { TelegramService } from './telegram.service';
import { LocationValidatorUtil } from './utils/location-validator.util';
import { TelegramFormatterUtil } from './utils/telegram-formatter.util';

@Module({
  imports: [
    ConfigModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const useWebhook = config.get<boolean>('telegram.useWebhook', false);
        const botToken = config.get<string>('telegram.botToken');

        if (!botToken) {
          throw new Error(
            'TELEGRAM_BOT_TOKEN is not defined in environment variables',
          );
        }

        return {
          token: botToken,
          middlewares: [session()],
          launchOptions: useWebhook
            ? {
                webhook: {
                  domain: config.get<string>('telegram.webhookUrl'),
                  hookPath: '/telegram/webhook',
                },
              }
            : {
                polling: {
                  allowedUpdates: ['message', 'callback_query'],
                },
              },
        };
      },
    }),
    TypeOrmModule.forFeature([
      Profile,
      User,
      Report,
      Category,
      Boundary,
      TelegramLinkCode,
    ]),
    ReportsModule,
    CategoriesModule,
  ],
  providers: [
    TelegramService,
    TelegramAuthService,
    TelegramImageService,
    TelegramGeocodingService,
    TelegramBotUpdate,
    NewReportScene,
    LinkAccountScene,
    TelegramLinkedGuard,
    TelegramRateLimitGuard,
    LocationValidatorUtil,
    TelegramFormatterUtil,
  ],
  exports: [TelegramAuthService],
})
export class TelegramModule {}
