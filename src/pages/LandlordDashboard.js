import React, { useState, useEffect } from 'react';
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
} from 'firebase/firestore';

const navItems = [
  { icon: '🏠', label: 'Dashboard', href: '/landlord-dashboard', active: true },
  { icon: '🏢', label: 'Properties', href: '/properties' },
  { icon: '👥', label: 'Tenants', href: '/tenants' },
  { icon: '🔔', label: 'Announcements', href: '/announcements' },
  { icon: '💳', label: 'Payments', href: '/payments' },
  { icon: '🛠️', label: 'Maintenance', href: '/maintenance' },
  { icon: '📊', label: 'Analytics', href: '/analytics' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
];

export default function LandlordDashboard() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [totalRequests, setTotalRequests] = useState(0);
  const [newRequests, setNewRequests] = useState(0);
  const [pendingTenants, setPendingTenants] = useState(0);
  const [rentCollected, setRentCollected] = useState(0);
  const [rentDue, setRentDue] = useState(0);
  const [latePayments, setLatePayments] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});
  const { darkMode } = useTheme();
  const navigate = useNavigate();

  // System theme detection (set once on mount)

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

  useEffect(() => {
    if (!user) return;
    const fetchProperties = async () => {
      const snap = await getDocs(
        query(collection(db, 'Properties'), where('landlord_id', '==', user.uid))
      );
      const map = {};
      snap.forEach((d) => {
        map[d.id] = d.data().name;
      });
      setPropertyMap(map);
    };
    fetchProperties();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const q = query(
          collection(db, 'MaintenanceRequests'),
          where('landlord_id', '==', user.uid)
        );
        const snap = await getDocs(q);
        let open = 0;
        const reqs = [];
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        snap.forEach((d) => {
          const data = d.data();
          reqs.push({ id: d.id, ...data });
          if (data.status === 'Open') open += 1;
          if (data.status === 'Resolved' && data.expense) {
            const created = data.created_at?.seconds
              ? new Date(data.created_at.seconds * 1000)
              : null;
            if (created && created >= start) {
              /* Placeholder for expenses */
            }
          }
        });
        reqs.sort((a, b) => {
          const aDate = a.created_at?.seconds
            ? new Date(a.created_at.seconds * 1000)
            : new Date(0);
          const bDate = b.created_at?.seconds
            ? new Date(b.created_at.seconds * 1000)
            : new Date(0);
          return bDate - aDate;
        });
        setRecentMaintenance(reqs.slice(0, 3));
        setTotalRequests(snap.size);
        setNewRequests(open);
      } catch (e) {
        console.error('Failed to fetch maintenance data', e);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchTenants = async () => {
      try {
        const q = query(
          collection(db, 'TenantRequests'),
          where('landlord_email', '==', user.email),
          where('status', '==', 'Pending')
        );
        const snap = await getDocs(q);
        setPendingTenants(snap.size);
      } catch (e) {
        console.error('Failed to fetch tenant requests', e);
      }
    };
    fetchTenants();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchPayments = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'RentPayments'), where('landlord_uid', '==', user.uid))
        );
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        let collected = 0;
        let due = 0;
        let late = 0;
        const now = new Date();
        data.forEach((p) => {
          const amt = parseFloat(p.amount);
          if (p.paid) collected += amt;
          else {
            due += amt;
            if (new Date(p.due_date) < now) late += 1;
          }
        });
        const upcoming = data
          .filter((p) => !p.paid)
          .map((p) => ({ ...p, dueDate: new Date(p.due_date) }))
          .filter((p) => p.dueDate >= now)
          .sort((a, b) => a.dueDate - b.dueDate)
          .slice(0, 4)
          .map((p) => ({
            id: p.id,
            property: propertyMap[p.property_id] || 'Unknown',
            dueDate: p.dueDate,
            amount: p.amount,
          }));
        setUpcomingPayments(upcoming);
        setRentCollected(collected);
        setRentDue(due);
        setLatePayments(late);
      } catch (e) {
        console.error('Failed to fetch payments', e);
      }
    };
    fetchPayments();
  }, [user, propertyMap]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const formatDue = (date) => {
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Due today';
    if (diff === 1) return 'Due in 1 day';
    return `Due in ${diff} days`;
  };

  const statusColor = {
    Open: 'text-red-500 dark:text-red-400',
    'In Progress': 'text-yellow-500 dark:text-yellow-400',
    Resolved: 'text-green-500 dark:text-green-400',
    Completed: 'text-green-500 dark:text-green-400',
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
                } relative`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {item.label}
                {item.label === 'Maintenance' && newRequests > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs rounded-full px-2">
                    {newRequests}
                  </span>
                )}
                {item.label === 'Tenants' && pendingTenants > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs rounded-full px-2">
                    {pendingTenants}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      )}

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
              👥 Tenants
              {pendingTenants > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs rounded-full px-2">
                  {pendingTenants}
                </span>
              )}
            </a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative">
              🛠️ Maintenance
              {newRequests > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs rounded-full px-2">
                  {newRequests}
                </span>
              )}
            </a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
            <a href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</a>
          </nav>
          <div className="px-6 py-4 border-t dark:border-gray-700">
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
              {/* Rent Collected */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Rent Collected</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">${rentCollected.toFixed(2)}</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">💰</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Payments received.</p>
              </div>

              {/* Total Rent Due */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Total Rent Due</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">${rentDue.toFixed(2)}</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">📄</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Overall outstanding rent.</p>
              </div>


              {/* Late Payments */}
              <a
                href="/payments"
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-300">Late Payments</p>
                    <p className="text-2xl font-semibold dark:text-gray-100">{latePayments}</p>
                  </div>
                  <div className="text-purple-600 bg-purple-100 dark:bg-gray-700 p-3 rounded-full">⏰</div>
                </div>
                <p className="text-xs text-gray-400 mt-2 dark:text-gray-300">Payments past due date.</p>
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
                  {upcomingPayments.length > 0 ? (
                    upcomingPayments.map((p) => (
                      <li key={p.id} className="flex justify-between">
                        <span>{`${p.property} - ${formatDue(p.dueDate)}`}</span>
                        <span className="font-medium">${p.amount}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No upcoming payments</li>
                  )}
                </ul>
                <a href="/payments" className="mt-4 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
                  View all payments
                </a>
              </section>

              {/* Recent Maintenance */}
              <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-100">Recent Maintenance</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-200">
                  {recentMaintenance.length > 0 ? (
                    recentMaintenance.map((r) => (
                      <li key={r.id}>
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {propertyMap[r.property_id] || 'Unknown'} · <span className={statusColor[r.status] || ''}>{r.status}</span>
                            </p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {r.created_at?.seconds ? new Date(r.created_at.seconds * 1000).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500">No recent requests</li>
                  )}
                </ul>
                <a href="/maintenance" className="mt-4 inline-block text-purple-700 font-medium hover:underline dark:text-purple-300">
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
