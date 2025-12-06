import { useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function MunicipalGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isMunicipalityUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isMunicipalityUser) {
    return <Navigate to="/reports/map" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
