import type { LoginRequest, RegisterRequest, AuthResponse } from './types';
export declare class AuthService {
    /**
     * Login user
     * POST /auth/login
     */
    static login(credentials: LoginRequest): Promise<import("./api-client").ApiResponse<AuthResponse>>;
    /**
     * Register new user
     * POST /auth/register
     */
    static register(userData: RegisterRequest): Promise<import("./api-client").ApiResponse<AuthResponse>>;
    /**
     * Logout user (client-side cleanup)
     * The session cookie will be cleared by setting it to expire
     */
    static logout(): void;
    /**
     * Check if user is authenticated by checking if session cookie exists
     */
    static isAuthenticated(): boolean;
    /**
     * Get session cookie value
     */
    static getSessionToken(): string | null;
}
//# sourceMappingURL=auth.service.d.ts.map