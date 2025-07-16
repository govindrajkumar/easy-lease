import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const navItems = [
  { icon: '🏠', label: 'Dashboard', href: '#', active: true},
  { icon: '🏢', label: 'Properties', href: '/properties' },
  { icon: '👥', label: 'Tenants', href: '#' },
  { icon: '🔔', label: 'Announcements', href: '#' },
  { icon: '💳', label: 'Payments', href: '#' },
  { icon: '🛠️', label: 'Maintenance', href: '#' },
  { icon: '📊', label: 'Analytics', href: '/analytics' },
  { icon: '⚙️', label: 'Settings', href: '#' },
];

export default function LandlordDashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  // System theme detection (set once on mount)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
  }, []);

  // Apply dark mode class to root (your preferred logic)
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  // Auth and fetch first name
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "Users", u.uid));
          if (snap.exists()) {
            setFirstName(snap.data().first_name || '');
          } else {
            setFirstName('');
          }
        } catch {
          setFirstName('');
        }
      } else {
        setFirstName('');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            EasyLease
          </h1>
          <div className="hidden md:flex items-center space-x-6">
            {firstName && (
              <span className="font-medium text-white dark:text-gray-100">
                {firstName}
              </span>
            )}
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:scale-105 transform transition dark:from-gray-700 dark:to-gray-900"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <button
            className="md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 shadow-md md:hidden">
          <nav className="px-4 py-2 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  item.active ? 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200' : ''
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
          <nav className="px-4 space-y-2">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</a>
          </nav>
          <div className="mt-auto px-6 py-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-xl">👤</span>
              <div>
                <div className="font-medium dark:text-gray-100">{firstName || "User"}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ""}</div>
              </div>
            </div>
          </div>
        </aside>
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Rent Due */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Total Rent Due</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">$12,450</p>
                    <p className="text-sm text-green-500 mt-1 dark:text-green-400">+$1,200 from last month</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">💰</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Due within 7 days: $8,200</p>
                <a href="#" className="mt-3 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View details
                </a>
              </div>

              {/* Maintenance Requests */}
              <a
                href="#/maintenance"
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Maintenance Requests</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">7</p>
                    <p className="text-sm text-red-500 mt-1 dark:text-red-400">+2 new requests</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">🔧</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Urgent: 3 · In progress: 4</p>
                <span className="mt-3 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View details
                </span>
              </a>

              {/* Late Payments */}
              <a
                href="#/late-payments"
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Late Payments</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">2</p>
                    <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">$2,400 outstanding</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">⏰</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Avg. days late: 5</p>
                <span className="mt-3 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View details
                </span>
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Payments */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-100">Upcoming Payments</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                  <li className="flex justify-between">
                    <span>Oakwood Apartments #304 - Due in 2 days</span>
                    <span className="font-medium">$1,250</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Riverside Condos #142 - Due in 3 days</span>
                    <span className="font-medium">$1,450</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Pine Street House - Due in 5 days</span>
                    <span className="font-medium">$1,850</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Maple Avenue Duplex - Due in 7 days</span>
                    <span className="font-medium">$1,600</span>
                  </li>
                </ul>
                <a href="#/payments" className="mt-4 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View all payments
                </a>
              </section>

              {/* Recent Maintenance */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-100">Recent Maintenance</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                  <li>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Leaking faucet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Riverside Condos #142 · <span className="text-red-500 dark:text-red-400">Urgent</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">Electrical issue</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Oakwood Apartments #304 · <span className="text-yellow-500 dark:text-yellow-400">In Progress</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">1 day ago</span>
                    </div>
                  </li>
                  <li>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">HVAC maintenance</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Pine Street House · <span className="text-green-500 dark:text-green-400">Completed</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">2 days ago</span>
                    </div>
                  </li>
                </ul>
                <a href="#/maintenance" className="mt-4 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View all requests
                </a>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
