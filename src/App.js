import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './Signup';
import LandlordDashboard from './LandlordDashboard';
import TenantDashboard from './TenantDashboard';
import PrivateRoute from './PrivateRoute';
import PropertiesPage from './PropertiesPage';
import LandingPage from './LandingPage'; 
import SignIn from './Signin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route element={<PrivateRoute />}>
          <Route path="/landlord-dashboard" element={<LandlordDashboard />} />
          <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;