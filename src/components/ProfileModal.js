import React, { useState, useEffect } from 'react';

export default function ProfileModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.name);
  const [email] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  const passwordsMatch = password === confirmPassword;

  const handleSave = () => {
    onSave({ name, password });
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Update Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg shadow-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-1 block w-full rounded-lg shadow-sm border-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg shadow-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg shadow-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
            {(password || confirmPassword) && (
              <p className={`text-sm mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => { handleSave(); onClose(); }}
            disabled={!passwordsMatch}
            className={`px-4 py-2 rounded bg-purple-600 text-white ${!passwordsMatch ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

