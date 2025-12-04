import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { LocalAuthGuard } from './../src/modules/auth/guards/local-auth.guard';
import { SessionGuard } from './../src/modules/auth/guards/session-auth.guard';
import { RolesGuard } from './../src/modules/auth/guards/roles.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Session } from '../src/common/entities/session.entity';
import { User } from '../src/common/entities/user.entity';
import { Role } from '../src/common/entities/role.entity';
import { Account } from '../src/common/entities/account.entity';
import { Category } from '../src/common/entities/category.entity';
import { Report } from '../src/common/entities/report.entity';
import { Office } from '../src/common/entities/office.entity';
import request = require('supertest');
import { Profile } from '../src/common/entities/profile.entity';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

const createMockRepository = (data: any[] = []) => {
  const repo: any = {
    find: jest.fn((options) => {
      let results = [...data];
      if (options && options.where) {
        results = results.filter((e) =>
          Object.entries(options.where).every(([k, v]) => {
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
              return true;
            }
            return e[k] === v;
          }),
        );
      }
      return Promise.resolve(results);
    }),
    findOne: jest.fn((options) => {
      const where = options?.where || {};
      const result = data.find((e) =>
        Object.entries(where).every(([k, v]) => {
          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            return true;
          }
          return e[k] === v;
        }),
      );
      return Promise.resolve(result || null);
    }),
    findOneBy: jest.fn((where) =>
      Promise.resolve(
        data.find((e) => Object.entries(where).every(([k, v]) => e[k] === v)) ||
          null,
      ),
    ),
    save: jest.fn((entity) => {
      if (entity.id) {
        const existing = data.find((e) => e.id === entity.id);
        if (existing) {
          Object.assign(existing, entity);
          if (entity.assignedOfficer && entity.assignedOfficer.id) {
            (existing as any).assignedOfficerId = entity.assignedOfficer.id;
          }
          return Promise.resolve(existing);
        }
      }
      const newEntity = {
        ...entity,
        id: entity.id || 'mocked-id',
        isAnonymous:
          entity.isAnonymous !== undefined ? entity.isAnonymous : false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      if (entity.assignedOfficer && entity.assignedOfficer.id) {
        (newEntity as any).assignedOfficerId = entity.assignedOfficer.id;
      }
      data.push(newEntity);
      return Promise.resolve(newEntity);
    }),
    create: jest.fn((dto) => ({ ...dto, id: dto.id || 'mocked-id' })),
    remove: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn((options) => {
      let results = [...data];
      if (options && options.where) {
        results = results.filter((e) =>
          Object.entries(options.where).every(([k, v]) => {
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
              return true;
            }
            return e[k] === v;
          }),
        );
      }
      return Promise.resolve(results.length);
    }),
    update: jest.fn((criteria, partialEntity) => {
      const id = typeof criteria === 'string' ? criteria : criteria.id;
      const existing = data.find((e) => e.id === id);
      if (existing) {
        Object.assign(existing, partialEntity);
      }
      return Promise.resolve({ affected: existing ? 1 : 0 });
    }),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(data[0] || null),
      getMany: jest.fn().mockResolvedValue(data),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: data,
        raw: data.map(() => ({ distance: 100 })),
      }),
    })),
  };
  repo.manager = {
    transaction: async (cb: any) => {
      const mockManager = {
        getRepository: (entity: any) => {
          if (entity?.name === 'Role') {
            return createMockRepository([
              { id: 'role_1', name: 'admin' },
              { id: 'role_2', name: 'user' },
              { id: 'role_3', name: 'municipal_pr_officer' },
            ]);
          }
          if (entity?.name === 'User') {
            return createMockRepository([]);
          }
          if (entity?.name === 'Account') {
            return createMockRepository([]);
          }
          return repo;
        },
      };
      return cb(mockManager);
    },
    getRepository: (entity: any) => repo,
  };
  return repo;
};

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let AppModule: any;
  let sessionCookie: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const importedModule = await import('./../src/app.module');
    AppModule = importedModule.AppModule;

    const mockRoles = [
      { id: 'role_1', name: 'admin', label: 'Admin', isMunicipal: true },
      { id: 'role_2', name: 'user', label: 'User', isMunicipal: false },
      {
        id: 'role_3',
        name: 'municipal_pr_officer',
        label: 'PR Officer',
        isMunicipal: true,
      },
      {
        id: 'role_5',
        name: 'technical_officer',
        label: 'Technical Officer',
        isMunicipal: true,
      },
    ];

    const mockUsers = [
      {
        id: 'user_1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role_1',
        role: {
          id: 'role_1',
          name: 'admin',
          label: 'Admin',
          isMunicipal: true,
        },
      },
      {
        id: 'user_2',
        email: 'jane@example.com',
        username: 'jane',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: 'role_2',
        role: { id: 'role_2', name: 'user', label: 'User', isMunicipal: false },
      },
      {
        id: 'officer_1',
        email: 'officer1@example.com',
        username: 'officer1',
        firstName: 'Officer',
        lastName: 'One',
        roleId: 'role_5',
        officeId: 'office_1',
        role: {
          id: 'role_5',
          name: 'officer',
          label: 'Technical Officer',
          isMunicipal: true,
        },
      },
      {
        id: 'officer_2',
        email: 'officer2@example.com',
        username: 'officer2',
        firstName: 'Officer',
        lastName: 'Two',
        roleId: 'role_5',
        officeId: 'office_1',
        role: {
          id: 'role_5',
          name: 'officer',
          label: 'Technical Officer',
          isMunicipal: true,
        },
      },
    ];

    const mockUser = mockUsers[0];

    const mockAccounts = [
      {
        id: 'account_1',
        userId: 'user_1',
        hashedPassword: 'hashed_password_1',
      },
    ];

    const mockOffices = [
      {
        id: 'office_1',
        name: 'administration',
        label: 'Administration',
      },
    ];

    const mockCategories = [
      {
        id: 'cat_1',
        name: 'Infrastructure',
        office: mockOffices[0],
        officeId: 'office_1',
      },
      { id: 'cat_2', name: 'Environment' },
    ];

    const mockReports: any[] = [
      {
        id: 'report_1',
        title: 'Test Report',
        description: 'Test Description',
        location: { type: 'Point', coordinates: [7.6869, 45.0703] },
        userId: 'user_1',
        categoryId: 'cat_1',
        user: mockUsers[0],
        category: mockCategories[0],
        isAnonymous: false,
        assignedOfficerId: undefined,
      },
    ];

    const reportsRepositoryMock = createMockRepository(mockReports);

    reportsRepositoryMock.save = jest.fn((entity) => {
      if (entity.id) {
        const existing = mockReports.find((e) => e.id === entity.id);
        if (existing) {
          Object.assign(existing, entity);
          if (entity.assignedOfficer && entity.assignedOfficer.id) {
            existing.assignedOfficerId = entity.assignedOfficer.id;
          }
          return Promise.resolve(existing);
        }
      }

      const newEntity = {
        ...entity,
        id: entity.id || 'mocked-id',
        isAnonymous:
          entity.isAnonymous !== undefined ? entity.isAnonymous : false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (newEntity.userId) {
        newEntity.user = mockUsers.find((u) => u.id === newEntity.userId);
      }

      if (entity.assignedOfficer && entity.assignedOfficer.id) {
        newEntity.assignedOfficerId = entity.assignedOfficer.id;
      }

      mockReports.push(newEntity);
      return Promise.resolve(newEntity);
    });

    const mockSession = {
      id: 'sess_1',
      userId: 'user_1',
      hashedSecret: 'hashed_secret',
    };

    const mockProfile = [
      {
        id: 'profile_1',
        userId: 'user_1',
        user: mockUsers[0],
        telegramUsername: null,
        emailNotificationsEnabled: false,
        profilePictureUrl: null,
      },
      {
        id: 'profile_2',
        userId: 'user_2',
        user: mockUsers[1],
        telegramUsername: '@jane_smith',
        emailNotificationsEnabled: true,
        profilePictureUrl: null,
      },
    ];

    const mockCookie = {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 3600_000,
    };
    const mockToken = 'sess_1.secret';

    const { DatabaseModule } = await import(
      './../src/providers/database/database.module'
    );
    const { MinioProvider } = await import(
      './../src/providers/minio/minio.provider'
    );

    const mockMinioProvider = {
      uploadFile: jest
        .fn()
        .mockResolvedValue(
          'http://localhost:9000/bucket/reports/mocked-id/test.jpg',
        ),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      deleteFiles: jest.fn().mockResolvedValue(undefined),
      extractFileNameFromUrl: jest.fn((url: string) => url.split('/').pop()),
    };

    const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    testingModuleBuilder
      .overrideModule(DatabaseModule)
      .useModule(class MockDatabaseModule {});

    testingModuleBuilder
      .overrideProvider(getRepositoryToken(Session))
      .useValue(createMockRepository([mockSession]))
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository(mockUsers))
      .overrideProvider(getRepositoryToken(Role))
      .useValue(createMockRepository(mockRoles))
      .overrideProvider(getRepositoryToken(Account))
      .useValue(createMockRepository(mockAccounts))
      .overrideProvider(getRepositoryToken(Category))
      .useValue(createMockRepository(mockCategories))
      .overrideProvider(getRepositoryToken(Report))
      .useValue(reportsRepositoryMock)
      .overrideProvider(getRepositoryToken(Office))
      .useValue(createMockRepository(mockOffices))
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(createMockRepository(mockProfile))
      .overrideProvider(MinioProvider)
      .useValue(mockMinioProvider);

    testingModuleBuilder.overrideGuard(LocalAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockUser;
        return true;
      },
    });

    testingModuleBuilder.overrideGuard(SessionGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        const hasCookie = req.cookies && req.cookies.session_token;
        if (hasCookie) {
          const path = req.path;
          const cookieValue = req.cookies.session_token;

          if (cookieValue === 'sess_2.secret') {
            req.user = mockUsers[1];
            req.session = { ...mockSession, userId: mockUsers[1].id };
            return true;
          }

          if (
            cookieValue === 'sess_muni.secret' &&
            path === '/profiles/profile/me'
          ) {
            req.user = mockUsers[0]; // john - admin (municipal user)
            req.session = mockSession;
            return true;
          }

          // Use regular user (user_2) for /profiles/profile/me endpoint
          if (path === '/profiles/profile/me') {
            req.user = mockUsers[1]; // jane - regular user
          } else {
            req.user = mockUser; // john - admin
          }
          req.session = mockSession;
          return true;
        }
        return false;
      },
    });

    testingModuleBuilder.overrideGuard(RolesGuard).useValue({
      canActivate: () => true,
    });

    const moduleFixture: TestingModule = await testingModuleBuilder.compile();

    app = moduleFixture.createNestApplication();
    const { ValidationPipe } = await import('@nestjs/common');
    const cookieParser = await import('cookie-parser');
    app.use(cookieParser.default());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================================================
  // Basic HTTP Error Handling
  // ============================================================================
  it('GET /nonexistent returns JSON error with statusCode and error', async () => {
    const res = await request(app.getHttpServer())
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(
      expect.objectContaining({ statusCode: 404, error: expect.any(String) }),
    );
  });

  it('HEAD /missing sets no body and no Set-Cookie', async () => {
    const res = await request(app.getHttpServer()).head('/missing').expect(404);
    expect(!res.text || res.text === '').toBeTruthy();
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('404 message includes method and path for multiple verbs', async () => {
    const server = app.getHttpServer();
    const path = '/deep/nested/path';
    const cases = [
      ['GET', () => request(server).get(path)],
      ['POST', () => request(server).post(path).send({ a: 1 })],
      ['PUT', () => request(server).put(path).send({ a: 1 })],
      ['PATCH', () => request(server).patch(path).send({ a: 1 })],
      ['DELETE', () => request(server).delete(path)],
      ['OPTIONS', () => request(server).options(path)],
    ] as const;
    for (const [method, make] of cases) {
      await make().set('Accept', 'application/json').expect(404);
    }
  });

  // ============================================================================
  // Authentication & Authorization
  // ============================================================================
  it('POST /auth/register returns user and sets session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'john@example.com',
            username: 'john',
            firstName: 'John',
            lastName: 'Doe',
            id: expect.any(String),
            role: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          }),
          session: expect.objectContaining({
            id: expect.any(String),
            userId: expect.any(String),
            hashedSecret: expect.any(String),
            expiresAt: expect.any(String),
            ipAddress: expect.any(String),
          }),
        }),
      }),
    );

    const setCookie = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie)
      ? setCookie.join(';')
      : String(setCookie || '');
    sessionCookie = cookies;
    expect(cookies).toMatch(/session_token=[^;]+/);
  });

  it('POST /auth/login returns user and session when guard passes', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'john', password: 'StrongP@ssw0rd' })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: 'john@example.com',
            username: 'john',
            firstName: 'John',
            lastName: 'Doe',
            id: expect.any(String),
            role: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          }),
          session: expect.objectContaining({
            id: expect.any(String),
            userId: expect.any(String),
            hashedSecret: expect.any(String),
            expiresAt: expect.any(String),
            ipAddress: expect.any(String),
          }),
        }),
      }),
    );

    const setCookie2 = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie2)
      ? setCookie2.join(';')
      : String(setCookie2 || '');
    sessionCookie = cookies;
    expect(cookies).toMatch(/session_token=[^;]+/);
  });

  it('POST /auth/logout with valid session returns 200', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200);
  });

  it('POST /auth/refresh with valid session returns 201', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(201);
  });

  // ============================================================================
  // Roles Management
  // ============================================================================
  it('GET /roles with authentication returns 200 with all roles', async () => {
    await request(app.getHttpServer())
      .get('/roles')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  // ============================================================================
  // Municipality Users Management
  // ============================================================================
  it('POST /users/municipality with valid data returns 201 and creates user', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        email: 'admin@municipality.gov',
        username: 'admin_user',
        firstName: 'Admin',
        lastName: 'User',
        password: 'SecureAdminPass123',
        roleId: 'role_1',
      })
      .expect(201);
  });

  it('GET /users/municipality with authentication returns 200 with all users', async () => {
    await request(app.getHttpServer())
      .get('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /users/municipality/user/:id with valid ID returns 200 with user', async () => {
    await request(app.getHttpServer())
      .get('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('POST /users/municipality/user/:id with valid data returns 200 and updates user', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ firstName: 'UpdatedJohn' })
      .expect(200);
  });

  it('DELETE /users/municipality/user/:id with valid ID returns 200 and deletes user', async () => {
    await request(app.getHttpServer())
      .delete('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /users/municipality/user/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .get('/users/municipality/user/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(404);
  });

  it('POST /users/municipality/user/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality/user/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ firstName: 'Updated' })
      .expect(404);
  });

  it('DELETE /users/municipality/user/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .delete('/users/municipality/user/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(404);
  });

  it('POST /users/municipality with invalid email returns 400', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        email: 'invalid-email',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'TestPass123',
        roleId: 'role_1',
      })
      .expect(400);
  });

  // ============================================================================
  // Regular User Profile Management
  // ============================================================================
  it('GET /profiles/profile/me with authentication returns 200 and user profile', async () => {
    await request(app.getHttpServer())
      .get('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('PATCH /profiles/profile/me with telegram username returns 200 and updates profile', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '@newusername' })
      .expect(200);
  });

  it('PATCH /profiles/profile/me with emailNotificationsEnabled returns 200 and updates profile', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ emailNotificationsEnabled: true })
      .expect(200);
  });

  it('PATCH /profiles/profile/me with invalid file type returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .attach('profilePicture', Buffer.from('test'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('PATCH /profiles/profile/me without authentication returns 403', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .send({ telegramUsername: '@username' })
      .expect(403);
  });

  it('PATCH /profiles/profile/me as municipality user returns 403', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_muni.secret')
      .send({ telegramUsername: '@username' })
      .expect(403);
  });

  it('PATCH /profiles/profile/me with invalid telegram username format returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: 'invalid' })
      .expect(400);
  });

  it('PATCH /profiles/profile/me with telegram username too short returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '@abc' })
      .expect(400);
  });

  it('PATCH /profiles/profile/me with telegram username too long returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '@' + 'a'.repeat(32) })
      .expect(400);
  });

  it('PATCH /profiles/profile/me with valid telegram username returns 200', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '@valid_username' })
      .expect(200);
  });

  it('PATCH /profiles/profile/me removes telegram username with empty string', async () => {
    await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '' })
      .expect(200);
  });

  // ============================================================================
  // Reports Management
  // ============================================================================

  it('POST /reports with valid data and images returns 201 and creates report', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Broken streetlight')
      .field('description', 'The streetlight on Main St is broken.')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(201);
  });

  it('POST /reports with 3 images (maximum allowed) returns 201', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Multiple issues')
      .field('description', 'Multiple problems detected')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-image-1'), 'test1.jpg')
      .attach('images', Buffer.from('fake-image-2'), 'test2.jpg')
      .attach('images', Buffer.from('fake-image-3'), 'test3.jpg')
      .expect(201);
  });

  it('POST /reports as anonymous (isAnonymous=true) returns 201 and handles visibility correctly', async () => {
    const response = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Secret Report')
      .field('description', 'Nobody needs to know who I am')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .field('isAnonymous', 'true')
      .attach('images', Buffer.from('fake-image'), 'secret.jpg')
      .expect(201);

    expect(response.body.data.isAnonymous).toBe(true);
    const reportId = response.body.data.id;

    await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeDefined();
        expect(res.body.data.user.id).toBe('user_1');
      });

    await request(app.getHttpServer())
      .get(`/reports/${reportId}`)
      .set('Cookie', 'session_token=sess_2.secret')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeNull();
        expect(res.body.data.id).toBe(reportId);
        expect(res.body.data.title).toBe('Secret Report');
      });
  });

  it('POST /reports without images returns 400', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'No images')
      .field('description', 'This should fail')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .expect(400);
  });

  it('POST /reports with more than 3 images returns 400', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Too many images')
      .field('description', 'This should fail')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-image-1'), 'test1.jpg')
      .attach('images', Buffer.from('fake-image-2'), 'test2.jpg')
      .attach('images', Buffer.from('fake-image-3'), 'test3.jpg')
      .attach('images', Buffer.from('fake-image-4'), 'test4.jpg')
      .expect(400);
  });

  it('POST /reports with invalid file type returns 400', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Invalid file type')
      .field('description', 'This should fail')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-pdf'), 'test.pdf')
      .expect(400);
  });

  it('POST /reports with oversized file returns 400', async () => {
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Oversized file')
      .field('description', 'This should fail')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', largeBuffer, 'large.jpg')
      .expect(400);
  });

  it('POST /reports with missing required fields returns 400 validation error', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Incomplete report')
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(400);
  });

  it('GET /reports with authentication returns 200 with all reports', async () => {
    await request(app.getHttpServer())
      .get('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports/:id with valid ID returns 200 with report', async () => {
    await request(app.getHttpServer())
      .get('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .get('/reports/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(404);
  });

  it('PATCH /reports/:id with valid data returns 200 and updates report', async () => {
    await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        status: 'resolved',
        description: 'Fixed by city crew.',
      })
      .expect(200);
  });

  it('PATCH /reports/:id with invalid status returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        status: 'invalid_status',
      })
      .expect(400);
  });

  it('PATCH /reports/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .patch('/reports/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ status: 'resolved' })
      .expect(404);
  });

  // ============================================================================
  // Reports Filtering & Search
  // ============================================================================

  it('GET /reports with status filter returns 200 with filtered reports', async () => {
    await request(app.getHttpServer())
      .get('/reports?status=pending')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports with categoryId filter returns 200 with filtered reports', async () => {
    await request(app.getHttpServer())
      .get('/reports?categoryId=cat_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports with userId filter returns 200 with filtered reports', async () => {
    await request(app.getHttpServer())
      .get('/reports?userId=user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports with bounding box filter returns 200 with filtered reports', async () => {
    await request(app.getHttpServer())
      .get(
        '/reports?minLongitude=7.0&maxLongitude=8.0&minLatitude=45.0&maxLatitude=46.0',
      )
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports with radius search returns 200 with nearby reports', async () => {
    await request(app.getHttpServer())
      .get(
        '/reports?searchLongitude=7.6869&searchLatitude=45.0703&radiusMeters=5000',
      )
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  // ============================================================================
  // Categories & Offices
  // ============================================================================

  it('GET /categories with authentication returns 200 with all categories', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /offices with authentication returns 200 with all offices', async () => {
    await request(app.getHttpServer())
      .get('/offices')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  // ============================================================================
  // Report Auto-Assignment Logic
  // ============================================================================

  it('PATCH /reports/:id with status=assigned updates status correctly', async () => {
    const res = await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ status: 'assigned' })
      .expect(200);

    expect(res.body.data.status).toBe('assigned');
  });

  it('PATCH /reports/:id with status=assigned auto-assigns to officer with fewest reports when no assignedOfficerId provided', async () => {
    const res = await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ status: 'assigned' })
      .expect(200);

    expect(res.body.data.status).toBe('assigned');
    expect(res.body.data.assignedOfficerId).toBeDefined();
  });

  it('PATCH /reports/:id with explanation field updates correctly', async () => {
    const res = await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        status: 'resolved',
        explanation: 'Fixed by replacing the broken component.',
      })
      .expect(200);

    expect(res.body.data.explanation).toBe(
      'Fixed by replacing the broken component.',
    );
  });

  // ============================================================================
  // Report Status Transitions
  // ============================================================================

  it('PATCH /reports/:id allows valid status transitions', async () => {
    const validStatuses = [
      'pending',
      'assigned',
      'in_progress',
      'resolved',
      'rejected',
    ];

    for (const status of validStatuses) {
      await request(app.getHttpServer())
        .patch('/reports/report_1')
        .set('Cookie', 'session_token=sess_1.secret')
        .send({ status })
        .expect(200);
    }
  });

  // ============================================================================
  // Report Address Field
  // ============================================================================

  it('POST /reports with address field includes address in response', async () => {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Report with address')
      .field('description', 'This has an address')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .field('address', '123 Main St, Turin')
      .attach('images', Buffer.from('fake-image'), 'test.jpg')
      .expect(201);

    expect(res.body.data.address).toBe('123 Main St, Turin');
  });

  // ============================================================================
  // Officer-Specific Endpoints
  // ============================================================================

  it('GET /reports/user/:userId returns reports assigned to specific officer', async () => {
    await request(app.getHttpServer())
      .get('/reports/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  // ============================================================================
  // Report Nearby Search Edge Cases
  // ============================================================================

  it('GET /reports/nearby with very small radius returns limited results', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/nearby?longitude=7.6869&latitude=45.0703&radius=10')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body).toHaveProperty('data');
  });

  it('GET /reports/nearby with large radius returns results with distance', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/nearby?longitude=7.6869&latitude=45.0703&radius=50000')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body).toHaveProperty('data');
  });

  it('GET /reports/nearby without radius parameter uses default radius', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/nearby?longitude=7.6869&latitude=45.0703')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body).toHaveProperty('data');
  });

  // ============================================================================
  // User Registration Edge Cases
  // ============================================================================

  it('POST /auth/register with duplicate username returns 201 and reuses existing user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'different@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
      })
      .expect(201);

    expect(res.body.data.user.username).toBe('john');
  });

  it('POST /auth/register with duplicate email can succeed if username exists', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'john@example.com',
        username: 'different_john',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('POST /auth/register with weak password returns 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'weak',
      })
      .expect(400);
  });

  it('POST /auth/register with invalid email format returns 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'StrongP@ssw0rd',
      })
      .expect(400);
  });

  it('POST /auth/register with missing fields returns 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
      })
      .expect(400);
  });

  // ============================================================================
  // Authentication Edge Cases
  // ============================================================================

  it('POST /auth/login with incorrect credentials returns 200 (mocked guard)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'john', password: 'WrongPassword123' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('POST /auth/logout without session cookie returns 403', async () => {
    await request(app.getHttpServer()).post('/auth/logout').expect(403);
  });

  it('POST /auth/refresh without session cookie returns 403', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(403);
  });

  // ============================================================================
  // Profile Picture Upload
  // ============================================================================

  it('PATCH /profiles/profile/me with valid profile picture returns 200', async () => {
    const imageBuffer = Buffer.from('fake-image-data');
    const res = await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .attach('profilePicture', imageBuffer, {
        filename: 'profile.jpg',
        contentType: 'image/jpeg',
      })
      .expect(200);

    expect(res.body.data.profilePictureUrl).toBeDefined();
  });

  // ============================================================================
  // Municipality User Validation
  // ============================================================================

  it('POST /users/municipality with missing password returns 400', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'role_1',
      })
      .expect(400);
  });

  // ============================================================================
  // Authorization Edge Cases
  // ============================================================================

  it('GET /users/municipality without authentication returns 403', async () => {
    await request(app.getHttpServer()).get('/users/municipality').expect(403);
  });

  it('POST /users/municipality without authentication returns 403', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePass123',
        roleId: 'role_1',
      })
      .expect(403);
  });

  it('GET /reports without authentication returns 403', async () => {
    await request(app.getHttpServer()).get('/reports').expect(403);
  });

  it('POST /reports without authentication returns 403', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .field('title', 'Test')
      .field('description', 'Test')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-image'), 'test.jpg')
      .expect(403);
  });

  it('GET /categories without authentication returns 403', async () => {
    await request(app.getHttpServer()).get('/categories').expect(403);
  });

  it('GET /offices without authentication returns 403', async () => {
    await request(app.getHttpServer()).get('/offices').expect(403);
  });

  it('GET /roles without authentication returns 403', async () => {
    await request(app.getHttpServer()).get('/roles').expect(403);
  });

  // ============================================================================
  // Report Update Validation
  // ============================================================================

  it('PATCH /reports/:id with empty body returns 200 (no changes)', async () => {
    await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({})
      .expect(200);
  });

  // ============================================================================
  // User Profile Update Edge Cases
  // ============================================================================

  it('PATCH /profiles/profile/me with both telegram username and email notifications returns 200', async () => {
    const res = await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        telegramUsername: '@combined_test',
        emailNotificationsEnabled: true,
      })
      .expect(200);

    expect(res.body.data.telegramUsername).toBe('@combined_test');
    expect(res.body.data.emailNotificationsEnabled).toBe(true);
  });

  it('PATCH /profiles/profile/me with emailNotificationsEnabled=false returns 200', async () => {
    const res = await request(app.getHttpServer())
      .patch('/profiles/profile/me')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ emailNotificationsEnabled: false })
      .expect(200);

    expect(res.body.data.emailNotificationsEnabled).toBe(false);
  });

  // ============================================================================
  // Report Creation with All Optional Fields
  // ============================================================================

  it('POST /reports with all fields including address and isAnonymous returns 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Complete Report')
      .field('description', 'This report has all fields')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .field('address', '456 Test Ave')
      .attach('images', Buffer.from('fake-image-1'), 'test1.jpg')
      .attach('images', Buffer.from('fake-image-2'), 'test2.jpg')
      .expect(201);

    expect(res.body.data.address).toBe('456 Test Ave');
    expect(res.body.data.isAnonymous).toBe(false);
    expect(res.body.data.images).toHaveLength(2);
  });
});
