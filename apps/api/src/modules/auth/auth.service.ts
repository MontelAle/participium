import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, Profile, RegisterDto, Role, Session, User } from '@repo/api';
import bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { Repository } from 'typeorm';

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
  ) {}

  async validateUser(username: string, password: string) {
    const account = await this.accountRepository.findOne({
      where: { providerId: 'local', accountId: username },
      relations: ['user', 'user.role', 'user.office'],
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
      let userRole = await manager
        .getRepository(Role)
        .findOne({ where: { name: 'user' } });
      if (!userRole) {
        userRole = manager
          .getRepository(Role)
          .create({ id: nanoid(), name: 'user' });
        await manager.getRepository(Role).save(userRole);
      }

      let user = await manager.getRepository(User).findOne({
        where: { username },
        relations: ['role'],
      });

      if (user) {
        const account = await manager.getRepository(Account).findOne({
          where: { providerId: 'local', accountId: username },
        });

        if (account) {
          throw new ConflictException('User with this username already exists');
        }

        const newAccount = manager.getRepository(Account).create({
          id: nanoid(),
          accountId: username,
          providerId: 'local',
          userId: user.id,
          password: hashedPassword,
          user: user,
        });

        await manager.getRepository(Account).save(newAccount);
      } else {
        const newUser = manager.getRepository(User).create({
          id: nanoid(),
          email,
          username,
          firstName,
          lastName,
          role: userRole,
        });

        user = await manager.getRepository(User).save(newUser);

        const profile = manager.getRepository(Profile).create({
          id: nanoid(),
          user: user,
          userId: user.id,
        });

        await manager.getRepository(Profile).save(profile);

        const newAccount = manager.getRepository(Account).create({
          id: nanoid(),
          accountId: username,
          providerId: 'local',
          userId: user.id,
          password: hashedPassword,
          user: user,
        });

        await manager.getRepository(Account).save(newAccount);
      }

      return { user };
    });
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
