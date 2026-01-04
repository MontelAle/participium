import type { LoginDto, RegisterDto, User, VerifyEmailDto } from '@/types';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (
    loginCredentials: LoginDto,
  ) => Promise<{ success: boolean; data?: User; error?: string; email?: string }>;

  register: (
    data: RegisterDto,
  ) => Promise<{ success: boolean; message?: string; error?: string }>;

  verifyEmail: (
    data: VerifyEmailDto,
  ) => Promise<{ success: boolean; data?: User; error?: string }>;

  logout: () => Promise<void>;
  isMunicipalityUser: boolean;
  isAdminUser: boolean;
  isCitizenUser: boolean;
  isGuestUser: boolean;
  isMunicipalPrOfficer: boolean;
  isTechnicalOfficer: boolean;
  isExternal: boolean;
  hasRole: (roles: string[]) => boolean;
};
