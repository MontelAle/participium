import { User } from './user.entity';
export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  user: User;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}
