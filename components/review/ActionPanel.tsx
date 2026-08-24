'use client';

import React, { useState, useEffect } from 'react';
import { ViolationSession, ViolationType } from '../../lib/types';
import { 
  CheckCircle2, 
  XCircle, 
  Flag, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Keyboard,
  HelpCircle
} from 'lucide-react';

interface ActionPanelProps {
  session: ViolationSession;
  correctedPlate: string;
  onApprove: (violationType: ViolationType, fineRwf: number, notes?: string) => void;
  onReject: (reason: string) => void;
  onFlag: (note: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  session,
  correctedPlate,
  onApprove,
  onReject,
  onFlag,
  onNext,
  onPrev,
}) => {
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'REJECT' | 'FLAG'>('APPROVE');

  // Form states
  const [violationType, setViolationType] = useState<ViolationType>('SPEEDING');
  const [fineRwf, setFineRwf] = useState<number>(25000);
  const [notes, setNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('Emergency vehicle on active dispatch');
  const [flagNote, setFlagNote] = useState<string>('Suspected cloned plate or stolen vehicle alert match');

  // Auto calculate recommended fine based on speed or violation
  useEffect(() => {
    if (session.camera.recordedSpeedKmh > session.camera.speedLimitKmh) {
      const delta = session.camera.recordedSpeedKmh - session.camera.speedLimitKmh;
      if (delta > 30) {
        setFineRwf(50000);
      } else if (delta > 15) {
        setFineRwf(25000);
      } else {
        setFineRwf(10000);
      }
      setViolationType('SPEEDING');
    } else if (session.exceptionReason === 'UNREGISTERED_VEHICLE') {
      setFineRwf(100000);
      setViolationType('UNREGISTERED_DRIVING');
    }
  }, [session]);

  // Keyboard shortcut handler for rapid processing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeAction === 'APPROVE') {
          onApprove(violationType, fineRwf, notes);
        } else if (activeAction === 'REJECT') {
          onReject(rejectReason);
        } else if (activeAction === 'FLAG') {
          onFlag(flagNote);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setActiveAction('REJECT');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setActiveAction('FLAG');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setActiveAction('APPROVE');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAction, violationType, fineRwf, notes, rejectReason, flagNote, onApprove, onReject, onFlag, onNext, onPrev]);

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveAction('APPROVE')}
          className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeAction === 'APPROVE'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Issue Citation
        </button>

        <button
          onClick={() => setActiveAction('REJECT')}
          className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeAction === 'REJECT'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <XCircle className="w-4 h-4" /> Dismiss Event
        </button>

        <button
          onClick={() => setActiveAction('FLAG')}
          className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeAction === 'FLAG'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Flag className="w-4 h-4" /> Flag Incident
        </button>
      </div>

      {/* APPROVE & ISSUE FINE FORM */}
      {activeAction === 'APPROVE' && (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Violation Classification
              </label>
              <select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value as ViolationType)}
                className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="SPEEDING">Speeding Limit Exceeded</option>
                <option value="RED_LIGHT_VIOLATION">Red Light Signal Violation</option>
                <option value="ILLEGAL_OVERTAKING">Illegal Line / Overtaking</option>
                <option value="UNREGISTERED_DRIVING">Unregistered Vehicle Operation</option>
                <option value="BUS_LANE_INTRUSION">BRT Bus Lane Intrusion</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Fine Amount (RWF)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="5000"
                  value={fineRwf}
                  onChange={(e) => setFineRwf(Number(e.target.value))}
                  className="w-full py-2 pl-3 pr-10 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  RWF
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Officer Log Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Verified plate match on character 8 vs glare"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <button
            onClick={() => onApprove(violationType, fineRwf, notes)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5 text-yellow-300" />
            CONFIRM & ISSUE CITATION TO BRIDGE [ENTER]
          </button>
        </div>
      )}

      {/* REJECT FORM */}
      {activeAction === 'REJECT' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Dismissal Justification Reason
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
            >
              <option value="Emergency vehicle on active dispatch">Emergency vehicle on active dispatch</option>
              <option value="Obstructed view / Unreadable evidence photo">Obstructed view / Unreadable evidence photo</option>
              <option value="Camera calibration / Radar pulse error">Camera calibration / Radar pulse error</option>
              <option value="False positive ALPR trigger">False positive ALPR trigger</option>
              <option value="Official diplomatic / police convoy exemption">Official diplomatic / police convoy exemption</option>
            </select>
          </div>

          <button
            onClick={() => onReject(rejectReason)}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            DISMISS EVENT & CLOSE SESSION [ENTER]
          </button>
        </div>
      )}

      {/* FLAG FORM */}
      {activeAction === 'FLAG' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Investigation Note for Traffic Command
            </label>
            <textarea
              rows={2}
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={() => onFlag(flagNote)}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Flag className="w-5 h-5" />
            FLAG FOR POLICE SPECIAL INSPECTION [ENTER]
          </button>
        </div>
      )}

      {/* Navigation & Keyboard Helper Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrev}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Prev [←]
          </button>
          <button
            onClick={onNext}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold"
          >
            Next [→] <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[10px] font-mono text-slate-400">
          <Keyboard className="w-3.5 h-3.5 text-slate-400" />
          <span>Hotkeys: <span className="text-slate-300 font-bold">A</span>:Approve | <span className="text-slate-300 font-bold">R</span>:Reject | <span className="text-slate-300 font-bold">F</span>:Flag</span>
        </div>
      </div>
    </div>
  );
};
