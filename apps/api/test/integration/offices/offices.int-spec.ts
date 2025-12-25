// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Office, Role } from '@entities';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import appConfig from '../../../src/config/app.config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { OfficesModule } from '../../../src/modules/offices/offices.module';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('OfficesController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let adminToken: string;
  let prOfficerToken: string;
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
        OfficesModule,
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

    // Create roles
    const userRole = dataSource.getRepository(Role).create({
      id: 'user-role-id',
      name: 'user',
      label: 'User',
      isMunicipal: false,
    });
    await dataSource.getRepository(Role).save(userRole);

    const adminRole = dataSource.getRepository(Role).create({
      id: 'admin-role-id',
      name: 'admin',
      label: 'Administrator',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(adminRole);

    const prOfficerRole = dataSource.getRepository(Role).create({
      id: 'pr-officer-role-id',
      name: 'pr_officer',
      label: 'PR Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(prOfficerRole);

    // Create test offices
    const office1 = dataSource.getRepository(Office).create({
      id: 'office-1',
      name: 'technical_office',
      label: 'Technical Office',
    });
    const office2 = dataSource.getRepository(Office).create({
      id: 'office-2',
      name: 'public_relations',
      label: 'Public Relations',
    });
    await dataSource.getRepository(Office).save([office1, office2]);

    // Create admin user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'admin@example.com',
      username: 'adminuser',
      firstName: 'Admin',
      lastName: 'User',
      password: 'AdminPassword123!',
    });

    await dataSource.query(
      `UPDATE "user" SET "roleId" = '${adminRole.id}' WHERE username = 'adminuser'`,
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

    // Create PR officer user
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'profficer@example.com',
      username: 'profficeruser',
      firstName: 'PR',
      lastName: 'Officer',
      password: 'PRPassword123!',
    });

    await dataSource.query(
      `UPDATE "user" SET "roleId" = '${prOfficerRole.id}' WHERE username = 'profficeruser'`,
    );

    const prOfficerLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'profficeruser', password: 'PRPassword123!' });

    const prCookies = prOfficerLoginResponse.headers['set-cookie'];
    if (prCookies && prCookies.length > 0) {
      const prCookie = prCookies.find((c: string) =>
        c.startsWith('session_token='),
      );
      if (prCookie) {
        prOfficerToken = prCookie.split(';')[0].split('=')[1];
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
      const userCookie = userCookies.find((c: string) =>
        c.startsWith('session_token='),
      );
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

  describe('GET /offices', () => {
    it('should retrieve all offices for admin user', async () => {
      const response = await request(app.getHttpServer())
        .get('/offices')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            label: expect.any(String),
          }),
        ]),
      });

      expect(response.body.data.length).toBe(2);
    });

    it('should retrieve all offices for PR officer', async () => {
      const response = await request(app.getHttpServer())
        .get('/offices')
        .set('Cookie', `session_token=${prOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer()).get('/offices').expect(401);
    });

    it('should reject request for regular user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/offices')
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });
});
