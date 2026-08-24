'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  FileText, 
  Camera, 
  UserCheck, 
  Activity, 
  MapPin
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { stats, officer } = useReviewQueue();

  const navItems = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Review Desk',
      href: '/review',
      icon: AlertOctagon,
      badge: stats.pendingReviews > 0 ? stats.pendingReviews : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-extrabold',
    },
    {
      name: 'Violation History',
      href: '/violations',
      icon: FileText,
      badge: stats.approvedToday,
      badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      name: 'Camera Network',
      href: '/cameras',
      icon: Camera,
      badge: '6 Active',
      badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      name: 'Officer Duty',
      href: '/profile',
      icon: UserCheck,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 h-[calc(100vh-4.5rem)] sticky top-18 transition-colors justify-between">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Police Control Navigation
          </p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/20 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full ${
                        isActive ? 'bg-amber-400 text-slate-950 font-black' : item.badgeColor || 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Shift Live Statistics Box with Rwandan Flag Subtle Accents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 relative overflow-hidden">
          {/* Subtle Corner Rwanda Accent Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-500" /> Active Shift Stats
            </span>
            <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              ON DUTY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Reviewed Today</p>
              <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                {officer.reviewsCompletedToday}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Accuracy Rate</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                {officer.accuracyRate}%
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="truncate">{officer.station}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-500 dark:text-slate-400 ml-1">SafeRwanda Police</span>
        </div>
        <p>Pipeline: <span className="text-emerald-500 font-bold">HUMAN-IN-LOOP</span></p>
      </div>
    </aside>
  );
};
