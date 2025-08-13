import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import MobileNav from '../components/MobileNav';
import ChatBubble from '../components/ChatBubble';
import { landlordNavItems } from '../constants/navItems';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState({ target: 'all', propertyId: '', tenantUid: '', message: '' });
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [filterProp, setFilterProp] = useState('');
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState('');
  const [messagesMap, setMessagesMap] = useState({});
  const [replyMap, setReplyMap] = useState({});
  const [unreadMessages, setUnreadMessages] = useState(0);
  const messageUnsubs = useRef({});

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const navItems = landlordNavItems({ active: 'announcements', unreadMessages });

  const tenantMap = tenants.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});
  const propertyMap = properties.reduce(
    (acc, p) => ({ ...acc, [p.id]: p.address_line1 }),
    {}
  );

  const toggleAnnouncement = async (id) => {
    if (activeId === id) {
      if (messageUnsubs.current[id]) {
        messageUnsubs.current[id]();
        delete messageUnsubs.current[id];
      }
      setActiveId('');
    } else {
      setActiveId(id);
      if (!messageUnsubs.current[id]) {
        const q = query(
          collection(db, 'Messages'),
          where('announcementId', '==', id),
          orderBy('createdAt')
        );
        messageUnsubs.current[id] = onSnapshot(q, (snap) => {
          const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMessagesMap((prev) => ({ ...prev, [id]: msgs }));
        });
      }
      if (user) {
        const unreadSnap = await getDocs(
          query(
            collection(db, 'Messages'),
            where('announcementId', '==', id),
            where('recipientUid', '==', user.uid),
            where('read', '==', false)
          )
        );
        unreadSnap.forEach((d) => updateDoc(doc(db, 'Messages', d.id), { read: true }));
      }
    }
  };

  useEffect(() => {
    return () => {
      Object.values(messageUnsubs.current).forEach((unsub) => unsub());
    };
  }, []);

  const sendReply = async (id) => {
    const text = replyMap[id]?.trim();
    const ann = announcements.find((a) => a.id === id);
    if (!user || !ann || !text) return;
    let recipients = [];
    if (ann.target === 'tenant' && ann.tenant_uid) {
      recipients = [ann.tenant_uid];
    } else if (ann.target === 'property') {
      recipients = tenants.filter((t) => t.propertyId === ann.property_id).map((t) => t.id);
    } else {
      recipients = tenants.map((t) => t.id);
    }
    await Promise.all(
      recipients.map((rid) =>
        addDoc(collection(db, 'Messages'), {
          senderUid: user.uid,
          recipientUid: rid,
          text,
          announcementId: id,
          createdAt: serverTimestamp(),
          read: false,
        })
      )
    );
    setReplyMap((prev) => ({ ...prev, [id]: '' }));
    alert('Reply sent');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'Users', u.uid));
        if (snap.exists()) setFirstName(snap.data().first_name || '');

        const propSnap = await getDocs(query(collection(db, 'Properties'), where('landlord_id', '==', u.uid)));
        const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProperties(props);

        const tenantData = [];
        for (const p of props) {
          const tList = p.tenants || (p.tenant_uid ? [p.tenant_uid] : []);
          for (const tid of tList) {
            const tSnap = await getDoc(doc(db, 'Users', tid));
            if (tSnap.exists()) {
              tenantData.push({ id: tid, name: tSnap.data().first_name, propertyId: p.id });
            }
          }
        }
        setTenants(tenantData);

        const annSnap = await getDocs(query(collection(db, 'Announcements'), where('landlord_id', '==', u.uid)));
        setAnnouncements(annSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'Messages'),
      where('recipientUid', '==', user.uid),
      where('read', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadMessages(snap.size));
    return () => unsub();
  }, [user]);

  const postAnnouncement = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    try {
      const annRef = await addDoc(collection(db, 'Announcements'), {
        landlord_id: user.uid,
        target: form.target,
        property_id: form.target === 'property' ? form.propertyId : '',
        tenant_uid: form.target === 'tenant' ? form.tenantUid : '',
        message: form.message,
        created_at: serverTimestamp(),
      });
      let recipients = [];
      if (form.target === 'tenant' && form.tenantUid) {
        recipients = [form.tenantUid];
      } else if (form.target === 'property') {
        recipients = tenants
          .filter((t) => t.propertyId === form.propertyId)
          .map((t) => t.id);
      } else {
        recipients = tenants.map((t) => t.id);
      }
      await Promise.all(
        recipients.map((rid) =>
          addDoc(collection(db, 'Messages'), {
            senderUid: user.uid,
            recipientUid: rid,
            text: form.message,
            announcementId: annRef.id,
            createdAt: serverTimestamp(),
            read: false,
          })
        )
      );
      const annSnap = await getDocs(query(collection(db, 'Announcements'), where('landlord_id', '==', user.uid)));
      setAnnouncements(annSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setForm({ target: 'all', propertyId: '', tenantUid: '', message: '' });
    } catch (err) {
      console.error('Failed to post announcement', err);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'Announcements', id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
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
            <a href="/landlord-dashboard" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏠 Dashboard</a>
            <a href="/properties" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">🏢 Properties</a>
            <a href="/tenants" className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">👥 Tenants</a>
            <a href="/announcements" className="flex items-center px-4 py-3 rounded-lg bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200">🔔 Announcements</a>
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

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <form onSubmit={postAnnouncement} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="all">All Tenants</option>
                <option value="property">Specific Property</option>
                <option value="tenant">Individual Tenant</option>
              </select>
            </div>
            {form.target === 'property' && (
              <div>
                <label className="block text-sm font-medium mb-1">Property</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="" disabled>Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.target === 'tenant' && (
              <div>
                <label className="block text-sm font-medium mb-1">Tenant</label>
                <select
                  value={form.tenantUid}
                  onChange={(e) => setForm({ ...form, tenantUid: e.target.value })}
                  className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="" disabled>Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              Post Announcement
            </button>
          </form>

          <select
            value={filterProp}
            onChange={(e) => setFilterProp(e.target.value)}
            className="border rounded p-2 dark:bg-gray-900 dark:border-gray-700 mb-4"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="space-y-4">
            {announcements
              .filter((a) => (filterProp ? a.property_id === filterProp : true))
              .map((a) => (
                <div
                  key={a.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-pointer"
                  onClick={() => toggleAnnouncement(a.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{a.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Target:{' '}
                        {a.target === 'all'
                          ? 'All tenants'
                          : a.target === 'property'
                          ? propertyMap[a.property_id] || a.property_id
                          : `Tenant ${tenantMap[a.tenant_uid] || a.tenant_uid}`}
                      </p>
                    </div>
                    <button
                      className="text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(a.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {activeId === a.id && (
                    <div className="mt-2 border-t pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                      {(messagesMap[a.id] || []).map((m) => (
                        <ChatBubble key={m.id} message={m} currentUid={user?.uid} />
                      ))}
                      {messagesMap[a.id] && messagesMap[a.id].length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No conversation yet.</p>
                      )}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={replyMap[a.id] || ''}
                          onChange={(e) => setReplyMap({ ...replyMap, [a.id]: e.target.value })}
                          className="flex-1 border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="Reply"
                        />
                        <button
                          className="px-3 py-2 bg-purple-600 text-white rounded"
                          onClick={() => sendReply(a.id)}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            {announcements.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">No announcements yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
