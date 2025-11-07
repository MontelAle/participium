import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { HomePage } from "@/pages/home";
import { UsersPage } from "@/pages/users";
import { MapPage } from "@/pages/map";
import { AuthProvider } from "@/contexts/auth-context";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<HomePage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="map" element={<MapPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;