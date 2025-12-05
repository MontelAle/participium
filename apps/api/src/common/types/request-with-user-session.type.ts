import { Session, User } from '@repo/api';
import { Request } from 'express';

export type RequestWithUserSession = Request & {
  user: User;
  session: Session;
};
