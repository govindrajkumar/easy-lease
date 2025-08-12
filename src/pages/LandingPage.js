import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import '../App.css'; // Tailwind CSS should be configured here

function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeSection, setActiveSection] = useState('home');

  // Refs for sections
  const sections = {
    home: useRef(null),
    dashboard: useRef(null),
    benefits: useRef(null),
    works: useRef(null),
    testimonials: useRef(null),
    pricing: useRef(null)
  };

  // Scroll spy and header shadow
  useEffect(() => {
    const handleScroll = () => {
      const y = window.pageYOffset;
      setScrolled(y > 40);
      Object.entries(sections).forEach(([key, ref]) => {
        if (ref.current) {
          const offset = ref.current.offsetTop - 100;
          if (y >= offset) setActiveSection(key);
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Testimonials data
  const testimonialsData = [
    { quote: 'EasyLease simplified my life!', name: 'Alice R.' },
    { quote: 'My tenants never miss a payment.', name: 'Maria S.' },
    { quote: 'Maintenance has never been easier.', name: 'David T.' }
  ];

  return (
    <div className="antialiased bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
      {/* Header */}
      <header className={`fixed w-full z-50 backdrop-blur-lg bg-white dark:bg-gray-900 transition-shadow ${scrolled ? 'shadow-xl' : ''}`}>  
        <div className="container mx-auto flex items-center justify-between px-6 lg:px-8 py-4">
          <button onClick={toggleDarkMode} className="text-2xl font-extrabold focus:outline-none">
            EasyLease
          </button>
          <nav className="hidden md:flex space-x-10 text-lg font-medium">
            {Object.keys(sections).map(key => (
              <a
                key={key}
                href={`#${key}`}
                className={`hover:text-indigo-500 transition ${activeSection === key ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}
              >{key.charAt(0).toUpperCase() + key.slice(1)}</a>
            ))}
          </nav>
          <div className="hidden md:flex space-x-4">
            <Link to="/signin" className="px-4 py-2 rounded-md text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
              Log In
            </Link>
            <Link to="/signup" className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:scale-105 transform transition">
              Sign Up
            </Link>
          </div>
          <button
            onClick={() => setMobileMenu(true)}
            className="md:hidden p-2 focus:outline-none"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
            mobileMenu ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setMobileMenu(false)}
        />
        {/* Sidebar */}
        <nav
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white dark:bg-gray-900 dark:text-gray-100 shadow-xl transform transition-transform duration-300 md:hidden ${
            mobileMenu ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={() => setMobileMenu(false)}
              className="p-2"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col p-6 space-y-3 text-lg">
            {Object.keys(sections).map(key => (
              <a key={key} href={`#${key}`} className="py-2" onClick={() => setMobileMenu(false)}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link to="/signin" className="block w-full text-left py-2 mb-2" onClick={() => setMobileMenu(false)}>
                Login
              </Link>
              <Link to="/signup" className="block w-full text-left py-2" onClick={() => setMobileMenu(false)}>
                Sign Up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="home" ref={sections.home} className="pt-32 pb-24 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight">
              Simplify Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-red-500">Rental Management</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-200 max-w-xl">Powerful dashboard, automated reminders, and seamless integrations to keep your properties running smoothly.</p>
            <div className="flex flex-wrap gap-4 mt-4">
                <Link to="/signin" className="px-6 py-3 rounded-full bg-white text-indigo-600 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition">Get Started</Link>
                <a href="#" className="inline-flex items-center gap-2 px-4 py-2 border border-white rounded-md hover:bg-white/20 transition text-sm lg:text-base">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16"/></svg>Watch Demo
                </a>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section id="dashboard" ref={sections.dashboard} className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">Your Dashboard</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="p-6 bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold">Monthly Revenue</h3>
              <p className="text-3xl font-bold mt-2">$12,450</p>
            </div>
            <div className="p-6 bg-green-600 dark:bg-green-700 text-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold">Active Properties</h3>
              <p className="text-3xl font-bold mt-2">24</p>
            </div>
            <div className="p-6 bg-yellow-600 dark:bg-yellow-700 text-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold">Pending Requests</h3>
              <p className="text-3xl font-bold mt-2">8</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <h4 className="font-semibold mb-4">Recent Payments</h4>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex justify-between"><span>Apartment 4B</span><span className="font-medium">$2,400</span></li>
                <li className="flex justify-between"><span>Downtown Loft</span><span className="font-medium">$1,800</span></li>
                <li className="flex justify-between"><span>Suburban House</span><span className="font-medium">$2,100</span></li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
              <h4 className="font-semibold mb-4">Maintenance Overview</h4>
              <div className="space-y-4">
                {['Plumbing Issues','Electrical','HVAC'].map((item,i) => (
                  <div key={i}>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: i===0?'33%':i===1?'25%':'50%'}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section id="benefits" ref={sections.benefits} className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">Key Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: '🏠', title: 'Manage Properties', text: 'Add, edit, and organize all your rental properties in one centralized dashboard.' },
              { icon: '💰', title: 'Collect Rent Online', text: 'Automate invoicing and securely accept payments via Stripe, with reminders.' },
              { icon: '🛠️', title: 'Track Maintenance', text: 'Submit and manage maintenance requests, assign to vendors, and monitor.' }
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-start p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transform transition hover:-translate-y-2 hover:shadow-2xl">
                <div className="text-5xl mb-4">{b.icon}</div>
                <h3 className="text-2xl font-semibold mb-2">{b.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="works" ref={sections.works} className="py-20 bg-gray-100 dark:bg-gray-700">
        <div className="container mx-auto px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Sign Up & Add Properties', text: 'Create your account and input property details including photos and rent price.', color: 'bg-indigo-600' },
              { step: '2', title: 'Invite Tenants & Set Payments', text: 'Send invites and configure automated rent reminders and payment schedules.', color: 'bg-green-600' },
              { step: '3', title: 'Track Income & Requests', text: 'View real-time dashboards, generate reports, and handle maintenance tickets effortlessly.', color: 'bg-yellow-600' }
            ].map((w, i) => (
              <div key={i} className="flex flex-col items-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition">
                <div className={`${w.color} flex items-center justify-center h-16 w-16 text-white rounded-full mb-4 animate-bounce`}><span className="text-2xl font-bold">{w.step}</span></div>
                <h3 className="text-2xl font-semibold mb-2">{w.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" ref={sections.testimonials} className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonialsData.map((t, i) => ( 
              <blockquote key={i} className="relative bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-lg before:content-[''] before:absolute before:-top-8 before:left-8 before:text-7xl before:text-indigo-100 animate-pulse">
                <p className="italic mb-6 text-lg text-gray-700 dark:text-gray-300">"{t.quote}"</p>
                <footer className="font-semibold text-right text-base text-gray-900 dark:text-gray-100">{t.name}, Landlord</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={sections.pricing} className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-12">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transform transition duration-500">
              <h3 className="text-2xl font-semibold mb-4">Free Plan</h3>
              <p className="text-5xl font-bold mb-4">$0<span className="text-lg font-normal">/month</span></p>
              <ul className="text-left space-y-3 mb-6 text-base text-gray-700 dark:text-gray-300">
                <li>✅ 1 property</li>
                <li>✅ Basic features</li>
                <li>✅ Email support</li>
              </ul>
                <Link to="/signin" className="px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition">Get Started</Link>
              </div>
            <div className="p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-4 border-indigo-600 hover:scale-105 transform transition duration-500">
              <h3 className="text-2xl font-semibold mb-4">Pro Plan</h3>
              <p className="text-5xl font-bold mb-4">$29<span className="text-lg font-normal">/month</span></p>
              <ul className="text-left space-y-3 mb-6 text-base text-gray-700 dark:text-gray-300">
                <li>✅ Unlimited properties</li>
                <li>✅ All features</li>
                <li>✅ Priority support</li>
              </ul>
              <button className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition">Try Pro Free 14d</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-12 mt-12">
        <div className="container mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xl font-bold mb-4">EasyLease</h4>
            <p className="text-base max-w-xs">All-in-one rental property management platform helping landlords and tenants manage properties effortlessly.</p>
          </div>
          <div className="flex space-x-12">
            <div>
              <h5 className="font-semibold mb-3 uppercase text-sm">Product</h5>
              <ul className="space-y-2 text-base">
                <li><a href="#" className="hover:text-indigo-600 transition">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3 uppercase text-sm">Company</h5>
              <ul className="space-y-2 text-base">
                <li><a href="#" className="hover:text-indigo-600 transition">About</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Blog</a></li>
              </ul>
            </div>
          </div>
          <div>
            <h5 className="font-semibold mb-3 uppercase text-sm">Follow Us</h5>
            <div className="flex space-x-4 text-2xl">
              <a href="#" aria-label="Twitter" className="hover:text-indigo-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M8 19c7.5 0 11-6.3 11-11v-.5A7.8 7.8 0 0 0 21 6.1a7.3 7.3 0 0 1-2 0.5A3.5 3.5 0 0 0 20 4.1a7 7 0 0 1-2.2.8A3.5 3.5 0 0 0 14 2a3.5 3.5 0 0 0-3.5 3.5c0 .2 0 .3 0 .5A10 10 0 0 1 3 3a3.5 3.5 0 0 0 1.1 4.7A3.4 3.4 0 0 1 3 7v.1a3.5 3.5 0 0 0 2.8 3.4 3.4 3.4 0 0 1-1 .1 3.4 3.4 0 0 1-.6 0 3.5 3.5 0 0 0 3.2 2.4A7 7 0 0 1 3 17a10 10 0 0 0 5.4 1.6z" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-indigo-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M16 8a6 6 0 0 1 6 6v6h-4v-6a2 2 0 0 0-4 0v6h-4v-6a6 6 0 0 1 6-6zM4 9h4v12H4zM6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="hover:text-indigo-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22 12a10 10 0 1 0-11 9.9v-6.9h-3v-3h3v-2c0-3 2-4.5 4.5-4.5 1.3 0 2.7.1 2.7.1v3h-1.5c-1.5 0-2 1-2 2v2h3.5l-.5 3h-3v6.9A10 10 0 0 0 22 12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">&copy; 2025 EasyLease, Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;