import React from 'react';

export default function ChatBubble({ message, currentUid }) {
  const isSender = message.senderUid === currentUid;
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-xs break-words ${
          isSender ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-900'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
