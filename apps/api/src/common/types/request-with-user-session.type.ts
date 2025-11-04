import { Request } from 'express';
import { User, Session } from '@repo/api';

export interface RequestWithUserSession extends Request {
  user: User;
  session: Session;
}
