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
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';

export default function PaymentsPage() {
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filterProp, setFilterProp] = useState('');
  const [rentCollected, setRentCollected] = useState(0);
  const [rentDue, setRentDue] = useState(0);
  const [latePayments, setLatePayments] = useState(0);
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  const computeStats = (list) => {
    let collected = 0;
    let due = 0;
    let late = 0;
    const now = new Date();
    list.forEach((p) => {
      const amt = parseFloat(p.amount);
      if (p.paid) collected += amt;
      else {
        due += amt;
        if (new Date(p.due_date) < now) late += 1;
      }
    });
    setRentCollected(collected);
    setRentDue(due);
    setLatePayments(late);
  };


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
        setProperties(props);

        const paySnap = await getDocs(
          query(collection(db, 'RentPayments'), where('landlord_uid', '==', u.uid))
        );
        const data = await Promise.all(
          paySnap.docs.map(async (d) => {
            const p = d.data();
            const prop = await getDoc(doc(db, 'Properties', p.property_id));
            const tenant = await getDoc(doc(db, 'Users', p.tenant_uid));
            return {
              id: d.id,
              propertyName: prop.exists() ? prop.data().name : '',
              tenantName: tenant.exists() ? tenant.data().first_name : '',
              ...p,
            };
          })
        );
        setPayments(data);

        computeStats(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const markPaid = async (id) => {
    await updateDoc(doc(db, 'RentPayments', id), {
      paid: true,
      paid_at: serverTimestamp(),
    });
    setPayments((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, paid: true } : p));
      computeStats(updated);
      return updated;
    });
  };

  const sendReminder = async (p) => {
    await addDoc(collection(db, 'RentReminders'), {
      tenant_uid: p.tenant_uid,
      property_id: p.property_id,
      amount: p.amount,
      due_date: p.due_date,
      landlord_uid: user.uid,
      created_at: serverTimestamp(),
    });
    alert('Reminder sent');
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
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">💳 Payments & Billing</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-gray-500">Rent Collected</p>
              <p className="text-2xl font-semibold">${rentCollected}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-gray-500">Rent Due</p>
              <p className="text-2xl font-semibold">${rentDue}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
              <p className="text-gray-500">Late Payments</p>
              <p className="text-2xl font-semibold">{latePayments}</p>
            </div>
          </div>

          <div>
            <div className="mb-4">
              <select
                value={filterProp}
                onChange={(e) => setFilterProp(e.target.value)}
                className="border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">All Properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <table className="min-w-full bg-white dark:bg-gray-800 rounded">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Tenant</th>
                  <th className="p-2">Property</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Due Date</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .filter((p) => (filterProp ? p.propertyName === filterProp : true))
                  .map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2">{p.tenantName}</td>
                      <td className="p-2">{p.propertyName}</td>
                      <td className="p-2">${p.amount}</td>
                      <td className="p-2">{p.due_date}</td>
                      <td className="p-2">{p.paid ? 'Paid' : 'Unpaid'}</td>
                      <td className="p-2 space-x-2">
                        {!p.paid && (
                          <button
                            className="px-2 py-1 bg-green-600 text-white rounded"
                            onClick={() => markPaid(p.id)}
                          >
                            Mark as Paid
                          </button>
                        )}
                        <button
                          className="px-2 py-1 bg-gray-200 rounded"
                          onClick={() => sendReminder(p)}
                        >
                          Reminder
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
