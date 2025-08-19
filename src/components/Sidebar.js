import React from 'react';

export default function Sidebar({ navItems = [], firstName = 'User', user }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg min-h-[calc(100vh-5rem)] justify-between">
      <nav className="px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              item.active ? 'bg-purple-100 text-purple-700 dark:bg-gray-700 dark:text-purple-200' : ''
            }`}
          >
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
  );
}

