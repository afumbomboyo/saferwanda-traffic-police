'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, AlertOctagon, Smartphone, ShieldCheck, UserX, UserCheck } from 'lucide-react';

export const ArchitectureFlowDiagram: React.FC = () => {
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden space-y-4">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
              System Architecture Flow
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic ALPR recognition & owner lookup routing pipeline
          </p>
        </div>
        <span className="px-3 py-1 text-[10px] font-mono font-bold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
          REAL-TIME PIPELINE ENFORCEMENT
        </span>
      </div>

      {/* Visual Flow Diagram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center pt-2">
        {/* Node 1: Violation Detected */}
        <div className="lg:col-span-3 p-3.5 rounded-2xl bg-slate-950/80 border border-sky-500/30 flex items-center space-x-3 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block">Step 1: Capture</span>
            <h4 className="text-xs font-black text-white">Camera Violation</h4>
            <p className="text-[10px] text-slate-400">ALPR ROI & OCR Detection</p>
          </div>
        </div>

        {/* Branch Arrow */}
        <div className="hidden lg:flex lg:col-span-1 justify-center text-slate-600">
          <ArrowRight className="w-5 h-5 animate-pulse" />
        </div>

        {/* Node 2: Decision Split */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Branch A: Owner Found -> Automatic Enforcement */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5 relative group hover:border-emerald-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-emerald-500 text-slate-950 uppercase tracking-wider">
                BRANCH A: OWNER FOUND
              </span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            
            <div className="space-y-1">
              <h5 className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Automatic Enforcement
              </h5>
              <p className="text-[11px] text-slate-300 leading-snug">
                Plate matched in National Registry → Fine generated → Automatic SMS sent to owner.
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-emerald-400/90 font-mono">
              <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Auto SMS Sent</span>
              <span className="font-bold text-emerald-300">No Officer Review Req.</span>
            </div>
          </div>

          {/* Branch B: Owner Missing -> Police Review */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2.5 relative group hover:border-amber-500 transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-amber-500 text-slate-950 uppercase tracking-wider">
                BRANCH B: OWNER MISSING
              </span>
              <UserX className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h5 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" /> Police Review Desk
              </h5>
              <p className="text-[11px] text-slate-300 leading-snug">
                Unregistered, low confidence, or plate missing → Exception queued to Human Verification Desk.
              </p>
            </div>

            <div className="pt-2 border-t border-amber-900/60 flex items-center justify-between text-[10px] text-amber-400/90 font-mono">
              <span>Manual Verification</span>
              <span className="font-bold text-amber-300">Officer Action Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
