import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { RegisterDto } from '../../common/dto/auth.dto';
import { Account } from '../../common/entities/account.entity';
import { Profile } from '../../common/entities/profile.entity';
import { Role } from '../../common/entities/role.entity';
import { Session } from '../../common/entities/session.entity';
import { User } from '../../common/entities/user.entity';
import { AuthService } from './auth.service';

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

  let mockEntityManager: any;

  beforeEach(async () => {
    mockEntityManager = {
      getRepository: jest.fn(),
    };

    userRepository = {
      manager: {
        transaction: jest.fn((cb) => cb(mockEntityManager)),
      },
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    accountRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    sessionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const roleRepository = { findOne: jest.fn() };
    const profileRepository = { create: jest.fn(), save: jest.fn() };

    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'cookie.httpOnly': true,
          'cookie.sameSite': 'lax',
          'cookie.secure': true,
          'session.expiresInSeconds': 3600,
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
        { provide: getRepositoryToken(Profile), useValue: profileRepository },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return null if account not found', async () => {
      accountRepository.findOne.mockResolvedValue(null);
      const result = await service.validateUser('user', 'pass');
      expect(result).toBeNull();
    });

    it('should return null if password invalid', async () => {
      accountRepository.findOne.mockResolvedValue({ password: 'hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser('user', 'wrong');
      expect(result).toBeNull();
    });

    it('should return user if valid', async () => {
      const user = { id: 'u1' };
      accountRepository.findOne.mockResolvedValue({ password: 'hash', user });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('user', 'pass');
      expect(result).toEqual({ user });
    });
  });

  describe('register', () => {
    const dto: RegisterDto = {
      email: 'new@test.com',
      username: 'newuser',
      firstName: 'New',
      lastName: 'User',
      password: 'password123',
    };

    it('should throw ConflictException if user already exists (Pre-transaction check)', async () => {
      userRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);

      expect(userRepository.manager.transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException inside transaction if Role not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');

      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Role)
          return { findOne: jest.fn().mockResolvedValue(null) };
        return { create: jest.fn(), save: jest.fn() };
      });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(userRepository.manager.transaction).toHaveBeenCalled();
    });

    it('should successfully register a new user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');

      const mockRole = { id: 'role-id', name: 'user' };
      const createdUser = { ...dto, id: 'mocked-id', role: mockRole };
      const createdProfile = { id: 'mocked-id', userId: 'mocked-id' };
      const createdAccount = { id: 'mocked-id', providerId: 'local' };

      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Role) {
          return { findOne: jest.fn().mockResolvedValue(mockRole) };
        }
        if (entity === User) {
          return {
            create: jest.fn().mockReturnValue(createdUser),
            save: jest.fn().mockResolvedValue(createdUser),
          };
        }
        if (entity === Profile) {
          return {
            create: jest.fn().mockReturnValue(createdProfile),
            save: jest.fn().mockResolvedValue(createdProfile),
          };
        }
        if (entity === Account) {
          return {
            create: jest.fn().mockReturnValue(createdAccount),
            save: jest.fn().mockResolvedValue(createdAccount),
          };
        }
        throw new Error(`Unexpected entity repository request: ${entity.name}`);
      });

      const result = await service.register(dto);

      expect(result).toEqual({ user: createdUser });
      expect(userRepository.manager.transaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('login', () => {
    it('should create session and return token', async () => {
      const user: any = { id: 'u1' };
      sessionRepository.create.mockReturnValue({ id: 's1' });
      sessionRepository.save.mockResolvedValue({ id: 's1' });

      const result = await service.login(user, '127.0.0.1', 'agent');

      expect(sessionRepository.create).toHaveBeenCalled();
      expect(result.token).toContain('s1.');
      expect(result.user).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should remove session if found', async () => {
      sessionRepository.findOne.mockResolvedValue({ id: 's1' });
      await service.logout('s1.secret');
      expect(sessionRepository.remove).toHaveBeenCalled();
    });

    it('should do nothing if session not found', async () => {
      sessionRepository.findOne.mockResolvedValue(null);
      await service.logout('s1.secret');
      expect(sessionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('refreshSession', () => {
    it('should update expiresAt', async () => {
      const session: any = { expiresAt: new Date() };
      await service.refreshSession(session);
      expect(sessionRepository.save).toHaveBeenCalledWith(session);
    });
  });

  describe('getCookieOptions', () => {
    it('should return correct options', () => {
      const opts = service.getCookieOptions();
      expect(opts).toHaveProperty('httpOnly', true);
      expect(opts).toHaveProperty('maxAge', 3600000);
    });
  });
});
