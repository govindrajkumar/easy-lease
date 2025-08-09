import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    role: 'landlord',
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
  });
  const { register } = useAuth();


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    try {
      await register(form.email, form.password, form.role);
      setSuccess(true);
      setTimeout(() => {
        navigate('/signin');
      }, 1500);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
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
          <ThemeToggle className="p-2 rounded focus:outline-none" />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 pb-10 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Sign Up
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="role"
                  value="landlord"
                  checked={form.role === 'landlord'}
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
                required
                className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Phone (optional)</label>
              <input
                type="tel"
                name="phone"
                value={form.phone || ""}
                onChange={handleChange}
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
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                required
                className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}
            {success && (
              <div className="text-green-600 text-center">Account created! Redirecting to login...</div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <a href="/signin" className="text-indigo-600 hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
