'use client';

import React from 'react';
import { MOCK_CAMERAS } from '../../lib/data/mockData';
import { Camera, MapPin, Gauge, Radio } from 'lucide-react';

export default function CamerasPage() {
  return (
    <div className="space-y-6 pb-16 md:pb-0">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle Rwanda Flag Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="pt-1">
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-500" /> SafeRwanda Camera Enforcement Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status, speed limits, and operational health of ALPR camera nodes across Kigali and provincial highways.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shrink-0">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>6 NODES ONLINE</span>
        </div>
      </div>

      {/* Grid of Camera Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_CAMERAS.map((cam) => (
          <div
            key={cam.cameraId}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-sky-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                  {cam.cameraId}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {cam.locationName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {cam.sector}, {cam.district} ({cam.province})
                </p>
              </div>

              <span
                className={`px-2.5 py-0.5 text-xs font-black rounded-full shrink-0 ${
                  cam.status === 'ONLINE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {cam.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Speed Limit</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-500" /> {cam.speedLimitKmh} KM/H
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Active Lane</span>
                <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                  LANE #{cam.laneNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">GPS Coordinates</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400">
                  {cam.coordinates.lat.toFixed(4)}, {cam.coordinates.lng.toFixed(4)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Last Heartbeat</span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {cam.lastPingTime}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
