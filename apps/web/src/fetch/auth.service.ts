import { ApiClient } from './api-client';
import type { LoginRequest, RegisterRequest, AuthResponse } from './types';

export class AuthService {
  /**
   * Login user
   * POST /auth/login
   */
  static async login(credentials: LoginRequest) {
    return ApiClient.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * Register new user
   * POST /auth/register
   */
  static async register(userData: RegisterRequest) {
    return ApiClient.post<AuthResponse>('/auth/register', userData);
  }

  /**
   * Logout user (client-side cleanup)
   * The session cookie will be cleared by setting it to expire
   */
  static logout() {
    // Clear session cookie
    document.cookie = 'session_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear any local storage if you're using it
    localStorage.removeItem('user');
    sessionStorage.clear();
  }

  /**
   * Check if user is authenticated by checking if session cookie exists
   */
  static isAuthenticated(): boolean {
    return document.cookie.includes('session_cookie=');
  }

  /**
   * Get session cookie value
   */
  static getSessionToken(): string | null {
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith('session_cookie=')
    );
    
    if (sessionCookie) {
      const token = sessionCookie.split('=')[1];
      return token || null;
    }
    
    return null;
  }
}
