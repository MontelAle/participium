import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from 'sonner';
import { RequireAuth } from '@/components/require-auth';

import LoginPage from './pages/auth/login/page';
import RegistrationPage from './pages/auth/registration/page';
import MapPage from './pages/map/page';
import MunicipalityUsersPage from './pages/app/municipality-users/page';
import DashboardPage from './pages/app/dashboard/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapPage />} />
            <Route
              path="/app/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route
              path="/app/municipality-users"
              element={
                <RequireAuth>
                  <MunicipalityUsersPage />
                </RequireAuth>
              }
            />
          </Route>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegistrationPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
