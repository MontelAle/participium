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
import { UsersModule } from '../../../src/modules/users/users.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { Role } from '../../../src/common/entities/role.entity';
import { User } from '../../../src/common/entities/user.entity';
import { Profile } from '../../../src/common/entities/profile.entity';
import { Office } from '../../../src/common/entities/office.entity';
import { Category } from '../../../src/common/entities/category.entity';
import appConfig from '../../../src/config/app.config';
import { setupTestDB, TypeOrmTestModule, MockMinioProvider } from '../test-helpers';
import { MinioProvider } from '../../../src/providers/minio/minio.provider';
import { MinioModule } from '../../../src/providers/minio/minio.module';

const request = require('supertest');

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let adminToken: string;
  let techOfficerToken: string;
  let userToken: string;
  let techOfficerRoleId: string;
  let prOfficerRoleId: string;
  let officeId: string;
  let categoryId: string;

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
        UsersModule,
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

    const techOfficerRole = dataSource.getRepository(Role).create({
      id: 'tech-officer-role-id',
      name: 'tech_officer',
      label: 'Technical Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(techOfficerRole);
    techOfficerRoleId = techOfficerRole.id;

    const prOfficerRole = dataSource.getRepository(Role).create({
      id: 'pr-officer-role-id',
      name: 'pr_officer',
      label: 'PR Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(prOfficerRole);
    prOfficerRoleId = prOfficerRole.id;

    const externalMaintainerRole = dataSource.getRepository(Role).create({
      id: 'external-maintainer-role-id',
      name: 'external_maintainer',
      label: 'External Maintainer',
      isMunicipal: false,
    });
    await dataSource.getRepository(Role).save(externalMaintainerRole);

    // Create office
    const office = dataSource.getRepository(Office).create({
      id: 'office-1',
      name: 'technical_office',
      label: 'Technical Office',
    });
    await dataSource.getRepository(Office).save(office);
    officeId = office.id;

    // Create category
    const category = dataSource.getRepository(Category).create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'roads',
    });
    await dataSource.getRepository(Category).save(category);
    categoryId = category.id;

    // Create admin user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        username: 'adminuser',
        firstName: 'Admin',
        lastName: 'User',
        password: 'AdminPassword123!',
      });

    await dataSource.query(`UPDATE "user" SET "roleId" = '${adminRole.id}' WHERE username = 'adminuser'`);

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

    // Create tech officer
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'tech@example.com',
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

  afterEach(async () => {
    // Clean up municipality users created during tests
    await dataSource.query(`DELETE FROM "account" WHERE "providerId" = 'local' AND "accountId" NOT IN ('adminuser', 'techuser', 'regularuser')`);
    await dataSource.query(`DELETE FROM "profile" WHERE "userId" NOT IN (SELECT id FROM "user" WHERE username IN ('adminuser', 'techuser', 'regularuser'))`);
    await dataSource.query(`DELETE FROM "user" WHERE username NOT IN ('adminuser', 'techuser', 'regularuser')`);
  });

  describe('POST /users/municipality', () => {
    it('should create a new municipality user as admin', async () => {
      const createDto = {
        email: 'newmunicipal@example.com',
        username: 'newmunicipal',
        firstName: 'New',
        lastName: 'Municipal',
        password: 'MunicipalPassword123!',
        roleId: techOfficerRoleId,
        officeId: officeId,
      };

      const response = await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          email: createDto.email,
          username: createDto.username,
          firstName: createDto.firstName,
          lastName: createDto.lastName,
        }),
      });

      // Verify user was created
      const user = await dataSource.getRepository(User).findOne({ where: { username: createDto.username } });
      expect(user).toBeDefined();
    });

    it('should reject creation with duplicate username (409 Conflict)', async () => {
      const createDto = {
        email: 'duplicate1@example.com',
        username: 'duplicateuser',
        firstName: 'Dup',
        lastName: 'User',
        password: 'Password123!',
        roleId: techOfficerRoleId,
      };

      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send(createDto)
        .expect(201);

      // Try to create with same username
      const duplicateDto = { ...createDto, email: 'duplicate2@example.com' };
      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send(duplicateDto)
        .expect(409);
    });

    it('should reject creation with invalid role (404 Not Found)', async () => {
      const createDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        roleId: 'non-existent-role-id',
      };

      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send(createDto)
        .expect(404);
    });

    it('should reject creation without authentication (401)', async () => {
      const createDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        roleId: techOfficerRoleId,
      };

      await request(app.getHttpServer())
        .post('/users/municipality')
        .send(createDto)
        .expect(401);
    });

    it('should reject creation for non-admin user (403 Forbidden)', async () => {
      const createDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        roleId: techOfficerRoleId,
      };

      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${userToken}`)
        .send(createDto)
        .expect(403);
    });

    it('should reject creation with invalid data (400 Bad Request)', async () => {
      const createDto = {
        email: 'invalid-email',
        username: 'test',
        // missing required fields
      };

      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /users/municipality', () => {
    beforeEach(async () => {
      // Create a test municipality user
      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send({
          email: 'municipal@example.com',
          username: 'municipaluser',
          firstName: 'Municipal',
          lastName: 'User',
          password: 'Password123!',
          roleId: techOfficerRoleId,
          officeId: officeId,
        });
    });

    it('should retrieve all municipality users as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            username: expect.any(String),
            role: expect.any(Object),
          }),
        ]),
      });
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get('/users/municipality')
        .expect(401);
    });

    it('should reject request for regular user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/users/municipality')
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });

  describe('GET /users/municipality/user/:id', () => {
    let testUserId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send({
          email: 'getbyid@example.com',
          username: 'getbyiduser',
          firstName: 'GetById',
          lastName: 'User',
          password: 'Password123!',
          roleId: techOfficerRoleId,
        });

      testUserId = response.body.data.id;
    });

    it('should retrieve municipality user by ID as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: testUserId,
          username: 'getbyiduser',
        }),
      });
    });

    it('should reject request for non-existent user (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .get('/users/municipality/user/non-existent-id')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(404);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get(`/users/municipality/user/${testUserId}`)
        .expect(401);
    });

    it('should reject request for non-admin user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .expect(403);
    });
  });

  describe('POST /users/municipality/user/:id (Update)', () => {
    let testUserId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send({
          email: 'update@example.com',
          username: 'updateuser',
          firstName: 'Update',
          lastName: 'User',
          password: 'Password123!',
          roleId: techOfficerRoleId,
        });

      testUserId = response.body.data.id;
    });

    it('should update municipality user as admin', async () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
        roleId: prOfficerRoleId,
      };

      const response = await request(app.getHttpServer())
        .post(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { id: testUserId },
      });

      // Verify update
      const user = await dataSource.getRepository(User).findOne({ where: { id: testUserId } });
      expect(user.firstName).toBe('Updated');
      expect(user.lastName).toBe('Name');
    });

    it('should reject update for non-existent user (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .post('/users/municipality/user/non-existent-id')
        .set('Cookie', `session_token=${adminToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });

    it('should reject update with duplicate username (409 Conflict)', async () => {
      // Create another user
      await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send({
          email: 'another@example.com',
          username: 'anotheruser',
          firstName: 'Another',
          lastName: 'User',
          password: 'Password123!',
          roleId: techOfficerRoleId,
        });

      // Try to update with existing username
      await request(app.getHttpServer())
        .post(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${adminToken}`)
        .send({ username: 'anotheruser' })
        .expect(409);
    });

    it('should reject update without authentication (401)', async () => {
      await request(app.getHttpServer())
        .post(`/users/municipality/user/${testUserId}`)
        .send({ firstName: 'Test' })
        .expect(401);
    });

    it('should reject update for non-admin user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${userToken}`)
        .send({ firstName: 'Test' })
        .expect(403);
    });
  });

  describe('DELETE /users/municipality/user/:id', () => {
    let testUserId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/users/municipality')
        .set('Cookie', `session_token=${adminToken}`)
        .send({
          email: 'delete@example.com',
          username: 'deleteuser',
          firstName: 'Delete',
          lastName: 'User',
          password: 'Password123!',
          roleId: techOfficerRoleId,
        });

      testUserId = response.body.data.id;
    });

    it('should delete municipality user as admin', async () => {
      // Delete associated profile first to avoid foreign key constraint violation
      await dataSource.getRepository(Profile).delete({ userId: testUserId });

      const response = await request(app.getHttpServer())
        .delete(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { id: testUserId },
      });

      // Verify deletion
      const user = await dataSource.getRepository(User).findOne({ where: { id: testUserId } });
      expect(user).toBeNull();
    });

    it('should reject deletion for non-existent user (404 Not Found)', async () => {
      await request(app.getHttpServer())
        .delete('/users/municipality/user/non-existent-id')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(404);
    });

    it('should reject deletion without authentication (401)', async () => {
      await request(app.getHttpServer())
        .delete(`/users/municipality/user/${testUserId}`)
        .expect(401);
    });

    it('should reject deletion for non-admin user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .delete(`/users/municipality/user/${testUserId}`)
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });

  describe('GET /users/external-maintainers', () => {
    it('should retrieve external maintainers as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/external-maintainers')
        .set('Cookie', `session_token=${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should retrieve external maintainers as tech officer', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/external-maintainers')
        .set('Cookie', `session_token=${techOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get('/users/external-maintainers')
        .expect(401);
    });

    it('should reject request for regular user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get('/users/external-maintainers')
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });
});
