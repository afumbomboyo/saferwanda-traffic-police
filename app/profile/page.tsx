'use client';

import React from 'react';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { Shield, MapPin, Award } from 'lucide-react';

export default function OfficerProfilePage() {
  const { officer } = useReviewQueue();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-0">
      {/* Officer ID Card Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
        {/* Subtle Rwanda flag top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pt-1">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-sky-900 via-blue-950 to-slate-950 text-amber-300 font-extrabold text-2xl flex items-center justify-center border-4 border-sky-500 shadow-lg">
              {officer.badgeNumber.substring(0, 2)}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
          </div>

          <div className="text-center sm:text-left space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {officer.name}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {officer.rank}
              </span>
            </div>

            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Badge: <strong className="text-slate-900 dark:text-slate-200">{officer.badgeNumber}</strong> • Officer ID: <strong className="text-slate-900 dark:text-slate-200">{officer.officerId}</strong>
            </p>

            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 pt-1">
              <MapPin className="w-3.5 h-3.5 text-sky-500" /> {officer.station} ({officer.district})
            </p>
          </div>
        </div>

        {/* Shift Stats Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Shift Start Time</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
              {new Date(officer.shiftStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">Active Duty</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Reviews Completed Today</span>
            <span className="text-base font-black font-mono text-slate-900 dark:text-white mt-1 block">
              {officer.reviewsCompletedToday} Cases
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Avg: 42s / review</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Accuracy Score</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              {officer.accuracyRate}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Verified by Supervisor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
