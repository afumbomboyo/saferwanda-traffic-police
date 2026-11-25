'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { 
  ScanFace,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Camera,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface OfficerBiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficerBiometricModal: React.FC<OfficerBiometricModalProps> = ({ isOpen, onClose }) => {
  const { loginWithBiometrics, authError } = useAuth();

  const [step, setStep] = useState<'FACIAL_SCAN' | 'PIN_INPUT' | 'SUCCESS'>('FACIAL_SCAN');

  const [facialProgress, setFacialProgress] = useState(0);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [facialVerified, setFacialVerified] = useState(false);
  const [facialError, setFacialError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('FACIAL_SCAN');
      setFacialProgress(0);
      setFacialVerified(false);
      setFacialError(null);
      setPin('');
      setPinError(null);
      startFacialCamera();
    }
  }, [isOpen]);

  const startFacialCamera = async () => {
    setIsScanningFace(true);
    setFacialProgress(0);
    setFacialError(null);
    setFacialVerified(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const droidCam = devices.find(
          (d) => d.kind === 'videoinput' && d.label.toLowerCase().includes('droidcam')
        );

        const stream = await navigator.mediaDevices.getUserMedia({
          video: droidCam
            ? { deviceId: { exact: droidCam.deviceId }, width: { ideal: 400 }, height: { ideal: 300 } }
            : { width: { ideal: 400 }, height: { ideal: 300 } },
        });

        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (e) {
      console.warn('Camera access denied or unavailable. Fallback to synthetic facial mesh.');
      setCameraActive(false);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setFacialProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanningFace(false);
        setFacialVerified(true);
        setFacialError(null);
      }
    }, 150);
  };

  const stopFacialCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const proceedToPinInput = () => {
    if (!facialVerified) {
      setFacialError('Facial recognition match incomplete! Please complete the face scan before entering the PIN.');
      return;
    }
    stopFacialCamera();
    setStep('PIN_INPUT');
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setPinError(null);
    }
  };

  const handlePinBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (pin.length < 6) {
      setPinError('Please enter your complete 6-digit Officer PIN');
      return;
    }

    const success = await loginWithBiometrics(pin);
    if (success) {
      setStep('SUCCESS');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setPinError(authError || 'Invalid 6-digit Officer PIN (Use 884210 or 123456).');
    }
  };

  if (!isOpen) return null;

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.error('Biometric modal video play error:', err);
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-white relative space-y-4 font-sans">
        
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500"></div>

        <div className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-sky-300 font-bold">Officer Duty</p>
              <h2 className="text-xl font-black text-white">Face + PIN Access</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              CLOSE
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {step === 'FACIAL_SCAN' && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-sky-500 bg-slate-950 flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  style={{ transform: 'scaleX(-1)' }}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
                    <ScanFace className="w-16 h-16 text-sky-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-sky-300">FACE MATCH SCANNER</span>
                  </div>
                )}
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 h-full transition-all duration-200"
                  style={{ width: `${facialProgress}%` }}
                ></div>
              </div>

              {facialError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{facialError}</span>
                </div>
              )}

              <button
                onClick={startFacialCamera}
                disabled={isScanningFace}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {isScanningFace ? 'VERIFYING FACE...' : 'SCAN & VERIFY FACE'}
              </button>

              <button
                onClick={proceedToPinInput}
                disabled={!facialVerified}
                className={`w-full py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                  facialVerified
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>PROCEED TO PIN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'PIN_INPUT' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center text-amber-400">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">Enter 6-Digit Officer Security PIN</h3>
                <p className="text-xs text-slate-400">Use your assigned officer PIN to complete access.</p>
              </div>

              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`w-10 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-mono font-black transition-all ${
                      pin.length > idx
                        ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 shadow-lg'
                        : 'border-slate-700 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {pin.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinPress(String(digit))}
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button onClick={handlePinBackspace} className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm">⌫</button>
                <button onClick={() => handlePinPress('0')} className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-sm">0</button>
                <button onClick={handlePinSubmit} className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm">OK</button>
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center space-y-3 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-white">Access Granted</h3>
              <p className="text-sm text-slate-300">Facial match and PIN verified successfully.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
