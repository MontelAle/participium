import { Test, TestingModule } from '@nestjs/testing';
import { createMockBotContext } from './__test-utils__/telegram-mocks';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramFormatterUtil } from './utils/telegram-formatter.util';

describe('TelegramBotUpdate', () => {
  let update: TelegramBotUpdate;
  let telegramAuthService: jest.Mocked<TelegramAuthService>;
  let formatterUtil: jest.Mocked<TelegramFormatterUtil>;

  beforeEach(async () => {
    const mockTelegramAuthService = {
      isLinked: jest.fn(),
    };

    const mockFormatterUtil = {
      getFrontendUrl: jest.fn((path?: string) =>
        path ? `https://example.com${path}` : 'https://example.com',
      ),
      isLocalhost: jest.fn(() => false),
      formatLinkMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramBotUpdate,
        { provide: TelegramAuthService, useValue: mockTelegramAuthService },
        { provide: TelegramFormatterUtil, useValue: mockFormatterUtil },
      ],
    }).compile();

    update = module.get<TelegramBotUpdate>(TelegramBotUpdate);
    telegramAuthService = module.get(TelegramAuthService);
    formatterUtil = module.get(TelegramFormatterUtil);
  });

  it('should be defined', () => {
    expect(update).toBeDefined();
  });

  describe('onStart', () => {
    it('should show linked welcome message if user is linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(true);

      await update.onStart(ctx);

      expect(telegramAuthService.isLinked).toHaveBeenCalledWith('123456789');
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Welcome'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );
    });

    it('should show unlinked welcome message if user not linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);

      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Welcome'),
        expect.any(Object),
      );
    });

    it('should show localhost URLs with code blocks for unlinked users', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      formatterUtil.isLocalhost.mockReturnValue(true);
      formatterUtil.getFrontendUrl.mockReturnValue('http://localhost:3000');

      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('localhost:3000'),
        expect.any(Object),
      );
    });

    it('should show production URLs with inline buttons for unlinked users', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      formatterUtil.isLocalhost.mockReturnValue(false);
      formatterUtil.getFrontendUrl.mockReturnValue('https://example.com');

      await update.onStart(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        }),
      );
    });

    it('should log user start event', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);

      await update.onStart(ctx);

      expect(telegramAuthService.isLinked).toHaveBeenCalled();
    });
  });

  describe('onLink', () => {
    it('should enter link-account scene', async () => {
      const ctx = createMockBotContext();

      await update.onLink(ctx);

      expect(ctx.scene.enter).toHaveBeenCalledWith('link-account');
    });
  });

  describe('onLinkAccountButton', () => {
    it('should answer callback query', async () => {
      const ctx = createMockBotContext();

      await update.onLinkAccountButton(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should enter link-account scene', async () => {
      const ctx = createMockBotContext();

      await update.onLinkAccountButton(ctx);

      expect(ctx.scene.enter).toHaveBeenCalledWith('link-account');
    });
  });

  describe('onStartNewReportButton', () => {
    it('should answer callback query', async () => {
      const ctx = createMockBotContext();

      await update.onStartNewReportButton(ctx);

      expect(ctx.answerCbQuery).toHaveBeenCalled();
    });

    it('should enter newreport scene', async () => {
      const ctx = createMockBotContext();

      await update.onStartNewReportButton(ctx);

      expect(ctx.scene.enter).toHaveBeenCalledWith('newreport');
    });
  });

  describe('onNewReport', () => {
    it('should enter newreport scene if user is linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(true);

      await update.onNewReport(ctx);

      expect(telegramAuthService.isLinked).toHaveBeenCalledWith('123456789');
      expect(ctx.scene.enter).toHaveBeenCalledWith('newreport');
      expect(ctx.reply).not.toHaveBeenCalled();
    });

    it('should send error message if user not linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);

      await update.onNewReport(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('link your account'),
      );
      expect(ctx.scene.enter).not.toHaveBeenCalled();
    });
  });

  describe('onHelp', () => {
    it('should show linked commands if user is linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(true);

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('/newreport'),
        expect.any(Object),
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.not.stringContaining('/link'),
        expect.any(Object),
      );
    });

    it('should show unlinked commands if user not linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('/link'),
        expect.any(Object),
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('/start'),
        expect.any(Object),
      );
    });

    it('should show localhost URLs with code blocks', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      formatterUtil.isLocalhost.mockReturnValue(true);
      formatterUtil.getFrontendUrl.mockReturnValue('http://localhost:3000');

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('localhost:3000'),
        expect.any(Object),
      );
    });

    it('should show production URLs with inline buttons', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      formatterUtil.isLocalhost.mockReturnValue(false);
      formatterUtil.getFrontendUrl.mockReturnValue('https://example.com');

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        }),
      );
    });

    it('should include help text for creating reports', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(true);

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('HOW TO CREATE A REPORT'),
        expect.any(Object),
      );
    });

    it('should disable link preview', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);

      await update.onHelp(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          link_preview_options: { is_disabled: true },
        }),
      );
    });
  });
});
