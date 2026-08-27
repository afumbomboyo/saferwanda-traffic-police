'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../../lib/context/AuthContext';
import { ReviewQueueProvider } from '../../lib/context/ReviewQueueContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { OfficerDutyLoginScreen } from '../auth/OfficerDutyLoginScreen';
import { Shield } from 'lucide-react';

const ProtectedDashboardContent: React.FC<{
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  children: React.ReactNode;
}> = ({ darkMode, setDarkMode, children }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white space-y-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-600/20 text-amber-300 flex items-center justify-center border-2 border-sky-400 animate-pulse">
            <Shield className="w-8 h-8" />
          </div>
          <p className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
            Verifying Rwanda Police Security Session...
          </p>
        </div>
      </div>
    );
  }

  // If officer is not logged in, DO NOT display dashboard layout at all. Show Duty Login Portal.
  if (!isAuthenticated) {
    return <OfficerDutyLoginScreen />;
  }

  // Once authenticated, render full operational dashboard
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
    <AuthProvider>
      <ProtectedDashboardContent darkMode={darkMode} setDarkMode={setDarkMode}>
        {children}
      </ProtectedDashboardContent>
    </AuthProvider>
  );
};


