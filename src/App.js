import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Signup from './pages/Signup';
import LandlordDashboard from './pages/LandlordDashboard';
import TenantDashboard from './pages/TenantDashboard';
import PrivateRoute from './components/PrivateRoute';
import PropertiesPage from './pages/PropertiesPage';
import TenantsPage from './pages/TenantsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PaymentsPage from './pages/PaymentsPage';
import MaintenancePage from './pages/MaintenancePage';
import TenantPaymentsPage from './pages/TenantPaymentsPage';
import TenantMaintenancePage from './pages/TenantMaintenancePage';
import TenantAnnouncementsPage from './pages/TenantAnnouncementsPage';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/Signin';
import TenantRequestsApprovalPage from './pages/TenantRequestsApprovalPage';
import SettingsPage from './pages/SettingsPage';
import TenantSettingsPage from './pages/TenantSettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<SignIn />} />
        <Route element={<PrivateRoute />}>
          <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/approve-requests" element={<TenantRequestsApprovalPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
          <Route path="/tenant-payments" element={<TenantPaymentsPage />} />
          <Route path="/tenant-maintenance" element={<TenantMaintenancePage />} />
          <Route path="/tenant-announcements" element={<TenantAnnouncementsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/tenant-settings" element={<TenantSettingsPage />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
