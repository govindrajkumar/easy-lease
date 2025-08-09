import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import client from '../api/client';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const scheduleRefresh = useCallback((token) => {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return;
    const expiry = decoded.exp * 1000;
    const timeout = expiry - Date.now() - 60000;
    if (timeout > 0) {
      setTimeout(refresh, timeout);
    }
  }, []);

  const setSession = (token, refreshToken) => {
    if (token) {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setCurrentUser(decodeToken(token));
      scheduleRefresh(token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
    }
  };

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    setSession(res.data.token, res.data.refreshToken);
    return decodeToken(res.data.token);
  };

  const register = async (email, password, role) => {
    const res = await client.post('/auth/register', { email, password, role });
    setSession(res.data.token, res.data.refreshToken);
    return decodeToken(res.data.token);
  };

  const logout = () => setSession(null);

  const refresh = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return logout();
    try {
      const res = await client.post('/auth/refresh', { refreshToken });
      setSession(res.data.token, res.data.refreshToken);
    } catch {
      logout();
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setSession(token, getRefreshToken());
    }
  }, []);

  const value = { currentUser, login, logout, register };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
