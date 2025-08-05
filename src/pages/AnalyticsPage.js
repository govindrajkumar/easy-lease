import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    properties: 0,
    occupied: 0,
    tenants: 0,
    pendingRequests: 0,
    rentRate: 0,
  });
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      // properties and tenants
      const propSnap = await getDocs(
        query(collection(db, 'Properties'), where('landlord_id', '==', user.uid))
      );
      let occupied = 0;
      const tenantSet = new Set();
      propSnap.forEach((d) => {
        const data = d.data();
        const t = data.tenants || [];
        occupied += t.length;
        t.forEach((id) => tenantSet.add(id));
      });
      const properties = propSnap.size;
      const tenants = tenantSet.size;

      // maintenance requests
      const reqSnap = await getDocs(
        query(
          collection(db, 'MaintenanceRequests'),
          where('landlord_id', '==', user.uid),
          where('status', '==', 'Open')
        )
      );
      const pendingRequests = reqSnap.size;

      // rent payments
      const paySnap = await getDocs(
        query(collection(db, 'RentPayments'), where('landlord_uid', '==', user.uid))
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
      setChartData({
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
    <div className={`min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <button
          onClick={() => navigate('/landlord-dashboard')}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          Back
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard title="Properties" value={metrics.properties} />
        <MetricCard title="Occupied Units" value={metrics.occupied} />
        <MetricCard title="Active Tenants" value={metrics.tenants} />
        <MetricCard title="Pending Requests" value={metrics.pendingRequests} />
        <MetricCard
          title="Rent Collection Rate"
          value={`${metrics.rentRate}%`}
        />
      </div>

      {chartData && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <Line data={chartData} />
        </div>
      )}
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
