import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';

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

      const result = await strategy.validate('test@example.com', 'password123');

      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('wrong@example.com', 'wrongpassword'),
      ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));

      expect(authService.validateUser).toHaveBeenCalledWith(
        'wrong@example.com',
        'wrongpassword',
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        strategy.validate('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle authService errors gracefully', async () => {
      (authService.validateUser as jest.Mock).mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(
        strategy.validate('test@example.com', 'password123'),
      ).rejects.toThrow('Database connection error');
    });
  });
});
