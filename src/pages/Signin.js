import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const navigate = useNavigate();
  const { login } = useAuth();


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });

      if (!res.ok) throw new Error('Invalid credentials');
      const { token } = await res.json();

      // store JWT and user details
      login(token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      sessionStorage.setItem('user_email', payload.email);
      if (payload.first_name) sessionStorage.setItem('user_first_name', payload.first_name);

      // redirect based on role
      if (payload.role === 'landlord') {
        navigate('/landlord-dashboard');
      } else {
        navigate('/tenant-dashboard');
      }
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-10">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            EasyLease
          </h1>
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="p-2 rounded focus:outline-none"
          >
            {darkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-yellow-300"
                fill="currentColor"
              >
                <path d="M10 2a8 8 0 017.446 4.908A6 6 0 1010 2z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 pb-10 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Sign In
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
              </button>
            </div>
            <div className="flex justify-between items-center">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm">Remember me</span>
              </label>
              <a href="/signup" className="text-sm text-indigo-600 hover:underline">
                Sign Up
              </a>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
