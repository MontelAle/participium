import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Account, RegisterDto, Session } from '@repo/api';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const account = await this.accountRepository.findOne({
      where: { providerId: 'local', accountId: email },
      relations: ['user'],
    });
    if (!account) return null;
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) return null;
    return { user: account.user };
  }

  async register(dto: RegisterDto) {
    const { email, username, firstName, lastName, password } = dto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.userRepository.manager.transaction(async (manager) => {
      const newUser = manager.getRepository(User).create({
        id: nanoid(8),
        email,
        username,
        firstName,
        lastName,
        role: { roleId: '01' },
      });
      const savedUser = await manager.getRepository(User).save(newUser);

      const newAccount = manager.getRepository(Account).create({
        id: nanoid(8),
        accountId: savedUser.email,
        providerId: 'local',
        userId: savedUser.id,
        password: hashedPassword,
        user: savedUser,
      });
      await manager.getRepository(Account).save(newAccount);

      return {
        user: savedUser,
      };
    });
  }

  async login(user: User, ipAddress: string, userAgent: string) {
    const cookie = {
      httpOnly: this.configService.get<boolean>('cookie.httpOnly'),
      sameSite: this.configService.get('cookie.sameSite'),
      secure: this.configService.get<boolean>('cookie.secure'),
      maxAge: this.configService.get<number>('session.expires'),
    };

    const session = this.sessionRepository.create({
      id: nanoid(8),
      userId: user.id,
      token: nanoid(16),
      expiresAt: new Date(
        Date.now() + this.configService.get<number>('session.expires'),
      ),
      ipAddress,
      userAgent,
    });

    await this.sessionRepository.save(session);

    return {
      session,
      user,
      cookie,
    };
  }
}
