'use client';

import React, { useState, useEffect } from 'react';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { EvidenceInspector } from '../../components/review/EvidenceInspector';
import { PlateOcrEditor } from '../../components/review/PlateOcrEditor';
import { RegistryLookupCard } from '../../components/review/RegistryLookupCard';
import { ActionPanel } from '../../components/review/ActionPanel';
import { 
  CheckCircle2, 
  ListFilter, 
  Camera, 
  ShieldCheck,
  List,
  Info
} from 'lucide-react';
import { VehicleRegistryMatch } from '../../lib/types';

export default function ReviewDeskPage() {
  const {
    sessions,
    activeSession,
    activeSessionId,
    selectSession,
    nextSession,
    prevSession,
    approveSession,
    rejectSession,
    flagSession,
    lookupPlateInRegistry,
    filterReason,
    setFilterReason,
    searchQuery,
  } = useReviewQueue();

  // Mobile active tab view ('CANVAS' | 'VERIFY' | 'QUEUE')
  const [mobileViewTab, setMobileViewTab] = useState<'CANVAS' | 'VERIFY' | 'QUEUE'>('CANVAS');

  // Pending queue list
  const pendingSessions = sessions.filter(s => {
    const isPending = s.status === 'PENDING_MANUAL_REVIEW';
    const matchesReason = filterReason === 'ALL' || s.exceptionReason === filterReason;
    const matchesSearch =
      !searchQuery ||
      s.aiDetection.suggestedPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.camera.locationName.toLowerCase().includes(searchQuery.toLowerCase());
    return isPending && matchesReason && matchesSearch;
  });

  // Plate input state for active session
  const [correctedPlate, setCorrectedPlate] = useState<string>('');
  const [registryMatch, setRegistryMatch] = useState<VehicleRegistryMatch>({ found: false });

  // Update plate input when active session changes
  useEffect(() => {
    if (activeSession) {
      const initialPlate = activeSession.aiDetection.suggestedPlate || '';
      setCorrectedPlate(initialPlate);
      setRegistryMatch(activeSession.registryMatch);
    }
  }, [activeSessionId, activeSession]);

  const handleVerifyRegistry = () => {
    const res = lookupPlateInRegistry(correctedPlate);
    setRegistryMatch(res);
  };

  if (!activeSession || pendingSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border-2 border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Review Queue Cleared!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
          All exception events have been reviewed by traffic police officers. The automatic enforcement pipeline is running cleanly (high-confidence plate reads are auto-approved).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle Top Rwanda Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="pt-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Police Review Desk
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              {pendingSessions.length} Exception Cases
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <Info className="w-3.5 h-3.5 text-sky-500 inline shrink-0" />
            <span>High-confidence OCR reads (≥85%) with registry matches are <strong>Auto-Approved</strong>. This workstation processes exceptions only.</span>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 text-[11px]">
            <ListFilter className="w-3.5 h-3.5" /> Exception:
          </span>
          {(['ALL', 'NO_PLATE_DETECTED', 'LOW_CONFIDENCE_OCR', 'REGISTRY_MISMATCH', 'UNREGISTERED_VEHICLE'] as const).map((reason) => (
            <button
              key={reason}
              onClick={() => setFilterReason(reason)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shrink-0 ${
                filterReason === reason
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {reason === 'ALL' ? 'All' : reason.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tab View Selector (Visible on small screens) */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 lg:hidden text-xs font-bold">
        <button
          onClick={() => setMobileViewTab('QUEUE')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileViewTab === 'QUEUE'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <List className="w-3.5 h-3.5" /> Queue ({pendingSessions.length})
        </button>

        <button
          onClick={() => setMobileViewTab('CANVAS')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileViewTab === 'CANVAS'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Evidence
        </button>

        <button
          onClick={() => setMobileViewTab('VERIFY')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            mobileViewTab === 'VERIFY'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Action & Lookup
        </button>
      </div>

      {/* Main Grid Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Pending Sessions Queue (Visible on desktop OR when Mobile tab is 'QUEUE') */}
        <div className={`lg:col-span-3 space-y-2 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 ${
          mobileViewTab === 'QUEUE' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Pending Exception Queue</span>
            <span className="font-mono text-[10px]">{pendingSessions.length} Items</span>
          </div>

          {pendingSessions.map((sess) => {
            const isSelected = sess.sessionId === activeSessionId;

            return (
              <div
                key={sess.sessionId}
                onClick={() => {
                  selectSession(sess.sessionId);
                  setMobileViewTab('CANVAS'); // Auto switch to canvas on mobile tap
                }}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 dark:border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {sess.sessionId}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {sess.aiDetection.suggestedPlate || 'NO PLATE'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      sess.exceptionReason === 'NO_PLATE_DETECTED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : sess.exceptionReason === 'REGISTRY_MISMATCH'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {sess.exceptionReason.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                  {sess.camera.locationName}
                </p>
              </div>
            );
          })}
        </div>

        {/* Middle Column: Evidence Inspector (Visible on desktop OR when Mobile tab is 'CANVAS') */}
        <div className={`lg:col-span-5 ${
          mobileViewTab === 'CANVAS' ? 'block' : 'hidden lg:block'
        }`}>
          <EvidenceInspector session={activeSession} />
        </div>

        {/* Right Column: Plate Editor, Registry Card, Action Panel (Visible on desktop OR when Mobile tab is 'VERIFY') */}
        <div className={`lg:col-span-4 space-y-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1 ${
          mobileViewTab === 'VERIFY' ? 'block' : 'hidden lg:block'
        }`}>
          <PlateOcrEditor
            session={activeSession}
            correctedPlate={correctedPlate}
            setCorrectedPlate={setCorrectedPlate}
            onVerifyRegistry={handleVerifyRegistry}
          />

          <RegistryLookupCard
            registryMatch={registryMatch}
            session={activeSession}
            searchedPlate={correctedPlate}
          />

          <ActionPanel
            session={activeSession}
            correctedPlate={correctedPlate}
            onApprove={(violationType, fineRwf, notes) =>
              approveSession(activeSession.sessionId, correctedPlate, violationType, fineRwf, notes)
            }
            onReject={(reason) => rejectSession(activeSession.sessionId, reason)}
            onFlag={(note) => flagSession(activeSession.sessionId, note)}
            onNext={nextSession}
            onPrev={prevSession}
          />
        </div>
      </div>
    </div>
  );
}
