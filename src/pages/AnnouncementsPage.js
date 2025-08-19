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
  addDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import MobileNav from '../components/MobileNav';
import AlertModal from '../components/AlertModal';
import Sidebar from '../components/Sidebar';
import { landlordNavItems } from '../constants/navItems';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [reactions, setReactions] = useState({});
  const [form, setForm] = useState({ target: 'all', propertyId: '', tenantUid: '', message: '' });
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const navigate = useNavigate();

  const navItems = landlordNavItems({ active: 'announcements' });

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;

      const userSnap = await getDoc(doc(db, 'Users', u.uid));
      if (userSnap.exists()) setFirstName(userSnap.data().first_name || '');

      const propSnap = await getDocs(query(collection(db, 'Properties'), where('landlord_id', '==', u.uid)));
      const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProperties(props);

      const tenantData = [];
      for (const p of props) {
        const tList = p.tenants || (p.tenant_uid ? [p.tenant_uid] : []);
        for (const tid of tList) {
          const tSnap = await getDoc(doc(db, 'Users', tid));
          if (tSnap.exists()) tenantData.push({ id: tid, name: tSnap.data().first_name, propertyId: p.id });
        }
      }
      setTenants(tenantData);

      const annSnap = await getDocs(
        query(collection(db, 'Announcements'), where('landlord_id', '==', u.uid), orderBy('created_at', 'desc'))
      );
      const anns = annSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAnnouncements(anns);

      anns.forEach((a) => {
        const rq = query(collection(db, 'AnnouncementReactions'), where('announcementId', '==', a.id));
        onSnapshot(rq, (rsnap) => {
          setReactions((prev) => ({ ...prev, [a.id]: rsnap.size }));
        });
      });
    });
    return () => unsubscribe();
  }, []);

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.message.trim() || !user) return;

    const annRef = await addDoc(collection(db, 'Announcements'), {
      landlord_id: user.uid,
      target: form.target,
      property_id: form.target === 'property' ? form.propertyId : '',
      tenant_uid: form.target === 'tenant' ? form.tenantUid : '',
      message: form.message,
      created_at: serverTimestamp(),
    });

    setAnnouncements([{ id: annRef.id, ...form, created_at: { seconds: Date.now() / 1000 } }, ...announcements]);
    setForm({ target: 'all', propertyId: '', tenantUid: '', message: '' });
  };

  const addReaction = async (announcementId) => {
    if (!user) return;
    const id = `${announcementId}_${user.uid}`;
    await setDoc(doc(db, 'AnnouncementReactions', id), {
      announcementId,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };

  const filteredAnnouncements = announcements.filter(
    (a) => !filterProp || a.property_id === filterProp
  );

  const propertyMap = properties.reduce((acc, p) => ({ ...acc, [p.id]: p.address_line1 }), {});

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
          <MobileNav navItems={navItems} handleLogout={handleLogout} />
        </div>
      </header>

      <div className="flex pt-20 min-h-[calc(100vh-5rem)]">
        <Sidebar navItems={navItems} firstName={firstName} user={user} />

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <form
            onSubmit={postAnnouncement}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4"
          >
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Write an announcement..."
            />
            <div className="flex space-x-2">
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="p-2 border rounded"
              >
                <option value="all">All tenants</option>
                <option value="property">Property</option>
                <option value="tenant">Tenant</option>
              </select>
              {form.target === 'property' && (
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  className="p-2 border rounded"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address_line1}
                    </option>
                  ))}
                </select>
              )}
              {form.target === 'tenant' && (
                <select
                  value={form.tenantUid}
                  onChange={(e) => setForm({ ...form, tenantUid: e.target.value })}
                  className="p-2 border rounded"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Post
              </button>
            </div>
          </form>

          <div className="flex items-center space-x-2">
            <span>Filter:</span>
            <select
              value={filterProp}
              onChange={(e) => setFilterProp(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">All</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address_line1}
                </option>
              ))}
            </select>
          </div>

          {filteredAnnouncements.map((a) => (
            <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="font-medium">{a.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {a.created_at?.seconds ? new Date(a.created_at.seconds * 1000).toLocaleString() : ''}
                {a.target === 'property' && ` • ${propertyMap[a.property_id] || ''}`}
                {a.target === 'tenant' && ` • ${tenants.find((t) => t.id === a.tenant_uid)?.name || ''}`}
              </p>
              <button
                onClick={() => addReaction(a.id)}
                className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-300"
              >
                <span className="mr-1">👍</span> {reactions[a.id] || 0}
              </button>
            </div>
          ))}
        </div>
      </div>

      {alertMessage && (
        <AlertModal message={alertMessage} onClose={() => setAlertMessage('')} />
      )}
    </div>
  );
}

