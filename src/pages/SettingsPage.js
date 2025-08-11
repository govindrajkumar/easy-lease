import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import MobileNav from '../components/MobileNav';
import { landlordNavItems } from '../constants/navItems';

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const { darkMode, toggleDarkMode } = useTheme();

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    announcements: true
  });

  const labels = {
    email: 'Email Notifications',
    sms: 'SMS Notifications',
    announcements: 'Announcements'
  };

  const [integrations, setIntegrations] = useState({
    stripe: { connected: false },
    email: true,
    sms: false
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'Users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setFirstName(data.first_name || '');
            setProfile((prev) => ({ ...prev, name: data.first_name || '', email: u.email || '' }));
          } else {
            setProfile((prev) => ({ ...prev, email: u.email || '' }));
          }
        } catch {
          setProfile((prev) => ({ ...prev, email: u.email || '' }));
        }
      }
    });
    return () => unsubscribe();
  }, []);


  const saveAll = () => {
    alert('Settings saved');
  };

  const toggleStripe = () => {
    setIntegrations(prev => ({
      ...prev,
      stripe: { connected: !prev.stripe.connected }
    }));
  };

  const toggleNotification = key => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleIntegration = key => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = async () => {
    if (!profile.password.trim()) return;
    try {
      await updatePassword(auth.currentUser, profile.password);
      alert('Password updated');
      setProfile(prev => ({ ...prev, password: '' }));
    } catch (e) {
      alert('Failed to update password');
    }
  };
  const handleLogout = async () => {
    await auth.signOut();
  };

  const navItems = landlordNavItems({ active: 'settings' });

  return (
    <div className="min-h-screen antialiased bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 flex flex-col">
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold">EasyLease</div>
          <div className="hidden md:flex items-center space-x-6">
            {firstName && <span className="font-medium text-white dark:text-gray-100">{firstName}</span>}
            <button
              onClick={saveAll}
              className="px-4 py-2 bg-green-400 hover:bg-green-500 rounded-full font-semibold"
            >
              Save All Changes
            </button>
          </div>
          <MobileNav navItems={navItems} handleLogout={handleLogout} />
        </div>
      </header>

      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
            <a href="/settings" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">⚙️ Settings</a>
          </nav>
          <div className="px-6 py-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-xl">👤</span>
              <div>
                <div className="font-medium dark:text-gray-100">{firstName || 'User'}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ''}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto mx-auto max-w-4xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">

            {/* Tabs */}
            <nav className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700 flex space-x-8">
              {['profile','notifications','integrations'].map(key => (
                <button key={key}
                        onClick={() => setTab(key)}
                        className={`border-b-2 pb-2 font-medium ${tab === key ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-600'}`}
                >
                  {key === 'profile' ? 'Profile & Account' : key === 'notifications' ? 'Notification Preferences' : 'Integrations'}
                </button>
              ))}
            </nav>

            {/* Profile & Account */}
            {tab === 'profile' && (
              <section className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={profile.password}
                      onChange={e => setProfile({ ...profile, password: e.target.value })}
                      placeholder="••••••••"
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      className="mt-2 px-3 py-1 bg-purple-600 text-white rounded"
                    >
                      Update Password
                    </button>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <span className="text-sm text-gray-700">Dark Mode</span>
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${darkMode ? 'bg-purple-500' : 'bg-gray-300'}`}
                    >
                      <span className="sr-only">Toggle Dark Mode</span>
                      <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Notification Preferences */}
            {tab === 'notifications' && (
              <section className="p-6">
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="capitalize text-gray-700">{labels[key]}</span>
                      <button onClick={() => toggleNotification(key)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                      >
                        <span className="sr-only">Toggle</span>
                        <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Integrations */}
            {tab === 'integrations' && (
              <section className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Stripe</span>
                    <button onClick={toggleStripe}
                            className={`px-4 py-2 rounded-full text-sm ${integrations.stripe.connected ? 'bg-gray-200 text-gray-700' : 'bg-purple-600 text-white'}`}
                    >
                      {integrations.stripe.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                  {['email','sms'].map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">
                        {key === 'email' ? 'Email Service' : 'SMS Service'}
                      </span>
                      <button onClick={() => toggleIntegration(key)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full ${integrations[key] ? 'bg-purple-500' : 'bg-gray-300'}`}
                      >
                        <span className="sr-only">Toggle</span>
                        <span className={`inline-block h-4 w-4 transform bg-white rounded-full transition ${integrations[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
