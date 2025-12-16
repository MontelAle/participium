// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Account, Profile, Session, User } from '@entities';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import appConfig from '../../../src/config/app.config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await setupTestDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        TypeOrmTestModule(container),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
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

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  afterEach(async () => {
    // Clean up data between tests
    await dataSource.query('TRUNCATE TABLE "session" CASCADE');
    await dataSource.query('TRUNCATE TABLE "account" CASCADE');
    await dataSource.query('TRUNCATE TABLE "profile" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    await dataSource.query('TRUNCATE TABLE "role" CASCADE');
  });

  beforeEach(async () => {
    // Create default user role needed for registration
    await dataSource.query(
      `INSERT INTO "role" (id, name, label, "isMunicipal") VALUES ('user-role-id', 'user', 'User', false) ON CONFLICT DO NOTHING`,
    );
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: expect.objectContaining({
            id: expect.any(String),
            email: registerDto.email,
            username: registerDto.username,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            role: expect.objectContaining({
              name: 'user',
            }),
          }),
          session: expect.objectContaining({
            id: expect.any(String),
            userId: expect.any(String),
            expiresAt: expect.any(String),
          }),
        },
      });

      // Verify session cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(
        cookies.some((cookie: string) => cookie.startsWith('session_token=')),
      ).toBe(true);

      // Verify user was created in database
      const user = await dataSource
        .getRepository(User)
        .findOne({
          where: { username: registerDto.username },
          relations: ['role'],
        });
      expect(user).toBeDefined();
      expect(user.email).toBe(registerDto.email);

      // Verify account was created
      const account = await dataSource
        .getRepository(Account)
        .findOne({ where: { userId: user.id, providerId: 'local' } });
      expect(account).toBeDefined();
      expect(account.accountId).toBe(registerDto.username);

      // Verify profile was created
      const profile = await dataSource
        .getRepository(Profile)
        .findOne({ where: { userId: user.id } });
      expect(profile).toBeDefined();
    });

    it('should reject registration with duplicate username', async () => {
      const registerDto = {
        email: 'test1@example.com',
        username: 'duplicateuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePassword123!',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same username but different email
      const duplicateDto = {
        ...registerDto,
        email: 'test2@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(duplicateDto)
        .expect(409);

      expect(response.body.message).toContain(
        'Username or Email already in use',
      );
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'SecurePassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with missing required fields', async () => {
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'login@example.com',
        username: 'loginuser',
        firstName: 'Login',
        lastName: 'Test',
        password: 'LoginPassword123!',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        username: 'loginuser',
        password: 'LoginPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          user: expect.objectContaining({
            username: loginDto.username,
            email: 'login@example.com',
          }),
          session: expect.objectContaining({
            id: expect.any(String),
            expiresAt: expect.any(String),
          }),
        },
      });

      // Verify session cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(
        cookies.some((cookie: string) => cookie.startsWith('session_token=')),
      ).toBe(true);

      // Verify session was created in database
      const sessions = await dataSource.getRepository(Session).find();
      expect(sessions).toHaveLength(2); // One from registration, one from login
    });

    it('should reject login with invalid username', async () => {
      const loginDto = {
        username: 'nonexistent',
        password: 'LoginPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        username: 'loginuser',
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with missing credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let sessionToken: string;

    beforeEach(async () => {
      // Register and login to get a session
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'logout@example.com',
          username: 'logoutuser',
          firstName: 'Logout',
          lastName: 'Test',
          password: 'LogoutPassword123!',
        });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((cookie: string) =>
        cookie.startsWith('session_token='),
      );
      expect(sessionCookie).toBeDefined();
      sessionToken = sessionCookie.split(';')[0].split('=')[1];
    });

    it('should logout successfully with valid session', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `session_token=${sessionToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
      });

      // Verify session cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(
        cookies.some(
          (cookie: string) =>
            cookie.includes('session_token') &&
            (cookie.includes('Max-Age=0') ||
              cookie.includes('Expires=Thu, 01 Jan 1970')),
        ),
      ).toBe(true);

      // Verify session was deleted from database
      const session = await dataSource
        .getRepository(Session)
        .findOne({ where: { id: sessionToken.split('.')[0] } });
      expect(session).toBeNull();
    });

    it('should reject logout without session token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should reject logout with invalid session token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'session_token=invalid.token.here')
        .expect(401);
    });
  });

  describe('Role Guards and Session Guards', () => {
    let regularUserToken: string;
    let adminToken: string;
    let techOfficerToken: string;

    beforeEach(async () => {
      // Create regular user
      const regularResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'regular@example.com',
          username: 'regularuser',
          firstName: 'Regular',
          lastName: 'User',
          password: 'Password123!',
        });

      const regularCookies = regularResponse.headers['set-cookie'];
      if (regularCookies && regularCookies.length > 0) {
        const regularCookie = regularCookies.find((c: string) =>
          c.startsWith('session_token='),
        );
        if (regularCookie) {
          regularUserToken = regularCookie.split(';')[0].split('=')[1];
        }
      }

      // Create admin user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'admin@example.com',
        username: 'adminuser',
        firstName: 'Admin',
        lastName: 'User',
        password: 'AdminPassword123!',
      });

      // Create admin role and assign to user
      const adminRole = await dataSource.query(
        `INSERT INTO "role" (id, name, label, "isMunicipal") VALUES ('admin-role', 'admin', 'Administrator', true) ON CONFLICT DO NOTHING RETURNING id`,
      );

      await dataSource.query(
        `UPDATE "user" SET "roleId" = 'admin-role' WHERE username = 'adminuser'`,
      );

      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'adminuser', password: 'AdminPassword123!' });

      const adminCookies = adminLoginResponse.headers['set-cookie'];
      if (adminCookies && adminCookies.length > 0) {
        const adminCookie = adminCookies.find((c: string) =>
          c.startsWith('session_token='),
        );
        if (adminCookie) {
          adminToken = adminCookie.split(';')[0].split('=')[1];
        }
      }

      // Create tech officer user
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'tech@example.com',
        username: 'techuser',
        firstName: 'Tech',
        lastName: 'Officer',
        password: 'TechPassword123!',
      });

      const techRole = await dataSource.query(
        `INSERT INTO "role" (id, name, label, "isMunicipal") VALUES ('tech-role', 'tech_officer', 'Technical Officer', true) ON CONFLICT DO NOTHING RETURNING id`,
      );

      await dataSource.query(
        `UPDATE "user" SET "roleId" = 'tech-role' WHERE username = 'techuser'`,
      );

      const techLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'techuser', password: 'TechPassword123!' });

      const techCookies = techLoginResponse.headers['set-cookie'];
      if (techCookies && techCookies.length > 0) {
        const techCookie = techCookies.find((c: string) =>
          c.startsWith('session_token='),
        );
        if (techCookie) {
          techOfficerToken = techCookie.split(';')[0].split('=')[1];
        }
      }
    });

    it('should verify SessionGuard blocks unauthenticated requests', async () => {
      // Test on logout endpoint which requires SessionGuard
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should verify SessionGuard allows authenticated requests', async () => {
      // Any authenticated user should be able to logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `session_token=${regularUserToken}`)
        .expect(200);
    });

    it('should verify SessionGuard rejects expired/invalid tokens', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'session_token=expired.invalid.token')
        .expect(401);
    });

    it('should allow access to protected routes with valid session', async () => {
      // The user should have a valid session after registration
      const user = await dataSource
        .getRepository(User)
        .findOne({ where: { username: 'regularuser' } });

      expect(user).toBeDefined();

      // Session should exist in database
      const sessions = await dataSource
        .getRepository(Session)
        .find({ where: { userId: user.id } });

      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should maintain session state across multiple requests', async () => {
      // First request
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      // After logout, token should be invalid
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(401);
    });

    it('should verify different users have isolated sessions', async () => {
      // Both users should have valid but separate sessions
      const regularUser = await dataSource
        .getRepository(User)
        .findOne({ where: { username: 'regularuser' } });

      const techUser = await dataSource
        .getRepository(User)
        .findOne({ where: { username: 'techuser' } });

      const regularSessions = await dataSource
        .getRepository(Session)
        .find({ where: { userId: regularUser.id } });

      const techSessions = await dataSource
        .getRepository(Session)
        .find({ where: { userId: techUser.id } });

      expect(regularSessions.length).toBeGreaterThan(0);
      expect(techSessions.length).toBeGreaterThan(0);

      // Session IDs should be different
      expect(regularSessions[0].id).not.toBe(techSessions[0].id);
    });

    it('should verify role information is attached to session', async () => {
      const adminUser = await dataSource.getRepository(User).findOne({
        where: { username: 'adminuser' },
        relations: ['role'],
      });

      expect(adminUser.role).toBeDefined();
      expect(adminUser.role.name).toBe('admin');
      expect(adminUser.role.isMunicipal).toBe(true);

      const regularUser = await dataSource.getRepository(User).findOne({
        where: { username: 'regularuser' },
        relations: ['role'],
      });

      expect(regularUser.role).toBeDefined();
      expect(regularUser.role.name).toBe('user');
    });

    it('should verify session contains user information after authentication', async () => {
      const user = await dataSource.getRepository(User).findOne({
        where: { username: 'adminuser' },
        relations: ['role'],
      });

      const session = await dataSource.getRepository(Session).findOne({
        where: { userId: user.id },
        relations: ['user', 'user.role'],
      });

      expect(session).toBeDefined();
      expect(session.user.id).toBe(user.id);
      expect(session.user.username).toBe('adminuser');
      expect(session.user.role.name).toBe('admin');
    });
  });
});
