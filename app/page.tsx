'use client';

import React from 'react';
import Link from 'next/link';
import { useReviewQueue } from '../lib/context/ReviewQueueContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flag, 
  Zap, 
  ArrowRight, 
  Camera, 
  AlertOctagon
} from 'lucide-react';
import { MOCK_CAMERAS } from '../lib/data/mockData';

export default function OverviewDashboardPage() {
  const { stats, sessions, selectSession } = useReviewQueue();

  const pendingSessions = sessions.filter(s => s.status === 'PENDING_MANUAL_REVIEW');

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Top Banner & Status Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-blue-950 to-slate-950 text-white shadow-xl relative overflow-hidden border border-sky-800/40">
        {/* Subtle Rwanda flag glow background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-amber-300 to-emerald-400"></div>

        <div className="space-y-1 z-10 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NATIONAL TRAFFIC PIPELINE ACTIVE
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              System Uptime: 99.98%
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            SafeRwanda Traffic Police Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Human-in-the-loop verification desk for ALPR camera exceptions, low-confidence plate reads, and national vehicle registry cross-checks.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/review"
          className="z-10 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/20 transition-all flex items-center space-x-2 shrink-0 group w-full sm:w-auto justify-center"
        >
          <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
          <span>OPEN REVIEW DESK ({stats.pendingReviews})</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Reviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.pendingReviews}
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Manual Action
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Cases routed to human desk due to low confidence or registry lookup failure.
          </p>
        </div>

        {/* Metric 2: Citations Approved Today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Approved Citations
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.approvedToday}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Issued Today
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Enforced and submitted to Firebase Firestore / violation bridge.
          </p>
        </div>

        {/* Metric 3: Flagged Incidents */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Flagged Incidents
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.flaggedToday}
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
              Special Inspection
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Stolen vehicle alerts, cloned plate suspicions, and police alerts.
          </p>
        </div>

        {/* Metric 4: Auto Pipeline Pass Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Auto Pipeline Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.autoEnforcementPassRate}%
            </span>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
              Autonomous
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automated enforcement path without needing police manual intervention.
          </p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Urgent Pending Queue Table (8 Cols on lg) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" /> Priority Exceptions Awaiting Review
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any row to open in the Review Desk evidence inspector.
              </p>
            </div>
            <Link
              href="/review"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
            >
              View All ({pendingSessions.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Location & Camera</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">AI OCR Plate</th>
                  <th className="py-2.5 px-3">Speed Delta</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingSessions.slice(0, 5).map((sess) => {
                  const isSpeeding = sess.camera.recordedSpeedKmh > sess.camera.speedLimitKmh;
                  const delta = sess.camera.recordedSpeedKmh - sess.camera.speedLimitKmh;

                  return (
                    <tr
                      key={sess.sessionId}
                      onClick={() => selectSession(sess.sessionId)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {sess.sessionId}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold block">{sess.camera.locationName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sess.camera.cameraId}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            sess.exceptionReason === 'NO_PLATE_DETECTED'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : sess.exceptionReason === 'REGISTRY_MISMATCH'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {sess.exceptionReason.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-white">
                        {sess.aiDetection.suggestedPlate || 'NO PLATE'}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {isSpeeding ? (
                          <span className="text-red-500 font-bold">
                            {sess.camera.recordedSpeedKmh} km/h (+{delta})
                          </span>
                        ) : (
                          <span className="text-slate-400">{sess.camera.recordedSpeedKmh} km/h</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href="/review"
                          onClick={() => selectSession(sess.sessionId)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] hover:bg-sky-700 transition-colors inline-flex items-center gap-1"
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Camera Network Status Summary (4 Cols on lg) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-500" /> Camera Nodes
            </h2>
            <Link
              href="/cameras"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              All Nodes
            </Link>
          </div>

          <div className="space-y-2.5">
            {MOCK_CAMERAS.map((cam) => (
              <div
                key={cam.cameraId}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {cam.locationName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {cam.cameraId} • Limit: {cam.speedLimitKmh} km/h
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${
                      cam.status === 'ONLINE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {cam.status}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{cam.lastPingTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
