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
import { CategoriesModule } from '../../../src/modules/categories/categories.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Role } from '../../../src/common/entities/role.entity';
import { Category } from '../../../src/common/entities/category.entity';
import { Office } from '../../../src/common/entities/office.entity';
import appConfig from '../../../src/config/app.config';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('CategoriesController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userToken: string;
  let techOfficerToken: string;

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
        CategoriesModule,
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

    // Create tech officer role
    const techOfficerRole = dataSource.getRepository(Role).create({
      id: 'tech-officer-role-id',
      name: 'tech_officer',
      label: 'Technical Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(techOfficerRole);

    // Create office and categories
    const office = dataSource.getRepository(Office).create({
      id: 'office-1',
      name: 'technical_office',
      label: 'Technical Office',
    });
    await dataSource.getRepository(Office).save(office);

    const category1 = dataSource.getRepository(Category).create({
      id: 'category-1',
      name: 'roads',
    });
    const category2 = dataSource.getRepository(Category).create({
      id: 'category-2',
      name: 'lighting',
    });
    await dataSource.getRepository(Category).save([category1, category2]);

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

    // Create tech officer user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'techofficer@example.com',
        username: 'techuser',
        firstName: 'Tech',
        lastName: 'Officer',
        password: 'TechPassword123!',
      });

    await dataSource.query(`UPDATE "user" SET "roleId" = '${techOfficerRole.id}' WHERE username = 'techuser'`);

    const techLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'techuser', password: 'TechPassword123!' });

    const techCookies = techLoginResponse.headers['set-cookie'];
    if (techCookies && techCookies.length > 0) {
      const techCookie = techCookies.find((c: string) => c.startsWith('session_token='));
      if (techCookie) {
        techOfficerToken = techCookie.split(';')[0].split('=')[1];
      }
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  describe('GET /categories', () => {
    it('should retrieve all categories for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Cookie', `session_token=${userToken}`)
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

      expect(response.body.data.length).toBe(2);
    });

    it('should retrieve all categories for tech officer', async () => {
      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Cookie', `session_token=${techOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/categories')
        .expect(401);
    });
  });
});
