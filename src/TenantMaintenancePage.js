import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: '', details: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');
        const propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', u.uid)));
        if (!propSnap.empty) {
          const propDoc = propSnap.docs[0];
          setProperty({ id: propDoc.id, ...propDoc.data() });
          const reqSnap = await getDocs(
            query(collection(db, 'MaintenanceRequests'), where('tenant_uid', '==', u.uid))
          );
          const data = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setRequests(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!property || !form.title.trim()) return;
    await addDoc(collection(db, 'MaintenanceRequests'), {
      title: form.title,
      details: form.details,
      tenant_uid: user.uid,
      landlord_id: property.landlord_id,
      property_id: property.id,
      status: 'Open',
      created_at: serverTimestamp(),
    });
    setForm({ title: '', details: '' });
    setFormOpen(false);
    const reqSnap = await getDocs(
      query(collection(db, 'MaintenanceRequests'), where('tenant_uid', '==', user.uid))
    );
    const data = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setRequests(data);
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
            <a href="/tenant-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📄 Lease Info</a>
            <a href="/tenant-payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments</a>
            <a href="/tenant-maintenance" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🛠️ Maintenance</a>
            <a href="/tenant-announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile &amp; Settings</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <button
            className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={() => setFormOpen(true)}
          >
            New Request
          </button>

          {requests.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition">
              <h3 className="font-medium">{r.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status: {r.status}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{r.created_at?.seconds ? new Date(r.created_at.seconds * 1000).toLocaleDateString() : ''}</p>
              <p className="mt-2">{r.details}</p>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center">No maintenance requests.</p>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={submitRequest} className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-medium dark:text-gray-100">New Request</h3>
            <input
              type="text"
              placeholder="Issue summary"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              required
            />
            <textarea
              placeholder="Details"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
            />
            <div className="flex justify-end space-x-2">
              <button type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
