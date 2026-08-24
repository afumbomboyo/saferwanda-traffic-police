'use client';

import React, { useState, useEffect } from 'react';
import { ReviewQueueProvider } from '../../lib/context/ReviewQueueContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('saferwanda_police_theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
    } else if (savedTheme === 'dark') {
      setDarkMode(true);
    } else {
      setDarkMode(true); // Default to sleek police dark mode
    }
  }, []);

  // Sync dark mode class on <html> document element and save to localStorage
  useEffect(() => {
    if (!mounted) return;

    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('saferwanda_police_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('saferwanda_police_theme', 'light');
    }
  }, [darkMode, mounted]);

  return (
    <ReviewQueueProvider>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <div className="flex-1 flex w-full max-w-[1700px] mx-auto">
          <Sidebar />
          
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden min-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </div>
    </ReviewQueueProvider>
  );
};
