'use client';

import React, { useState, useEffect } from 'react';
import { ReviewQueueProvider } from '../../lib/context/ReviewQueueContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
