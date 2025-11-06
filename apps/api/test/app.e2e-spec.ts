import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthService } from './../src/modules/auth/auth.service';
import { LocalAuthGuard } from './../src/modules/auth/guards/local-auth.guard';
import request = require('supertest');

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

// Stub TypeORM to avoid real DataSource/repositories during e2e
jest.mock('@nestjs/typeorm', () => ({
  TypeOrmModule: {
    forRoot: () => ({
      module: class MockTypeOrmRoot {},
      providers: [],
      exports: [],
    }),
    forFeature: () => ({
      module: class MockTypeOrmFeature {},
      providers: [],
      exports: [],
    }),
  },
  InjectRepository: () => () => undefined,
}));

// mock modules to avoid database or auth initialization
jest.mock('./../src/providers/database/database.module', () => ({
  DatabaseModule: class DatabaseModule {},
}));

// Note: keep AuthModule real so routes exist; providers/guards are overridden below

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let AppModule: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const importedModule = await import('./../src/app.module');
    AppModule = importedModule.AppModule;

    const testingModuleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

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

    testingModuleBuilder.overrideProvider(AuthService).useValue({
      register: jest.fn(async () => ({ user: mockUser })),
      login: jest.fn(async () => ({
        user: mockUser,
        session: mockSession,
        cookie: mockCookie,
      })),
      validateUser: jest.fn(async () => ({ user: mockUser })),
    });

    testingModuleBuilder.overrideGuard(LocalAuthGuard).useValue({
      canActivate: (context: any) => {
        const req = context.switchToHttp().getRequest();
        req.user = mockUser;
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

  // Happy-path tests using overridden AuthService and bypassed LocalAuthGuard
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

    // Body
    expect(res.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: 'john@example.com',
          username: 'john',
        }),
        session: expect.objectContaining({ token: 'mock_token_123' }),
      }),
    );
    // Cookie
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
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ email: 'john@example.com' }),
        session: expect.objectContaining({ token: 'mock_token_123' }),
      }),
    );
    const setCookie2 = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie2)
      ? setCookie2.join(';')
      : String(setCookie2 || '');
    expect(cookies).toContain('session_token=mock_token_123');
  });
});
