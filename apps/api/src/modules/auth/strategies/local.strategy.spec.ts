import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-id',
}));

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      };

      (authService.validateUser as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      const result = await strategy.validate('testuser', 'password123');

      expect(authService.validateUser).toHaveBeenCalledWith(
        'testuser',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('wrong_username', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(authService.validateUser).toHaveBeenCalledWith(
        'wrong_username',
        'wrongpassword',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('nonexistent_user', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('testuser', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle authService errors gracefully', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(
        strategy.validate('testuser', 'password123'),
      ).rejects.toThrow(Error);
    });
  });
});
