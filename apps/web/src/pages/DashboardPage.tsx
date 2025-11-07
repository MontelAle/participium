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
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <h2 className="text-lg font-semibold mb-4">Welcome back!</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Email:</strong> {user?.email || 'Loading...'}</p>
              <p><strong>Username:</strong> {user?.username || 'Loading...'}</p>
              <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
            </div>
          </div>

          <div className="rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
            <p className="text-sm text-green-700 dark:text-green-300">
              ✅ <strong>Session Active:</strong> You are successfully logged in and your session cookie is working!
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950 text-xs">
            <p className="font-semibold mb-2">Debug Info:</p>
            <p>Cookie exists: {hasCookie ? 'Yes' : 'No'}</p>
            <p>User in state: {hasUser ? 'Yes' : 'No'}</p>
            <p>User in localStorage: {storedUser ? 'Yes' : 'No'}</p>
          </div>

          <div className="flex gap-4">
            <Button onClick={logout} variant="destructive">
              Logout
            </Button>
            <Button asChild variant="outline">
              <a href="/">Go to Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
