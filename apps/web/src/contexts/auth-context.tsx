import { createContext, useContext, useState, ReactNode } from 'react';
import type { User, LoginDto, RegisterDto } from '@repo/api';
import { AuthContextType } from '@/types/auth';
import { useLogin, useRegister, useLogout } from '@/hooks/use-auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const isAuthenticated = user !== null;
  const isMunicipalityUser = user?.role?.isMunicipal || false;
  const isAdminUser = user?.role?.name === 'admin';
  const isCitizenUser = user?.role?.name === 'user';
  const isMunicipalPrOfficer = user?.role?.name === 'pr_officer';
  const isTechnicalOfficer = user?.role?.name === 'tech_officer';
  const isGuestUser = isAuthenticated === false;
  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending;
  const error =
    loginMutation.error?.message || registerMutation.error?.message || null;

  const login = async (credentials: LoginDto) => {
    try {
      const response = await loginMutation.mutateAsync(credentials);
      const userData = response.data.user;
      setUser(userData);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data: RegisterDto) => {
    try {
      const response = await registerMutation.mutateAsync(data);
      const userData = response.data.user;
      setUser(userData);
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        isAdminUser,
        isCitizenUser,
        isGuestUser,
        isMunicipalityUser,
        isMunicipalPrOfficer,
        isTechnicalOfficer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
