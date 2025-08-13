import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import ChatBubble from '../components/ChatBubble';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [recipientUid, setRecipientUid] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(db, 'Messages'), orderBy('createdAt'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (!text.trim() || !user || !recipientUid.trim()) return;
    await addDoc(collection(db, 'Messages'), {
      text: text.trim(),
      senderUid: user.uid,
      recipientUid: recipientUid.trim(),
      createdAt: serverTimestamp(),
    });
    setText('');
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="mb-4 space-y-2">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} currentUid={user?.uid} />
        ))}
      </div>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Recipient UID"
        value={recipientUid}
        onChange={(e) => setRecipientUid(e.target.value)}
      />
      <div className="flex">
        <input
          className="border p-2 flex-1 mr-2"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-purple-600 text-white px-4 py-2 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}
