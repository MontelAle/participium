import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockBotContext,
  createMockCategories,
  createMockReportSession,
  createMockUser,
} from '../__test-utils__/telegram-mocks';
import { ACTIONS, BUTTONS, MESSAGES } from '../constants/telegram-ui.constants';
import { TelegramAuthService } from '../telegram-auth.service';
import { TelegramGeocodingService } from '../telegram-geocoding.service';
import { TelegramService } from '../telegram.service';
import { LocationValidatorUtil } from '../utils/location-validator.util';
import { TelegramFormatterUtil } from '../utils/telegram-formatter.util';
import { NewReportScene } from './newreport.scene';

describe('NewReportScene', () => {
  let scene: NewReportScene;
  let telegramAuthService: jest.Mocked<TelegramAuthService>;
  let telegramService: jest.Mocked<TelegramService>;
  let geocodingService: jest.Mocked<TelegramGeocodingService>;
  let locationValidator: jest.Mocked<LocationValidatorUtil>;
  let formatterUtil: jest.Mocked<TelegramFormatterUtil>;

  beforeEach(async () => {
    const mockTelegramAuthService = {
      getLinkedUser: jest.fn(),
    };

    const mockTelegramService = {
      getCategories: jest.fn().mockResolvedValue([]),
      createReport: jest.fn(),
    };

    const mockGeocodingService = {
      reverseGeocode: jest.fn(),
    };

    const mockLocationValidator = {
      validateTurinBoundary: jest.fn(),
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
        NewReportScene,
        { provide: TelegramAuthService, useValue: mockTelegramAuthService },
        { provide: TelegramService, useValue: mockTelegramService },
        { provide: TelegramGeocodingService, useValue: mockGeocodingService },
        { provide: LocationValidatorUtil, useValue: mockLocationValidator },
        { provide: TelegramFormatterUtil, useValue: mockFormatterUtil },
      ],
    }).compile();

    scene = module.get<NewReportScene>(NewReportScene);
    telegramAuthService = module.get(TelegramAuthService);
    telegramService = module.get(TelegramService);
    geocodingService = module.get(TelegramGeocodingService);
    locationValidator = module.get(LocationValidatorUtil);
    formatterUtil = module.get(TelegramFormatterUtil);
  });

  it('should be defined', () => {
    expect(scene).toBeDefined();
  });

  describe('onEnter', () => {
    it('should initialize session and request location for linked verified user', async () => {
      const ctx = createMockBotContext();
      const mockUser = createMockUser({ isEmailVerified: true });
      telegramAuthService.getLinkedUser.mockResolvedValue(mockUser);

      await scene.onEnter(ctx);

      expect(ctx.session.reportData).toEqual({
        step: 'location',
        photos: [],
      });
      expect(ctx.reply).toHaveBeenCalledWith(
        MESSAGES.STEP_LOCATION,
        expect.any(Object),
      );
    });

    it('should leave scene if user not linked', async () => {
      const ctx = createMockBotContext();
      telegramAuthService.getLinkedUser.mockResolvedValue(null);

      await scene.onEnter(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_NOT_LINKED);
      expect(ctx.scene.leave).toHaveBeenCalled();
    });

    it('should leave scene if email not verified', async () => {
      const ctx = createMockBotContext();
      const mockUser = createMockUser({ isEmailVerified: false });
      telegramAuthService.getLinkedUser.mockResolvedValue(mockUser);

      await scene.onEnter(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_EMAIL_VERIFY);
      expect(ctx.scene.leave).toHaveBeenCalled();
    });
  });

  describe('onLocation', () => {
    it('should save location and transition to title step if valid', async () => {
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('location') },
        message: {
          location: { latitude: 45.070312, longitude: 7.686864 },
        } as any,
      });
      locationValidator.validateTurinBoundary.mockResolvedValue(true);
      geocodingService.reverseGeocode.mockResolvedValue('Via Roma 1, Torino');

      await scene.onLocation(ctx);

      expect(ctx.session.reportData.location).toEqual({
        latitude: 45.070312,
        longitude: 7.686864,
      });
      expect(ctx.session.reportData.address).toBe('Via Roma 1, Torino');
      expect(ctx.session.reportData.step).toBe('title');
      expect(ctx.reply).toHaveBeenCalledWith(
        MESSAGES.STEP_TITLE,
        expect.any(Object),
      );
    });

    it('should reject location outside boundary', async () => {
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('location') },
        message: {
          location: { latitude: 40.0, longitude: 8.0 },
        } as any,
      });
      locationValidator.validateTurinBoundary.mockResolvedValue(false);

      await scene.onLocation(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_OUTSIDE_BOUNDARIES);
      expect(ctx.session.reportData.step).toBe('location');
    });
  });

  describe('onText - title step', () => {
    it('should reject title > 100 chars', async () => {
      const title = 'A'.repeat(101);
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('title') },
        message: { text: title } as any,
      });

      await scene.onText(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_INVALID_TITLE);
      expect(ctx.session.reportData.step).toBe('title');
    });

    it('should reject empty title', async () => {
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('title') },
        message: { text: '' } as any,
      });

      await scene.onText(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_INVALID_TITLE);
      expect(ctx.session.reportData.step).toBe('title');
    });
  });

  describe('onText - description step', () => {
    it('should accept valid description (10 chars)', async () => {
      const description = 'A'.repeat(10);
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('description') },
        message: { text: description } as any,
      });

      telegramService.getCategories.mockResolvedValue(
        createMockCategories() as any,
      );

      await scene.onText(ctx);

      expect(ctx.session.reportData.description).toBe(description);
      expect(ctx.session.reportData.step).toBe('category');
    });

    it('should reject description < 10 chars', async () => {
      const description = 'A'.repeat(9);
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('description') },
        message: { text: description } as any,
      });

      await scene.onText(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_INVALID_DESC);
      expect(ctx.session.reportData.step).toBe('description');
    });

    it('should reject description > 1000 chars', async () => {
      const description = 'A'.repeat(1001);
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('description') },
        message: { text: description } as any,
      });

      await scene.onText(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_INVALID_DESC);
      expect(ctx.session.reportData.step).toBe('description');
    });
  });

  describe('onText - location step', () => {
    it('should send error if text sent instead of location', async () => {
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('location') },
        message: { text: 'Some text' } as any,
      });

      await scene.onText(ctx);

      expect(ctx.reply).toHaveBeenCalledWith(
        MESSAGES.ERR_TEXT_LOCATION,
        expect.any(Object),
      );
      expect(ctx.session.reportData.step).toBe('location');
    });
  });

  describe('onText - cancel and done commands', () => {
    it('should ignore done command in other steps', async () => {
      const ctx = createMockBotContext({
        session: { reportData: createMockReportSession('title') },
        message: { text: '/done' } as any,
      });

      await scene.onText(ctx);

      expect(ctx.session.reportData.title).toBe('/done');
      expect(ctx.session.reportData.step).toBe('description');
    });
  });

  describe('onPhoto', () => {
    it('should add 1st photo file_id to session', async () => {
      const ctx = createMockBotContext({
        session: {
          reportData: createMockReportSession('photos', { photos: [] }),
        },
        message: {
          photo: [
            { file_id: 'small', width: 100 },
            { file_id: 'large', width: 1000 },
          ],
        } as any,
      });

      await scene.onPhoto(ctx);

      expect(ctx.session.reportData.photos).toContain('large');
      expect(ctx.session.reportData.photos).toHaveLength(1);
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('1/3'));
    });

    it('should reject 4th photo (limit reached)', async () => {
      const session = createMockReportSession('photos', {
        photos: ['file_1', 'file_2', 'file_3'],
      });
      const ctx = createMockBotContext({
        session: { reportData: session },
        message: {
          photo: [{ file_id: 'file_4' }],
        } as any,
      });

      await scene.onPhoto(ctx);

      expect(ctx.session.reportData.photos).toHaveLength(3);
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Maximum of 3 photos'),
      );
    });

    it('should select largest photo from array', async () => {
      const ctx = createMockBotContext({
        session: {
          reportData: createMockReportSession('photos', { photos: [] }),
        },
        message: {
          photo: [
            { file_id: 'small', width: 100 },
            { file_id: 'medium', width: 500 },
            { file_id: 'large', width: 1000 },
          ],
        } as any,
      });

      await scene.onPhoto(ctx);

      expect(ctx.session.reportData.photos[0]).toBe('large');
    });
  });

  it('should ignore text input if session is missing', async () => {
    const ctx = createMockBotContext({ session: { reportData: null } });
    await scene.onText(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should ignore location input if step is wrong', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
    });
    await scene.onLocation(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should ignore category selection if step is wrong', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
    });
    await scene.onCategorySelect(ctx);
    expect(telegramService.getCategories).not.toHaveBeenCalled();
  });

  it('should handle category not found', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('category') },
      match: ['prefix-invalid', 'invalid'] as RegExpMatchArray,
    });

    telegramService.getCategories.mockResolvedValue([]);

    await scene.onCategorySelect(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalledWith('Category not found');
    expect(ctx.session.reportData.step).toBe('category');
  });

  it('should ignore photo input if step is wrong', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
    });
    await scene.onPhoto(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should ignore anonymity selection if step is wrong', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
    });
    await scene.onAnonymitySelect(ctx);
    expect(ctx.answerCbQuery).not.toHaveBeenCalled();
  });

  it('should ignore confirm action if step is wrong', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
    });
    await scene.onConfirm(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should handle switch default case in onText', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('photos') },
      message: { text: 'random text' } as any,
    });

    await scene.onText(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should format confirm message for localhost', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('confirm') },
    });

    formatterUtil.isLocalhost.mockReturnValue(true);
    telegramService.createReport.mockResolvedValue({
      id: '123',
      status: 'pending',
    } as any);

    await scene.onConfirm(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Report Link:'),
      expect.objectContaining({ parse_mode: 'HTML' }),
    );
  });

  it('should format photo message correctly for < 3 photos', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('photos', { photos: [] }),
      },
      message: { photo: [{ file_id: '1' }] } as any,
    });

    await scene.onPhoto(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Send more photos'),
    );
  });

  it('should format photo message correctly for 3 photos', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('photos', { photos: ['1', '2'] }),
      },
      message: { photo: [{ file_id: '3' }] } as any,
    });

    await scene.onPhoto(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Type /done to continue'),
    );
  });

  it('should handle cancel command (no callback query)', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
      callbackQuery: undefined,
    });

    await scene.onCancelCommand(ctx);

    expect(ctx.answerCbQuery).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(
      MESSAGES.CANCELLED,
      expect.any(Object),
    );
    expect(ctx.session.reportData).toBeNull();
  });

  it('should handle cancel button (with callback query)', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
      callbackQuery: { id: '1' } as any,
    });

    await scene.onCancel(ctx);

    expect(ctx.answerCbQuery).toHaveBeenCalled();
    expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
    expect(ctx.reply).toHaveBeenCalledWith(
      MESSAGES.CANCELLED,
      expect.any(Object),
    );
  });

  it('should handle geocoding failing (no address returned)', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('location', { address: undefined }),
      },
      message: { location: { latitude: 45.0, longitude: 7.0 } } as any,
    });

    locationValidator.validateTurinBoundary.mockResolvedValue(true);
    geocodingService.reverseGeocode.mockResolvedValue(null);

    await scene.onLocation(ctx);

    expect(ctx.session.reportData.address).toBeUndefined();
    expect(ctx.session.reportData.step).toBe('title');
  });

  it('should handle report creation error', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('confirm') },
    });

    telegramService.createReport.mockRejectedValue(new Error('DB Error'));

    await scene.onConfirm(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('DB Error'),
      expect.any(Object),
    );
    expect(ctx.scene.leave).toHaveBeenCalled();
  });

  it('should trigger cancel via text command /cancel', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('title') },
      message: { text: '/cancel' } as any,
    });

    await scene.onText(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      MESSAGES.CANCELLED,
      expect.any(Object),
    );
    expect(ctx.session.reportData).toBeNull();
  });

  it('should trigger onPhotosDone via /done command', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('photos', { photos: ['id1'] }),
      },
      message: { text: '/done' } as any,
    });

    await scene.onText(ctx);

    expect(ctx.session.reportData.step).toBe('anonymity');
    expect(ctx.reply).toHaveBeenCalledWith(
      MESSAGES.STEP_ANONYMITY,
      expect.any(Object),
    );
  });

  it('should handle valid category selection and request photos', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('category') },
      match: ['prefix-cat-123', 'cat-123'] as RegExpMatchArray,
    });

    const mockCats = [{ id: 'cat-123', name: 'Test Category' }];
    telegramService.getCategories.mockResolvedValue(mockCats as any);

    await scene.onCategorySelect(ctx);

    expect(ctx.session.reportData.categoryId).toBe('cat-123');
    expect(ctx.session.reportData.categoryName).toBe('Test Category');
    expect(ctx.session.reportData.step).toBe('photos');
    expect(ctx.editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
    expect(ctx.reply).toHaveBeenCalledWith(
      MESSAGES.STEP_PHOTOS,
      expect.any(Object),
    );
  });

  it('should handle anonymity selection YES and confirm with address', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('anonymity', {
          address: 'Via Roma',
        }),
      },
      match: [ACTIONS.ANONYMOUS_YES] as RegExpMatchArray,
    });

    await scene.onAnonymitySelect(ctx);

    expect(ctx.session.reportData.isAnonymous).toBe(true);
    expect(ctx.session.reportData.step).toBe('confirm');
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Via Roma'),
      expect.any(Object),
    );
  });

  it('should confirm with coordinates if address is missing', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('anonymity', {
          address: undefined,
          location: { latitude: 10.123456, longitude: 20.654321 },
        }),
      },
      match: [ACTIONS.ANONYMOUS_NO] as RegExpMatchArray,
    });

    await scene.onAnonymitySelect(ctx);

    expect(ctx.session.reportData.isAnonymous).toBe(false);
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('10.123456, 20.654321'),
      expect.any(Object),
    );
  });

  it('should include view buttons in production environment', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('confirm') },
    });

    formatterUtil.isLocalhost.mockReturnValue(false);
    telegramService.createReport.mockResolvedValue({
      id: '1',
      status: 'ok',
    } as any);

    await scene.onConfirm(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        reply_markup: expect.objectContaining({
          inline_keyboard: expect.arrayContaining([
            expect.arrayContaining([
              expect.objectContaining({ text: BUTTONS.VIEW_REPORT }),
            ]),
          ]),
        }),
      }),
    );
  });

  it('should handle unknown errors (non-Error objects)', async () => {
    const ctx = createMockBotContext({
      session: { reportData: createMockReportSession('confirm') },
    });

    telegramService.createReport.mockRejectedValue('String Error');

    await scene.onConfirm(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Unknown error'),
      expect.any(Object),
    );
  });

  it('should prevent finishing photos step if no photos uploaded', async () => {
    const ctx = createMockBotContext({
      session: {
        reportData: createMockReportSession('photos', { photos: [] }),
      },
      message: { text: '/done' } as any,
    });

    await scene.onText(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(MESSAGES.ERR_NO_PHOTOS);
    expect(ctx.session.reportData.step).toBe('photos');
  });
});
