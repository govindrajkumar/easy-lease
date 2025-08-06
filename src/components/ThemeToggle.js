import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <button
      onClick={toggleDarkMode}
      aria-label="Toggle theme"
      className={className}
    >
      {darkMode ? (
        <FaSun className="h-6 w-6 text-yellow-300" />
      ) : (
        <FaMoon className="h-6 w-6 text-gray-800" />
      )}
    </button>
  );
}
