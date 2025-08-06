import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';
import { auth, db } from "../firebase"; // adjust path if needed
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SignIn() {
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const navigate = useNavigate();


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
        // 1) Authenticate with Firebase Auth
        const { user } = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
  
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
          <ThemeToggle className="p-2 rounded focus:outline-none" />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center pt-20 pb-10 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Sign In
          </h2>
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
                  className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                />
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
                  className="mt-1 block w-full h-12 px-4 border-gray-300 dark:border-gray-700 rounded-lg shadow-sm dark:bg-gray-900 pr-10 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  aria-label="Toggle password visibility"
                >
                {showPass ? <FaEyeSlash /> : <FaEye />}
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
