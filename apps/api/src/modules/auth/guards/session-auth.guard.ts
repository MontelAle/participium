import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../../common/entities/session.entity';
import type { RequestWithUserSession } from '../../../common/types/request-with-user-session.type';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUserSession>();

    const token = req.cookies?.session_token;
    if (!token) throw new UnauthorizedException('No session token');

    const tokenParts = token.split('.');
    if (tokenParts.length !== 2) {
      throw new UnauthorizedException('Invalid session token format');
    }

    const sessionId = tokenParts[0];
    const sessionSecret = tokenParts[1];

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'user.role', 'user.office'],
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (
      new Date().getTime() - session.updatedAt.getTime() >
      this.configService.get<number>('session.expiresInSeconds') * 1000
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const hashedSecret = createHash('sha256')
      .update(sessionSecret)
      .digest('hex');

    if (!this.constantTimeEqual(hashedSecret, session.hashedSecret)) {
      throw new UnauthorizedException('Invalid session secret');
    }

    req.user = session.user;
    session.user = undefined;
    req.session = session;
    return true;
  }

  private constantTimeEqual(aString: string, bString: string): boolean {
    const a = Buffer.from(aString);
    const b = Buffer.from(bString);
    if (a.byteLength !== b.byteLength) {
      return false;
    }
    let c = 0;
    for (let i = 0; i < a.byteLength; i++) {
      c |= a[i] ^ b[i];
    }
    return c === 0;
  }
}
