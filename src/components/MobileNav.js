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
    <div className="md:hidden relative">
      <button onClick={() => setOpen(!open)} className="p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 w-screen bg-white dark:bg-gray-800 shadow-md z-20">
          <nav className="px-4 py-2 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${item.active ? 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200' : ''}`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {item.label}
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
              <span className="text-xl mr-3">🚪</span>Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
