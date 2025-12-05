import { User } from './user.entity';

export interface Profile {
  id: string;
  telegramUsername?: string | null;
  emailNotificationsEnabled: boolean;
  profilePictureUrl?: string | null;
  userId: string;
  user: User;
  createdAt: Date;
  updatedAt: Date;
}
