import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Account, RegisterDto, Session, Role } from '@repo/api';
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

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

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

    return this.userRepository.manager.transaction(async (manager) => {
      // Role check/create
      let userRole = await manager.getRepository(Role).findOne({ where: { name: 'user' } });
      if (!userRole) {
        userRole = manager.getRepository(Role).create({ id: nanoid(8), name: 'user' });
        await manager.getRepository(Role).save(userRole);
      }

      // User check/create
      let user = await manager.getRepository(User).findOne({ where: { email } });

      if (user) {
        const account = await manager.getRepository(Account).findOne({
          where: { providerId: 'local', accountId: email },
        });

        if (account) {
          throw new Error('User with this email already exists');
        }

        const newAccount = manager.getRepository(Account).create({
          id: nanoid(8),
          accountId: email,
          providerId: 'local',
          userId: user.id,
          password: hashedPassword,
          user: user,
        });

        await manager.getRepository(Account).save(newAccount);        
      } else {
        const newUser = manager.getRepository(User).create({
          id: nanoid(8),
          email,
          username,
          firstName,
          lastName,
          role: userRole,
        });

        user = await manager.getRepository(User).save(newUser);

        const newAccount = manager.getRepository(Account).create({
          id: nanoid(8),
          accountId: email,
          providerId: 'local',
          userId: user.id,
          password: hashedPassword,
          user: user,
        });

        await manager.getRepository(Account).save(newAccount);
      }

      return {user};
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

  async logout(sessionToken: string) {
    const session = await this.sessionRepository.findOne({
      where: { token: sessionToken },
    });

    if (session) {
      await this.sessionRepository.remove(session);
    }
  }
}
