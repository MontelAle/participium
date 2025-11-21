import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from 'sonner';
import { MunicipalGuard } from '@/components/municipal-guard';
import { CitizenGuard } from './components/citizen-guard';

import LoginPage from './pages/auth/login/page';
import RegistrationPage from './pages/auth/registration/page';
import MapPage from './pages/map/page';
import MunicipalityUsersPage from './pages/app/municipality-users/page';
import DashboardPage from './pages/app/dashboard/page';
import ReportPage from './pages/report/page';
import MunicipalityPrOfficerPage from './pages/app/municipality-pr-officer/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/map" replace />} />
            <Route
              path="/map"
              element={
                <CitizenGuard>
                  <MapPage />
                </CitizenGuard>
              }
            />
            <Route
              path="/report"
              element={
                <CitizenGuard>
                  <ReportPage />
                </CitizenGuard>
              }
            />
            <Route
              path="/app/dashboard"
              element={
                <MunicipalGuard>
                  <DashboardPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/municipality-users"
              element={
                <MunicipalGuard>
                  <MunicipalityUsersPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/municipality-pr-officer"
              element={
                <MunicipalGuard>
                  <MunicipalityPrOfficerPage />
                </MunicipalGuard>
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
