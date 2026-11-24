'use client';

import React, { useEffect, useState } from 'react';
import { CameraMetadata } from '../../lib/types';
import { subscribeToFirestoreCameras } from '../../lib/services/camerasService';
import { Camera, MapPin, Radio, ShieldCheck, Globe, Cpu, AlertCircle } from 'lucide-react';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Subscribe to live Firestore `cameras` collection (filters traffic_enforcement === true)
    const unsubscribe = subscribeToFirestoreCameras((firestoreCameras) => {
      setCameras(firestoreCameras || []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle Rwanda Flag Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-500" /> SafeRwanda Traffic Cameras
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              TRAFFIC ENFORCEMENT FILTERED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registered security and traffic cameras configured with active traffic enforcement capabilities.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shrink-0">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>{cameras.length} ENFORCEMENT NODES REGISTERED</span>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading traffic enforcement camera network...
        </div>
      ) : cameras.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Traffic Enforcement Cameras Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No camera records in the <code className="font-mono text-sky-400">cameras</code> collection match <code className="font-mono text-emerald-400">services.traffic_enforcement == true</code>.
          </p>
        </div>
      ) : (
        /* Grid of Camera Cards matching Database Schema */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => {
            const allowedEvents = cam.allowedEvents || [];
            const services = cam.services || {};

            return (
              <div
                key={cam.cameraId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-sky-500/60 transition-colors relative overflow-hidden"
              >
                {/* Card Title Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        {cam.cameraId}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Enforcement Active
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {cam.name || cam.locationName}
                    </h3>
                  </div>
                </div>

                {/* DB Schema Location Block */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
                  <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {cam.locationName}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {cam.district}, {cam.city}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
                    <div>
                      <span className="text-slate-400 block">Latitude</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cam.coordinates.lat}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Longitude</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{cam.coordinates.lng}</span>
                    </div>
                  </div>

                  {cam.organization && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400 block">Owner / Organization</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{cam.organization}</span>
                    </div>
                  )}

                  {cam.webhookUrl && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800 text-[9px] text-slate-400 truncate flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate" title={cam.webhookUrl}>{cam.webhookUrl}</span>
                    </div>
                  )}
                </div>

                {/* Allowed Event Rules Tags */}
                {allowedEvents.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Enforced Event Rules
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {allowedEvents.map((evt, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30"
                        >
                          {evt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Services List */}
                <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Enabled Camera Services
                  </span>
                  <div className="flex flex-wrap gap-1 text-[9px] font-mono font-bold">
                    {services.traffic_enforcement && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Traffic Enforcement
                      </span>
                    )}
                    {services.live_stream && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        Live Stream
                      </span>
                    )}
                    {services.abnormal_activity_alert && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Abnormal Alerts
                      </span>
                    )}
                    {services.information_storage && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Storage
                      </span>
                    )}
                    {services.information_retrieval && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Retrieval
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
