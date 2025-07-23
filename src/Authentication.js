import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import './index.css'; // Assuming you'll move the CSS here or use Tailwind CSS directly

function AuthPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [form, setForm] = useState({
    role: 'landlord',
    name: '',
    email: '',
    password: '',
    confirm: '',
    remember: false,
    property: '',
    landlordEmail: '',
  });
  const [showPass, setShowPass] = useState(false);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    alert('Signed in!');
    window.location.href = 'tenant_dashboard_js_modal_updated.html';
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      alert('Passwords do not match');
      return;
    }
    alert(`Account created as ${form.role}!`);
    window.location.href = 'tenant_dashboard_js_modal_updated.html';
  };

  return (
    <div className={`antialiased transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-10">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <span className="text-2xl font-bold cursor-pointer" onClick={toggleDarkMode}>
              EasyLease
            </span>
            <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="p-2 rounded focus:outline-none">
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-300" fill="currentColor">
                  <path d="M10 2a8 8 0 017.446 4.908A6 6 0 1010 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Auth Card */}
        <main className="flex-1 flex items-center justify-center pt-20 pb-10 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
            {/* Mode Switch */}
            <div className="flex justify-center mb-6 space-x-4">
              <button
                onClick={() => setMode('signin')}
                className={`border-b-2 pb-2 font-medium ${
                  mode === 'signin' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`border-b-2 pb-2 font-medium ${
                  mode === 'signup' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Sign In Form */}
            {mode === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Email address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    {showPass ? <span>🙈</span> : <span>👁️</span>}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={form.remember}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-indigo-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition">
                  Sign In
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role"
                      value="landlord"
                      checked={form.role === 'landlord'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Landlord</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role"
                      value="tenant"
                      checked={form.role === 'tenant'}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>Tenant</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                {form.role === 'tenant' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">Property Code</label>
                      <input
                        type="text"
                        name="property"
                        value={form.property}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Landlord Email</label>
                      <input
                        type="email"
                        name="landlordEmail"
                        value={form.landlordEmail}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
                <div className="relative">
                  <label className="block text-sm font-medium">Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    {showPass ? <span>🙈</span> : <span>👁️</span>}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium">Confirm Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    {showPass ? <span>🙈</span> : <span>👁️</span>}
                  </button>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition">
                  Create Account
                </button>
              </form>
            )}
          </div>
        </main>
      </body>
    </div>
  );
}

export default AuthPage;
