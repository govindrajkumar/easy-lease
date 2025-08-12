import React, { useEffect, useState } from 'react';
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
  arrayRemove,
} from 'firebase/firestore';
import MobileNav from '../components/MobileNav';
import { landlordNavItems } from '../constants/navItems';

export default function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [filterProp, setFilterProp] = useState('');
  const [showRequestsModal, setShowRequestsModal] = useState(false);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
  const navigate = useNavigate();

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
        const tenantData = [];
        for (const p of props) {
          const tList = p.tenants || (p.tenant_uid ? [p.tenant_uid] : []);
          for (const tid of tList) {
            const tSnap = await getDoc(doc(db, 'Users', tid));
            if (tSnap.exists()) {
              tenantData.push({ id: tid, propertyName: p.name, ...tSnap.data() });
            }
          }
        }
        
        setTenants(tenantData.filter(Boolean));

        const reqQuery = query(
          collection(db, 'TenantRequests'),
          where('landlord_email', '==', u.email),
          where('status', '==', 'Pending')
        );
        const reqSnap = await getDocs(reqQuery);
        const requestsWithNames = await Promise.all(
          reqSnap.docs.map(async (d) => {
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
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const navItems = landlordNavItems({ active: 'tenants', pendingTenants: requests.length });

  const handleDelete = async (uid) => {
    if (!window.confirm('Delete tenant?')) return;
    try {
      await deleteDoc(doc(db, 'Users', uid));
      const propQuery = query(collection(db, 'Properties'), where('tenants', 'array-contains', uid));
      const snap = await getDocs(propQuery);
      await Promise.all(
        snap.docs.map((d) => updateDoc(doc(db, 'Properties', d.id), { tenants: arrayRemove(uid) }))
      );
      const oldQuery = query(collection(db, 'Properties'), where('tenant_uid', '==', uid));
      const oldSnap = await getDocs(oldQuery);
      await Promise.all(
        oldSnap.docs.map((d) => updateDoc(doc(db, 'Properties', d.id), { tenant_uid: '' }))
      );
      setTenants((prev) => prev.filter((t) => t.id !== uid));
    } catch (e) {
      console.error('Failed to delete tenant', e);
    }
  };

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

  const openEditModal = (tenant) => {
    setEditTenant(tenant);
    setEditForm({
      first_name: tenant.first_name || '',
      last_name: tenant.last_name || '',
      email: tenant.email || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateTenant = async () => {
    if (!editTenant) return;
    try {
      await updateDoc(doc(db, 'Users', editTenant.id), {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
      });
      setTenants((prev) =>
        prev.map((t) =>
          t.id === editTenant.id
            ? { ...t, first_name: editForm.first_name, last_name: editForm.last_name, email: editForm.email }
            : t
        )
      );
      setShowEditModal(false);
    } catch (e) {
      console.error('Failed to update tenant', e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col antialiased text-gray-800 bg-white dark:bg-gray-900 dark:text-gray-100">
      <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed w-full z-30 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>EasyLease</h1>
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => setShowRequestsModal(true)}
              className="relative px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Requests
              {requests.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
                  {requests.length}
                </span>
              )}
            </button>
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
            <MobileNav navItems={navItems} handleLogout={handleLogout} />
        </div>
      </header>

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">👥 Tenants</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
            <a href="/payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
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

        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Your Tenants</h2>
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
          {tenants.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No tenants found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tenants
                .filter((t) => (filterProp ? t.propertyName === filterProp : true))
                .map((t) => (
                <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                  <h3 className="text-lg font-medium dark:text-gray-100">{t.first_name} {t.last_name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Property: {t.propertyName}</p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => openEditModal(t)}
                    >
                      Modify
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">Pending Tenant Requests</h3>
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
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                onClick={() => setShowRequestsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
              {properties.map((p) => {
                const full = (p.tenants || []).length >= 4;
                return (
                  <option key={p.id} value={p.id} disabled={full}>
                    {p.address_line1 || p.name}{full ? ' (Full)' : ''}
                  </option>
                );
              })}
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
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">Modify Tenant</h3>
            <input
              type="text"
              placeholder="First Name"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleUpdateTenant}
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
