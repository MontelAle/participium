import { SessionGuard } from './session-auth.guard';
import { Repository } from 'typeorm';
import { Session, User } from '@repo/api';
import { UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

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
      ],
    }).compile();

    guard = module.get<SessionGuard>(SessionGuard);
    sessionRepository = module.get(getRepositoryToken(Session)) as unknown as MockRepository<Session>;
  });

  // Mock dell'ExecutionContext con req persistente
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
      req, // export del req per poterlo verificare nel test
    } as unknown as any;
  };

  it('should throw UnauthorizedException if no session token', async () => {
    const context = mockExecutionContext();
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if session not found', async () => {
    sessionRepository.findOne.mockResolvedValue(null);

    const context = mockExecutionContext({ session_token: 'token123' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if session expired', async () => {
    const expiredSession: Partial<Session> = {
      token: 'token123',
      expiresAt: new Date(Date.now() - 1000), // scaduta
      user: { id: 'user1', role: { name: 'admin' } } as User,
    };
    sessionRepository.findOne.mockResolvedValue(expiredSession);

    const context = mockExecutionContext({ session_token: 'token123' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access and attach user and session if session is valid', async () => {
    const validSession: Partial<Session> = {
      token: 'token123',
      expiresAt: new Date(Date.now() + 10000), // valida
      user: { id: 'user1', role: { name: 'admin' } } as User,
    };
    sessionRepository.findOne.mockResolvedValue(validSession);

    const context = mockExecutionContext({ session_token: 'token123' });
    const req = context.req; // prendi il req reale modificato dal guard

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(req.user).toEqual(validSession.user);
    expect(req.session).toEqual(validSession);
  });
});
