import { Session, User } from '@entities';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionGuard } from './session-auth.guard';

type MockRepository<T = any> = {
  findOne: jest.Mock;
};

describe('SessionGuard', () => {
  let guard: SessionGuard;
  let sessionRepository: MockRepository<Session>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionGuard,
        {
          provide: getRepositoryToken(Session),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'cookie.name') return 'session_token';
              if (key === 'session.expiresInSeconds') return 3600;
              return null;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<SessionGuard>(SessionGuard);
    sessionRepository = module.get(
      getRepositoryToken(Session),
    ) as unknown as MockRepository<Session>;
  });

  const mockExecutionContext = (cookies?: Record<string, string>) => {
    const req: any = {
      cookies,
      user: null,
      session: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      req,
    } as unknown as any;
  };

  it('should throw UnauthorizedException if no session token', async () => {
    const context = mockExecutionContext();
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('No session token'),
    );
  });

  it('should throw UnauthorizedException if session token format is invalid', async () => {
    const context = mockExecutionContext({ session_token: 'invalid-format' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid session token format'),
    );
  });

  it('should throw UnauthorizedException if session not found', async () => {
    sessionRepository.findOne.mockResolvedValue(null);

    const context = mockExecutionContext({
      session_token: 'sessionId.secret123',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired session'),
    );
  });

  it('should throw UnauthorizedException if session expired', async () => {
    const expiredSession: Partial<Session> = {
      id: 'sessionId',
      hashedSecret: 'somehash',
      expiresAt: new Date(Date.now() + 10000),
      updatedAt: new Date(Date.now() - 3700000),
      user: { id: 'user1', role: { name: 'admin' } } as User,
    };
    sessionRepository.findOne.mockResolvedValue(expiredSession);

    const context = mockExecutionContext({
      session_token: 'sessionId.secret123',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired session'),
    );
  });

  it('should throw UnauthorizedException if session secret is invalid', async () => {
    const validSession: Partial<Session> = {
      id: 'sessionId',
      hashedSecret: 'correcthash',
      expiresAt: new Date(Date.now() + 10000),
      updatedAt: new Date(),
      user: { id: 'user1', role: { name: 'admin' } } as User,
    };
    sessionRepository.findOne.mockResolvedValue(validSession);

    const context = mockExecutionContext({
      session_token: 'sessionId.wrongsecret',
    });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid session secret'),
    );
  });

  it('should allow access and attach user and session if session is valid', async () => {
    const crypto = require('node:crypto');
    const correctHash = crypto
      .createHash('sha256')
      .update('secret123')
      .digest('hex');

    const expectedUser = { id: 'user1', role: { name: 'admin' } } as User;
    const validSession: Partial<Session> = {
      id: 'sessionId',
      hashedSecret: correctHash,
      expiresAt: new Date(Date.now() + 10000),
      updatedAt: new Date(),
      user: expectedUser,
    };
    sessionRepository.findOne.mockResolvedValue(validSession);

    const context = mockExecutionContext({
      session_token: 'sessionId.secret123',
    });
    const req = context.req;

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.user).toEqual(expectedUser);
    expect(req.session).toEqual({ ...validSession, user: undefined });
  });
});
