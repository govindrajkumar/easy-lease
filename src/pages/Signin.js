import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
import { auth, db } from "../firebase"; // adjust path if needed
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SignIn() {
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setResetMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email address';
    if (!form.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      // 1) Authenticate with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, form.email, form.password);

      // 2) Fetch user document from Firestore
      const snap = await getDoc(doc(db, "Users", user.uid));
      if (!snap.exists()) throw new Error("Profile not found.");

      const { role, first_name } = snap.data();

      // 3) Store session variables
      sessionStorage.setItem("user_email", form.email);
      sessionStorage.setItem("user_first_name", first_name);

      // 4) Redirect based on role
      if (role === "landlord") {
        navigate("/landlord-dashboard");
      } else {
        navigate("/tenant-dashboard");
      }
    } catch (e) {
      if (e.code === 'auth/invalid-email') setErrors({ email: 'Invalid email address' });
      else if (e.code === 'auth/user-not-found') setErrors({ email: 'Email not found' });
      else if (e.code === 'auth/wrong-password') setErrors({ password: 'Incorrect password' });
      else setErrors({ general: e.message });
    }
  };

  const handlePasswordReset = async () => {
    setResetMsg('');
    setErrors({});
    if (!form.email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetMsg('Password reset email sent.');
    } catch (e) {
      if (e.code === 'auth/invalid-email') setErrors({ email: 'Invalid email address' });
      else if (e.code === 'auth/user-not-found') setErrors({ email: 'Email not found' });
      else setErrors({ general: e.message });
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
            Sign In
          </h2>
          {errors.general && <p className="text-sm text-red-600 mb-4">{errors.general}</p>}
          {resetMsg && <p className="text-sm text-green-600 mb-4">{resetMsg}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.email)}
                className={`mt-1 block w-full h-12 px-4 rounded-lg shadow-sm dark:bg-gray-900 focus:ring-1 focus:outline-none ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.password)}
                className={`mt-1 block w-full h-12 px-4 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:ring-1 focus:outline-none ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
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
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
                <a href="/signup" className="text-sm text-indigo-600 hover:underline">
                  Sign Up
                </a>
              </div>
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
