'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useReviewQueue } from '../lib/context/ReviewQueueContext';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flag, 
  Zap, 
  ArrowRight, 
  Camera, 
  AlertOctagon,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { MOCK_CAMERAS } from '../lib/data/mockData';
import { ArchitectureFlowDiagram } from '../components/dashboard/ArchitectureFlowDiagram';
import { AutomaticEnforcementCard } from '../components/dashboard/AutomaticEnforcementCard';
import { ViolationRecordModal } from '../components/dashboard/ViolationRecordModal';
import { ViolationSession } from '../lib/types';

export default function OverviewDashboardPage() {
  const { stats, sessions, selectSession } = useReviewQueue();
  const [selectedInspectionSession, setSelectedInspectionSession] = useState<ViolationSession | null>(null);

  // Separate sessions based on established architecture:
  // 1. Automatic Enforcement: owner found -> automatic SMS fine generated
  const automaticSessions = sessions.filter(
    s => s.status === 'AUTOMATIC_ENFORCEMENT' || s.realRecord?.enforcement.status === 'pending_payment'
  );

  // 2. Police Review: owner missing / low OCR / registry mismatch -> police review desk
  const pendingReviewSessions = sessions.filter(
    s => s.status === 'PENDING_MANUAL_REVIEW' || s.realRecord?.enforcement.status === 'police_review'
  );

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
            Real-time ALPR enforcement pipeline: Automatic violations with owner matches issue direct SMS citations, while exceptions route to the officer verification desk.
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

      {/* Pipeline System Architecture Flow Visualizer */}
      <ArchitectureFlowDiagram />

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Automatic Enforcement */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Automatic Enforcement
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.automaticEnforcementsToday}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Owner Found / SMS
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Auto-approved violations; fine issued via SMS without officer bottleneck.
          </p>
        </div>

        {/* Metric 2: Pending Police Reviews */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Police Reviews
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
              Owner Missing
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Cases routed to officer desk due to unreadable plate or registry exception.
          </p>
        </div>

        {/* Metric 3: Approved Citations Today */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Officer Approved
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.approvedToday}
            </span>
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
              Verified Today
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Verified by officers and synchronized to traffic database.
          </p>
        </div>

        {/* Metric 4: Auto Pipeline Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Auto Pipeline Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.autoEnforcementPassRate}%
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Autonomous
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automated enforcement path without needing police manual intervention.
          </p>
        </div>
      </div>

      {/* Dedicated Section: Automatic Enforcement Violations */}
      <div className="p-5 rounded-3xl bg-slate-900/60 dark:bg-slate-900 border border-emerald-500/40 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                Automatic Enforcement Feed
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {automaticSessions.length} Auto Records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High-confidence violations with verified owner matches. Fine issued automatically via SMS; officer can inspect read-only without approval.
            </p>
          </div>

          <Link
            href="/violations"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
          >
            Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Automatic Enforcement Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automaticSessions.map((sess) => (
            <AutomaticEnforcementCard
              key={sess.sessionId}
              session={sess}
              onInspect={(s) => setSelectedInspectionSession(s)}
            />
          ))}
        </div>
      </div>

      {/* Main 2-Column Section: Police Review Queue & Camera Network */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Police Review Queue (Owner Missing / Exceptions) */}
        <div className="lg:col-span-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" /> Police Review Queue (Owner Missing / Low Confidence)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cases requiring human verification. Click any row to resolve in Review Desk.
              </p>
            </div>
            <Link
              href="/review"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              Open Workstation ({pendingReviewSessions.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Location & Camera</th>
                  <th className="py-2.5 px-3">Exception Reason</th>
                  <th className="py-2.5 px-3">AI OCR Plate</th>
                  <th className="py-2.5 px-3">Violation Type</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pendingReviewSessions.map((sess) => {
                  const violationName = sess.realRecord?.violation.type || 'line_crossing';

                  return (
                    <tr
                      key={sess.sessionId}
                      onClick={() => setSelectedInspectionSession(sess)}
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
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300 capitalize">
                        {violationName.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href="/review"
                          onClick={() => selectSession(sess.sessionId)}
                          className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] hover:bg-sky-700 transition-colors inline-flex items-center gap-1"
                        >
                          Verify <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Camera Network Status Summary */}
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

      {/* Read-Only Inspection Modal */}
      {selectedInspectionSession && (
        <ViolationRecordModal
          session={selectedInspectionSession}
          onClose={() => setSelectedInspectionSession(null)}
        />
      )}
    </div>
  );
}
