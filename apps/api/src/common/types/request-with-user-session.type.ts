import { Request } from 'express';
import { User, Session } from '@repo/api';

export type RequestWithUserSession = Request & {
  user: User;
  session: Session;
};

