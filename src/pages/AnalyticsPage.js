import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [metrics, setMetrics] = useState({
    properties: 0,
    occupied: 0,
    tenants: 0,
    pendingRequests: 0,
    rentRate: 0,
  });
  const [rentChartData, setRentChartData] = useState(null);
  const [expenseChartData, setExpenseChartData] = useState(null);
  const [occupancyChartData, setOccupancyChartData] = useState(null);
  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;
      const snap = await getDoc(doc(db, 'Users', u.uid));
      if (snap.exists()) setFirstName(snap.data().first_name || '');

      // properties and tenants
      const propSnap = await getDocs(
        query(collection(db, 'Properties'), where('landlord_id', '==', u.uid))
      );
      const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      let occupied = 0;
      const tenantSet = new Set();
      const occupancyLabels = [];
      const occupancyValues = [];
      props.forEach((data) => {
        const t = data.tenants || [];
        occupied += t.length;
        t.forEach((id) => tenantSet.add(id));
        occupancyLabels.push(data.name);
        occupancyValues.push(t.length);
      });
      const properties = props.length;
      const tenants = tenantSet.size;

      // maintenance requests for pending count and expenses
      const reqSnap = await getDocs(
        query(collection(db, 'MaintenanceRequests'), where('landlord_id', '==', u.uid))
      );
      let pendingRequests = 0;
      const expenseMap = {};
      reqSnap.forEach((d) => {
        const r = d.data();
        if (r.status === 'Open') pendingRequests += 1;
        if (r.status === 'Resolved' && r.expense) {
          expenseMap[r.property_id] = (expenseMap[r.property_id] || 0) + parseFloat(r.expense);
        }
      });
      const expenseLabels = props.map((p) => p.name);
      const expenseValues = props.map((p) => expenseMap[p.id] || 0);

      // rent payments
      const paySnap = await getDocs(
        query(collection(db, 'RentPayments'), where('landlord_uid', '==', u.uid))
      );
      let collected = 0;
      let due = 0;
      const monthly = {};
      paySnap.forEach((d) => {
        const p = d.data();
        const amt = parseFloat(p.amount);
        const date = new Date(p.due_date);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthly[key]) monthly[key] = { collected: 0, due: 0 };
        if (p.paid) {
          collected += amt;
          monthly[key].collected += amt;
        } else {
          due += amt;
        }
        monthly[key].due += amt;
      });
      const rentRate = collected + due > 0 ? (collected / (collected + due)) * 100 : 0;
      const keys = Object.keys(monthly).sort(
        (a, b) => new Date(`${a}-01`) - new Date(`${b}-01`)
      );
      const labels = keys.map((k) => {
        const [y, m] = k.split('-');
        return new Date(y, m - 1).toLocaleString('default', {
          month: 'short',
          year: '2-digit',
        });
      });
      setRentChartData({
        labels,
        datasets: [
          {
            label: 'Collected',
            data: keys.map((k) => monthly[k].collected),
            borderColor: 'rgb(34,197,94)',
            backgroundColor: 'rgba(34,197,94,0.2)',
          },
          {
            label: 'Total Due',
            data: keys.map((k) => monthly[k].due),
            borderColor: 'rgb(147,51,234)',
            backgroundColor: 'rgba(147,51,234,0.2)',
          },
        ],
      });

      setExpenseChartData({
        labels: expenseLabels,
        datasets: [
          {
            label: 'Expenses',
            data: expenseValues,
            backgroundColor: 'rgba(147,51,234,0.6)',
          },
        ],
      });

      const colors = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#F472B6','#34D399'];
      setOccupancyChartData({
        labels: occupancyLabels,
        datasets: [
          {
            data: occupancyValues,
            backgroundColor: colors.slice(0, occupancyValues.length),
          },
        ],
      });

      setMetrics({
        properties,
        occupied,
        tenants,
        pendingRequests,
        rentRate: Number(rentRate.toFixed(1)),
      });
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>EasyLease</h1>
          <div className="hidden md:flex items-center space-x-6">
            {firstName && (
              <span className="font-medium text-white dark:text-gray-100">{firstName}</span>
            )}
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
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">📊 Analytics</a>
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
          <h2 className="text-2xl font-bold mb-8">Analytics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <MetricCard title="Properties" value={metrics.properties} />
            <MetricCard title="Occupied Units" value={metrics.occupied} />
            <MetricCard title="Active Tenants" value={metrics.tenants} />
            <MetricCard title="Pending Requests" value={metrics.pendingRequests} />
            <MetricCard title="Rent Collection Rate" value={`${metrics.rentRate}%`} />
          </div>

          {expenseChartData && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-8 h-64">
              <Bar data={expenseChartData} options={{ maintainAspectRatio: false }} />
            </div>
          )}
          {rentChartData && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-8 h-64">
              <Line data={rentChartData} options={{ maintainAspectRatio: false }} />
            </div>
          )}
          {occupancyChartData && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow flex justify-center h-64">
              <Pie data={occupancyChartData} options={{ maintainAspectRatio: false }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-sm text-gray-500 dark:text-gray-400">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
