import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthService } from './../src/modules/auth/auth.service';
import { LocalAuthGuard } from './../src/modules/auth/guards/local-auth.guard';
import { SessionGuard } from './../src/modules/auth/guards/session-auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Session, User, Role, Account, Category, Report } from '@repo/api';
import request = require('supertest');

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  save: jest.fn((entity) => Promise.resolve(entity)),
  create: jest.fn((dto) => dto),
  remove: jest.fn((entity) => Promise.resolve(entity)),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let AppModule: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const importedModule = await import('./../src/app.module');
    AppModule = importedModule.AppModule;

    const { DatabaseModule } = await import(
      './../src/providers/database/database.module'
    );

    const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    testingModuleBuilder.overrideModule(DatabaseModule).useModule(
      class MockDatabaseModule {},
    );

    testingModuleBuilder
      .overrideProvider(getRepositoryToken(Session))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Role))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Account))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Category))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(Report))
      .useValue(createMockRepository());

    const mockUser = {
      id: 'user_1',
      email: 'john@example.com',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
    } as any;
    const mockSession = {
      id: 'sess_1',
      userId: 'user_1',
      token: 'mock_token_123',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    } as any;
    const mockCookie = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: false,
      maxAge: 3600_000,
    };
    const mockToken = 'mock_token_123';

    testingModuleBuilder.overrideProvider(AuthService).useValue({
      register: jest.fn(async () => ({ user: mockUser })),
      login: jest.fn(async () => ({
        user: mockUser,
        session: mockSession,
        token: mockToken,
      })),
      validateUser: jest.fn(async () => ({ user: mockUser })),
      logout: jest.fn(async () => undefined),
      getCookieOptions: jest.fn(() => mockCookie),
    });

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
        return true;
      },
    });

    const moduleFixture: TestingModule = await testingModuleBuilder.compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Error and 404 tests ---
  it('GET /nonexistent returns JSON error with statusCode and error', async () => {
    const res = await request(app.getHttpServer())
      .get('/nonexistent')
      .set('Accept', 'application/json')
      .expect(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual(
      expect.objectContaining({ statusCode: 404, error: expect.any(String) }),
    );
    expect(String(res.body.message || '')).toContain('/nonexistent');
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
      const res = await make().set('Accept', 'application/json').expect(404);
      const msg = String(res.body?.message || '');
      expect(msg).toContain(path);
      expect(msg).toContain(method);
    }
  });

  // --- Auth Controller ---
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
          }),
          session: expect.objectContaining({ token: 'mock_token_123' }),
        }),
      }),
    );
    const setCookie = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie)
      ? setCookie.join(';')
      : String(setCookie || '');
    expect(cookies).toContain('session_token=mock_token_123');
    expect(cookies.toLowerCase()).toContain('httponly');
  });

  it('POST /auth/login returns user and session when guard passes', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'john@example.com', password: 'StrongP@ssw0rd' })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ email: 'john@example.com' }),
          session: expect.objectContaining({ token: 'mock_token_123' }),
        }),
      }),
    );
    const setCookie2 = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie2)
      ? setCookie2.join(';')
      : String(setCookie2 || '');
    expect(cookies).toContain('session_token=mock_token_123');
  });

  it('POST /auth/logout returns success', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  // --- Roles Controller ---
  it('GET /roles returns all roles', async () => {
    const res = await request(app.getHttpServer())
      .get('/roles')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // --- Users Controller ---
  it('POST /users/municipality creates a municipality user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/municipality')
      .set('Cookie', 'session_token=mock_token_123')
      .send({
        email: 'admin@municipality.gov',
        username: 'admin_user',
        firstName: 'Admin',
        lastName: 'User',
        password: 'SecureAdminPass123',
        role: 'admin',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /users/municipality returns all municipality users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/municipality')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /users/municipality/user/:id returns a municipality user by ID', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /users/municipality/user/:id updates a municipality user by ID', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=mock_token_123')
      .send({
        email: 'updated@municipality.gov',
        username: 'updated_user',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'municipal_administrator',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('user_1');
  });

  it('DELETE /users/municipality/user/:id deletes a municipality user by ID', async () => {
    const res = await request(app.getHttpServer())
      .delete('/users/municipality/user/user_1')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('user_1');
  });

  // --- Reports Controller ---
  it('POST /reports creates a report', async () => {
    const res = await request(app.getHttpServer())
      .post('/reports')
      .set('Cookie', 'session_token=mock_token_123')
      .send({
        title: 'Broken streetlight',
        description: 'The streetlight on Main St is broken.',
        longitude: 12.34,
        latitude: 56.78,
        categoryId: 'cat1',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /reports returns all reports', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports/:id returns a report by ID', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports/report_1')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('PATCH /reports/:id updates a report', async () => {
    const res = await request(app.getHttpServer())
      .patch('/reports/report_1')
      .set('Cookie', 'session_token=mock_token_123')
      .send({
        status: 'resolved',
        description: 'Fixed by city crew.',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('DELETE /reports/:id deletes a report', async () => {
    await request(app.getHttpServer())
      .delete('/reports/report_1')
      .set('Cookie', 'session_token=mock_token_123')
      .expect(204);
  });
});
