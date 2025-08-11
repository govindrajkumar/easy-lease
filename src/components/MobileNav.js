import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

/**
 * Responsive mobile navigation with hamburger button.
 * Accepts navItems array [{icon,label,href,active,badge}] and handleLogout callback.
 */
export default function MobileNav({ navItems = [], handleLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    if (handleLogout) {
      await handleLogout();
    } else {
      await auth.signOut();
      navigate('/signin');
    }
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        className="p-2"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
      />
      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b dark:border-gray-700 flex items-center justify-between">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={() => setOpen(false)}
            className="p-2"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="px-4 py-4 space-y-2 text-lg">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                item.active
                  ? 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200'
                  : ''
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-red-600 text-white text-xs rounded-full px-2">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="text-xl mr-3">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
