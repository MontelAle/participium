import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from 'sonner';

import LoginPage from './pages/auth/login/page';
import RegistrationPage from './pages/auth/registration/page';
import MapPage from './pages/map/page';
import MunicipalityUsersPage from './pages/users-municipality/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/map" replace />} />
            <Route path="map" element={<MapPage />} />
            <Route
              path="municipality-users"
              element={<MunicipalityUsersPage />}
            />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
