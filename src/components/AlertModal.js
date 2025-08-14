import React from 'react';

export default function AlertModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm text-center">
        <p className="mb-4 dark:text-gray-100">{message}</p>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}
