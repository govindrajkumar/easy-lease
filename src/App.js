import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import PrivateRoute from './components/PrivateRoute';

const Signup = lazy(() => import('./pages/Signup'));
const LandlordDashboard = lazy(() => import('./pages/LandlordDashboard'));
const TenantDashboard = lazy(() => import('./pages/TenantDashboard'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const TenantsPage = lazy(() => import('./pages/TenantsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const TenantPaymentsPage = lazy(() => import('./pages/TenantPaymentsPage'));
const TenantMaintenancePage = lazy(() => import('./pages/TenantMaintenancePage'));
const TenantAnnouncementsPage = lazy(() => import('./pages/TenantAnnouncementsPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignIn = lazy(() => import('./pages/Signin'));
const TenantRequestsApprovalPage = lazy(() => import('./pages/TenantRequestsApprovalPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TenantSettingsPage = lazy(() => import('./pages/TenantSettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

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
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
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
          </Route>
        </Routes>
      </Suspense>
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
