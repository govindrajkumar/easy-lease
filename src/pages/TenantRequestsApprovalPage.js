// TenantRequestsApprovalPage.js
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
  addDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

export default function TenantRequestsApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [leaseDetails, setLeaseDetails] = useState({
    rent: '',
    startDate: '',
    endDate: '',
    deposit: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) {
          setFirstName(snap.data().first_name || '');
          const email = u.email;
          const q = query(
            collection(db, 'TenantRequests'),
            where('landlord_email', '==', email),
            where('status', '==', 'Pending')
          );
          const snapshot = await getDocs(q);

          const requestsWithNames = await Promise.all(
            snapshot.docs.map(async (d) => {
              const req = d.data();
              const userSnap = await getDoc(doc(db, 'Users', req.tenant_uid));
              return {
                id: d.id,
                tenant_uid: req.tenant_uid,
                tenant_name: userSnap.exists() ? userSnap.data().first_name : 'Unknown',
                created_at: req.created_at,
              };
            })
          );

          setRequests(requestsWithNames);

          const propQuery = query(
            collection(db, 'Properties'),
            where('landlord_id', '==', u.uid)
          );
          const propSnapshot = await getDocs(propQuery);
          const props = propSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setProperties(props);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const openAssignModal = (req) => {
    setSelectedRequest(req);
    setSelectedPropertyId('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedPropertyId) return;
    setAssignLoading(true);
    try {
      await updateDoc(doc(db, 'Users', selectedRequest.tenant_uid), { status: 'Active' });
      const prop = properties.find((p) => p.id === selectedPropertyId);
      if (prop && (prop.tenants || []).length >= 4) {
        alert('This property already has the maximum number of tenants.');
        setAssignLoading(false);
        return;
      }
      await updateDoc(doc(db, 'Properties', selectedPropertyId), {
        tenants: arrayUnion(selectedRequest.tenant_uid),
      });
      await updateDoc(doc(db, 'TenantRequests', selectedRequest.id), { status: 'Approved' });
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      setShowAssignModal(false);
      setLeaseDetails({ rent: '', startDate: '', endDate: '', deposit: '' });
      setShowLeaseModal(true);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleSaveLease = async () => {
    if (!selectedRequest || !selectedPropertyId) return;
    try {
      await addDoc(collection(db, 'Leases'), {
        tenant_uid: selectedRequest.tenant_uid,
        property_id: selectedPropertyId,
        rent_amount: leaseDetails.rent,
        start_date: leaseDetails.startDate,
        end_date: leaseDetails.endDate,
        security_deposit: leaseDetails.deposit,
        created_at: serverTimestamp(),
      });
      // create initial rent payment record
      await addDoc(collection(db, 'RentPayments'), {
        tenant_uid: selectedRequest.tenant_uid,
        landlord_uid: user.uid,
        property_id: selectedPropertyId,
        amount: leaseDetails.rent,
        due_date: leaseDetails.startDate,
        paid: false,
        created_at: serverTimestamp(),
      });
      setShowLeaseModal(false);
    } catch (e) {
      console.error('Failed to save lease', e);
      alert('Failed to save lease details');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4">
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            EasyLease
          </h1>
          <div className="hidden md:flex items-center space-x-6">
            {firstName && <span>{firstName}</span>}
            <button
              onClick={handleLogout}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:scale-105 transform transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments</a>
            <a href="/maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
            <a href="/analytics" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
            <a href="/settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          <h2 className="text-2xl font-bold mb-6">Pending Tenant Requests</h2>
          {requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No pending requests at this time.</p>
          ) : (
            <ul className="space-y-4">
              {requests.map((req) => (
                <li key={req.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium">{req.tenant_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Requested on: {req.created_at?.seconds ? new Date(req.created_at.seconds * 1000).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => openAssignModal(req)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Assign Property</h3>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full border rounded p-2 mb-4 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>
                Select property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address_line1 || p.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                onClick={() => setShowAssignModal(false)}
                disabled={assignLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                onClick={handleAssign}
                disabled={!selectedPropertyId || assignLoading}
              >
                {assignLoading ? 'Assigning...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showLeaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">Lease Details</h3>
            <input
              type="number"
              placeholder="Rent Amount"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={leaseDetails.rent}
              onChange={(e) => setLeaseDetails({ ...leaseDetails, rent: e.target.value })}
            />
            <input
              type="text"
              placeholder="Security Deposit"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={leaseDetails.deposit}
              onChange={(e) => setLeaseDetails({ ...leaseDetails, deposit: e.target.value })}
            />
            <input
              type="date"
              placeholder="Start Date"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={leaseDetails.startDate}
              onChange={(e) => setLeaseDetails({ ...leaseDetails, startDate: e.target.value })}
            />
            <input
              type="date"
              placeholder="End Date"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={leaseDetails.endDate}
              onChange={(e) => setLeaseDetails({ ...leaseDetails, endDate: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                onClick={() => setShowLeaseModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSaveLease}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
