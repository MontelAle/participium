import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, Session } from '@repo/api';
import { SessionGuard } from './guards/session-auth.guard';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = { id: 1, username: 'testuser' };
  const mockSession = { token: 'session-token' };
  const mockCookie = { httpOnly: true };
  const mockLoginResult = {
    user: mockUser,
    session: mockSession,
    cookie: mockCookie,
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
            logout: jest.fn().mockResolvedValue({ message: 'Logout successful' }),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and set cookie', async () => {
      const loginDto: LoginDto = {
        email: 'testuser@example.com',
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
      expect(res.cookie).toHaveBeenCalledWith(
        'session_cookie',
        mockSession.token,
        mockCookie,
      );
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });
  });

  describe('create (register)', () => {
    it('should call authService.register and login, then set cookie', async () => {
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

      // Mock login to return session/cookie for the new user
      (authService.login as jest.Mock).mockResolvedValueOnce(mockLoginResult);

      const result = await controller.create(registerDto, req, res);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.login).toHaveBeenCalledWith(
        mockUser,
        req.ip,
        req.headers['user-agent'],
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'session_cookie',
        mockSession.token,
        mockCookie,
      );
      expect(result).toEqual({ user: mockUser, session: mockSession });
    });
  });

  describe('logout', () => {
    it('should call authService.logout and clear cookie', async () => {
      const req: any = {
        cookies: { session_cookie: 'session-token' },
      };
      const res: any = { clearCookie: jest.fn() };

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('session-token');
      expect(res.clearCookie).toHaveBeenCalledWith('session_cookie');
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should clear cookie even if no session token is present', async () => {
      const req: any = {
        cookies: {},
      };
      const res: any = { clearCookie: jest.fn() };

      const result = await controller.logout(req, res);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('session_cookie');
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
