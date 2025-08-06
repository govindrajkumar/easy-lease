import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [activePayment, setActivePayment] = useState(null);
  const [ccInfo, setCcInfo] = useState({ number: '', expiry: '', cvc: '' });
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');
        const unpaidQuery = query(
          collection(db, 'RentPayments'),
          where('tenant_uid', '==', u.uid),
          where('paid', '==', false)
        );
        const paySnap = await getDocs(unpaidQuery);
        const unpaid = await Promise.all(
          paySnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.property_id)
            .map(async (p) => {
              const propSnap = await getDoc(doc(db, 'Properties', p.property_id));
              return {
                ...p,
                propertyName: propSnap.exists() ? propSnap.data().name : '',
              };
            })
        );
        const paidQuery = query(
          collection(db, 'RentPayments'),
          where('tenant_uid', '==', u.uid),
          where('paid', '==', true)
        );
        const paidSnap = await getDocs(paidQuery);
        const paid = await Promise.all(
          paidSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.property_id)
            .map(async (p) => {
              const propSnap = await getDoc(doc(db, 'Properties', p.property_id));
              return {
                ...p,
                propertyName: propSnap.exists() ? propSnap.data().name : '',
              };
            })
        );
        setPayments(unpaid);
        setHistory(paid);

        const remSnap = await getDocs(
          query(collection(db, 'RentReminders'), where('tenant_uid', '==', u.uid))
        );
        const rems = await Promise.all(
          remSnap.docs.map(async (d) => {
            const r = d.data();
            const propSnap = await getDoc(doc(db, 'Properties', r.property_id));
            return {
              id: d.id,
              propertyName: propSnap.exists() ? propSnap.data().name : '',
              ...r,
            };
          })
        );
        setReminders(rems);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubMessages;
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (unsubMessages) unsubMessages();
      if (u) {
        const q = query(collection(db, 'Messages'), where('to', '==', u.uid), where('read', '==', false));
        unsubMessages = onSnapshot(q, (snap) => setUnread(snap.size));
      } else {
        setUnread(0);
      }
    });
    return () => {
      if (unsubMessages) unsubMessages();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const handlePay = async (p) => {
    await updateDoc(doc(db, 'RentPayments', p.id), {
      paid: true,
      paid_at: serverTimestamp(),
    });
    setPayments((prev) => prev.filter((x) => x.id !== p.id));
    setHistory((prev) => [...prev, { ...p, paid: true, paid_at: new Date() }]);
    setActivePayment(null);
    setCcInfo({ number: '', expiry: '', cvc: '' });
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
            <a href="/tenant-payments" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">💳 Payments</a>
              <a href="/tenant-maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance{unread > 0 && <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-2">{unread}</span>}</a>
            <a href="/tenant-announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/tenant-settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile &amp; Settings</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold">Rent Reminders</h2>
            <div className="space-y-4">
              {reminders.map((r) => (
                <div key={r.id} className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{r.propertyName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due {r.due_date}</p>
                    </div>
                    <span className="font-semibold">${r.amount}</span>
                  </div>
                </div>
              ))}
              {reminders.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center">No reminders.</p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold">Outstanding Invoices</h2>
            <div className="space-y-4">
              {payments.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{p.propertyName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due {p.due_date}</p>
                    </div>
                    <span className="font-semibold">${p.amount}</span>
                  </div>
                  <button
                    className="mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    onClick={() => setActivePayment(p)}
                  >
                    Pay Now
                  </button>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center">No outstanding payments.</p>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <div className="space-y-4">
              {history.map((p) => (
                <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{p.propertyName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Paid {p.due_date}</p>
                    </div>
                    <span className="font-semibold">${p.amount}</span>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center">No payments yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {activePayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">
              Pay ${activePayment.amount}
            </h3>
            <input
              type="text"
              placeholder="Card Number"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              value={ccInfo.number}
              onChange={(e) => setCcInfo({ ...ccInfo, number: e.target.value })}
            />
            <input
              type="text"
              placeholder="Expiry (MM/YY)"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              value={ccInfo.expiry}
              onChange={(e) => setCcInfo({ ...ccInfo, expiry: e.target.value })}
            />
            <input
              type="text"
              placeholder="CVC"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              value={ccInfo.cvc}
              onChange={(e) => setCcInfo({ ...ccInfo, cvc: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                onClick={() => setActivePayment(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded"
                onClick={() => handlePay(activePayment)}
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
