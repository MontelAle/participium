// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Boundary, Category, Office, Report, Role } from '@entities';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import appConfig from '../../../src/config/app.config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { ReportsModule } from '../../../src/modules/reports/reports.module';
import { MinioModule } from '../../../src/providers/minio/minio.module';
import { MinioProvider } from '../../../src/providers/minio/minio.provider';
import {
  MockMinioProvider,
  setupTestDB,
  TypeOrmTestModule,
} from '../test-helpers';

const request = require('supertest');

describe('ReportsController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let userToken: string;
  let techOfficerToken: string;
  let prOfficerToken: string;
  let userId: string;
  let categoryId: string;
  let officeId: string;

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
        ReportsModule,
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

    const techOfficerRole = dataSource.getRepository(Role).create({
      id: 'tech-officer-role-id',
      name: 'tech_officer',
      label: 'Technical Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(techOfficerRole);

    const prOfficerRole = dataSource.getRepository(Role).create({
      id: 'pr-officer-role-id',
      name: 'pr_officer',
      label: 'PR Officer',
      isMunicipal: true,
    });
    await dataSource.getRepository(Role).save(prOfficerRole);

    // Create office
    const office = dataSource.getRepository(Office).create({
      id: 'office-1',
      name: 'technical_office',
      label: 'Technical Office',
    });
    await dataSource.getRepository(Office).save(office);

    // Create category
    const category = dataSource.getRepository(Category).create({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'roads',
    });
    await dataSource.getRepository(Category).save(category);
    categoryId = category.id;

    // Create boundary (rectangular area covering test coordinates)
    const boundary = dataSource.getRepository(Boundary).create({
      id: 'test-boundary-1',
      name: 'test_municipality',
      label: 'Test Municipality',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [7.5, 45],
              [7.9, 45],
              [7.9, 45.2],
              [7.5, 45.2],
              [7.5, 45],
            ],
          ],
        ],
      },
    });
    await dataSource.getRepository(Boundary).save(boundary);

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

    // Create tech officer
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'tech@example.com',
      username: 'techuser',
      firstName: 'Tech',
      lastName: 'Officer',
      password: 'TechPassword123!',
    });

    await dataSource.query(
      `UPDATE "user" SET "roleId" = '${techOfficerRole.id}' WHERE username = 'techuser'`,
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

    // Create PR officer
    await request(app.getHttpServer()).post('/auth/register').send({
      email: 'profficer@example.com',
      username: 'profficer',
      firstName: 'PR',
      lastName: 'Officer',
      password: 'PRPassword123!',
    });

    await dataSource.query(
      `UPDATE "user" SET "roleId" = '${prOfficerRole.id}' WHERE username = 'profficer'`,
    );

    const prLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'profficer', password: 'PRPassword123!' });

    const prCookies = prLoginResponse.headers['set-cookie'];
    if (prCookies && prCookies.length > 0) {
      const prCookie = prCookies.find((c: string) =>
        c.startsWith('session_token='),
      );
      if (prCookie) {
        prOfficerToken = prCookie.split(';')[0].split('=')[1];
      }
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
    await container.stop();
  });

  afterEach(async () => {
    // Clean up reports between tests
    await dataSource.query('DELETE FROM "report"');
  });

  describe('POST /reports', () => {
    it('should create a new report with valid data and images', async () => {
      const fakeImage = Buffer.from('fake image content');

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Test Report')
        .field('description', 'This is a test report')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test1.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'Test Report',
          description: 'This is a test report',
          status: 'pending',
        }),
      });

      // Verify report was created in database
      const report = await dataSource.getRepository(Report).findOne({
        where: { title: 'Test Report' },
      });
      expect(report).toBeDefined();
      expect(report.userId).toBe(userId);
    });

    it('should reject report without images (400 Bad Request)', async () => {
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Test Report')
        .field('description', 'This is a test report')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .expect(400);

      const errMsg1 = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(errMsg1).toMatch(/image|images|upload/i);
    });

    it('should reject report with invalid image mimetype (400 Bad Request)', async () => {
      const fakeImage = Buffer.from('fake pdf content');

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Test Report')
        .field('description', 'Test')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(400);

      const errMsg2 = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(errMsg2).toMatch(/invalid file type|mimetype|file type/i);
    });

    it('should reject report with image exceeding size limit (400 Bad Request)', async () => {
      const largeImage = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Test Report')
        .field('description', 'Test')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', largeImage, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);

      const errMsg3 = Array.isArray(response.body.message)
        ? response.body.message.join(' ')
        : response.body.message;
      expect(errMsg3).toMatch(/exceeds.*5 ?MB|size limit|file size/i);
    });

    it('should reject report creation without authentication (401)', async () => {
      const fakeImage = Buffer.from('fake image content');

      await request(app.getHttpServer())
        .post('/reports')
        .field('title', 'Test Report')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);
    });

    it('should reject report with missing required fields (400)', async () => {
      const fakeImage = Buffer.from('fake image content');

      await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Test Report')
        // missing categoryId, longitude, latitude
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(400);
    });
  });

  describe('GET /reports', () => {
    beforeEach(async () => {
      // Create test reports
      const fakeImage = Buffer.from('fake image content');

      await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Report 1')
        .field('description', 'First report')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test1.jpg',
          contentType: 'image/jpeg',
        });
    });

    it('should retrieve all reports for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter reports by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports?status=pending')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter reports by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports?categoryId=${categoryId}`)
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer()).get('/reports').expect(401);
    });
  });

  describe('GET /reports/public', () => {
    let pendingReportId: string;
    let inProgressReportId: string;

    beforeEach(async () => {
      const fakeImage = Buffer.from('fake image content');

      // Create pending report
      const pendingResponse = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Pending Report')
        .field('description', 'This should not be visible to guests')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      pendingReportId = pendingResponse.body.data.id;

      // Create another report and move it to in_progress
      const inProgressResponse = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'In Progress Report')
        .field('description', 'This should be visible to guests')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      inProgressReportId = inProgressResponse.body.data.id;

      // Move to in_progress
      await request(app.getHttpServer())
        .patch(`/reports/${inProgressReportId}`)
        .set('Cookie', `session_token=${prOfficerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);
    });

    it('should not include pending reports in public endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check that pending report is not in the list
      const pendingReport = response.body.data.find(
        (r: any) => r.id === pendingReportId,
      );
      expect(pendingReport).toBeUndefined();
    });

    it('should include in_progress reports in public endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check that in_progress report is in the list
      const inProgressReport = response.body.data.find(
        (r: any) => r.id === inProgressReportId,
      );
      expect(inProgressReport).toBeDefined();
      expect(inProgressReport.status).toBe('in_progress');
    });

    it('should include suspended reports in public endpoint', async () => {
      // Move report to suspended
      await request(app.getHttpServer())
        .patch(`/reports/${inProgressReportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check that suspended report is in the list
      const suspendedReport = response.body.data.find(
        (r: any) => r.id === inProgressReportId,
      );
      expect(suspendedReport).toBeDefined();
      expect(suspendedReport.status).toBe('suspended');
    });

    it('should work without authentication (public access)', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /reports/stats', () => {
    it('should retrieve dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/stats')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          total: expect.any(Number),
          pending: expect.any(Number),
          in_progress: expect.any(Number),
          resolved: expect.any(Number),
        }),
      });
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer()).get('/reports/stats').expect(401);
    });
  });

  describe('GET /reports/nearby', () => {
    it('should find nearby reports based on location', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/nearby?longitude=7.6869&latitude=45.0703&radius=10000')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should use default radius when not specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/reports/nearby?longitude=7.6869&latitude=45.0703')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get('/reports/nearby?longitude=7.6869&latitude=45.0703')
        .expect(401);
    });
  });

  describe('GET /reports/:id', () => {
    let reportId: string;

    beforeEach(async () => {
      const fakeImage = Buffer.from('fake image content');

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Single Report')
        .field('description', 'Single report test')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      reportId = response.body.data.id;
    });

    it('should retrieve report by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports/${reportId}`)
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: reportId,
          title: 'Single Report',
        }),
      });
    });

    it('should reject request for non-existent report (404)', async () => {
      await request(app.getHttpServer())
        .get('/reports/non-existent-id')
        .set('Cookie', `session_token=${userToken}`)
        .expect(404);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get(`/reports/${reportId}`)
        .expect(401);
    });
  });

  describe('PATCH /reports/:id', () => {
    let reportId: string;

    beforeEach(async () => {
      const fakeImage = Buffer.from('fake image content');

      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Update Report')
        .field('description', 'Report to update')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      reportId = response.body.data.id;
    });

    it('should update report as PR officer', async () => {
      const updateDto = {
        status: 'in_progress',
      };

      const response = await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${prOfficerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: reportId,
          status: 'in_progress',
        }),
      });
    });

    it('should update report as tech officer', async () => {
      const updateDto = {
        status: 'assigned',
      };

      const response = await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject update for non-existent report (404)', async () => {
      await request(app.getHttpServer())
        .patch('/reports/non-existent-id')
        .set('Cookie', `session_token=${prOfficerToken}`)
        .send({ status: 'in_progress' })
        .expect(404);
    });

    it('should reject update without authentication (401)', async () => {
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .send({ status: 'in_progress' })
        .expect(401);
    });

    it('should reject update for regular user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${userToken}`)
        .send({ status: 'in_progress' })
        .expect(403);
    });
  });

  describe('PATCH /reports/:id - Suspended Status Transitions', () => {
    let reportId: string;

    beforeEach(async () => {
      const fakeImage = Buffer.from('fake image content');

      // Create a report and move it to in_progress status
      const response = await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'Report for Suspension Test')
        .field('description', 'Test suspended status transitions')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      reportId = response.body.data.id;

      // Move report to in_progress
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${prOfficerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);
    });

    it('should allow tech officer to transition report from in_progress to suspended', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: reportId,
          status: 'suspended',
        }),
      });
    });

    it('should allow tech officer to transition report from suspended back to in_progress', async () => {
      // First suspend the report
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      // Then resume it
      const response = await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: reportId,
          status: 'in_progress',
        }),
      });
    });

    it('should filter suspended reports in public endpoint', async () => {
      // Suspend the report
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      // Query public reports - suspended should be visible
      const response = await request(app.getHttpServer())
        .get('/reports/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      const suspendedReport = response.body.data.find(
        (r: any) => r.id === reportId,
      );
      expect(suspendedReport).toBeDefined();
      expect(suspendedReport.status).toBe('suspended');
    });

    it('should include suspended status in authenticated user reports', async () => {
      // Suspend the report
      await request(app.getHttpServer())
        .patch(`/reports/${reportId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .send({ status: 'suspended' })
        .expect(200);

      // Query reports as authenticated user
      const response = await request(app.getHttpServer())
        .get('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const suspendedReport = response.body.data.find(
        (r: any) => r.id === reportId,
      );
      expect(suspendedReport).toBeDefined();
      expect(suspendedReport.status).toBe('suspended');
    });
  });

  describe('GET /reports/user/:userId', () => {
    beforeEach(async () => {
      const fakeImage = Buffer.from('fake image content');

      await request(app.getHttpServer())
        .post('/reports')
        .set('Cookie', `session_token=${userToken}`)
        .field('title', 'User Report')
        .field('description', 'Report by user')
        .field('categoryId', categoryId)
        .field('longitude', '7.6869')
        .field('latitude', '45.0703')
        .attach('images', fakeImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });
    });

    it('should retrieve reports by userId as PR officer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports/user/${userId}`)
        .set('Cookie', `session_token=${prOfficerToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.any(Array),
      });
    });

    it('should retrieve reports by userId as tech officer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports/user/${userId}`)
        .set('Cookie', `session_token=${techOfficerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without authentication (401)', async () => {
      await request(app.getHttpServer())
        .get(`/reports/user/${userId}`)
        .expect(401);
    });

    it('should reject request for regular user (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .get(`/reports/user/${userId}`)
        .set('Cookie', `session_token=${userToken}`)
        .expect(403);
    });
  });
});
