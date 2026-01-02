import { Account, Profile, Role, Session, User } from '@entities';
import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';
import { Repository } from 'typeorm';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/auth.dto';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  async validateUser(username: string, password: string) {
    const account = await this.accountRepository.findOne({
      where: { providerId: 'local', accountId: username },
      relations: ['user', 'user.role', 'user.office'],
    });

    if (!account) return null;

    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      account.password,
    );

    if (!isPasswordValid) return null;
    return { user: account.user };
  }

  async register(dto: RegisterDto) {
    const { email, username, firstName, lastName, password } = dto;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException('Username or Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = this.otpService.generateVerificationCode();
    const codeExpiry = this.otpService.generateCodeExpiry();

    const result = await this.userRepository.manager.transaction(
      async (manager) => {
        const userRole = await manager
          .getRepository(Role)
          .findOne({ where: { name: 'user' } });

        if (!userRole) {
          throw new ConflictException(
            'Default role "user" not found. Contact support.',
          );
        }

        const newUser = manager.getRepository(User).create({
          id: nanoid(),
          email,
          username,
          firstName,
          lastName,
          role: userRole,
          emailVerificationCode: verificationCode,
          emailVerificationCodeExpiry: codeExpiry,
          isEmailVerified: false,
        });

        const savedUser = await manager.getRepository(User).save(newUser);

        const profile = manager.getRepository(Profile).create({
          id: nanoid(),
          userId: savedUser.id,
          user: savedUser,
        });

        await manager.getRepository(Profile).save(profile);

        const newAccount = manager.getRepository(Account).create({
          id: nanoid(),
          accountId: username,
          providerId: 'local',
          userId: savedUser.id,
          password: hashedPassword,
          user: savedUser,
        });

        await manager.getRepository(Account).save(newAccount);

        return { user: savedUser };
      },
    );

    await this.emailService.sendVerificationEmail(email, verificationCode);

    return {
      message:
        'Registration successful. Please check your email for the verification code.',
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'office'],
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('Email already verified');
    }

    if (!user.emailVerificationCode || !user.emailVerificationCodeExpiry) {
      throw new ConflictException('No verification code found');
    }

    if (this.otpService.isCodeExpired(user.emailVerificationCodeExpiry)) {
      throw new ConflictException('Verification code has expired');
    }

    if (user.emailVerificationCode !== code) {
      throw new ConflictException('Invalid verification code');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpiry = null;

    await this.userRepository.save(user);

    return { user };
  }

  getCookieOptions() {
    return {
      httpOnly: this.configService.get<boolean>('cookie.httpOnly'),
      sameSite: this.configService.get('cookie.sameSite'),
      secure: this.configService.get<boolean>('cookie.secure'),
      maxAge: this.configService.get<number>('session.expiresInSeconds') * 1000,
    };
  }

  async login(user: User, ipAddress: string, userAgent: string) {
    const secret = nanoid();
    const hashedSecret = createHash('sha256').update(secret).digest('hex');

    const session = this.sessionRepository.create({
      id: nanoid(),
      userId: user.id,
      hashedSecret,
      expiresAt: new Date(
        Date.now() +
          this.configService.get<number>('session.expiresInSeconds') * 1000,
      ),
      ipAddress,
      userAgent,
    });

    await this.sessionRepository.save(session);

    const token = `${session.id}.${secret}`;

    return {
      session: instanceToPlain(session),
      user,
      token,
    };
  }

  async logout(sessionToken: string) {
    const tokenParts = sessionToken.split('.');
    const sessionId = tokenParts[0];

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (session) {
      await this.sessionRepository.remove(session);
    }
  }

  async refreshSession(session: Session) {
    session.expiresAt = new Date(
      Date.now() +
        this.configService.get<number>('session.expiresInSeconds') * 1000,
    );
    await this.sessionRepository.save(session);
    return { session: instanceToPlain(session) };
  }
}
