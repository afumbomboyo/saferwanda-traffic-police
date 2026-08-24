'use client';

import React, { useState, useEffect } from 'react';
import { ViolationSession } from '../../lib/types';
import { Edit3, CheckCircle2, AlertOctagon, HelpCircle, Search, ShieldCheck } from 'lucide-react';

interface PlateOcrEditorProps {
  session: ViolationSession;
  correctedPlate: string;
  setCorrectedPlate: (val: string) => void;
  onVerifyRegistry: () => void;
}

export const PlateOcrEditor: React.FC<PlateOcrEditorProps> = ({
  session,
  correctedPlate,
  setCorrectedPlate,
  onVerifyRegistry,
}) => {
  const getExceptionBadge = () => {
    switch (session.exceptionReason) {
      case 'NO_PLATE_DETECTED':
        return {
          title: 'NO PLATE DETECTED',
          desc: 'ALPR failed to isolate license plate bounding box.',
          color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/80',
        };
      case 'LOW_CONFIDENCE_OCR':
        return {
          title: 'LOW CONFIDENCE OCR',
          desc: 'Character confidence score below safety threshold (85%).',
          color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80',
        };
      case 'REGISTRY_MISMATCH':
        return {
          title: 'VEHICLE REGISTRY MISMATCH',
          desc: 'Plate string detected, but vehicle specs conflict with RRA registry.',
          color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/80',
        };
      case 'UNREGISTERED_VEHICLE':
        return {
          title: 'UNREGISTERED VEHICLE',
          desc: 'Plate string not found in national motor registry.',
          color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/80',
        };
    }
  };

  const badge = getExceptionBadge();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCorrectedPlate(val);
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Exception Reason Warning Header */}
      <div className={`p-3 rounded-xl border ${badge.color} flex items-start space-x-3`}>
        <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-black tracking-wider uppercase block">{badge.title}</span>
          <p className="text-xs mt-0.5 opacity-90">{badge.desc}</p>
        </div>
      </div>

      {/* AI Character-by-Character Breakdown */}
      {session.aiDetection.characterConfidences.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>AI OCR Character Confidence</span>
            <span className="text-[10px] text-slate-400">Hover character for confidence %</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {session.aiDetection.characterConfidences.map((item, idx) => {
              let colorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
              if (item.confidence < 70) {
                colorClass = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-400 dark:border-red-700 animate-pulse font-black';
              } else if (item.confidence < 90) {
                colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold';
              }

              if (item.char === ' ') {
                return <span key={idx} className="w-2"></span>;
              }

              return (
                <div
                  key={idx}
                  title={`Character '${item.char}' Confidence: ${item.confidence}%`}
                  className={`flex flex-col items-center justify-center w-8 h-9 rounded-lg border text-sm font-mono transition-transform hover:scale-110 ${colorClass}`}
                >
                  <span className="font-extrabold">{item.char}</span>
                  <span className="text-[9px] opacity-75 leading-none">{item.confidence}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Officer Edit Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-blue-500" /> Correct License Plate Number
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Format: [RAA 123 A / RDF 000]</span>
        </label>

        <div className="relative flex items-center">
          {/* Simulated Rwandan License Plate Graphics inside input */}
          <div className="absolute left-2 flex flex-col items-center justify-center w-6 h-8 rounded bg-blue-600 text-[8px] text-white font-bold pointer-events-none select-none">
            <span>RWA</span>
            <span className="w-4 h-0.5 bg-yellow-400 mt-0.5"></span>
          </div>

          <input
            type="text"
            value={correctedPlate}
            onChange={handleInputChange}
            placeholder="e.g. RAB 892 A"
            className="w-full pl-10 pr-28 py-3 text-lg font-mono font-black tracking-widest uppercase rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />

          <button
            type="button"
            onClick={onVerifyRegistry}
            className="absolute right-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            Lookup
          </button>
        </div>
      </div>
    </div>
  );
};
