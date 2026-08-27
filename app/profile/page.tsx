'use client';

import React, { useState } from 'react';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { useAuth } from '../../lib/context/AuthContext';
import { OfficerBiometricModal } from '../../components/auth/OfficerBiometricModal';
import { Shield, MapPin, Award, Fingerprint, ShieldCheck, KeyRound, LogOut, CheckCircle2 } from 'lucide-react';

export default function OfficerProfilePage() {
  const { officer } = useReviewQueue();
  const { user, idToken, isAuthenticated, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${isAuthenticated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
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

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Fingerprint className="w-4 h-4" />
              <span>Biometric Duty Login</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={logout}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
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

      {/* Firebase Authentication Security Details Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-sky-500/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Firebase Security & Auth Status
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
            isAuthenticated
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {isAuthenticated ? 'AUTHENTICATED POLICE OFFICER' : 'UNAUTHENTICATED SESSION'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold text-[10px] block uppercase">Firebase Auth UID</span>
            <p className="text-slate-900 dark:text-slate-200 truncate font-semibold">
              {user ? user.uid : 'No active Firebase Auth session'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold text-[10px] block uppercase">Firestore Security Rules Status</span>
            <p className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enforced (/violations/{'{violationId}'})
            </p>
          </div>
        </div>

        {idToken && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold text-[10px] block uppercase">ID Token Preview (JWT)</span>
            <p className="text-slate-400 text-[10px] font-mono break-all line-clamp-2">
              {idToken}
            </p>
          </div>
        )}
      </div>

      {/* Biometric Duty Login Modal */}
      <OfficerBiometricModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

