import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');
        const propSnap = await getDocs(
          query(collection(db, 'Properties'), where('landlord_id', '==', u.uid))
        );
        const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const tenantData = await Promise.all(
          props
            .filter((p) => p.tenant_uid)
            .map(async (p) => {
              const tSnap = await getDoc(doc(db, 'Users', p.tenant_uid));
              if (tSnap.exists()) {
                return {
                  id: p.tenant_uid,
                  propertyName: p.name,
                  ...tSnap.data(),
                };
              }
              return null;
            })
        );
        setTenants(tenantData.filter(Boolean));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('Delete tenant?')) return;
    try {
      await deleteDoc(doc(db, 'Users', uid));
      const propQuery = query(collection(db, 'Properties'), where('tenant_uid', '==', uid));
      const snap = await getDocs(propQuery);
      await Promise.all(
        snap.docs.map((d) => updateDoc(doc(db, 'Properties', d.id), { tenant_uid: '' }))
      );
      setTenants((prev) => prev.filter((t) => t.id !== uid));
    } catch (e) {
      console.error('Failed to delete tenant', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>EasyLease</h1>
          <div className="hidden md:flex items-center space-x-6">
            {firstName && <span className="font-medium text-white dark:text-gray-100">{firstName}</span>}
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:scale-105 transform transition dark:from-gray-700 dark:to-gray-900"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">👥 Tenants</a>
            <a href="/approve-requests" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">✅ Approve Requests</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
            <a href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</a>
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

        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Your Tenants</h2>
          {tenants.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No tenants found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tenants.map((t) => (
                <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                  <h3 className="text-lg font-medium dark:text-gray-100">{t.first_name} {t.last_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Property: {t.propertyName}</p>
                  <button
                    className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleDelete(t.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
