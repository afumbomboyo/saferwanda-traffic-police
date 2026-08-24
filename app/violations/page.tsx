'use client';

import React, { useState } from 'react';
import { useReviewQueue } from '../../lib/context/ReviewQueueContext';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Flag, 
  Eye, 
  ListFilter
} from 'lucide-react';
import { ViolationSession } from '../../lib/types';

export default function ViolationsHistoryPage() {
  const { sessions, searchQuery, filterStatus, setFilterStatus } = useReviewQueue();
  const [selectedSessionModal, setSelectedSessionModal] = useState<ViolationSession | null>(null);

  // Filtered sessions
  const filteredSessions = sessions.filter(s => {
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      s.aiDetection.suggestedPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.officerReview?.correctedPlate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.camera.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.officerReview?.reviewedByOfficerName || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle Rwanda Flag Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="pt-1">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" /> Enforcement Violations & Audit Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete searchable register of all officer-reviewed citations, dismissed events, and flagged incidents.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0 text-[11px]">
            <ListFilter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['ALL', 'APPROVED_CITATION_ISSUED', 'REJECTED_DISMISSED', 'FLAGGED_FOR_INVESTIGATION', 'PENDING_MANUAL_REVIEW'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all shrink-0 ${
                filterStatus === status
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {status === 'ALL'
                ? 'All'
                : status === 'APPROVED_CITATION_ISSUED'
                ? 'Approved'
                : status === 'REJECTED_DISMISSED'
                ? 'Dismissed'
                : status === 'FLAGGED_FOR_INVESTIGATION'
                ? 'Flagged'
                : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900 dark:text-white">{filteredSessions.length}</strong> records</span>
          <span className="font-mono text-[10px] hidden sm:inline">EXPORT: CSV / FIRESTORE SNAPSHOT</span>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3 px-3">Session ID / Timestamp</th>
                <th className="py-3 px-3">Enforcement Location</th>
                <th className="py-3 px-3">AI OCR Plate</th>
                <th className="py-3 px-3">Verified Plate</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reviewed By</th>
                <th className="py-3 px-3">Fine (RWF)</th>
                <th className="py-3 px-3 text-right">Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSessions.map((sess) => {
                return (
                  <tr
                    key={sess.sessionId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                        {sess.sessionId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(sess.timestamp).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold block">{sess.camera.locationName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{sess.camera.cameraId}</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {sess.aiDetection.suggestedPlate || 'NO PLATE'}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ({sess.aiDetection.overallConfidence.toFixed(0)}% conf)
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-black text-slate-900 dark:text-white">
                      {sess.officerReview?.correctedPlate || sess.aiDetection.suggestedPlate || 'PENDING'}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                          sess.status === 'APPROVED_CITATION_ISSUED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : sess.status === 'REJECTED_DISMISSED'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : sess.status === 'FLAGGED_FOR_INVESTIGATION'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {sess.status === 'APPROVED_CITATION_ISSUED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {sess.status === 'REJECTED_DISMISSED' && <XCircle className="w-3 h-3 text-slate-400" />}
                        {sess.status === 'FLAGGED_FOR_INVESTIGATION' && <Flag className="w-3 h-3 text-amber-600" />}
                        {sess.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {sess.officerReview ? (
                        <div>
                          <span className="font-bold text-xs block">{sess.officerReview.reviewedByOfficerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {sess.officerReview.reviewedByOfficerId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sess.officerReview?.fineAmountRwf
                        ? `${sess.officerReview.fineAmountRwf.toLocaleString()} RWF`
                        : '0 RWF'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedSessionModal(sess)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Log
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Audit History: {selectedSessionModal.sessionId}
                </h3>
                <p className="text-xs text-slate-500">
                  Enforcement Event Captured on {new Date(selectedSessionModal.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Original AI Detection</span>
                <p className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {selectedSessionModal.aiDetection.suggestedPlate || 'NO PLATE READ'}
                </p>
                <p className="text-slate-500">Confidence: {selectedSessionModal.aiDetection.overallConfidence}%</p>
                <p className="text-slate-500">AI Visual Class: {selectedSessionModal.aiDetection.aiVehicleClass}</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 space-y-1">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold uppercase block">Officer Corrected Verification</span>
                <p className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {selectedSessionModal.officerReview?.correctedPlate || selectedSessionModal.aiDetection.suggestedPlate}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Violation: {selectedSessionModal.officerReview?.violationType || 'N/A'}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Fine Amount: {selectedSessionModal.officerReview?.fineAmountRwf ? `${selectedSessionModal.officerReview.fineAmountRwf.toLocaleString()} RWF` : 'None'}
                </p>
              </div>
            </div>

            {selectedSessionModal.officerReview && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Officer Review Audit Trail</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  Reviewed by <strong className="text-slate-900 dark:text-white">{selectedSessionModal.officerReview.reviewedByOfficerName}</strong> ({selectedSessionModal.officerReview.reviewedByOfficerId}) at {new Date(selectedSessionModal.officerReview.reviewedAt).toLocaleString()}
                </p>
                {selectedSessionModal.officerReview.notes && (
                  <p className="text-slate-500 italic mt-1">&quot;{selectedSessionModal.officerReview.notes}&quot;</p>
                )}
                {selectedSessionModal.officerReview.rejectionReason && (
                  <p className="text-red-500 font-bold mt-1">Rejection Reason: {selectedSessionModal.officerReview.rejectionReason}</p>
                )}
                {selectedSessionModal.officerReview.flagReason && (
                  <p className="text-amber-500 font-bold mt-1">Flag Reason: {selectedSessionModal.officerReview.flagReason}</p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
