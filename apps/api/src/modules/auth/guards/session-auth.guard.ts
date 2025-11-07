import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '@repo/api';
import type { RequestWithUserSession } from '../../../common/types/request-with-user-session.type';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUserSession>();

    const token = req.cookies?.session_token;
    if (!token) throw new UnauthorizedException('No session token');

    const session = await this.sessionRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    req.user = session.user;
    req.session = session;
    return true;
  }
}