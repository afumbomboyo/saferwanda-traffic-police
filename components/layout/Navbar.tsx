'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { useAuth } from '../../lib/context/AuthContext';
import { OfficerBiometricModal } from '../auth/OfficerBiometricModal';
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Sun, 
  Moon, 
  RefreshCw, 
  Menu, 
  X,
  LayoutDashboard,
  AlertOctagon,
  FileText,
  Camera,
  UserCheck,
  Fingerprint,
  Lock,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const pathname = usePathname();
  const { stats, searchQuery, setSearchQuery, resetMockData } = useReviewQueue();
  const { isAuthenticated, officer, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);


  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard, badge: null },
    { name: 'Review Desk', href: '/review', icon: AlertOctagon, badge: stats.pendingReviews > 0 ? stats.pendingReviews : null },
    { name: 'Violations', href: '/violations', icon: FileText, badge: null },
    { name: 'Cameras', href: '/cameras', icon: Camera, badge: null },
    { name: 'Officer Duty', href: '/profile', icon: UserCheck, badge: null },
  ];

  return (
    <>
      {/* Subtle Rwandan Flag Tricolor Top Bar Accent (Sky Blue, Yellow, Green) */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500 sticky top-0 z-50"></div>

      <header className="sticky top-1.5 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
        <div className="flex h-16 items-center justify-between px-3 sm:px-6">
          {/* Left: Brand / System Title with Rwandan Police Crest Styling */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-700 to-indigo-900 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform border border-sky-400/30">
                <Shield className="w-5 h-5 text-amber-300 fill-amber-300/20" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                    SafeRwanda
                  </span>
                  {/* Subtle Flag Pill */}
                  <span className="px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase rounded bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-emerald-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    TRAFFIC POLICE
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  National Control Center
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Center: Global Search Input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search plate (e.g. RAB 892 A), Session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-200 font-bold"
                >
                  CLEAR
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => setMobileSearchOpen(prev => !prev)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Toggle Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Quick Reset for Prototype Testing */}
            <button
              onClick={resetMockData}
              title="Reset Demo Data"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden xl:inline">Reset</span>
            </button>

            {/* Pending Reviews Pill */}
            <Link
              href="/review"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 hover:bg-amber-500/20 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wide hidden xs:inline">
                Queue:
              </span>
              <span className="px-1.5 py-0.2 text-[10px] sm:text-xs font-black rounded-md bg-amber-500 text-slate-950 shadow-sm">
                {stats.pendingReviews}
              </span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Officer Duty Authentication & Profile Badge */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsBiometricModalOpen(true)}
                title={isAuthenticated ? 'Firebase Auth Verified (Click to re-authenticate)' : 'Click to perform Police Duty Biometric Login'}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                  isAuthenticated
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30 animate-pulse'
                }`}
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-black text-[10px] border border-sky-500 shadow-inner">
                    {isAuthenticated ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Fingerprint className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </div>
                
                <div className="hidden lg:block text-left">
                  <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                    {isAuthenticated ? officer.name : 'Duty Login Required'}
                  </p>
                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                    {isAuthenticated ? 'FIREBASE AUTH ACTIVE' : 'TOUCH TO AUTHENTICATE'}
                  </p>
                </div>
              </button>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <input
              type="text"
              placeholder="Search plate number, session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        )}

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Police Navigation Menu
            </p>
            <nav className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl font-bold text-xs ${
                      isActive
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Quick Navigation Bar (Field Officer Phone Optimization) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-slate-400">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors relative ${
                isActive ? 'text-sky-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Officer Biometric Multi-Step Duty Login Modal */}
      <OfficerBiometricModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
      />
    </>
  );
};

