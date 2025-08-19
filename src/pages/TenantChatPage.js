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
import Sidebar from '../components/Sidebar';
import { tenantNavItems } from '../constants/navItems';

export default function TenantChatPage() {
  const [firstName, setFirstName] = useState('');
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [landlord, setLandlord] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) return;
      setFirstName(u.displayName || '');

      // Find landlord via tenant property
      let propSnap = await getDocs(query(collection(db, 'Properties'), where('tenants', 'array-contains', u.uid)));
      if (propSnap.empty) {
        propSnap = await getDocs(query(collection(db, 'Properties'), where('tenant_uid', '==', u.uid)));
      }
      const props = propSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const prop = props[0];
      if (prop) {
        let name = 'Landlord';
        if (prop.landlord_id) {
          const lsnap = await getDoc(doc(db, 'Users', prop.landlord_id));
          if (lsnap.exists()) name = lsnap.data().first_name || name;
        }
        setLandlord({ uid: prop.landlord_id, name });
      }

      const q = query(collection(db, 'Conversations'), where('participants', 'array-contains', u.uid));
      onSnapshot(q, (snap) => {
        const convs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setConversations(convs);
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeConv || !activeConv.id || activeConv.id === 'direct-temp') return setMessages([]);
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
    let convId = activeConv.id;
    if (convId === 'direct' && landlord) {
      const convRef = await addDoc(collection(db, 'Conversations'), {
        type: 'direct',
        participants: [user.uid, landlord.uid],
      });
      convId = convRef.id;
      setActiveConv({ id: convId, type: 'direct', name: landlord.name });
    }
    await addDoc(collection(db, 'Conversations', convId, 'Messages'), {
      senderUid: user.uid,
      text: t,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      reactions: {},
    });
    setText('');
  };

  const navItems = tenantNavItems({ active: 'chat' });

  // Prepare conversation list: landlord direct first then groups
  const convList = () => {
    const list = [];
    if (landlord) {
      const direct = conversations.find(
        (c) => c.type === 'direct' && c.participants.includes(landlord.uid)
      );
      if (direct) list.push({ id: direct.id, type: 'direct', name: landlord.name });
      else list.push({ id: 'direct', type: 'direct', name: landlord.name });
    }
    conversations
      .filter((c) => c.type === 'group')
      .forEach((c) => list.push(c));
    return list;
  };

  const convs = convList();

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

        <div className="flex-1 p-6 flex">
          <div className="w-64 border-r pr-4 space-y-2">
            {convs.map((c) => (
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
            {convs.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No conversations.</div>
            )}
          </div>

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
    </div>
  );
}

