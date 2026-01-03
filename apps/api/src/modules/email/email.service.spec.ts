import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: any;
  let sendMailMock: jest.Mock;

  const mockConfigData: Record<string, any> = {
    'email.host': 'smtp.test.com',
    'email.port': 587,
    'email.secure': false,
    'email.user': 'testuser',
    'email.password': 'testpass',
    'email.from': 'no-reply@participium.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    sendMailMock = (nodemailer.createTransport() as any).sendMail;

    configService = {
      get: jest.fn((key: string) => mockConfigData[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: mockConfigData['email.host'],
        port: mockConfigData['email.port'],
        secure: mockConfigData['email.secure'],
        auth: {
          user: mockConfigData['email.user'],
          pass: mockConfigData['email.password'],
        },
      });
      expect(configService.get).toHaveBeenCalledWith('email.from');
    });
  });

  describe('sendVerificationEmail', () => {
    const email = 'user@example.com';
    const code = '123456';

    it('should send email successfully and log info', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      sendMailMock.mockResolvedValue(true);

      await service.sendVerificationEmail(email, code);

      expect(sendMailMock).toHaveBeenCalledTimes(1);
      expect(sendMailMock).toHaveBeenCalledWith({
        from: mockConfigData['email.from'],
        to: email,
        subject: 'Confirm your Participium registration',
        html: expect.stringContaining(code),
      });

      expect(logSpy).toHaveBeenCalledWith(
        `Verification email sent to ${email}`,
      );
    });

    it('should catch error, log it, and throw Error', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      const smtpError = new Error('SMTP Connection Timeout');

      sendMailMock.mockRejectedValue(smtpError);

      await expect(service.sendVerificationEmail(email, code)).rejects.toThrow(
        'Failed to send verification email',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        `Failed to send verification email to ${email}`,
        smtpError,
      );
    });
  });
});
