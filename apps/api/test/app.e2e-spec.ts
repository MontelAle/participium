import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { describe, it, beforeEach } from '@jest/globals';
import request from 'supertest';
import { AppModule } from './../src/app.module';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST) - should register a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('session');
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('/auth/login (POST) - should login a user', async () => {
    // First, register the user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'login@example.com',
        username: 'loginuser',
        firstName: 'Login',
        lastName: 'User',
        password: 'password123',
      })
      .expect(201);

    // Then, login
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'loginuser',
        password: 'password123',
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('session');
    expect(res.body.user.username).toBe('loginuser');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('/protected (GET) - should deny access without session cookie', async () => {
    await request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('/protected (GET) - should allow access with session cookie', async () => {
    // Register and login to get session cookie
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'protected@example.com',
        username: 'protecteduser',
        firstName: 'Protected',
        lastName: 'User',
        password: 'password123',
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'protecteduser',
        password: 'password123',
      })
      .expect(201);

    const cookie = loginRes.headers['set-cookie'];

    const res = await request(app.getHttpServer())
      .get('/protected')
      .set('Cookie', cookie)
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('protecteduser');
  });
});
