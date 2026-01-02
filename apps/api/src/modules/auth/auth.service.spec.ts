import { Account, Profile, Role, Session, User } from '@entities';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { OtpService } from './otp.service';

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

  let emailService: any;
  let otpService: any;
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

    emailService = { sendVerificationEmail: jest.fn() };
    otpService = {
      generateVerificationCode: jest.fn().mockReturnValue('123456'),
      generateCodeExpiry: jest.fn().mockReturnValue(new Date()),
      isCodeExpired: jest.fn(),
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
        { provide: EmailService, useValue: emailService },
        { provide: OtpService, useValue: otpService },
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

    it('should successfully register a new user, send email, and return message', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');

      const mockRole = { id: 'role-id', name: 'user' };

      const createdUser = {
        ...dto,
        id: 'mocked-id',
        role: mockRole,
        isEmailVerified: false,
        emailVerificationCode: '123456',
      };

      const createdProfile = { id: 'mocked-id', userId: 'mocked-id' };
      const createdAccount = { id: 'mocked-id', providerId: 'local' };

      mockEntityManager.getRepository.mockImplementation((entity: any) => {
        if (entity === Role)
          return { findOne: jest.fn().mockResolvedValue(mockRole) };
        if (entity === User)
          return {
            create: jest.fn().mockReturnValue(createdUser),
            save: jest.fn().mockResolvedValue(createdUser),
          };
        if (entity === Profile)
          return {
            create: jest.fn().mockReturnValue(createdProfile),
            save: jest.fn().mockResolvedValue(createdProfile),
          };
        if (entity === Account)
          return {
            create: jest.fn().mockReturnValue(createdAccount),
            save: jest.fn().mockResolvedValue(createdAccount),
          };
        throw new Error(`Unexpected entity repository request: ${entity.name}`);
      });

      const result = await service.register(dto);

      expect(result).toEqual({
        message:
          'Registration successful. Please check your email for the verification code.',
      });

      expect(userRepository.manager.transaction).toHaveBeenCalled();

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        '123456',
      );
    });
  });

  describe('verifyEmail', () => {
    const email = 'test@test.com';
    const code = '123456';
    let mockUser: any;

    beforeEach(() => {
      mockUser = {
        id: 'u1',
        email,
        isEmailVerified: false,
        emailVerificationCode: '123456',
        emailVerificationCodeExpiry: new Date(Date.now() + 10000),
        save: jest.fn(),
      };
    });

    it('should throw ConflictException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail(email, code)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if already verified', async () => {
      mockUser.isEmailVerified = true;
      userRepository.findOne.mockResolvedValue(mockUser);
      await expect(service.verifyEmail(email, code)).rejects.toThrow(
        'Email already verified',
      );
    });

    it('should throw ConflictException if verification code is missing on user entity', async () => {
      mockUser.emailVerificationCode = null;
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.verifyEmail(email, code)).rejects.toThrow(
        'No verification code found',
      );
    });

    it('should throw ConflictException if code expired', async () => {
      otpService.isCodeExpired.mockReturnValue(true);
      userRepository.findOne.mockResolvedValue(mockUser);
      await expect(service.verifyEmail(email, code)).rejects.toThrow(
        'Verification code has expired',
      );
    });

    it('should throw ConflictException if code matches but is wrong', async () => {
      otpService.isCodeExpired.mockReturnValue(false);
      mockUser.emailVerificationCode = '999999';
      userRepository.findOne.mockResolvedValue(mockUser);
      await expect(service.verifyEmail(email, code)).rejects.toThrow(
        'Invalid verification code',
      );
    });

    it('should verify user and clear codes on success', async () => {
      otpService.isCodeExpired.mockReturnValue(false);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.verifyEmail(email, code);

      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.emailVerificationCode).toBeNull();
      expect(mockUser.emailVerificationCodeExpiry).toBeNull();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ user: mockUser });
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
