import { useLogin, useLogout, useRegister, useVerifyEmail } from '@/hooks/use-auth';
import type { LoginDto, RegisterDto, VerifyEmailDto, User } from '@/types';
import { AuthContextType } from '@/types/auth';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const verifyEmailMutation = useVerifyEmail();

  const flags = useMemo(() => {
    const isAuthenticated = user !== null;
    return {
      isAuthenticated,
      isMunicipalityUser: user?.role?.isMunicipal || false,
      isAdminUser: user?.role?.name === 'admin',
      isCitizenUser: user?.role?.name === 'user',
      isMunicipalPrOfficer: user?.role?.name === 'pr_officer',
      isTechnicalOfficer: user?.role?.name === 'tech_officer',
      isGuestUser: !isAuthenticated,
      isExternal: user?.role?.name === 'external_maintainer',
    };
  }, [user]);

  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending ||
    verifyEmailMutation.isPending;

  const error =
    loginMutation.error?.message ||
    registerMutation.error?.message ||
    verifyEmailMutation.error?.message ||
    null;

  const login = useCallback(
    async (credentials: LoginDto) => {
      try {
        const response = await loginMutation.mutateAsync(credentials);
        const userData = response.data.user;
        setUser(userData);
        return { success: true, data: userData };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed';
        return { success: false, error: errorMessage };
      }
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: RegisterDto) => {
      try {
        const response = await registerMutation.mutateAsync(data);
        // Registration successful, but user needs to verify email before login
        return { success: true, message: response.message };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        return { success: false, error: errorMessage };
      }
    },
    [registerMutation],
  );

  const verifyEmail = useCallback(
    async (data: VerifyEmailDto) => {
      try {
        const response = await verifyEmailMutation.mutateAsync(data);
        const userData = response.data.user;
        setUser(userData);
        return { success: true, data: userData };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Email verification failed';
        return { success: false, error: errorMessage };
      }
    },
    [verifyEmailMutation],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  }, [logoutMutation]);

  const hasRole = useCallback(
    (roles: string[]) => {
      return !!user && !!user.role && roles.includes(user.role.name);
    },
    [user],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      error,
      ...flags,
      login,
      register,
      verifyEmail,
      logout,
      hasRole,
    }),
    [user, isLoading, error, flags, login, register, verifyEmail, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
