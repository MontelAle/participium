import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const emailConfig = {
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure'),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates in development
      },
    };

    this.from = this.configService.get<string>('email.from');
    this.transporter = createTransport(emailConfig);
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const subject = 'Confirm your Participium registration';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Participium!</h2>
        <p>Thank you for registering. Please use the following code to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you didn't request this registration, please ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }
}
