'use client';

import React, { useState } from 'react';
import { ViolationSession } from '../../lib/types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sun, 
  Sliders, 
  Maximize2, 
  Gauge, 
  MapPin, 
  Calendar, 
  Eye, 
  Layers,
  Sparkles
} from 'lucide-react';

interface EvidenceInspectorProps {
  session: ViolationSession;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'BEST' | 'CONTEXT' | 'CROP'>('BEST');
  const [zoom, setZoom] = useState<number>(1);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [showControls, setShowControls] = useState<boolean>(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleResetFilters = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
  };

  const getCurrentImage = () => {
    switch (activeTab) {
      case 'CONTEXT':
        return session.evidenceSnapshots.contextSnapshotUrl;
      case 'CROP':
        return session.evidenceSnapshots.plateCropUrl;
      case 'BEST':
      default:
        return session.evidenceSnapshots.bestSnapshotUrl;
    }
  };

  const isSpeeding = session.camera.recordedSpeedKmh > session.camera.speedLimitKmh;
  const speedDelta = session.camera.recordedSpeedKmh - session.camera.speedLimitKmh;

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Telemetry Overlay */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">{session.camera.locationName}</span>
            <span className="text-slate-500 font-mono">({session.camera.cameraId})</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(session.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Speed Radar Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800">
            <Gauge className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-mono">Limit: {session.camera.speedLimitKmh} km/h</span>
            <span className="text-slate-600">|</span>
            <span className={`font-mono font-black text-sm ${isSpeeding ? 'text-red-400' : 'text-emerald-400'}`}>
              Recorded: {session.camera.recordedSpeedKmh} km/h
            </span>
            {isSpeeding && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-red-950 text-red-400 border border-red-800">
                +{speedDelta} KM/H OVER
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Evidence Viewer Canvas */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[360px] group">
        {/* Rendered Image with Zoom & Filter CSS */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out p-2"
          style={{
            transform: `scale(${zoom})`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
        >
          {/* eslint-disable-next-html-tag */}
          <img
            src={getCurrentImage()}
            alt="Evidence Snapshot"
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Canvas Floating Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl z-10 text-white">
          {/* View Tab Buttons */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800/80 mr-2">
            <button
              onClick={() => setActiveTab('BEST')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'BEST' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Best Snapshot
            </button>
            <button
              onClick={() => setActiveTab('CONTEXT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'CONTEXT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Context View
            </button>
            <button
              onClick={() => setActiveTab('CROP')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'CROP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Plate Crop
            </button>
          </div>

          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-1 font-bold text-slate-300">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1"></div>

          {/* Image Adjustments Toggle */}
          <button
            onClick={() => setShowControls(prev => !prev)}
            title="Adjust Image Brightness / Contrast"
            className={`p-1.5 rounded-lg transition-colors ${
              showControls ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetFilters}
            title="Reset Zoom & Image Filters"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Expandable Sliders Panel */}
        {showControls && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-72 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-20 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>Image Enhancements</span>
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Reset
              </button>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>Brightness</span>
                <span>{brightness}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
                <span>Contrast Boost</span>
                <span>{contrast}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="250"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Plate Crop Preview & AI Prediction Details */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-28 h-12 rounded border border-slate-700 bg-slate-950 overflow-hidden shrink-0">
            {/* eslint-disable-next-html-tag */}
            <img
              src={session.evidenceSnapshots.plateCropUrl}
              alt="Plate Crop"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">AI Visual Classifier:</span>
              <span className="text-xs font-extrabold text-white">
                {session.aiDetection.aiVehicleClass} ({session.aiDetection.aiVehicleColor})
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Lane #{session.camera.laneNumber} • Sector {session.camera.sector}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold block">AI Overall OCR Confidence</span>
          <span
            className={`text-sm font-black font-mono ${
              session.aiDetection.overallConfidence >= 90
                ? 'text-emerald-400'
                : session.aiDetection.overallConfidence >= 70
                ? 'text-amber-400'
                : 'text-red-400'
            }`}
          >
            {session.aiDetection.overallConfidence.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
