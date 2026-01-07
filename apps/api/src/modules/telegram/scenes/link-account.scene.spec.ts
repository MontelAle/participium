import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockBotContext,
  createMockUser,
} from '../__test-utils__/telegram-mocks';
import { TelegramAuthService } from '../telegram-auth.service';
import { TelegramFormatterUtil } from '../utils/telegram-formatter.util';
import { LinkAccountScene } from './link-account.scene';

describe('LinkAccountScene', () => {
  let scene: LinkAccountScene;
  let telegramAuthService: jest.Mocked<TelegramAuthService>;
  let formatterUtil: jest.Mocked<TelegramFormatterUtil>;

  beforeEach(async () => {
    const mockTelegramAuthService = {
      isLinked: jest.fn(),
      getLinkedUser: jest.fn(),
      generateLinkCode: jest.fn(),
    };

    const mockFormatterUtil = {
      getFrontendUrl: jest.fn((path?: string) =>
        path ? `https://example.com${path}` : 'https://example.com',
      ),
      isLocalhost: jest.fn(() => false),
      formatLinkMessage: jest.fn(
        (text, url, label) => `${text}\n\n${label}: ${url}`,
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkAccountScene,
        { provide: TelegramAuthService, useValue: mockTelegramAuthService },
        { provide: TelegramFormatterUtil, useValue: mockFormatterUtil },
      ],
    }).compile();

    scene = module.get<LinkAccountScene>(LinkAccountScene);
    telegramAuthService = module.get(TelegramAuthService);
    formatterUtil = module.get(TelegramFormatterUtil);
  });

  it('should be defined', () => {
    expect(scene).toBeDefined();
  });

  describe('onEnter', () => {
    it('should generate link code and send instructions for unlinked user', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');

      await scene.onEnter(ctx);

      expect(telegramAuthService.isLinked).toHaveBeenCalledWith('123456789');
      expect(telegramAuthService.generateLinkCode).toHaveBeenCalledWith(
        '123456789',
        'testuser',
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('123456'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should show already linked message if user is linked', async () => {
      const ctx = createMockBotContext();
      const mockUser = createMockUser({ username: 'johndoe' });
      telegramAuthService.isLinked.mockResolvedValue(true);
      telegramAuthService.getLinkedUser.mockResolvedValue(mockUser);

      await scene.onEnter(ctx);

      expect(telegramAuthService.getLinkedUser).toHaveBeenCalledWith(
        '123456789',
      );
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('johndoe'),
        expect.objectContaining({
          parse_mode: 'HTML',
        }),
      );
      expect(ctx.scene.leave).toHaveBeenCalled();
      expect(telegramAuthService.generateLinkCode).not.toHaveBeenCalled();
    });

    it('should leave scene after showing already linked message', async () => {
      const ctx = createMockBotContext();
      const mockUser = createMockUser();
      telegramAuthService.isLinked.mockResolvedValue(true);
      telegramAuthService.getLinkedUser.mockResolvedValue(mockUser);

      await scene.onEnter(ctx);

      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should show inline buttons for production URLs', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');
      formatterUtil.isLocalhost.mockReturnValue(false);

      await scene.onEnter(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.any(Array),
          }),
        }),
      );
    });

    it('should not show buttons for localhost URLs', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');
      formatterUtil.isLocalhost.mockReturnValue(true);

      await scene.onEnter(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reply_markup: expect.objectContaining({
            inline_keyboard: [],
          }),
        }),
      );
    });

    it('should include registration button for production URLs', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');
      formatterUtil.isLocalhost.mockReturnValue(false);

      await scene.onEnter(ctx);

      const replyCall = (ctx.reply as jest.Mock).mock.calls[0];
      const options = replyCall[1];
      expect(options.reply_markup.inline_keyboard).toHaveLength(2);
    });

    it('should use formatLinkMessage for message formatting', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');

      await scene.onEnter(ctx);

      expect(formatterUtil.formatLinkMessage).toHaveBeenCalledWith(
        expect.stringContaining('123456'),
        'https://example.com/settings/telegram',
        expect.any(String),
      );
    });

    it('should log code generation', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');

      await scene.onEnter(ctx);

      expect(telegramAuthService.generateLinkCode).toHaveBeenCalled();
    });

    it('should leave scene after sending instructions', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');

      await scene.onEnter(ctx);

      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should handle errors and send generic error message', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockRejectedValue(
        new Error('Database error'),
      );

      await scene.onEnter(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('error'));
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should leave scene even on error', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.isLinked.mockRejectedValue(new Error('Test error'));

      await scene.onEnter(ctx);

      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should use Unknown username if username not provided', async () => {
      const ctx = createMockBotContext({
        from: { id: 123456789, username: undefined } as any,
      });
      telegramAuthService.isLinked.mockResolvedValue(false);
      telegramAuthService.generateLinkCode.mockResolvedValue('123456');

      await scene.onEnter(ctx);

      expect(telegramAuthService.generateLinkCode).toHaveBeenCalledWith(
        '123456789',
        'Unknown',
      );
    });
  });
});
