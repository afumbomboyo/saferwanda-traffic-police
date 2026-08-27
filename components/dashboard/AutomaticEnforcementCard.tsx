'use client';

import React from 'react';
import { ViolationSession } from '../../lib/types';
import { CheckCircle2, Eye, Smartphone, ShieldCheck, UserCheck, DollarSign, Clock } from 'lucide-react';

interface AutomaticEnforcementCardProps {
  session: ViolationSession;
  onInspect: (session: ViolationSession) => void;
}

export const AutomaticEnforcementCard: React.FC<AutomaticEnforcementCardProps> = ({ session, onInspect }) => {
  const real = session.realRecord;
  const plate = real?.vehicle.plate || session.aiDetection.suggestedPlate || 'RAB123A';
  const violationType = (real?.violation.type || 'loitering').replace(/_/g, ' ');
  const confidencePercent = real?.recognition.plate_confidence 
    ? Math.round(real.recognition.plate_confidence * 100) 
    : session.aiDetection.overallConfidence;
  const ownerName = real?.vehicle.owner_name || session.registryMatch.ownerName || 'John Doe';
  const ownerPhone = real?.vehicle.owner_phone || session.registryMatch.ownerPhone || '+25078XXXXXXX';
  const fineRwf = real?.violation.fine_amount_rwf || 20000;
  const paymentStatus = real?.enforcement.payment_status || 'pending';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/30 shadow-md space-y-3 relative overflow-hidden group hover:border-emerald-500 transition-all">
      {/* Top Emerald Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500"></div>

      {/* Top Header Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            AUTOMATIC ENFORCEMENT
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {session.camera.cameraId || session.realRecord?.camera_id}
          </span>
        </div>

        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main Content Grid: Plate & Violation Info */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Plate</span>
          <span className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-wider">
            {plate}
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
            {confidencePercent}% confidence
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Violation Type</span>
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 capitalize block">
            {violationType}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
            {session.camera.locationName}
          </span>
        </div>
      </div>

      {/* Details Grid: Owner Found, SMS Sent, Fine, Payment */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs">
        {/* Owner Found */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Registry Lookup</span>
          <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="truncate">Owner found</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ownerName}</p>
        </div>

        {/* Notification Status */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Notification</span>
          <div className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400 text-[11px]">
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS sent</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{ownerPhone}</p>
        </div>

        {/* Fine Amount */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Citation Fine</span>
          <div className="font-mono font-black text-slate-900 dark:text-white text-[11px]">
            RWF {fineRwf.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Fine Generated</p>
        </div>

        {/* Payment Status */}
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Payment Status</span>
          <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400 text-[11px] capitalize">
            <DollarSign className="w-3.5 h-3.5" />
            <span>{paymentStatus}</span>
          </div>
          <p className="text-[10px] text-slate-400">RRA Gateway Sync</p>
        </div>
      </div>

      {/* Footer Info & Read-Only Inspection Action */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <span className="text-slate-400 text-[10px] italic">
          No approval needed (Auto-processed)
        </span>

        <button
          onClick={() => onInspect(session)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Eye className="w-3.5 h-3.5 text-sky-500" />
          <span>Inspect Case</span>
        </button>
      </div>
    </div>
  );
};
