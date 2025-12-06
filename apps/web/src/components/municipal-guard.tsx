import { useAuth } from '@/contexts/auth-context';
import { MunicipalGuardProps } from '@/types/ui';
import { Navigate, useLocation } from 'react-router-dom';

export function MunicipalGuard({ children }: MunicipalGuardProps) {
  const { isAuthenticated, isMunicipalityUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isMunicipalityUser) {
    return <Navigate to="/reports/map" state={{ from: location }} replace />;
  }

  return children;
}