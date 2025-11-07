import type { LoginRequest, RegisterRequest, User } from '@/fetch';
export declare function useAuth(): {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginRequest) => Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@/fetch").AuthResponse;
        error?: undefined;
    }>;
    register: (userData: RegisterRequest) => Promise<{
        success: boolean;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: import("@/fetch").AuthResponse;
        error?: undefined;
    }>;
    logout: () => void;
    isAuthenticated: boolean;
};
//# sourceMappingURL=useAuth.d.ts.map