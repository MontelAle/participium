// Base API client configuration
// In development, use proxy (requests go through Vite dev server)
// In production, use the full API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export class ApiClient {
    static baseUrl = API_BASE_URL;
    static async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: 'include', // Important: include cookies in requests
        };
        try {
            const response = await fetch(url, config);
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            }
            if (!response.ok) {
                // If unauthorized (401), clear local storage (session expired)
                if (response.status === 401) {
                    localStorage.removeItem('user');
                    // Redirect to login if not already on login/register pages
                    if (!window.location.pathname.includes('/login') &&
                        !window.location.pathname.includes('/register')) {
                        window.location.href = '/login';
                    }
                }
                return {
                    error: data ? data.message || 'Request failed' : 'Request failed',
                    status: response.status,
                };
            }
            return {
                data,
                status: response.status,
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                status: 0,
            };
        }
    }
    static get(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    static post(endpoint, body, options) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    static put(endpoint, body, options) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    static delete(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}
