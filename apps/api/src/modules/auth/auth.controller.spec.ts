import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginDto, RegisterDto } from '../../common/dto/auth.dto';
import { Profile } from '../../common/entities/profile.entity';
import { Session } from '../../common/entities/session.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './guards/session-auth.guard';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = { id: 1, username: 'testuser' };
  const mockSession = { id: 123, userId: 1 };
  const mockToken = 'session-token';
  const mockCookie = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  };
  const mockLoginResult = {
    user: mockUser,
    session: mockSession,
    token: mockToken,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockLoginResult),
            register: jest.fn().mockResolvedValue({ user: mockUser }),
            logout: jest.fn().mockResolvedValue(undefined),
            getCookieOptions: jest.fn().mockReturnValue(mockCookie),
            refreshSession: jest
              .fn()
              .mockResolvedValue({ session: mockSession }),
          },
        },
        {
          provide: SessionGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Profile),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login, getCookieOptions, and set cookie', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password',
      };
      const req: any = {
        user: mockUser,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const res: any = { cookie: jest.fn() };

      const result = await controller.login(loginDto, req, res);

      expect(authService.login).toHaveBeenCalledWith(
        req.user,
        req.ip,
        req.headers['user-agent'],
      );
      expect(authService.getCookieOptions).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'session_token',
        mockToken,
        mockCookie,
      );
      expect(result).toEqual({
        success: true,
        data: { user: mockUser, session: mockSession },
      });
    });

    it('should throw UnauthorizedException when req.user is not present', async () => {
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password',
      };
      const req: any = {
        user: null,
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const res: any = { cookie: jest.fn() };

      await expect(controller.login(loginDto, req, res)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.login).not.toHaveBeenCalled();
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('create (register)', () => {
    it('should call authService.register, login, getCookieOptions, then set cookie', async () => {
      const registerDto: RegisterDto = {
        email: 'alice@example.com',
        username: 'alice',
        firstName: 'alice',
        lastName: 'smith',
        password: 'password',
      };
      const req: any = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'jest' },
      };
      const res: any = { cookie: jest.fn() };

      (authService.login as jest.Mock).mockResolvedValueOnce(mockLoginResult);

      const result = await controller.create(registerDto, req, res);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        req.ip,
        req.headers['user-agent'],
      );
      expect(authService.getCookieOptions).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'session_token',
        mockToken,
        mockCookie,
      );
      expect(result).toEqual({
        success: true,
        data: { user: mockUser, session: mockSession },
      });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear cookie', async () => {
      const req: any = {
        cookies: { session_token: 'session-token' },
      };
      const res: any = { clearCookie: jest.fn() };

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('session-token');
      expect(res.clearCookie).toHaveBeenCalledWith('session_token');
      expect(result).toEqual({ success: true });
    });

    it('should clear cookie even if no session token is present', async () => {
      const req: any = {
        cookies: {},
      };
      const res: any = { clearCookie: jest.fn() };

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith(undefined);
      expect(res.clearCookie).toHaveBeenCalledWith('session_token');
      expect(result).toEqual({ success: true });
    });
  });

  describe('refresh', () => {
    it('should update session, set cookie, and return user/session', async () => {
      const mockSession = {
        id: 'session-id',
        updatedAt: new Date(),
        expiresAt: new Date(),
      };
      const mockUser = { id: 1, username: 'testuser' };
      const mockCookie = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000,
      };
      const req: any = {
        user: mockUser,
        session: mockSession,
        cookies: { session_token: 'session-id.secret' },
      };
      const res: any = { cookie: jest.fn() };

      (authService.refreshSession as jest.Mock).mockResolvedValueOnce({
        session: mockSession,
      });

      const result = await controller.refresh(req, res);

      expect(authService.refreshSession).toHaveBeenCalledWith(mockSession);
      expect(authService.getCookieOptions).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'session_token',
        req.cookies.session_token,
        mockCookie,
      );
      expect(result).toEqual({
        success: true,
        data: { user: mockUser, session: mockSession },
      });
    });
  });
});
