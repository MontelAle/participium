import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Account, RegisterDto, Session, Role } from '@repo/api';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

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
          'session.expiresInSeconds': 60 * 60,
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

      const mockRole = { id: 'mocked-id', name: 'user' };
      const savedUser = { id: 'mocked-id', ...dto, role: mockRole };
      const savedAccount = {
        id: 'mocked-id',
        accountId: dto.email,
        providerId: 'local',
        userId: savedUser.id,
        password: 'hashed',
        user: savedUser,
      };

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Role) {
            return {
              findOne: jest.fn().mockResolvedValue(mockRole),
              create: jest.fn().mockReturnValue(mockRole),
              save: jest.fn().mockResolvedValue(mockRole),
            };
          }
          if (entity === User) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockReturnValue(savedUser),
              save: jest.fn().mockResolvedValue(savedUser),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockReturnValue(savedAccount),
              save: jest.fn().mockResolvedValue(savedAccount),
            };
          }
        }),
      };

      userRepository.manager.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const result = await service.register(dto);
      expect(result).toEqual({ user: savedUser });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });

    it('should throw ConflictException when user exists with same email and local account', async () => {
      const dto: RegisterDto = {
        email: 'existing@example.com',
        username: 'existinguser',
        firstName: 'Existing',
        lastName: 'User',
        password: 'password',
      };

      const mockRole = { id: 'role-id', name: 'user' };
      const existingUser = {
        id: 'existing-user-id',
        email: dto.email,
        username: 'oldusername',
        firstName: 'Old',
        lastName: 'Name',
        role: mockRole,
      };
      const existingAccount = {
        id: 'existing-account-id',
        accountId: dto.email,
        providerId: 'local',
        userId: existingUser.id,
        password: 'oldhashed',
      };

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Role) {
            return {
              findOne: jest.fn().mockResolvedValue(mockRole),
            };
          }
          if (entity === User) {
            return {
              findOne: jest.fn().mockResolvedValue(existingUser),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(existingAccount),
            };
          }
        }),
      };

      userRepository.manager.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      await expect(service.register(dto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should create user role automatically if it does not exist', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password',
      };

      const createdRole = { id: 'mocked-id', name: 'user' };
      const savedUser = { id: 'mocked-id', ...dto, role: createdRole };
      const savedAccount = {
        id: 'mocked-id',
        accountId: dto.email,
        providerId: 'local',
        userId: savedUser.id,
        password: 'hashed',
        user: savedUser,
      };

      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');

      const roleCreateSpy = jest.fn().mockReturnValue(createdRole);
      const roleSaveSpy = jest.fn().mockResolvedValue(createdRole);

      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Role) {
            return {
              findOne: jest.fn().mockResolvedValue(null), // Role doesn't exist
              create: roleCreateSpy,
              save: roleSaveSpy,
            };
          }
          if (entity === User) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockReturnValue(savedUser),
              save: jest.fn().mockResolvedValue(savedUser),
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockReturnValue(savedAccount),
              save: jest.fn().mockResolvedValue(savedAccount),
            };
          }
        }),
      };

      userRepository.manager.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const result = await service.register(dto);

      expect(result).toEqual({ user: savedUser });
      expect(roleCreateSpy).toHaveBeenCalledWith({
        id: 'mocked-id',
        name: 'user',
      });
      expect(roleSaveSpy).toHaveBeenCalledWith(createdRole);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
    });
    it('should create local account for existing user without local account', async () => {
      const dto: RegisterDto = {
        email: 'existing@example.com',
        username: 'existinguser',
        firstName: 'Existing',
        lastName: 'User',
        password: 'password',
      };
    
      const mockRole = { id: 'role-id', name: 'user' };
      const existingUser = {
        id: 'existing-user-id',
        email: dto.email,
        username: 'existingusername',
        firstName: 'Existing',
        lastName: 'User',
        role: mockRole,
      };
    
      const newAccount = {
        id: 'mocked-id',
        accountId: dto.email,
        providerId: 'local',
        userId: existingUser.id,
        password: 'hashed',
        user: existingUser,
      };
    
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');
    
      const accountCreateSpy = jest.fn().mockReturnValue(newAccount);
      const accountSaveSpy = jest.fn().mockResolvedValue(newAccount);
    
      const mockManager = {
        getRepository: jest.fn((entity) => {
          if (entity === Role) {
            return {
              findOne: jest.fn().mockResolvedValue(mockRole),
            };
          }
          if (entity === User) {
            return {
              findOne: jest.fn().mockResolvedValue(existingUser), // User exists
            };
          }
          if (entity === Account) {
            return {
              findOne: jest.fn().mockResolvedValue(null), // But no local account
              create: accountCreateSpy,
              save: accountSaveSpy,
            };
          }
        }),
      };
    
      userRepository.manager.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });
    
      const result = await service.register(dto);
    
      expect(result).toEqual({ user: existingUser });
      expect(accountCreateSpy).toHaveBeenCalledWith({
        id: 'mocked-id',
        accountId: dto.email,
        providerId: 'local',
        userId: existingUser.id,
        password: 'hashed',
        user: existingUser,
      });
      expect(accountSaveSpy).toHaveBeenCalledWith(newAccount);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
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
      const secret = 'mocked-id'; // nanoid is mocked
      const hashedSecret = createHash('sha256').update(secret).digest('hex');
      const session = { id: 'mocked-id', userId: user.id, hashedSecret };
      sessionRepository.create.mockReturnValue(session);
      sessionRepository.save.mockResolvedValue(session);

      const result = await service.login(user, '127.0.0.1', 'jest');
      expect(sessionRepository.create).toHaveBeenCalled();
      expect(sessionRepository.save).toHaveBeenCalledWith(session);
      expect(result).toHaveProperty('user', user);
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('token', `${session.id}.${secret}`);
    });
  });

  describe('getCookieOptions', () => {
    it('should return cookie settings based on config', () => {
      const options = service.getCookieOptions();
      expect(options).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 1000,
      });
    });
  });

  describe('logout', () => {
    it('should find and remove session from database', async () => {
      const secret = 'mocked-id';
      const sessionToken = `session-id.${secret}`;
      const session = {
        id: 'session-id',
        hashedSecret: createHash('sha256').update(secret).digest('hex'),
        userId: 'user-id',
      };

      sessionRepository.findOne.mockResolvedValue(session);
      sessionRepository.remove.mockResolvedValue(session);

      const result = await service.logout(sessionToken);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-id' },
      });
      expect(sessionRepository.remove).toHaveBeenCalledWith(session);
      expect(result).toBeUndefined();
    });

    it('should not fail if session does not exist', async () => {
      const sessionToken = 'non-existent-id.mocked-id';

      sessionRepository.findOne.mockResolvedValue(null);

      const result = await service.logout(sessionToken);

      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(sessionRepository.remove).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    describe('refreshSession', () => {
      it('should update expiresAt and save the session', async () => {
        const oldDate = new Date('2025-01-01T10:00:00Z');
        const session: any = { id: 'session-id', expiresAt: oldDate };

        sessionRepository.save.mockResolvedValue(session);

        const result = await service.refreshSession(session);

        expect(session.expiresAt.getTime()).toBeGreaterThan(oldDate.getTime());
        expect(sessionRepository.save).toHaveBeenCalledWith(session);
        expect(result).toEqual({ session: expect.any(Object) });
      });
    });
  });
});
