import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import MobileNav from '../components/MobileNav';
import { tenantNavItems } from '../constants/navItems';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

export default function TenantAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [property, setProperty] = useState(null);
  const [unread, setUnread] = useState(0);
  const [landlordName, setLandlordName] = useState('');
  const [activeId, setActiveId] = useState('');
  const [messagesMap, setMessagesMap] = useState({});
  const navigate = useNavigate();

  const navItems = tenantNavItems({ active: 'announcements', unread });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');
        let propSnap = await getDocs(query(collection(db, 'Properties'), where('tenants', 'array-contains', u.uid)));
        if (propSnap.empty) {
          propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', u.uid)));
        }
        if (!propSnap.empty) {
          const propDoc = propSnap.docs[0];
          const prop = { id: propDoc.id, ...propDoc.data() };
          setProperty(prop);
          const lSnap = await getDoc(doc(db, 'Users', prop.landlord_id));
          if (lSnap.exists()) setLandlordName(lSnap.data().first_name || '');
          const annSnap = await getDocs(query(collection(db, 'Announcements'), where('landlord_id', '==', prop.landlord_id)));
          const data = annSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((a) =>
              a.target === 'all' ||
              (a.target === 'property' && a.property_id === prop.id) ||
              (a.target === 'tenant' && a.tenant_uid === u.uid)
            )
            .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
          setAnnouncements(data);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubMessages;
    const unsubAuth = auth.onAuthStateChanged((u) => {
      if (unsubMessages) unsubMessages();
      if (u) {
        const q = query(collection(db, 'Messages'), where('to', '==', u.uid), where('read', '==', false));
        unsubMessages = onSnapshot(q, (snap) => setUnread(snap.size));
      } else {
        setUnread(0);
      }
    });
    return () => {
      if (unsubMessages) unsubMessages();
      unsubAuth();
    };
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const sendReply = async (id) => {
    const text = replyMap[id]?.trim();
    const ann = announcements.find((a) => a.id === id);
    if (!user || !ann || !text) return;
    await addDoc(collection(db, 'Messages'), {
      from: user.uid,
      to: ann.landlord_id,
      text,
      announcement_id: id,
      created_at: serverTimestamp(),
    });
    setReplyMap({ ...replyMap, [id]: '' });
    await fetchMessages(id);
    alert('Reply sent');
  };

  const fetchMessages = async (id) => {
    const snap = await getDocs(
      query(collection(db, 'Messages'), where('announcement_id', '==', id), orderBy('created_at'))
    );
    const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setMessagesMap((prev) => ({ ...prev, [id]: msgs }));
  };

  const toggleAnnouncement = async (id) => {
    if (activeId === id) {
      setActiveId('');
    } else {
      setActiveId(id);
      if (!messagesMap[id]) await fetchMessages(id);
    }
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
        <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
          <nav className="px-4 space-y-2 mt-4">
            <a href="/tenant-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">📄 Lease Info</a>
            <a href="/tenant-payments" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">💳 Payments</a>
              <a href="/tenant-maintenance" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🛠️ Maintenance{unread > 0 && <span className="ml-2 bg-red-500 text-white rounded-full text-xs px-2">{unread}</span>}</a>
            <a href="/tenant-announcements" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🔔 Announcements</a>
            <a href="/tenant-settings" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👤 Profile &amp; Settings</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {announcements.map((a, idx) => (
            <div
              key={a.id}
              onClick={() => toggleAnnouncement(a.id)}
              className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-xl transition cursor-pointer ${idx === 0 ? 'border-2 border-purple-600' : ''}`}
            >
              <p className="font-medium">{a.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {a.created_at?.seconds ? new Date(a.created_at.seconds * 1000).toLocaleString() : ''}
              </p>
              {activeId === a.id && (
                <div className="mt-2 space-y-2">
                  {(messagesMap[a.id] || []).map((m) => (
                    <p key={m.id} className="text-sm">
                      <span className="font-semibold">
                        {m.from === user?.uid ? firstName || 'You' : landlordName || 'Landlord'}
                      </span>{' '}
                      {m.text}
                    </p>
                  ))}
                  {messagesMap[a.id] && messagesMap[a.id].length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No conversation yet.</p>
                  )}
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Reply"
                      value={replyMap[a.id] || ''}
                      onChange={(e) => setReplyMap({ ...replyMap, [a.id]: e.target.value })}
                      className="flex-1 border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                    />
                    <button
                      className="px-3 py-2 bg-purple-600 text-white rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        sendReply(a.id);
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center">No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}
