import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
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
  deleteDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [messageMap, setMessageMap] = useState({});
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const { darkMode } = useTheme();
  const navigate = useNavigate();


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');

        const reqSnap = await getDocs(query(collection(db, 'MaintenanceRequests'), where('landlord_id', '==', u.uid)));
        const data = await Promise.all(
          reqSnap.docs.map(async (d) => {
            const req = d.data();
            const tSnap = await getDoc(doc(db, 'Users', req.tenant_uid));
            const pSnap = await getDoc(doc(db, 'Properties', req.property_id));
            return {
              id: d.id,
              tenantName: tSnap.exists() ? tSnap.data().first_name : 'Unknown',
              propertyName: pSnap.exists() ? pSnap.data().name : '',
              ...req,
            };
          })
        );
        setRequests(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const resolveRequest = async (id) => {
    await updateDoc(doc(db, 'MaintenanceRequests', id), { status: 'Resolved' });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' } : r)));
  };

  const deleteRequest = async (id) => {
    await deleteDoc(doc(db, 'MaintenanceRequests', id));
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const sendMessage = async (id) => {
    const msg = messageMap[id]?.trim();
    if (!msg) return;
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    await addDoc(collection(db, 'Messages'), {
      from: user.uid,
      to: req.tenant_uid,
      text: msg,
      created_at: serverTimestamp(),
    });
    setMessageMap((prev) => ({ ...prev, [id]: '' }));
    alert('Message sent');
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
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🛠️ Maintenance</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{r.tenantName} – {r.propertyName}</p>
                  <p className="text-sm">Status: {r.status}</p>
                </div>
                <div className="space-x-2">
                  <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => resolveRequest(r.id)}>Resolve</button>
                  <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteRequest(r.id)}>Delete</button>
                </div>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Send message"
                  value={messageMap[r.id] || ''}
                  onChange={(e) => setMessageMap({ ...messageMap, [r.id]: e.target.value })}
                  className="flex-1 border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                />
                <button className="px-3 py-2 bg-purple-600 text-white rounded" onClick={() => sendMessage(r.id)}>
                  Send
                </button>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No maintenance requests.</p>
          )}
        </div>
      </div>
    </div>
  );
}
