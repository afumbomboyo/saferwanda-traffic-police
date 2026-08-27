'use client';

import React, { useState } from 'react';
import { ViolationSession } from '../../lib/types';
import { X, CheckCircle2, ShieldCheck, FileCode, Camera, User, Smartphone, AlertCircle, Copy, Check } from 'lucide-react';

interface ViolationRecordModalProps {
  session: ViolationSession | null;
  onClose: () => void;
}

export const ViolationRecordModal: React.FC<ViolationRecordModalProps> = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'REAL_JSON'>('SUMMARY');
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const real = session.realRecord;
  const isAutoEnforced = session.status === 'AUTOMATIC_ENFORCEMENT' || real?.enforcement.status === 'pending_payment';
  const realJsonString = JSON.stringify(
    real || {
      violation_id: session.sessionId,
      camera_id: session.camera.cameraId,
      violation: {
        type: session.officerReview?.violationType || 'speeding',
        timestamp: session.timestamp,
      },
      vehicle: {
        plate: session.aiDetection.suggestedPlate || null,
        plate_detected: Boolean(session.aiDetection.suggestedPlate),
        owner_name: session.registryMatch.ownerName || null,
        owner_phone: session.registryMatch.ownerPhone || null,
        owner_email: null,
      },
      recognition: {
        status: session.aiDetection.overallConfidence > 80 ? 'recognized' : 'low_confidence',
        plate_detected: Boolean(session.aiDetection.suggestedPlate),
        plate_confidence: session.aiDetection.overallConfidence / 100,
        ocr_confidence: session.aiDetection.overallConfidence / 100,
        plate_detection_confidence: session.aiDetection.overallConfidence / 100,
      },
      enforcement: {
        status: session.status,
        fine_generated: true,
        notification_sent: true,
        payment_status: 'pending',
      },
    },
    null,
    2
  );

  const handleCopyJson = () => {
    navigator.clipboard.writeText(realJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 relative">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase rounded-full ${
                isAutoEnforced
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isAutoEnforced ? 'AUTOMATIC ENFORCEMENT' : 'POLICE REVIEW CASE'}
              </span>
              <span className="font-mono text-xs text-slate-300">
                {real?.violation_id || session.sessionId}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              Violation Inspection & Telemetry Log
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SUMMARY'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Inspection Summary
          </button>

          <button
            onClick={() => setActiveTab('REAL_JSON')}
            className={`py-2 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'REAL_JSON'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-500" /> System Real Data JSON
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'SUMMARY' ? (
            <div className="space-y-4">
              {/* Image & ROI Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ALPR Camera Capture
                  </span>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative">
                    <img
                      src={session.evidenceSnapshots.bestSnapshotUrl}
                      alt="Traffic Snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    ALPR ROI License Plate Crop
                  </span>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 relative flex items-center justify-center p-2">
                    <img
                      src={session.evidenceSnapshots.plateCropUrl}
                      alt="Plate Crop"
                      className="w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Vehicle & Plate */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Vehicle Identification</span>
                  <p className="font-mono text-base font-black text-slate-900 dark:text-white">
                    {real?.vehicle.plate || session.aiDetection.suggestedPlate || 'NO PLATE'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Plate Detected: <strong className="text-slate-900 dark:text-white">{real?.vehicle.plate_detected ? 'Yes' : 'No'}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Confidence: <strong className="text-emerald-600 dark:text-emerald-400">{real?.recognition.plate_confidence ? `${Math.round(real.recognition.plate_confidence * 100)}%` : `${session.aiDetection.overallConfidence}%`}</strong>
                  </p>
                </div>

                {/* Owner & Registry */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Owner Registry Match</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {real?.vehicle.owner_name || session.registryMatch.ownerName || 'Owner Missing'}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                    Phone: <span className="font-mono">{real?.vehicle.owner_phone || session.registryMatch.ownerPhone || 'N/A'}</span>
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] truncate">
                    Email: <span className="font-mono">{real?.vehicle.owner_email || 'N/A'}</span>
                  </p>
                </div>

                {/* Enforcement & Fine */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase block">Enforcement Action</span>
                  <p className="font-mono text-base font-black text-slate-900 dark:text-white capitalize">
                    {real?.violation.type || 'loitering'}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    Fine: <strong className="font-mono text-slate-900 dark:text-white">RWF {(real?.violation.fine_amount_rwf || 20000).toLocaleString()}</strong>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    Status: <span className="font-bold uppercase text-emerald-600 dark:text-emerald-400">{real?.enforcement.status || session.status}</span>
                  </p>
                </div>
              </div>

              {/* Bounding Box Telemetry */}
              {real?.evidence?.bounding_box && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">ALPR ROI Bounding Box Telemetry</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                    x1: {real.evidence.bounding_box.x1}, y1: {real.evidence.bounding_box.y1}, x2: {real.evidence.bounding_box.x2}, y2: {real.evidence.bounding_box.y2}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Exact JSON payload matching real backend data structure:
                </span>
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed shadow-inner max-h-[50vh]">
                {realJsonString}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> SafeRwanda Traffic Audit Register
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-xs transition-all shadow-md"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
