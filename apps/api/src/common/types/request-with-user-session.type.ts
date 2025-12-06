import { Request } from 'express';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export type RequestWithUserSession = Request & {
  user: User;
  session: Session;
};
