'use client';

import React from 'react';
import { VehicleRegistryMatch, ViolationSession } from '../../lib/types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Car, 
  User, 
  Phone, 
  Calendar, 
  ShieldAlert,
  FileCheck2,
  Info
} from 'lucide-react';

interface RegistryLookupCardProps {
  registryMatch: VehicleRegistryMatch;
  session: ViolationSession;
  searchedPlate: string;
}

export const RegistryLookupCard: React.FC<RegistryLookupCardProps> = ({
  registryMatch,
  session,
  searchedPlate,
}) => {
  // Check for vehicle body or color discrepancy between AI visual classifier & official registry
  const isBodyMismatch =
    registryMatch.found &&
    registryMatch.bodyType &&
    session.aiDetection.aiVehicleClass &&
    !session.aiDetection.aiVehicleClass.toLowerCase().includes(registryMatch.bodyType.toLowerCase()) &&
    !registryMatch.bodyType.toLowerCase().includes(session.aiDetection.aiVehicleClass.toLowerCase());

  const isStolenAlert = registryMatch.registrationStatus === 'STOLEN_ALERT';

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header title */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-blue-500" /> National Vehicle Registry Cross-Check
        </h3>

        {registryMatch.found ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Registry Record Match
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" /> Record Not Found
          </span>
        )}
      </div>

      {/* Discrepancy & Stolen Alerts */}
      {isStolenAlert && (
        <div className="p-3 rounded-xl bg-red-600 text-white font-bold text-xs flex items-start space-x-2 animate-pulse shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-extrabold uppercase text-sm block">⚠️ CRITICAL: STOLEN VEHICLE ALERT</span>
            <p className="text-xs font-normal text-red-100 mt-0.5">
              This license plate ({registryMatch.plateNumber}) is flagged as STOLEN in the National Police Registry database. Immediate officer flagging recommended!
            </p>
          </div>
        </div>
      )}

      {isBodyMismatch && !isStolenAlert && (
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase text-[11px] block">VISUAL SPEC DISCREPANCY DETECTED</span>
            <p className="text-xs opacity-90 mt-0.5">
              Camera AI visual classifier detected a <span className="font-bold underline">{session.aiDetection.aiVehicleClass}</span> ({session.aiDetection.aiVehicleColor}), but registry records state this plate belongs to a <span className="font-bold underline">{registryMatch.bodyType}</span> ({registryMatch.color}). Suspected cloned plate!
            </p>
          </div>
        </div>
      )}

      {/* Registry Record Detail Grid */}
      {registryMatch.found ? (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Registered Owner</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-500" /> {registryMatch.ownerName}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">National ID / TIN</span>
            <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">
              {registryMatch.ownerNationalId || 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Vehicle Make & Model</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-slate-400" /> {registryMatch.make} {registryMatch.model} ({registryMatch.manufactureYear})
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Body Type & Color</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
              {registryMatch.bodyType} • {registryMatch.color}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Phone Number</span>
            <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" /> {registryMatch.ownerPhone || 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-semibold block">Registration Status</span>
            <span className="inline-block mt-0.5 font-bold font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {registryMatch.registrationStatus}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
          <Info className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Vehicle Found for &quot;{searchedPlate}&quot;</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Verify typing or check if vehicle is foreign-registered or newly imported without RRA clearance.
          </p>
        </div>
      )}
    </div>
  );
};
