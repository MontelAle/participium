export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}
export declare class ApiClient {
    private static baseUrl;
    static request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;
    static get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;
    static post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>>;
    static put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>>;
    static delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>>;
}
//# sourceMappingURL=api-client.d.ts.map