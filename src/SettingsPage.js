import React, { useState } from 'react';
import { auth } from './firebase';
import { updatePassword } from 'firebase/auth';
import { useTheme } from './ThemeContext';

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: 'John Smith',
    email: 'john@example.com',
    password: ''
  });
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

  return (
    <div className="antialiased bg-gray-50 text-gray-800 flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white shadow-lg pt-20 flex-shrink-0">
        <nav className="flex-1 px-4 space-y-2">
          <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">🏠 Dashboard</a>
          <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">🏢 Properties</a>
          <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">👥 Tenants</a>
          <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">🔔 Announcements</a>
          <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">💳 Payments & Billing</a>
          <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">🛠️ Maintenance</a>
          <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100">📊 Analytics</a>
          <a href="/settings" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700">⚙️ Settings</a>
        </nav>
        <div className="px-6 py-4 border-t">
          <div className="flex items-center space-x-3">
            <span className="text-xl">👤</span>
            <div>
              <div className="font-medium">{profile.name}</div>
              <div className="text-sm text-gray-500">{profile.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white p-6 fixed top-0 left-0 right-0 z-20 flex items-center justify-between">
          <div className="text-2xl font-bold">EasyLease</div>
          <button onClick={saveAll}
                  className="px-4 py-2 bg-green-400 hover:bg-green-500 rounded-full font-semibold">
            Save All Changes
          </button>
        </header>

        {/* Content */}
        <main className="pt-24 p-6 mx-6 overflow-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

            {/* Tabs */}
            <nav className="bg-gray-50 px-6 py-4 border-b flex space-x-8">
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
