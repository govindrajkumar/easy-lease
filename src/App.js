import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Signup from './Signup';
import LandlordDashboard from './LandlordDashboard';
import TenantDashboard from './TenantDashboard';
import PrivateRoute from './PrivateRoute';
import PropertiesPage from './PropertiesPage';
import TenantsPage from './TenantsPage';
import AnnouncementsPage from './AnnouncementsPage';
import PaymentsPage from './PaymentsPage';
import MaintenancePage from './MaintenancePage';
import TenantPaymentsPage from './TenantPaymentsPage';
import TenantMaintenancePage from './TenantMaintenancePage';
import TenantAnnouncementsPage from './TenantAnnouncementsPage';
import LandingPage from './LandingPage';
import SignIn from './Signin';
import TenantRequestsApprovalPage from './TenantRequestsApprovalPage';
import SettingsPage from './SettingsPage';

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
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
          <Route path="/tenant-payments" element={<TenantPaymentsPage />} />
          <Route path="/tenant-maintenance" element={<TenantMaintenancePage />} />
          <Route path="/tenant-announcements" element={<TenantAnnouncementsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;
