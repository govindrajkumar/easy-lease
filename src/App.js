import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
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
import ChatPage from './pages/ChatPage';

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} />
        <Route path="/signup" element={<AnimatedPage><Signup /></AnimatedPage>} />
        <Route path="/signin" element={<AnimatedPage><SignIn /></AnimatedPage>} />
        <Route element={<PrivateRoute />}>
          <Route path="/landlord-dashboard" element={<AnimatedPage><LandlordDashboard /></AnimatedPage>} />
          <Route path="/properties" element={<AnimatedPage><PropertiesPage /></AnimatedPage>} />
          <Route path="/tenants" element={<AnimatedPage><TenantsPage /></AnimatedPage>} />
          <Route path="/announcements" element={<AnimatedPage><AnnouncementsPage /></AnimatedPage>} />
          <Route path="/payments" element={<AnimatedPage><PaymentsPage /></AnimatedPage>} />
          <Route path="/maintenance" element={<AnimatedPage><MaintenancePage /></AnimatedPage>} />
          <Route path="/approve-requests" element={<AnimatedPage><TenantRequestsApprovalPage /></AnimatedPage>} />
          <Route path="/analytics" element={<AnimatedPage><AnalyticsPage /></AnimatedPage>} />
          <Route path="/tenant-dashboard" element={<AnimatedPage><TenantDashboard /></AnimatedPage>} />
          <Route path="/tenant-payments" element={<AnimatedPage><TenantPaymentsPage /></AnimatedPage>} />
          <Route path="/tenant-maintenance" element={<AnimatedPage><TenantMaintenancePage /></AnimatedPage>} />
          <Route path="/tenant-announcements" element={<AnimatedPage><TenantAnnouncementsPage /></AnimatedPage>} />
          <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
          <Route path="/tenant-settings" element={<AnimatedPage><TenantSettingsPage /></AnimatedPage>} />
          <Route path="/chat" element={<AnimatedPage><ChatPage /></AnimatedPage>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  );
}
