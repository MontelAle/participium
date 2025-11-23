import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MunicipalGuard } from '@/components/municipal-guard';
import { CitizenGuard } from '@/components/citizen-guard';
import LoginPage from '@/pages/auth/login/page';
import RegistrationPage from '@/pages/auth/registration/page';
import MapPage from '@/pages/report-map/page';
import ReportPage from '@/pages/report/page';
import DashboardPage from '@/pages/app/dashboard/page';
import MunicipalityUsersPage from '@/pages/app/municipality-users/page';
import MunicipalityPrOfficerPage from '@/pages/app/municipality-pr-officer/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/report-map" replace />} />
            <Route
              path="/report-map"
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
