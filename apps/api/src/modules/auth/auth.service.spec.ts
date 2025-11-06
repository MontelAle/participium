import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Account, RegisterDto, Session, Role } from '@repo/api';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { create } from 'domain';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let accountRepository: any;
  let sessionRepository: any;
  let configService: any;
  let roleRepository: any;

  beforeEach(async () => {
    userRepository = {
      manager: {
        transaction: jest.fn(),
      },
      create: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
    };
    accountRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn().mockReturnThis(),
    };
    sessionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    roleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        const config = {
          'cookie.httpOnly': true,
          'cookie.sameSite': 'lax',
          'cookie.secure': true,
          'session.expires': 1000 * 60 * 60,
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Account), useValue: accountRepository },
        { provide: getRepositoryToken(Session), useValue: sessionRepository },
        { provide: getRepositoryToken(Role), useValue: roleRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if account not found', async () => {
      accountRepository.findOne.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      accountRepository.findOne.mockResolvedValue({
        password: 'hashed',
        user: {},
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should return user if credentials are valid', async () => {
      const user = { id: 1 };
      accountRepository.findOne.mockResolvedValue({ password: 'hashed', user });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ user });
    });
  });

  describe('register', () => {
    it('should create and save user and account', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password',
      };
      const savedUser = { id: 'mocked-id', ...dto };
      const savedAccount = {
        id: 'mocked-id',
        accountId: dto.email,
        user: savedUser,
      };

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);
      accountRepository.create.mockReturnValue(savedAccount);
      accountRepository.save.mockResolvedValue(savedAccount);

      userRepository.manager.transaction.mockImplementation(async (cb: any) => {
        return cb({
          getRepository: () => ({
            create: userRepository.create,
            save: userRepository.save,
            findOne: roleRepository.findOne,
          }),
        });
      });

      const result = await service.register(dto);
      expect(result).toEqual({ user: savedUser });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should create and save session, return user, session, and cookie', async () => {
      const user: any = {
        id: 'user-id',
        email: 'user@example.com',
        username: 'username',
        firstName: 'First',
        lastName: 'Last',
      };
      const session = { id: 'mocked-id', userId: user.id, token: 'mocked-id' };
      sessionRepository.create.mockReturnValue(session);
      sessionRepository.save.mockResolvedValue(session);

      const result = await service.login(user, '127.0.0.1', 'jest');
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalledWith(session);
      expect(result).toHaveProperty('user', user);
      expect(result).toHaveProperty('session', session);
      expect(result.cookie).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 1000 * 60 * 60,
      });
    });
  });

  describe('logout', () => {
    it('should find and remove session from database', async () => {
      const sessionToken = 'test-token';
      const session = {
        id: 'session-id',
        token: sessionToken,
        userId: 'user-id',
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.remove.mockResolvedValue(session);

      const result = await service.logout(sessionToken);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { token: sessionToken },
      });
      expect(sessionRepository.remove).toHaveBeenCalledWith(session);
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should not fail if session does not exist', async () => {
      const sessionToken = 'non-existent-token';

      sessionRepository.findOne.mockResolvedValue(null);

      const result = await service.logout(sessionToken);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { token: sessionToken },
      });
      expect(sessionRepository.remove).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
