import { useAuth } from '@/contexts/auth-context';
import { CitizenGuardProps } from '@/types/ui';
import { Navigate, useLocation } from 'react-router-dom';

export function CitizenGuard({ children }: CitizenGuardProps) {
  const { isMunicipalityUser } = useAuth();
  const location = useLocation();

  if (isMunicipalityUser) {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  // RITORNA IL NODO PULITO. <>{children}</> è overhead inutile.
  return children;
}