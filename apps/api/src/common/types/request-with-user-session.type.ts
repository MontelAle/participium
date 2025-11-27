import { Request } from 'express';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';

export type RequestWithUserSession = Request & {
  user: User;
  session: Session;
};
