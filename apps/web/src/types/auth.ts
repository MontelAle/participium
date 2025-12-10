import { LoginDto, RegisterDto, User } from '@repo/api';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    loginCredentials: LoginDto,
  ) => Promise<{ success: boolean; data?: User; error?: string }>;
  register: (
    data: RegisterDto,
  ) => Promise<{ success: boolean; data?: User; error?: string }>;
  logout: () => Promise<void>;
  isMunicipalityUser: boolean;
  isAdminUser: boolean;
  isCitizenUser: boolean;
  isGuestUser: boolean;
  isMunicipalPrOfficer: boolean;
  isTechnicalOfficer: boolean;
  hasRole: (roles: string[]) => boolean;
};
