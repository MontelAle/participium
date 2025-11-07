import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@repo/api";
import * as authApi from "@/api/endpoints/auth";
import { AuthContextType } from "@/types/auth";
import { LoginDto, RegisterDto } from "@repo/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null;

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(credentials);
      const userData = response.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(data);
      const userData = response.user || response;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return { success: true, data: userData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}