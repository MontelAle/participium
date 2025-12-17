import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../../common/entities/session.entity';
import type { RequestWithUserSession } from '../../../common/types/request-with-user-session.type';
import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';

/**
 * PublicGuard - Optional authentication guard
 * 
 * This guard allows both authenticated and unauthenticated requests to proceed.
 * If a valid session token is present, it will attach the user to the request.
 * If no token or invalid token is provided, it sets req.user to null and continues.
 * 
 * Use this guard for endpoints that should be publicly accessible but may
 * provide additional data/functionality for authenticated users.
 */
@Injectable()
export class PublicGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUserSession>();

    const token = req.cookies?.session_token;
    
    // No token present - allow as guest user
    if (!token) {
      req.user = null;
      return true;
    }

    // Validate token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 2) {
      req.user = null;
      return true;
    }

    const sessionId = tokenParts[0];
    const sessionSecret = tokenParts[1];

    // Find session in database
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user', 'user.role', 'user.office'],
    });

    // Invalid session - allow as guest user
    if (!session) {
      req.user = null;
      return true;
    }

    // Check if session expired
    if (
      new Date().getTime() - session.updatedAt.getTime() >
      this.configService.get<number>('session.expiresInSeconds') * 1000
    ) {
      req.user = null;
      return true;
    }

    // Validate session secret
    const hashedSecret = createHash('sha256')
      .update(sessionSecret)
      .digest('hex');

    if (!this.constantTimeEqual(hashedSecret, session.hashedSecret)) {
      req.user = null;
      return true;
    }

    // Valid session - attach user to request
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
