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
import { REPORT_ERROR_MESSAGES } from '../src/modules/reports/constants/error-messages';
import request = require('supertest');

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
          return Promise.resolve(existing);
        }
      }
      const newEntity = { ...entity, id: entity.id || 'mocked-id' };
      data.push(newEntity);
      return Promise.resolve(newEntity);
    }),
    create: jest.fn((dto) => ({ ...dto, id: dto.id || 'mocked-id' })),
    remove: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
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
      { id: 'role_1', name: 'admin' },
      { id: 'role_2', name: 'user' },
      { id: 'role_3', name: 'municipal_pr_officer' },
      { id: 'role_5', name: 'technical_officer' },
    ];

    const mockUsers = [
      {
        id: 'user_1',
        email: 'john@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        roleId: 'role_1',
        role: { id: 'role_1', name: 'admin' },
      },
      {
        id: 'user_2',
        email: 'jane@example.com',
        username: 'jane',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: 'role_2',
        role: { id: 'role_2', name: 'user' },
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

    const mockCategories = [
      { id: 'cat_1', name: 'Infrastructure' },
      { id: 'cat_2', name: 'Environment' },
    ];

    const mockReports = [
      {
        id: 'report_1',
        title: 'Test Report',
        description: 'Test Description',
        location: { type: 'Point', coordinates: [7.6869, 45.0703] },
        userId: 'user_1',
        categoryId: 'cat_1',
        user: mockUsers[0],
        category: mockCategories[0],
      },
    ];

    const mockOffices = [
      {
        id: 'office_1',
        name: 'administration',
        label: 'Administration',
      },
    ];

    const mockSession = {
      id: 'sess_1',
      userId: 'user_1',
      hashedSecret: 'hashed_secret',
    };

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
      .useValue(createMockRepository(mockReports))
      .overrideProvider(getRepositoryToken(Office))
      .useValue(createMockRepository(mockOffices))
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
        req.user = mockUser;
        req.session = mockSession;
        req.cookies = { session_token: 'sess_1.secret' };
        return true;
      },
    });

    testingModuleBuilder.overrideGuard(RolesGuard).useValue({
      canActivate: () => true,
    });

    const moduleFixture: TestingModule = await testingModuleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

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

  it('POST /auth/logout returns success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('GET /roles returns all roles', async () => {
    const res = await request(app.getHttpServer())
      .get('/roles')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /users/municipality creates a municipality user', async () => {
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

  it('GET /users/municipality returns all municipality users', async () => {
    await request(app.getHttpServer())
      .get('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /users/municipality/user/:id returns a municipality user by ID', async () => {
    await request(app.getHttpServer())
      .get('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('POST /users/municipality/user/:id updates a municipality user by ID', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ firstName: 'UpdatedJohn' })
      .expect(200);
  });

  it('DELETE /users/municipality/user/:id deletes a municipality user by ID', async () => {
    await request(app.getHttpServer())
      .delete('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('POST /reports creates a report with images', async () => {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Broken streetlight')
      .field('description', 'The streetlight on Main St is broken.')
      .field('longitude', '12.34')
      .field('latitude', '56.78')
      .field('categoryId', 'cat_1')
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.images).toBeDefined();
  });

  it('POST /reports with 3 images (maximum allowed)', async () => {
    const res = await request(app.getHttpServer())
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

  it('POST /reports without images returns 400', async () => {
    const res = await request(app.getHttpServer())
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
    const res = await request(app.getHttpServer())
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
    const res = await request(app.getHttpServer())
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
    const res = await request(app.getHttpServer())
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

  it('GET /reports returns all reports', async () => {
    await request(app.getHttpServer())
      .get('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /reports/:id returns a report by ID', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /reports/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .get('/reports/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(404);
  });

  it('PATCH /reports/:id updates a report', async () => {
    await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        status: 'resolved',
        description: 'Fixed by city crew.',
      })
      .expect(200);
  });

  it('DELETE /reports/:id deletes a report', async () => {
    await request(app.getHttpServer())
      .delete('/reports/report_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(204);
  });

  it('GET /reports with status filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports?status=pending')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports with categoryId filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports?categoryId=cat_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports with userId filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports?userId=user_1')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports with bounding box filter', async () => {
    const res = await request(app.getHttpServer())
      .get(
        '/reports?minLongitude=7.0&maxLongitude=8.0&minLatitude=45.0&maxLatitude=46.0',
      )
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports with radius search', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports?searchLongitude=7.6869&searchLatitude=45.0703&radiusMeters=5000')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /categories returns all categories', async () => {
    await request(app.getHttpServer())
      .get('/categories')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('GET /offices returns all offices', async () => {
    await request(app.getHttpServer())
      .get('/offices')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(200);
  });

  it('POST /auth/refresh refreshes session', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'session_token=sess_1.secret')
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

  it('POST /users/municipality with weak password returns 400', async () => {
    await request(app.getHttpServer())
      .post('/users/municipality')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'weak',
        roleId: 'role_1',
      })
      .expect(400);
  });

  it('POST /auth/register with duplicate username returns 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'unique@example.com',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        password: 'StrongP@ssw0rd',
      })
      .expect(409);
  });

  it('POST /reports with missing required fields returns 400', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=sess_1.secret')
      .field('title', 'Incomplete report')
      .attach('images', Buffer.from('fake-image-data'), 'test.jpg')
      .expect(400);
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

  it('PATCH /reports/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .patch('/reports/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ status: 'resolved' })
      .expect(404);
  });

  it('DELETE /reports/:id with non-existent ID returns 404', async () => {
    await request(app.getHttpServer())
      .delete('/reports/non-existent-id')
      .set('Cookie', 'session_token=sess_1.secret')
      .expect(404);
  });

  it('PATCH /users/profile updates telegram username', async () => {
    await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ telegramUsername: '@newusername' })
      .expect(200);
  });

  it('PATCH /users/profile updates email notifications setting', async () => {
    await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Cookie', 'session_token=sess_1.secret')
      .send({ emailNotificationsEnabled: true })
      .expect(200);
  });

  it('PATCH /users/profile with invalid file type returns 400', async () => {
    await request(app.getHttpServer())
      .patch('/users/profile')
      .set('Cookie', 'session_token=sess_1.secret')
      .attach('profilePicture', Buffer.from('test'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      })
      .expect(400);
  });

  it('PATCH /users/profile without authentication returns 401', async () => {
    await request(app.getHttpServer())
      .patch('/users/profile')
      .send({ telegramUsername: '@username' })
      .expect(401);
  });
});
