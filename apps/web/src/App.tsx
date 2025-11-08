import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { HomePage } from './pages/home/page';
import { MapPage } from './pages/map/page';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from 'sonner';

import LoginPage from './pages/auth/login/page';
import RegistrationPage from './pages/auth/registration/page';
import AdministratorPage from './pages/administrator/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<HomePage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="/administrator" element={<AdministratorPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
