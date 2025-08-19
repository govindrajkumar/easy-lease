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
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import MobileNav from '../components/MobileNav';
import AlertModal from '../components/AlertModal';
import Sidebar from '../components/Sidebar';
import { tenantNavItems } from '../constants/navItems';

export default function TenantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [reactions, setReactions] = useState({});
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();

  const navItems = tenantNavItems({ active: 'announcements' });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;

      const snap = await getDoc(doc(db, 'Users', u.uid));
      if (snap.exists()) setFirstName(snap.data().first_name || '');

      let propSnap = await getDocs(query(collection(db, 'Properties'), where('tenants', 'array-contains', u.uid)));
      if (propSnap.empty) {
        propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', u.uid)));
      }
      if (propSnap.empty) return;

      const propDoc = propSnap.docs[0];
      const prop = { id: propDoc.id, ...propDoc.data() };
      setProperty(prop);

      const annQ = query(
        collection(db, 'Announcements'),
        where('landlord_id', '==', prop.landlord_id)
      );
      onSnapshot(annQ, (annSnap) => {
        const data = annSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
          .filter(
            (a) =>
              a.target === 'all' ||
              (a.target === 'property' && a.property_id === prop.id) ||
              (a.target === 'tenant' && a.tenant_uid === u.uid)
          );
        setAnnouncements(data);
        data.forEach((a) => {
          const rq = query(
            collection(db, 'AnnouncementReactions'),
            where('announcementId', '==', a.id)
          );
          onSnapshot(rq, (rsnap) => {
            setReactions((prev) => ({ ...prev, [a.id]: rsnap.size }));
          });
        });
      });
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
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
          {announcements.map((a) => (
            <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="font-medium">{a.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {a.created_at?.seconds ? new Date(a.created_at.seconds * 1000).toLocaleString() : ''}
                {a.target === 'property' && ` • ${property?.address_line1 || ''}`}
                {a.target === 'tenant' && ` • ${firstName}`}
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

