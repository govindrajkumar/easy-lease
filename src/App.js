import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import Signup from './Signup';
import Login from './Login';
import LandlordDashboard from './LandlordDashboard';
import TenantDashboard from './TenantDashboard';
import PrivateRoute from './PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;