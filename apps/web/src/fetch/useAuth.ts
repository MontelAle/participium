import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '@/fetch';
import type { LoginRequest, RegisterRequest, User } from '@/fetch';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage if exists
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Authentication is based on user presence in localStorage
  // The httpOnly cookie is automatically sent with requests but can't be read by JS
  const isAuthenticated = user !== null;

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    const response = await AuthService.login(credentials);

    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return { success: false, error: response.error };
    }

    if (response.data) {
      setUser(response.data.user);
      // Optionally store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoading(false);
      navigate('/dashboard'); // Redirect to dashboard after login
      return { success: true, data: response.data };
    }

    setIsLoading(false);
    return { success: false, error: 'Unknown error' };
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    setError(null);

    const response = await AuthService.register(userData);

    if (response.error) {
      setError(response.error);
      setIsLoading(false);
      return { success: false, error: response.error };
    }

    if (response.data) {
      setUser(response.data.user);
      // Optionally store user in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoading(false);
      navigate('/dashboard'); // Redirect to dashboard after registration
      return { success: true, data: response.data };
    }

    setIsLoading(false);
    return { success: false, error: 'Unknown error' };
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    navigate('/login');
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  };
}
