// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Profile, Role } from '@entities';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import appConfig from '../../../src/config/app.config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { ProfilesModule } from '../../../src/modules/profiles/profiles.module';
import { MinioModule } from '../../../src/providers/minio/minio.module';
import { MinioProvider } from '../../../src/providers/minio/minio.provider';
import {
  MockMinioProvider,
  setupTestDB,
  TypeOrmTestModule,
} from '../test-helpers';

const request = require('supertest');

describe('ProfilesController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userToken: string;
  let municipalUserToken: string;
  let userId: string;

  beforeAll(async () => {
    container = await setupTestDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        TypeOrmTestModule(container),
        MinioModule,
        AuthModule,
        ProfilesModule,
      ],
    })
      .overrideProvider(MinioProvider)
      .useClass(MockMinioProvider)
      .compile();

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

    // Create user role
    const userRole = dataSource.getRepository(Role).create({
      id: 'user-role-id',
      name: 'user',
      label: 'User',
      isMunicipal: false,
    });
    await dataSource.getRepository(Role).save(userRole);

    // Create municipal role
    const techOfficerRole = dataSource.getRepository(Role).create({
      id: 'tech-officer-role-id',
      name: 'tech_officer',
      label: 'Technical Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(techOfficerRole);

    // Create regular user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        username: 'regularuser',
        firstName: 'Regular',
        lastName: 'User',
        password: 'UserPassword123!',
      });

    const userCookies = userResponse.headers['set-cookie'];
    if (userCookies && userCookies.length > 0) {
      const userCookie = userCookies.find((c: string) =>
        c.startsWith('session_token='),
      );
      if (userCookie) {
        userToken = userCookie.split(';')[0].split('=')[1];
      }
    }

    userId = userResponse.body.data.user.id;

    // Create municipal user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'municipal@example.com',
      username: 'municipaluser',
      firstName: 'Municipal',
      lastName: 'User',
      password: 'MunicipalPassword123!',
    });

    await dataSource.query(
      `UPDATE "user" SET "roleId" = '${techOfficerRole.id}' WHERE username = 'municipaluser'`,
    );

    const municipalLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'municipaluser', password: 'MunicipalPassword123!' });

    const municipalCookies = municipalLoginResponse.headers['set-cookie'];
    if (municipalCookies && municipalCookies.length > 0) {
      const municipalCookie = municipalCookies.find((c: string) =>
        c.startsWith('session_token='),
      );
      if (municipalCookie) {
        municipalUserToken = municipalCookie.split(';')[0].split('=')[1];
      }
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  describe('GET /profiles/profile/me', () => {
    it('should retrieve current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles/profile/me')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toMatchObject({
        id: userId,
        email: 'user@example.com',
        username: 'regularuser',
        firstName: 'Regular',
        lastName: 'User',
      });
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get('/profiles/profile/me')
        .expect(401);
    });
  });

  describe('PATCH /profiles/profile/me', () => {
    it('should update profile for regular user', async () => {
      const updateDto = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        telegramUsername: '@updated_user',
      };

      const response = await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .set('Cookie', `session_token=${userToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toMatchObject({
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
      });

      // Verify in database
      const profile = await dataSource.getRepository(Profile).findOne({
        where: { userId },
        relations: ['user'],
      });
      expect(profile.user.firstName).toBe('UpdatedFirst');
      expect(profile.telegramUsername).toBe('@updated_user');
    });

    it('should update emailNotificationsEnabled', async () => {
      const updateDto = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        emailNotificationsEnabled: false,
      };

      const response = await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .set('Cookie', `session_token=${userToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify in database
      const profile = await dataSource
        .getRepository(Profile)
        .findOne({ where: { userId } });
      expect(profile.emailNotificationsEnabled).toBe(false);
    });

    it('should reject profile update for municipal user (403 Forbidden)', async () => {
      const updateDto = {
        firstName: 'ShouldFail',
      };

      await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .set('Cookie', `session_token=${municipalUserToken}`)
        .send(updateDto)
        .expect(403);
    });

    it('should reject update without authentication (401)', async () => {
      await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .send({ firstName: 'Test' })
        .expect(401);
    });
  });

  describe('PATCH /profiles/profile/me with file upload', () => {
    it('should reject profile picture with invalid mimetype (400 Bad Request)', async () => {
      const response = await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .set('Cookie', `session_token=${userToken}`)
        .field('firstName', 'Test')
        .attach('profilePicture', Buffer.from('fake pdf content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Invalid file type: application/pdf. Allowed types: JPEG, PNG, WebP',
      );
    });

    it('should reject profile picture exceeding size limit (400 Bad Request)', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      const response = await request(app.getHttpServer())
        .patch('/profiles/profile/me')
        .set('Cookie', `session_token=${userToken}`)
        .field('firstName', 'Test')
        .attach('profilePicture', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      expect(response.body.message).toContain('File size must not exceed 5MB');
    });
  });
});
