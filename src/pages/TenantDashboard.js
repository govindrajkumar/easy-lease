import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [landlordEmail, setLandlordEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const [property, setProperty] = useState(null);
  const [lease, setLease] = useState(null);

  const userFirstName = sessionStorage.getItem('user_first_name');
  const userEmail = sessionStorage.getItem('user_email');

  useEffect(() => {
    const fetchUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'Users', user.uid));
        if (snap.exists()) {
          const userData = snap.data();
          sessionStorage.setItem('user_first_name', userData.first_name);
          sessionStorage.setItem('user_email', userData.email);
          setStatus(userData.status || 'Inactive');
        } else {
          setStatus('Inactive');
        }
      } catch (err) {
        console.error('Failed to fetch user data', err);
        setStatus('Inactive');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatus();
  }, [navigate]);

  useEffect(() => {
    const fetchLeaseInfo = async () => {
      if (status !== 'Active') return;
      const user = auth.currentUser;
      if (!user) return;
      let propSnap = await getDocs(
        query(collection(db, 'Properties'), where('tenants', 'array-contains', user.uid))
      );
      if (propSnap.empty) {
        propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', user.uid)));
      }
      if (!propSnap.empty) {
        const propDoc = propSnap.docs[0];
        const propData = { id: propDoc.id, ...propDoc.data() };
        setProperty(propData);
        const leaseQuery = query(
          collection(db, 'Leases'),
          where('tenant_uid', '==', user.uid),
          where('property_id', '==', propDoc.id)
        );
        const leaseSnap = await getDocs(leaseQuery);
        if (!leaseSnap.empty) {
          const leaseDoc = leaseSnap.docs[0];
          setLease({ id: leaseDoc.id, ...leaseDoc.data() });
        }
      }
    };
    fetchLeaseInfo();
  }, [status]);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !landlordEmail.trim()) return;

    try {
      setSendingRequest(true);
      await addDoc(collection(db, 'TenantRequests'), {
        tenant_uid: user.uid,
        landlord_email: landlordEmail.trim().toLowerCase(),
        status: 'Pending',
        created_at: serverTimestamp(),
      });

      await updateDoc(doc(db, 'Users', user.uid), {
        status: 'Pending',
      });

      setRequestSent(true);
      setStatus('Pending');
    } catch (err) {
      console.error('Error sending request:', err);
      alert('Failed to send request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const Header = () => (
    <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
        <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>EasyLease</h1>
        <div className="hidden md:flex items-center space-x-6">
          {userFirstName && (
            <span className="font-medium text-white dark:text-gray-100">{userFirstName}</span>
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
  );

  if (status === 'Inactive') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 pt-20">
          <div className="bg-yellow-100 border-l-4 border-yellow-600 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100 p-6 rounded-lg max-w-lg text-center shadow space-y-4">
            <div className="text-3xl">⚠️</div>
            <h2 className="text-lg font-bold">You're not yet assigned to a property.</h2>
            <p>Please ask your landlord for their email and enter it below:</p>

            {requestSent ? (
              <p className="text-green-600 dark:text-green-400 font-medium">Request sent! Please wait for your landlord to approve it.</p>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Landlord Email"
                  value={landlordEmail}
                  onChange={(e) => setLandlordEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded border dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  if (status === 'Pending') {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-4 pt-20">
          <div className="bg-yellow-100 border-l-4 border-yellow-600 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-100 p-6 rounded-lg max-w-lg text-center shadow space-y-3">
            <div className="text-3xl">⏳</div>
            <h2 className="text-lg font-bold">Request Pending</h2>
            <p>Your request has been sent. Please wait for your landlord to approve it.</p>
          </div>
        </div>
      </>
    );
  }

  // Active dashboard rendering below...



  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
            EasyLease
          </h1>
          <div className="hidden md:flex items-center space-x-6">
            {userFirstName && (
              <span className="font-medium text-white dark:text-gray-100">{userFirstName}</span>
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
            <a href="/tenant-dashboard" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">📄 Lease Info</a>
            <a href="/tenant-payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments</a>
            <a href="/tenant-maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/tenant-announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/tenant-settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile &amp; Settings</a>
          </nav>
          <div className="px-6 py-4 border-t dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <span className="text-xl">👤</span>
              <div>
                <div className="font-medium dark:text-gray-100">{userFirstName || "User"}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{userEmail || ""}</div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 overflow-y-auto space-y-8">
            {/* Render main dashboard (Active tenant) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Property</h3>
                <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{property ? property.name : 'N/A'}</p>
                {property && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{property.address_line1}</p>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Lease Period</h3>
                {lease ? (
                  <>
                    <p className="text-2xl font-semibold mt-2 dark:text-gray-100">
                      {lease.start_date} – {lease.end_date}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Rent: ${lease.rent_amount}</p>
                  </>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">N/A</p>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-sm text-gray-500 dark:text-gray-400">Security Deposit</h3>
                <p className="text-2xl font-semibold mt-2 dark:text-gray-100">{lease ? `$${lease.security_deposit}` : 'N/A'}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
