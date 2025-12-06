import { useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function CitizenGuard({ children }: { children: ReactNode }) {
  const { isMunicipalityUser } = useAuth();
  const location = useLocation();

  if (isMunicipalityUser) {
    return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
