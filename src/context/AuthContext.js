import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('token');
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

  const login = (jwt) => {
    sessionStorage.setItem('token', jwt);
    setToken(jwt);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
  };

  const refreshToken = (jwt) => {
    sessionStorage.setItem('token', jwt);
    setToken(jwt);
  };

  const authFetch = (url, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
  };

  const value = { token, login, logout, refreshToken, authFetch };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
