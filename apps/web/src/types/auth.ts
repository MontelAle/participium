import { Session, User } from '@repo/api';
import { LoginDto, RegisterDto  } from '@repo/api';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (loginCredentials: LoginDto) => Promise<{ success: boolean; data?: User; error?: string }>;
  register: (data: RegisterDto) => Promise<{ success: boolean; data?: User; error?: string }>;
  logout: () => Promise<void>;
};

export type LoginResponse = {
  user: User;
  session: Session;
}