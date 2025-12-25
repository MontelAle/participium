import { Session, User } from '@entities';
import { Request } from 'express';

export type RequestWithUserSession = Request & {
  user: User;
  session: Session;
};
