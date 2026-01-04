import { Injectable } from '@nestjs/common';
import { TOTP } from 'otpauth';

@Injectable()
export class OtpService {
  generateVerificationCode(): string {
    const totp = new TOTP({
      issuer: 'Participium',
      label: 'Email Verification',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    return totp.generate();
  }

  generateCodeExpiry(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);
    return expiry;
  }

  isCodeExpired(expiry: Date): boolean {
    return new Date() > expiry;
  }
}
