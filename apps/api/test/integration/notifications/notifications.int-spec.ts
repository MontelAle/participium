// Mock nanoid before any imports that use it
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id-' + Math.random().toString(36).substring(7),
}));

import { Notification, Role, User } from '@entities';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import appConfig from '../../../src/config/app.config';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { NotificationsModule } from '../../../src/modules/notifications/notifications.module';
import { setupTestDB, TypeOrmTestModule } from '../test-helpers';

const request = require('supertest');

describe('NotificationsController (Integration)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await setupTestDB();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
        TypeOrmTestModule(container),
        AuthModule,
        NotificationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
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

  beforeEach(async () => {
    // Ensure default user role exists for registration
    const roleRepo = dataSource.getRepository(Role);
    const existing = await roleRepo.findOne({ where: { name: 'user' } });
    if (!existing) {
      const userRole = roleRepo.create({
        id: 'user-role-id',
        name: 'user',
        label: 'User',
        isMunicipal: false,
      });
      await roleRepo.save(userRole);
    }
  });

  afterEach(async () => {
    // Clean up data between tests
    await dataSource.query('TRUNCATE TABLE "notification" CASCADE');
    await dataSource.query('TRUNCATE TABLE "session" CASCADE');
    await dataSource.query('TRUNCATE TABLE "account" CASCADE');
    await dataSource.query('TRUNCATE TABLE "profile" CASCADE');
    await dataSource.query('TRUNCATE TABLE "user" CASCADE');
    await dataSource.query('TRUNCATE TABLE "role" CASCADE');
  });

  it('GET /notifications returns notifications for the authenticated user', async () => {
    // Register a user and get session cookie
    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notify1@example.com',
      username: 'notifyuser1',
      firstName: 'Notify',
      lastName: 'User',
      password: 'NotifyPassword123!',
    });

    const cookies = registerRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find((c: string) => c.startsWith('session_token='));
    const sessionToken = sessionCookie.split(';')[0].split('=')[1];

    const user = await dataSource.getRepository(User).findOne({ where: { username: 'notifyuser1' } });
    expect(user).toBeDefined();

    // Create notifications for this user and another user
    const notifRepo = dataSource.getRepository(Notification);
    const n1 = notifRepo.create({ userId: user.id, type: 'info', message: 'One', read: false });
    const n2 = notifRepo.create({ userId: user.id, type: 'info', message: 'Two', read: true });
    await notifRepo.save([n1, n2]);

    // Other user's notification
    const otherUser = dataSource.getRepository(User).create({ username: 'other', email: 'o@example.com' });
    otherUser.id = 'other-user-id';
    await dataSource.getRepository(User).save(otherUser);
    const otherNotif = notifRepo.create({ userId: otherUser.id, type: 'info', message: 'Other', read: false });
    await notifRepo.save(otherNotif);

    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Cookie', `session_token=${sessionToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    // only the two notifications belonging to user
    expect(res.body.data).toHaveLength(2);
    const messages = res.body.data.map((d: any) => d.message);
    expect(messages).toEqual(expect.arrayContaining(['One', 'Two']));
  });

  it('GET /notifications?unread=1 returns only unread notifications', async () => {
    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notify2@example.com',
      username: 'notifyuser2',
      firstName: 'Notify',
      lastName: 'User',
      password: 'NotifyPassword123!',
    });
    const cookies = registerRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c: string) => c.startsWith('session_token='));
    const sessionToken = sessionCookie.split(';')[0].split('=')[1];

    const user = await dataSource.getRepository(User).findOne({ where: { username: 'notifyuser2' } });

    const notifRepo = dataSource.getRepository(Notification);
    const n1 = notifRepo.create({ userId: user.id, type: 'info', message: 'Unread', read: false });
    const n2 = notifRepo.create({ userId: user.id, type: 'info', message: 'Read', read: true });
    await notifRepo.save([n1, n2]);

    const res = await request(app.getHttpServer())
      .get('/notifications')
      .query({ unread: '1' })
      .set('Cookie', `session_token=${sessionToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].message).toBe('Unread');
  });

  it('PATCH /notifications/:id/read marks a notification as read and returns it', async () => {
    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notify3@example.com',
      username: 'notifyuser3',
      firstName: 'Notify',
      lastName: 'User',
      password: 'NotifyPassword123!',
    });
    const cookies = registerRes.headers['set-cookie'];
    const sessionCookie = cookies.find((c: string) => c.startsWith('session_token='));
    const sessionToken = sessionCookie.split(';')[0].split('=')[1];

    const user = await dataSource.getRepository(User).findOne({ where: { username: 'notifyuser3' } });

    const notifRepo = dataSource.getRepository(Notification);
    const n = notifRepo.create({ userId: user.id, type: 'info', message: 'ToMark', read: false });
    const saved = await notifRepo.save(n);

    const res = await request(app.getHttpServer())
      .patch(`/notifications/${saved.id}/read`)
      .set('Cookie', `session_token=${sessionToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);

    const fromDb = await notifRepo.findOne({ where: { id: saved.id } });
    expect(fromDb.read).toBe(true);
  });

  it('PATCH /notifications/:id/read for another user returns 404', async () => {
    // Register first user
    const r1 = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notify4a@example.com',
      username: 'notifyuser4a',
      firstName: 'Notify',
      lastName: 'User',
      password: 'NotifyPassword123!',
    });
    const cookie1 = r1.headers['set-cookie'].find((c: string) => c.startsWith('session_token='));
    const token1 = cookie1.split(';')[0].split('=')[1];

    // Register second user
    const r2 = await request(app.getHttpServer()).post('/auth/register').send({
      email: 'notify4b@example.com',
      username: 'notifyuser4b',
      firstName: 'Notify',
      lastName: 'User',
      password: 'NotifyPassword123!',
    });
    const user2 = await dataSource.getRepository(User).findOne({ where: { username: 'notifyuser4b' } });

    const notifRepo = dataSource.getRepository(Notification);
    const other = notifRepo.create({ userId: user2.id, type: 'info', message: 'OtherUserNotif', read: false });
    const saved = await notifRepo.save(other);

    // Try to mark second user's notification using first user's session
    await request(app.getHttpServer())
      .patch(`/notifications/${saved.id}/read`)
      .set('Cookie', `session_token=${token1}`)
      .expect(404);
  });
});
