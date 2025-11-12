import { useAuth } from '@/contexts/auth-context';
import { Navigate, useLocation } from 'react-router-dom';

export function MunicipalGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMunicipalityUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isMunicipalityUser) {
    return <Navigate to="/map" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
