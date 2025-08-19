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
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import MobileNav from '../components/MobileNav';
import ChatBubble from '../components/ChatBubble';
import { landlordNavItems } from '../constants/navItems';

export default function ChatPage() {
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [properties, setProperties] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createTarget, setCreateTarget] = useState('all');
  const [createProp, setCreateProp] = useState('');
  const navigate = useNavigate();

  // Load auth and conversations
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;
      setFirstName(u.displayName || '');

      const propSnap = await getDocs(
        query(collection(db, 'Properties'), where('landlord_id', '==', u.uid))
      );
      const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProperties(props);

      const q = query(
        collection(db, 'Conversations'),
        where('participants', 'array-contains', u.uid)
      );
      onSnapshot(q, async (snap) => {
        const convs = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            if (data.type === 'direct') {
              const otherUid = (data.participants || []).find((p) => p !== u.uid);
              let name = 'Chat';
              if (otherUid) {
                const osnap = await getDoc(doc(db, 'Users', otherUid));
                if (osnap.exists()) name = osnap.data().first_name || name;
              }
              return { id: d.id, name, ...data };
            }
            return { id: d.id, ...data };
          })
        );
        setConversations(convs);
      });
    });
    return () => unsub();
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!activeConv) return setMessages([]);
    const mref = collection(db, 'Conversations', activeConv.id, 'Messages');
    const q = query(mref, orderBy('createdAt'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsub();
  }, [activeConv]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/signin');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !user || !activeConv) return;
    await addDoc(collection(db, 'Conversations', activeConv.id, 'Messages'), {
      senderUid: user.uid,
      text: t,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      reactions: {},
    });
    setText('');
  };

  const createConversation = async (e) => {
    e.preventDefault();
    if (!user) return;
    let tenantUids = [];
    if (createTarget === 'all') {
      properties.forEach((p) => {
        const list = p.tenants || (p.tenant_uid ? [p.tenant_uid] : []);
        tenantUids.push(...list);
      });
    } else if (createProp) {
      const prop = properties.find((p) => p.id === createProp);
      if (prop) {
        tenantUids = prop.tenants || (prop.tenant_uid ? [prop.tenant_uid] : []);
      }
    }
    tenantUids = Array.from(new Set(tenantUids));
    if (tenantUids.length === 0) {
      setCreating(false);
      return;
    }
    const name =
      createTarget === 'all'
        ? 'All Tenants'
        : properties.find((p) => p.id === createProp)?.address_line1 || 'Group';
    const convRef = await addDoc(collection(db, 'Conversations'), {
      type: 'group',
      participants: [user.uid, ...tenantUids],
      propertyId: createTarget === 'property' ? createProp : '',
      name,
    });
    setCreating(false);
    setCreateProp('');
    setCreateTarget('all');
    setActiveConv({ id: convRef.id, type: 'group', name });
  };

  const navItems = landlordNavItems({ active: 'chat' });

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
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <span className="mr-2">{item.icon}</span> {item.label}
                {item.badge ? (
                  <span className="ml-auto bg-purple-600 text-white rounded-full px-2 py-0.5 text-xs">{item.badge}</span>
                ) : null}
              </a>
            ))}
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

        <div className="flex-1 p-6 flex">
          {/* Conversation list */}
          <div className="w-64 border-r pr-4 space-y-2">
            <button
              className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              onClick={() => setCreating(true)}
            >
              + New Group
            </button>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeConv?.id === c.id ? 'bg-gray-200 dark:bg-gray-700' : ''
                }`}
              >
                {c.name || 'Conversation'}
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No conversations.</div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 pl-4 flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} currentUid={user?.uid} />
              ))}
              {activeConv && messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400">No messages yet.</div>
              )}
            </div>
            {activeConv && (
              <form onSubmit={sendMessage} className="flex">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 border rounded-l p-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-r hover:bg-purple-700"
                >
                  Send
                </button>
              </form>
            )}
            {!activeConv && (
              <div className="text-gray-500 dark:text-gray-400 text-center mt-10">
                Select a conversation to begin.
              </div>
            )}
          </div>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={createConversation}
            className="bg-white dark:bg-gray-800 p-4 rounded space-y-4 w-full max-w-sm"
          >
            <h3 className="text-lg font-medium">New Group</h3>
            <select
              value={createTarget}
              onChange={(e) => setCreateTarget(e.target.value)}
              className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
            >
              <option value="all">All tenants</option>
              <option value="property">Specific property</option>
            </select>
            {createTarget === 'property' && (
              <select
                value={createProp}
                onChange={(e) => setCreateProp(e.target.value)}
                className="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700"
              >
                <option value="">Select property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address_line1}
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 rounded border dark:border-gray-700"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

