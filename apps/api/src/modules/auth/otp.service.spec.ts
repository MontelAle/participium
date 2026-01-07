import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpService],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should generate a 6-digit code', () => {
    const code = service.generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate an expiry date 30 minutes in the future', () => {
    const now = new Date();
    const expiry = service.generateCodeExpiry();
    const diffMinutes = (expiry.getTime() - now.getTime()) / 1000 / 60;
    expect(diffMinutes).toBeCloseTo(30, 0);
  });

  it('should return true if code is expired', () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(service.isCodeExpired(pastDate)).toBe(true);
  });

  it('should return false if code is valid', () => {
    const futureDate = new Date(Date.now() + 10000);
    expect(service.isCodeExpired(futureDate)).toBe(false);
  });
});
