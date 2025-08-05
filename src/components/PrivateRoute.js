import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};

const PrivateRoute = () => {
  const { token, logout } = useAuth();
  if (!token || !isTokenValid(token)) {
    logout();
    return <Navigate to="/signin" />;
  }
  return <Outlet />;
};

export default PrivateRoute;
