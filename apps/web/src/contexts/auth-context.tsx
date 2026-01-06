import {
  useLogin,
  useLogout,
  useRegister,
  useVerifyEmail,
} from '@/hooks/use-auth';
import type { LoginDto, RegisterDto, User, VerifyEmailDto } from '@/types';
import { AuthContextType } from '@/types/auth';
import { useQueryClient } from '@tanstack/react-query';
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
        const errorResponse =
          err instanceof Error ? (err as any).response : null;
        return {
          success: false,
          error: errorMessage,
          email: errorResponse?.email,
        };
      }
    },
    [loginMutation],
  );

  const register = useCallback(
    async (data: RegisterDto) => {
      try {
        const response = await registerMutation.mutateAsync(data);
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

  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    // Immediately clear client auth state to stop components from triggering queries
    setUser(null);
    try {
      localStorage.removeItem('user');
    } catch {}

    try {
      // Cancel any in-flight queries and remove cached queries so polling stops
      await queryClient.cancelQueries();
      queryClient.removeQueries();
    } catch (e) {
      console.error('Error clearing queries on logout', e);
    }

    // Attempt server-side logout but don't wait on it to prevent further client polling
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [logoutMutation, queryClient]);

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
    [
      user,
      isLoading,
      error,
      flags,
      login,
      register,
      verifyEmail,
      logout,
      hasRole,
    ],
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
