import { User } from './user.entity';
export interface Session {
  id: string;
  expiresAt: Date;
  hashedSecret: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
  user: User;
  impersonatedBy?: string;
}
