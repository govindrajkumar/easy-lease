import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';


export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [newProperty, setNewProperty] = useState({
    name: '',
    description: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    zip_code: '',
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentProp, setCurrentProp] = useState(null);
  const [newProp, setNewProp] = useState({ name: '', address: '', units: 1 });
  const [currentTab, setCurrentTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  // System theme detection (set once on mount)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
  }, []);

  // Apply dark mode class to root
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

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

  // Fetch properties from Firestore for this landlord
  useEffect(() => {
    if (!user) return;
    const fetchProperties = async () => {
      try {
        const q = query(collection(db, 'Properties'), where('landlord_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const props = [];
        querySnapshot.forEach((doc) => {
          props.push({ id: doc.id, ...doc.data() });
        });
        setProperties(props);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchProperties();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const openDetail = (prop) => {
    setCurrentProp(prop);
    setCurrentTab('overview');
    setShowDetailModal(true);
  };

  // Add property to Firestore
  const handleAddProperty = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);

    // Basic validation
    if (!newProperty.name.trim() || !newProperty.address_line1.trim() || !newProperty.city.trim() || !newProperty.province.trim() || !newProperty.zip_code.trim()) {
      setAddError('Please fill all required fields.');
      setAddLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'Properties'), {
        name: newProperty.name,
        description: newProperty.description,
        address_line1: newProperty.address_line1,
        address_line2: newProperty.address_line2,
        city: newProperty.city,
        province: newProperty.province,
        zip_code: newProperty.zip_code,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        landlord_id: user?.uid || '',
      });
      setAddSuccess('Property added successfully!');
      setNewProperty({
        name: '',
        description: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: '',
        zip_code: '',
      });
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1200);
    } catch (err) {
      setAddError('Failed to add property. Please try again.');
    }
    setAddLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 antialiased">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg pt-20">
        <nav className="flex-1 px-4 space-y-2">
          <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🏢 Properties</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🔔 Announcements</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments & Billing</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📊 Analytics</a>
          <a href="#" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">⚙️ Settings</a>
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

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-tr from-purple-700 to-blue-500 text-white fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-2 md:px-4 lg:px-6 py-4 max-w-none dark:from-gray-900 dark:to-gray-800">
          <h1
            className="text-2xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            EasyLease
          </h1>
          <div className="hidden md:flex items-center space-x-6">
            <button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-green-500 to-green-700 text-white hover:scale-105 transform transition dark:from-green-700 dark:to-green-900"
              onClick={() => setShowAddModal(true)}
            >
              Add Property
            </button>
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
        </header>

        {/* Properties Table */}
        <main className="pt-24 p-6 overflow-auto mx-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Address</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">City</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Province</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {properties.map((prop) => (
                  <tr
                    key={prop.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => openDetail(prop)}
                  >
                    <td className="px-6 py-4 text-sm dark:text-gray-100">{prop.name}</td>
                    <td className="px-6 py-4 text-sm dark:text-gray-100">
                      {prop.address_line1
                        ? prop.address_line1
                        : <span className="italic text-gray-400 dark:text-gray-500">No address</span>}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-100">{prop.city || <span className="italic text-gray-400 dark:text-gray-500">—</span>}</td>
                    <td className="px-6 py-4 text-sm dark:text-gray-100">{prop.province || <span className="italic text-gray-400 dark:text-gray-500">—</span>}</td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">
                      No properties found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Add Property Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 text-2xl"
                onClick={() => setShowAddModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Add Property</h2>
              <form className="space-y-4" onSubmit={handleAddProperty}>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Name*</label>
                  <input
                    type="text"
                    value={newProperty.name}
                    onChange={e => setNewProperty({ ...newProperty, name: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Description</label>
                  <textarea
                    value={newProperty.description}
                    onChange={e => setNewProperty({ ...newProperty, description: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Address Line 1*</label>
                  <input
                    type="text"
                    value={newProperty.address_line1}
                    onChange={e => setNewProperty({ ...newProperty, address_line1: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Address Line 2</label>
                  <input
                    type="text"
                    value={newProperty.address_line2}
                    onChange={e => setNewProperty({ ...newProperty, address_line2: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">City*</label>
                  <input
                    type="text"
                    value={newProperty.city}
                    onChange={e => setNewProperty({ ...newProperty, city: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Province*</label>
                  <input
                    type="text"
                    value={newProperty.province}
                    onChange={e => setNewProperty({ ...newProperty, province: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Zip Code*</label>
                  <input
                    type="text"
                    value={newProperty.zip_code}
                    onChange={e => setNewProperty({ ...newProperty, zip_code: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                {addError && <div className="text-red-500 text-center">{addError}</div>}
                {addSuccess && <div className="text-green-600 text-center">{addSuccess}</div>}
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded dark:bg-purple-700"
                    disabled={addLoading}
                  >
                    {addLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Property Detail Modal */}
        {showDetailModal && currentProp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-4xl relative">
              <button
                className="text-gray-500 dark:text-gray-300 absolute top-4 right-4 text-2xl"
                onClick={() => setShowDetailModal(false)}
              >
                &times;
              </button>
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">{currentProp.name}</h2>

              {/* Tabs */}
              <div className="border-b dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['overview', 'tenants', 'payments', 'maintenance', 'documents'].map((tab) => (
                    <button
                      key={tab}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        currentTab === tab
                          ? 'border-purple-500 text-purple-600 dark:text-purple-300 dark:border-purple-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400'
                      }`}
                      onClick={() => setCurrentTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div>
                {currentTab === 'overview' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Units</p>
                        <p className="text-2xl font-semibold dark:text-gray-100">{currentProp.units}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Tenants</p>
                        <p className="text-2xl font-semibold dark:text-gray-100">{currentProp.tenants.length}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rent Due</p>
                        <p className="text-2xl font-semibold dark:text-gray-100">${currentProp.rentDue}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-200">
                      Address: {[currentProp.address_line1, currentProp.address_line2, currentProp.city, currentProp.province, currentProp.zip_code]
                        .filter(Boolean)
                        .join(', ') || <span className="italic text-gray-400 dark:text-gray-500">No address</span>}
                    </p>
                  </div>
                )}

                {currentTab === 'tenants' && (
                  <table className="min-w-full mb-4">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {currentProp.tenants.map((t, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 dark:text-gray-100">{t.name}</td>
                          <td className="px-6 py-4 dark:text-gray-100">{t.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                t.status === 'Active'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {currentTab === 'payments' && (
                  <table className="min-w-full mb-4">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {currentProp.payments.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 dark:text-gray-100">{inv.date}</td>
                          <td className="px-6 py-4 dark:text-gray-100">${inv.amount}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                inv.status === 'Paid'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                  : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {currentTab === 'maintenance' && (
                  <ul className="space-y-4">
                    {currentProp.maintenance.map((req, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium dark:text-gray-100">{req.issue}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{req.date} • {req.status}</p>
                        </div>
                        <button className="text-purple-600 hover:underline dark:text-purple-300">View Details</button>
                      </li>
                    ))}
                  </ul>
                )}

                {currentTab === 'documents' && (
                  <ul className="space-y-4">
                    {currentProp.documents.map((doc, idx) => (
                      <li key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium dark:text-gray-100">{doc.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{doc.date}</p>
                        </div>
                        <a href={doc.url} className="text-purple-600 hover:underline dark:text-purple-300">Download</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

