import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { MunicipalGuard } from '@/components/municipal-guard';
import { CitizenGuard } from '@/components/citizen-guard';
import LoginPage from '@/pages/auth/login/page';
import RegistrationPage from '@/pages/auth/registration/page';
import MapPage from '@/pages/reports/map/page';
import CreateReportpage from '@/pages/reports/create/page';
import ReportDetailsPage from '@/pages/reports/view/page';
import DashboardPage from '@/pages/app/dashboard/page';
import MunicipalityUsersPage from '@/pages/app/municipality-users/page';
import MunicipalityUsersCreatePage from '@/pages/app/municipality-users/create/page';
import MunicipalityUsersViewPage from '@/pages/app/municipality-users/view/page';
import AssignReportsPage from '@/pages/app/assign-reports/page';
import ProfilePage from '@/pages/profile/page';
import AssignedReportsPage from './pages/app/assigned-reports/page';
import AssignReportsViewPage from '@/pages/app/assign-reports/view/page';
import AssignedReportsViewPage from './pages/app/assigned-reports/view/page';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          mobileOffset={80}
          richColors
          duration={2000}
        />
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/reports/map" replace />} />
            <Route
              path="/reports/map"
              element={
                <CitizenGuard>
                  <MapPage />
                </CitizenGuard>
              }
            />
            <Route
              path="/reports/create"
              element={
                <CitizenGuard>
                  <CreateReportpage />
                </CitizenGuard>
              }
            />
            <Route
              path="/reports/view/:id"
              element={
                <CitizenGuard>
                  <ReportDetailsPage />
                </CitizenGuard>
              }
            />

            <Route
              path="/profile"
              element={
                <CitizenGuard>
                  <ProfilePage />
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
              path="/app/municipality-users/create"
              element={
                <MunicipalGuard>
                  <MunicipalityUsersCreatePage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/municipality-users/view/:id"
              element={
                <MunicipalGuard>
                  <MunicipalityUsersViewPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/assign-reports"
              element={
                <MunicipalGuard>
                  <AssignReportsPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/assign-reports/view/:id"
              element={
                <MunicipalGuard>
                  <AssignReportsViewPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/assigned-reports"
              element={
                <MunicipalGuard>
                  <AssignedReportsPage />
                </MunicipalGuard>
              }
            />
            <Route
              path="/app/assigned-reports/view/:id"
              element={
                <MunicipalGuard>
                  <AssignedReportsViewPage />
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
