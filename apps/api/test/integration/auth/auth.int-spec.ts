// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { User } from '../../../src/common/entities/user.entity';
import { Account } from '../../../src/common/entities/account.entity';
import { Profile } from '../../../src/common/entities/profile.entity';
import { Session } from '../../../src/common/entities/session.entity';
import appConfig from '../../../src/config/app.config';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
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
      expect(cookies.some((cookie: string) => cookie.startsWith('session_token='))).toBe(true);

      // Verify user was created in database
      const user = await dataSource
        .getRepository(User)
        .findOne({ where: { username: registerDto.username }, relations: ['role'] });
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

      expect(response.body.message).toContain('already exists');
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
        // missing firstName, lastName, password
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
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
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
      expect(cookies.some((cookie: string) => cookie.startsWith('session_token='))).toBe(true);

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
        .expect(400);
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
      const sessionCookie = cookies.find((cookie: string) =>
        cookie.startsWith('session_token='),
      );
      sessionToken = sessionCookie.split(';')[0].split('=')[1];
    });

    it('should logout successfully with valid session', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `session_token=${sessionToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: expect.any(String),
      });

      // Verify session cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(
        cookies.some((cookie: string) =>
          cookie.includes('session_token=') && cookie.includes('Max-Age=0'),
        ),
      ).toBe(true);

      // Verify session was deleted from database
      const session = await dataSource
        .getRepository(Session)
        .findOne({ where: { id: sessionToken.split('.')[0] } });
      expect(session).toBeNull();
    });

    it('should reject logout without session token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should reject logout with invalid session token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'session_token=invalid.token.here')
        .expect(401);
    });
  });
});
