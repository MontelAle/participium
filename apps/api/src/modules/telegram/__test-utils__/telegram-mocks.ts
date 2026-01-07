import type { User } from '@entities';
import { Profile } from '@entities';
import { Scenes } from 'telegraf';
import { BotContext } from '../interfaces/bot-context.interface';
import { ReportSessionData } from '../interfaces/report-session.interface';

export const createMockTelegrafBot = () => ({
  telegram: {
    sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
    getFileLink: jest.fn().mockResolvedValue({
      href: 'https://api.telegram.org/file/bot<token>/photos/file.jpg',
    }),
  },
  use: jest.fn(),
  on: jest.fn(),
  command: jest.fn(),
  action: jest.fn(),
  start: jest.fn(),
  launch: jest.fn(),
  stop: jest.fn(),
});

export const createMockBotContext = (
  overrides?: Partial<BotContext>,
): BotContext => {
  const session: any = {
    reportData: null,
    __scenes: {},
  };

  const sceneContext: Partial<Scenes.SceneContextScene<BotContext>> = {
    enter: jest.fn().mockResolvedValue({}),
    leave: jest.fn().mockResolvedValue({}),
    reenter: jest.fn().mockResolvedValue({}),
    current: undefined,
    ...overrides?.scene,
  };

  const fromData =
    overrides?.from === undefined
      ? {
          id: 123456789,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          is_bot: false,
        }
      : overrides.from;

  const ctx = {
    from: fromData,
    chat: {
      id: 123456789,
      type: 'private',
      ...overrides?.chat,
    },
    reply: jest.fn().mockResolvedValue({ message_id: 1 }),
    replyWithHTML: jest.fn().mockResolvedValue({ message_id: 1 }),
    answerCbQuery: jest.fn().mockResolvedValue(true),
    editMessageReplyMarkup: jest.fn().mockResolvedValue({ message_id: 1 }),
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      ...overrides?.message,
    },
    callbackQuery: overrides?.callbackQuery || undefined,
    session: {
      ...session,
      ...overrides?.session,
    },
    scene: sceneContext as Scenes.SceneContextScene<BotContext>,
    match: overrides?.match || undefined,
    update: overrides?.update || {},
    telegram: createMockTelegrafBot().telegram,
  } as unknown as BotContext;

  return ctx;
};

export const createMockReportSession = (
  step: ReportSessionData['step'],
  overrides?: Partial<ReportSessionData>,
): ReportSessionData => {
  const baseSession: ReportSessionData = {
    step,
    photos: [],
  };

  const stepOrder = [
    'location',
    'title',
    'description',
    'category',
    'photos',
    'anonymity',
    'confirm',
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  if (currentStepIndex >= 0) {
    baseSession.location = { latitude: 45.070312, longitude: 7.686864 };
    baseSession.address = 'Via Roma 1, Torino';
  }
  if (currentStepIndex >= 1) {
    baseSession.title = 'Test Report Title';
  }
  if (currentStepIndex >= 2) {
    baseSession.description =
      'This is a test description with enough characters to be valid.';
  }
  if (currentStepIndex >= 3) {
    baseSession.categoryId = 'cat-123';
    baseSession.categoryName = 'Infrastructure';
  }
  if (currentStepIndex >= 4) {
    baseSession.photos = ['file_id_1', 'file_id_2'];
  }
  if (currentStepIndex >= 5) {
    baseSession.isAnonymous = false;
  }

  return { ...baseSession, ...overrides };
};

export const createMockExecutionContext = (ctx: any) => ({
  switchToHttp: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
  getType: jest.fn().mockReturnValue('graphql'),
  getClass: jest.fn(),
  getHandler: jest.fn(),
  getArgs: jest.fn().mockReturnValue([ctx]),
  getArgByIndex: jest.fn((index: number) => (index === 0 ? ctx : undefined)),
});

export const createMockRepository = <T = any>() => ({
  create: jest.fn((entity: any) => entity as T),
  save: jest.fn((entity: any) => Promise.resolve(entity as T)),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  remove: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
});

export const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(null),
  getMany: jest.fn().mockResolvedValue([]),
  leftJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  setParameters: jest.fn().mockReturnThis(),
});

export const createMockUser = (overrides?: Partial<User>): User =>
  ({
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    isEmailVerified: true,
    emailVerificationCode: null,
    emailVerificationCodeExpiry: null,
    role: {
      id: 'role-1',
      name: 'user',
      isMunicipal: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: [],
    } as any,
    roleId: 'role-1',
    officeId: null,
    office: null,
    officeRoles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as any;

export const createMockProfile = (overrides?: Partial<Profile>): Profile => {
  const profile = new Profile();
  Object.assign(profile, {
    id: 'profile-123',
    userId: 'user-123',
    telegramId: '123456789',
    telegramUsername: 'testuser',
    telegramLinkedAt: new Date(),
    emailNotifications: true,
    telegramNotifications: false,
    user: createMockUser(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
  return profile;
};

export const createMockCategories = () => [
  {
    id: 'cat-1',
    name: 'Infrastructure',
    icon: '🏗️',
    description: 'Infrastructure issues',
  },
  {
    id: 'cat-2',
    name: 'Environment',
    icon: '🌳',
    description: 'Environmental issues',
  },
  { id: 'cat-3', name: 'Safety', icon: '🚨', description: 'Safety concerns' },
];
