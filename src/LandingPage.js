import React from 'react';
import { Link } from 'react-router-dom';
import dashboardMockup from './dashboard-mockup.png'; // Replace with actual image path

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-white shadow-md">
        <div className="text-2xl font-bold text-blue-600">EasyLease</div>
        <nav className="space-x-4">
          <Link to="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
          <Link to="/login" className="text-gray-700 hover:text-blue-600">Log In</Link>
          <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Get Started</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-24 flex flex-col md:flex-row items-center justify-center p-8">
        {/* Left Side: Text and Buttons */}
        <div className="md:w-1/2 p-4 text-center md:text-left">
          <h1 className="text-5xl font-bold text-blue-800 mb-4">Take Control of Your Rental Portfolio</h1>
          <p className="text-xl text-gray-700 mb-8 max-w-lg mx-auto md:mx-0">
            EasyLease helps you list properties, collect rent, and handle maintenance—all from one dashboard.
          </p>
          <div className="space-x-4 flex justify-center md:justify-start">
            <Link to="/signup" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">Get Started</Link>
            <button className="px-6 py-3 border border-blue-600 text-blue-600 rounded hover:bg-blue-100 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.2A1 1 0 0010 9.768v4.464a1 1 0 001.555.832l3.197-2.2a1 1 0 000-1.664z" />
              </svg>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Side: Dashboard Mockup */}
        <div className="md:w-1/2 p-4 mt-8 md:mt-0">
          <img src={dashboardMockup} alt="Dashboard Mockup" className="w-full h-auto shadow-lg rounded" />
        </div>
      </main>
    </div>
  );
};

export default LandingPage;