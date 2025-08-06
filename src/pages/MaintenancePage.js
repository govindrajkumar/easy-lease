import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
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
  serverTimestamp,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';

export default function MaintenancePage() {
  const [requests, setRequests] = useState([]);
  const [messageMap, setMessageMap] = useState({});
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [properties, setProperties] = useState([]);
  const [filterProp, setFilterProp] = useState('');
  const [tab, setTab] = useState('Open');
  const [activeReq, setActiveReq] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [expense, setExpense] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ property_id: '', title: '', details: '' });
  const { darkMode } = useTheme();
  const navigate = useNavigate();


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');

        const propSnap = await getDocs(query(collection(db, 'Properties'), where('landlord_id', '==', u.uid)));
        const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProperties(props);

        const reqSnap = await getDocs(query(collection(db, 'MaintenanceRequests'), where('landlord_id', '==', u.uid)));
        const data = await Promise.all(
          reqSnap.docs.map(async (d) => {
            const req = d.data();
            let tenantName = 'Landlord';
            if (req.tenant_uid) {
              const tSnap = await getDoc(doc(db, 'Users', req.tenant_uid));
              tenantName = tSnap.exists() ? tSnap.data().first_name : 'Unknown';
            }
            const pSnap = await getDoc(doc(db, 'Properties', req.property_id));
            return {
              id: d.id,
              tenantName,
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

  const updateStatus = async (id, status, exp) => {
    const data = { status };
    if (exp !== undefined) data.expense = exp;
    await updateDoc(doc(db, 'MaintenanceRequests', id), data);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const addUpdate = async () => {
    const text = updateText.trim();
    if (!text || !activeReq) return;
    await updateDoc(doc(db, 'MaintenanceRequests', activeReq.id), {
      updates: arrayUnion({ text, by: user.uid, name: firstName, created_at: Timestamp.now() }),
    });
    setRequests((prev) =>
      prev.map((r) =>
        r.id === activeReq.id
          ? {
              ...r,
              updates: [
                ...(r.updates || []),
                { text, by: user.uid, name: firstName, created_at: { seconds: Timestamp.now().seconds } },
              ],
            }
          : r
      )
    );
    setActiveReq((prev) =>
      prev
        ? {
            ...prev,
            updates: [
              ...(prev.updates || []),
              { text, by: user.uid, name: firstName, created_at: { seconds: Timestamp.now().seconds } },
            ],
          }
        : prev
    );
    setUpdateText('');
  };

  const deleteRequest = async (id) => {
    await deleteDoc(doc(db, 'MaintenanceRequests', id));
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const sendMessage = async (id) => {
    const msg = messageMap[id]?.trim();
    if (!msg) return;
    const req = requests.find((r) => r.id === id);
    if (!req || !req.tenant_uid) return;
    await addDoc(collection(db, 'Messages'), {
      from: user.uid,
      to: req.tenant_uid,
      text: msg,
      created_at: serverTimestamp(),
    });
    setMessageMap((prev) => ({ ...prev, [id]: '' }));
    alert('Message sent');
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!form.property_id || !form.title.trim()) return;
    const docRef = await addDoc(collection(db, 'MaintenanceRequests'), {
      title: form.title,
      details: form.details,
      landlord_id: user.uid,
      property_id: form.property_id,
      status: 'Open',
      created_at: serverTimestamp(),
    });
    const propertyName = properties.find((p) => p.id === form.property_id)?.name || '';
    setRequests((prev) => [
      ...prev,
      {
        id: docRef.id,
        title: form.title,
        details: form.details,
        landlord_id: user.uid,
        property_id: form.property_id,
        status: 'Open',
        tenantName: 'Landlord',
        propertyName,
      },
    ]);
    setForm({ property_id: '', title: '', details: '' });
    setFormOpen(false);
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
          <div className="flex items-center space-x-4 mb-4">
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              onClick={() => setFormOpen(true)}
            >
              New Request
            </button>
            <select
              value={filterProp}
              onChange={(e) => setFilterProp(e.target.value)}
              className="border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <div className="flex space-x-2">
              {['Open', 'In Progress', 'Resolved'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded ${tab === t ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {requests
            .filter((r) => (filterProp ? r.propertyName === filterProp : true))
            .filter((r) => r.status === tab)
            .map((r) => (
              <div
                key={r.id}
                className={`${r.status === 'Resolved' ? 'bg-green-100 dark:bg-green-800' : r.status === 'In Progress' ? 'bg-yellow-100 dark:bg-yellow-800' : 'bg-white dark:bg-gray-800'} p-4 rounded-lg shadow space-y-2 cursor-pointer`}
                onClick={() => {
                  setActiveReq(r);
                  setExpense(r.expense || '');
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{r.tenantName} – {r.propertyName}</p>
                    <p className="text-sm">Status: {r.status}</p>
                  </div>
                  <div className="space-x-2">
                    <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={(e) => {e.stopPropagation(); deleteRequest(r.id);}}>Delete</button>
                  </div>
                </div>
                {r.tenant_uid && (
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
                )}
              </div>
            ))}
          {requests.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No maintenance requests.</p>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={submitRequest} className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-medium">New Request</h3>
            <select
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value })}
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              required
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {activeReq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setActiveReq(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium">{activeReq.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{activeReq.tenantName} – {activeReq.propertyName}</p>
            <p>{activeReq.details}</p>
            <p className="text-sm">Status: {activeReq.status}</p>
            {activeReq.expense && <p className="text-sm">Expense: ${activeReq.expense}</p>}
            <div className="max-h-40 overflow-y-auto space-y-1 border-t pt-2">
              {(activeReq.updates || []).map((u, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{u.name}:</span> {u.text}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <input
                type="text"
                className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                placeholder="Add update"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
              />
              <button className="px-4 py-2 bg-purple-600 text-white rounded w-full" onClick={addUpdate}>Add Update</button>
              <select
                value={activeReq.status}
                onChange={(e) => { setActiveReq({ ...activeReq, status: e.target.value }); updateStatus(activeReq.id, e.target.value); }}
                className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              >
                {['Open', 'In Progress', 'Resolved'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {activeReq.status === 'Resolved' && (
                <input
                  type="number"
                  className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Expense"
                  value={expense}
                  onChange={(e) => { setExpense(e.target.value); updateStatus(activeReq.id, 'Resolved', e.target.value); }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
