import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuth } from '@/fetch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { AuthService } from '@/fetch';
export function DashboardPage() {
    const { user, logout, isAuthenticated } = useAuth();
    // Debug info
    const hasCookie = AuthService.isAuthenticated();
    const hasUser = user !== null;
    const storedUser = localStorage.getItem('user');
    console.log('Dashboard Debug:', {
        isAuthenticated,
        hasCookie,
        hasUser,
        user,
        storedUser,
        cookies: document.cookie
    });
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted/40 p-6", children: _jsxs(Card, { className: "w-full max-w-2xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-2xl", children: "Dashboard" }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "rounded-lg bg-muted p-4", children: [_jsx("h2", { className: "text-lg font-semibold mb-4", children: "Welcome back!" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " ", user?.email || 'Loading...'] }), _jsxs("p", { children: [_jsx("strong", { children: "Username:" }), " ", user?.username || 'Loading...'] }), _jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", user?.firstName, " ", user?.lastName] }), _jsxs("p", { children: [_jsx("strong", { children: "User ID:" }), " ", user?.id] })] })] }), _jsx("div", { className: "rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950", children: _jsxs("p", { className: "text-sm text-green-700 dark:text-green-300", children: ["\u2705 ", _jsx("strong", { children: "Session Active:" }), " You are successfully logged in and your session cookie is working!"] }) }), _jsxs("div", { className: "rounded-lg bg-blue-50 p-4 dark:bg-blue-950 text-xs", children: [_jsx("p", { className: "font-semibold mb-2", children: "Debug Info:" }), _jsxs("p", { children: ["Cookie exists: ", hasCookie ? 'Yes' : 'No'] }), _jsxs("p", { children: ["User in state: ", hasUser ? 'Yes' : 'No'] }), _jsxs("p", { children: ["User in localStorage: ", storedUser ? 'Yes' : 'No'] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx(Button, { onClick: logout, variant: "destructive", children: "Logout" }), _jsx(Button, { asChild: true, variant: "outline", children: _jsx("a", { href: "/", children: "Go to Home" }) })] })] })] }) }));
}
export default DashboardPage;
