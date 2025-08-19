import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ChatBubble({ message, currentUid }) {
  const [senderName, setSenderName] = useState(message.senderName || '');

  useEffect(() => {
    // Fetch sender name if not provided on the message object
    if (!senderName && message.senderUid) {
      const fetchName = async () => {
        const snap = await getDoc(doc(db, 'Users', message.senderUid));
        if (snap.exists()) {
          setSenderName(snap.data().first_name || '');
        }
      };
      fetchName();
    }
  }, [message.senderUid, senderName]);

  const isSender = message.senderUid === currentUid;

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className="flex flex-col">
        {!isSender && senderName && (
          <span className="text-xs text-gray-500 mb-1">{senderName}</span>
        )}
        <div
          className={`px-3 py-2 rounded-lg max-w-xs break-words ${
            isSender ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}
