// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { RolesModule } from '../../../src/modules/roles/roles.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Role } from '../../../src/common/entities/role.entity';
import appConfig from '../../../src/config/app.config';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('RolesController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    container = await setupTestDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        TypeOrmTestModule(container),
        AuthModule,
        RolesModule,
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

    // Create user role for registration
    const userRole = dataSource.getRepository(Role).create({
      id: 'user-role-id',
      name: 'user',
      label: 'User',
      isMunicipal: false,
    });
    await dataSource.getRepository(Role).save(userRole);

    // Create admin role and user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        username: 'adminuser',
        firstName: 'Admin',
        lastName: 'User',
        password: 'AdminPassword123!',
      });

    // Update user to admin role
    const adminRole = await dataSource.getRepository(Role).findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      const newAdminRole = dataSource.getRepository(Role).create({
        id: 'admin-role-id',
        name: 'admin',
        label: 'Administrator',
        isMunicipal: true,
      });
      await dataSource.getRepository(Role).save(newAdminRole);
    }

    await dataSource.query(`UPDATE "user" SET "roleId" = (SELECT id FROM role WHERE name = 'admin') WHERE username = 'adminuser'`);

    // Login as admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'adminuser', password: 'AdminPassword123!' });

    const adminCookies = adminLoginResponse.headers['set-cookie'];
    if (adminCookies && adminCookies.length > 0) {
      const adminCookie = adminCookies.find((c: string) => c.startsWith('session_token='));
      if (adminCookie) {
        adminToken = adminCookie.split(';')[0].split('=')[1];
      }
    }

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
      const userCookie = userCookies.find((c: string) => c.startsWith('session_token='));
      if (userCookie) {
        userToken = userCookie.split(';')[0].split('=')[1];
      }
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  describe('GET /roles', () => {
    it('should retrieve all roles for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/roles')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
          }),
        ]),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .expect(401);
    });

    it('should reject request for non-admin user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });
});
