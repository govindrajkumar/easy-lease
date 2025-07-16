import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TenantDashboard() {
  const navigate = useNavigate();

  // Simulated data (replace with real data as needed)
  const tenantData = {
    overview: {
      nextDue: { amount: '$1,200', date: 'Jul 1, 2025' },
      lease: { start: 'Jan 1, 2025', end: 'Dec 31, 2025', daysLeft: 210 },
      maintenanceOpen: 2,
    },
    lease: {
      property: '', // Empty means not assigned
      rent: '$1,200',
      landlord: { name: 'Jane Doe', email: 'jane@landlord.com', phone: '555-1234' },
      utilities: 'Water & Trash included; Tenant pays electricity & gas',
    },
    history: [
      { date: 'Jun 1, 2025', amount: '$1,200', status: 'Paid', receiptUrl: '#' },
      { date: 'May 1, 2025', amount: '$1,200', status: 'Paid', receiptUrl: '#' },
      { date: 'Apr 1, 2025', amount: '$1,200', status: 'Paid', receiptUrl: '#' },
    ],
  };

  const userFirstName = sessionStorage.getItem('user_first_name');
  const userEmail = sessionStorage.getItem('user_email');

  useEffect(() => {
    if (!userFirstName || !userEmail) {
      navigate('/'); // Redirect to landing if session missing
    }
  }, [navigate, userFirstName, userEmail]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handlePayRentClick = () => {
    alert('Redirecting to payment portal...');
  };

  const handleViewRequestsClick = () => {
    alert('Navigating to maintenance requests...');
  };

  // Check if tenant is assigned to a property
  const notAssigned = !tenantData.lease.property;

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
            {userFirstName && (
              <span className="font-medium text-white dark:text-gray-100">
                {userFirstName}
              </span>
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
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
          <nav className="px-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">📄 Lease Info</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile & Settings</a>
          </nav>
          <div className="mt-auto px-6 py-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-xl">👤</span>
              <div>
                <div className="font-medium dark:text-gray-100">{userFirstName || "User"}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userEmail || ""}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto space-y-8">
            {notAssigned ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg shadow-md max-w-xl w-full text-center mt-24">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="font-semibold text-lg mb-2">The tenant has not been added to a property.</div>
                  <div>Please contact your landlord for assistance.</div>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400">Next Rent Due</h3>
                    <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{tenantData.overview.nextDue.amount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Due on {tenantData.overview.nextDue.date}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400">Lease Period</h3>
                    <p className="text-2xl font-semibold mt-2 dark:text-gray-100">
                      {tenantData.overview.lease.start} – {tenantData.overview.lease.end}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tenantData.overview.lease.daysLeft} days left</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-sm text-gray-500 dark:text-gray-400">Open Maintenance</h3>
                    <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{tenantData.overview.maintenanceOpen}</p>
                    <button
                      className="text-purple-600 hover:underline text-sm mt-1"
                      onClick={handleViewRequestsClick}
                    >
                      View Requests
                    </button>
                  </div>
                </div>

                {/* Lease Details */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Lease Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Property Address</p>
                      <p className="mt-1 dark:text-gray-100">{tenantData.lease.property}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Monthly Rent</p>
                      <p className="mt-1 dark:text-gray-100">{tenantData.lease.rent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Landlord Contact</p>
                      <p className="mt-1 dark:text-gray-100">{tenantData.lease.landlord.name}</p>
                      <div className="mt-2 space-x-4">
                        <a
                          className="text-purple-600 hover:underline"
                          href={`mailto:${tenantData.lease.landlord.email}`}
                        >
                          Email
                        </a>
                        <a
                          className="text-purple-600 hover:underline"
                          href={`tel:${tenantData.lease.landlord.phone}`}
                        >
                          Call
                        </a>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Utilities</p>
                      <p className="mt-1 dark:text-gray-100">{tenantData.lease.utilities}</p>
                    </div>
                  </div>
                </section>

                {/* Payment History */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold dark:text-gray-100">Payment History</h2>
                  </div>
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {tenantData.history.map((pay, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm dark:text-gray-100">{pay.date}</td>
                          <td className="px-6 py-4 text-sm dark:text-gray-100">{pay.amount}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              pay.status === 'Paid'
                                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm dark:text-gray-100">
                            <a href={pay.receiptUrl} className="text-purple-600 hover:underline">
                              Download
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
