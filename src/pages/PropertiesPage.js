import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, collection, setDoc, serverTimestamp, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import MobileNav from '../components/MobileNav';
import Sidebar from '../components/Sidebar';
import { landlordNavItems } from '../constants/navItems';
import AddressAutocomplete from '../components/AddressAutocomplete';

const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Northwest Territories',
  'Nunavut',
  'Yukon',
];

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
    photo: '',
    photoFile: null,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentProp, setCurrentProp] = useState(null);
  const [newProp, setNewProp] = useState({ name: '', address: '', units: 1 });
  const [currentTab, setCurrentTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const { darkMode } = useTheme();
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [propertyLeases, setPropertyLeases] = useState([]);
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

  const navItems = landlordNavItems({ active: 'properties' });

  const openDetail = async (prop) => {
    setCurrentProp(prop);
    setCurrentTab('overview');
    setShowDetailModal(true);
    try {
      const q = query(collection(db, 'Leases'), where('property_id', '==', prop.id));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPropertyLeases(list);
    } catch {
      setPropertyLeases([]);
    }
  };

  const openEdit = (prop) => {
    // Ensure all editable fields have default values to avoid sending
    // `undefined` to Firestore, which rejects such updates.
    setEditProperty({
      ...prop,
      name: prop.name || '',
      description: prop.description || '',
      address_line1: prop.address_line1 || '',
      address_line2: prop.address_line2 || '',
      city: prop.city || '',
      province: prop.province || '',
      zip_code: prop.zip_code || '',
      photo: prop.photo || '',
      photoFile: null,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setNewProperty({ ...newProperty, photo: reader.result, photoFile: file });
    reader.readAsDataURL(file);
  };

  const handleEditImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setEditProperty((prev) => ({ ...prev, photo: reader.result, photoFile: file }));
    reader.readAsDataURL(file);
  };

  // Add property to Firestore
  const handleAddProperty = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);

    if (!user) {
      setAddError('You must be logged in to add a property.');
      setAddLoading(false);
      return;
    }

    // Basic validation
    if (
      !newProperty.name.trim() ||
      !newProperty.address_line1.trim() ||
      !newProperty.city.trim() ||
      !newProperty.province.trim() ||
      !newProperty.zip_code.trim()
    ) {
      setAddError('Please fill all required fields.');
      setAddLoading(false);
      return;
    }

    try {
      const docRef = doc(collection(db, 'Properties'));
      let photoURL = '';
      if (newProperty.photoFile) {
        const imageRef = ref(storage, `properties/${docRef.id}`);
        await uploadBytes(imageRef, newProperty.photoFile);
        photoURL = await getDownloadURL(imageRef);
      }
      await setDoc(docRef, {
        name: newProperty.name,
        description: newProperty.description,
        address_line1: newProperty.address_line1,
        address_line2: newProperty.address_line2,
        city: newProperty.city,
        province: newProperty.province,
        zip_code: newProperty.zip_code,
        photo: photoURL,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        landlord_id: user?.uid || '',
      });

      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProperties((prev) => [{ id: snap.id, ...snap.data() }, ...prev]);
      }

      setAddSuccess('Property added successfully!');
      setNewProperty({
        name: '',
        description: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: '',
        zip_code: '',
        photo: '',
        photoFile: null,
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

  const handleEditProperty = async (e) => {
    e.preventDefault();
    if (!editProperty) return;
    setEditError('');
    setEditLoading(true);

    if (!user) {
      setEditError('You must be logged in to edit a property.');
      setEditLoading(false);
      return;
    }
    try {
      const docRef = doc(db, 'Properties', editProperty.id);
      let photoURL = editProperty.photo || '';
      if (editProperty.photoFile) {
        const imageRef = ref(storage, `properties/${editProperty.id}`);
        await uploadBytes(imageRef, editProperty.photoFile);
        photoURL = await getDownloadURL(imageRef);
      }
      await updateDoc(docRef, {
        // Use default empty strings for any missing fields so Firestore
        // doesn't receive undefined values and reject the update.
        name: editProperty.name ?? '',
        description: editProperty.description ?? '',
        address_line1: editProperty.address_line1 ?? '',
        address_line2: editProperty.address_line2 ?? '',
        city: editProperty.city ?? '',
        province: editProperty.province ?? '',
        zip_code: editProperty.zip_code ?? '',
        photo: photoURL,
        updated_at: serverTimestamp(),
      });
      setProperties((prev) =>
        prev.map((p) => (p.id === editProperty.id ? { ...p, ...editProperty, photo: photoURL } : p))
      );
      setShowEditModal(false);
    } catch {
      setEditError('Failed to save property.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete property handler
  const handleDeleteProperty = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteDoc(doc(db, 'Properties', deleteId));
      setProperties((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      setDeleteError('Failed to delete property. Please try again.');
    }
    setDeleteLoading(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 antialiased">
      {/* Sidebar */}
        <Sidebar navItems={navItems} firstName={firstName} user={user} />

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
          <MobileNav navItems={navItems} handleLogout={handleLogout} />
        </header>

        {/* Properties Table */}
        <main className="pt-24 p-6 overflow-auto mx-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="w-full aspect-square overflow-hidden">
                  {prop.photo ? (
                    <img src={prop.photo} alt={prop.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold dark:text-gray-100">{prop.name}</h3>
                  <p className="text-sm dark:text-gray-300">{prop.city}{prop.province ? `, ${prop.province}` : ''}</p>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      className="px-3 py-1 bg-blue-500 text-white rounded"
                      onClick={() => openDetail(prop)}
                    >
                      Details
                    </button>
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      onClick={() => openEdit(prop)}
                    >
                      Modify
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500 text-white rounded"
                      onClick={() => setDeleteId(prop.id)}
                      disabled={deleteLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {properties.length === 0 && (
              <div className="col-span-full text-center text-gray-400 dark:text-gray-500">No properties found.</div>
            )}
          </div>
        </main>

        {/* Add Property Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
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
                  <AddressAutocomplete
                    value={newProperty.address_line1}
                    onChange={(val) =>
                      setNewProperty({ ...newProperty, address_line1: val })
                    }
                    onSelect={(addr) =>
                      setNewProperty((prev) => ({ ...prev, ...addr }))
                    }
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
                  <select
                    value={newProperty.province}
                    onChange={e => setNewProperty({ ...newProperty, province: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  >
                    <option value="" disabled>Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                  {newProperty.photo && (
                    <img
                      src={newProperty.photo}
                      alt="preview"
                      className="mt-2 w-24 h-24 object-cover rounded"
                    />
                  )}
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

        {/* Edit Property Modal */}
        {showEditModal && editProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 text-2xl"
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Modify Property</h2>
              <form className="space-y-4" onSubmit={handleEditProperty}>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Name*</label>
                  <input
                    type="text"
                    value={editProperty.name}
                    onChange={(e) => setEditProperty({ ...editProperty, name: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Description</label>
                  <textarea
                    value={editProperty.description}
                    onChange={(e) => setEditProperty({ ...editProperty, description: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Address Line 1*</label>
                  <AddressAutocomplete
                    value={editProperty.address_line1}
                    onChange={(val) => setEditProperty({ ...editProperty, address_line1: val })}
                    onSelect={(addr) =>
                      setEditProperty((prev) => ({ ...prev, ...addr }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Address Line 2</label>
                  <input
                    type="text"
                    value={editProperty.address_line2}
                    onChange={(e) => setEditProperty({ ...editProperty, address_line2: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">City*</label>
                  <input
                    type="text"
                    value={editProperty.city}
                    onChange={(e) => setEditProperty({ ...editProperty, city: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Province*</label>
                  <select
                    value={editProperty.province}
                    onChange={(e) => setEditProperty({ ...editProperty, province: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  >
                    <option value="" disabled>Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Zip Code*</label>
                  <input
                    type="text"
                    value={editProperty.zip_code}
                    onChange={(e) => setEditProperty({ ...editProperty, zip_code: e.target.value })}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImage}
                    className="w-full border rounded p-2 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                  />
                  {editProperty.photo && (
                    <img
                      src={editProperty.photo}
                      alt="preview"
                      className="mt-2 w-24 h-24 object-cover rounded"
                    />
                  )}
                </div>
                {editError && <div className="text-red-500 text-center">{editError}</div>}
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded dark:bg-purple-700"
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Property Detail Modal */}
        {showDetailModal && currentProp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md relative">
              <button
                className="text-gray-500 dark:text-gray-300 absolute top-4 right-4 text-2xl"
                onClick={() => { setShowDetailModal(false); setPropertyLeases([]); }}
              >
                &times;
              </button>
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">{currentProp.name}</h2>
              <div className="space-y-4">
                <p className="dark:text-gray-200">
                  <strong>Address:</strong>{' '}
                  {[currentProp.address_line1, currentProp.address_line2, currentProp.city, currentProp.province, currentProp.zip_code]
                    .filter(Boolean)
                    .join(', ') || <span className="italic text-gray-400 dark:text-gray-500">No address</span>}
                </p>
                <p className="dark:text-gray-200">
                  <strong>Units:</strong> {currentProp.units || 4}
                </p>
                <p className="dark:text-gray-200">
                  <strong>Tenants:</strong> {currentProp.tenants ? currentProp.tenants.length : currentProp.tenant_uid ? 1 : 0}
                </p>
                <p className="dark:text-gray-200">
                  <strong>Total Rent Due:</strong> ${currentProp.total_rent_due || currentProp.rentDue || 0}
                </p>
                {currentProp.description && (
                  <p className="dark:text-gray-200 whitespace-pre-line">{currentProp.description}</p>
                )}
                {propertyLeases.map((l) => (
                  l.signed_agreement_url ? (
                  <p key={l.id} className="dark:text-gray-200">
                      <a
                        href={l.signed_agreement_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Download Signed Agreement
                      </a>
                    </p>
                  ) : null
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 text-2xl"
                onClick={() => setDeleteId(null)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Delete Property</h2>
              <p className="mb-4 dark:text-gray-200">Are you sure you want to delete this property? This action cannot be undone.</p>
              {deleteError && <div className="text-red-500 mb-2">{deleteError}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-gray-100 rounded"
                  onClick={() => setDeleteId(null)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded dark:bg-red-700"
                  onClick={handleDeleteProperty}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

