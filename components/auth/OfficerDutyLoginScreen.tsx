'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { fetchAndVerifyPoliceOfficer } from '../../lib/services/officerService';
import { PoliceOfficerDoc } from '../../lib/types';
import {
  Shield,
  ScanFace,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  UserCheck,
  Search,
  Camera,
} from 'lucide-react';

export const OfficerDutyLoginScreen: React.FC = () => {
  const {
    authenticatePoliceOfficer,
    isAuthenticating,
    authError,
  } = useAuth();

  const [step, setStep] = useState<
    'IDENTIFY' | 'FACIAL_SCAN' | 'PIN_INPUT' | 'SUCCESS'
  >('IDENTIFY');

  const [policeIdInput, setPoliceIdInput] =
    useState<string>('');

  const [verifiedOfficerDoc, setVerifiedOfficerDoc] =
    useState<PoliceOfficerDoc | null>(null);

  const [identifyError, setIdentifyError] =
    useState<string | null>(null);

  const [isCheckingDoc, setIsCheckingDoc] =
    useState<boolean>(false);

  // ------------------------------------------------------------
  // Facial / liveness state
  // ------------------------------------------------------------

  const [facialProgress, setFacialProgress] =
    useState<number>(0);

  const [isScanningFace, setIsScanningFace] =
    useState<boolean>(false);

  const [facialVerified, setFacialVerified] =
    useState<boolean>(false);

  const [facialError, setFacialError] =
    useState<string | null>(null);

  const [faceChallenge, setFaceChallenge] =
    useState<{
      challenge_id: string;
      challenge: string;
      instruction: string;
      expires_in_seconds: number;
    } | null>(null);

  const [livenessAuthorizationId, setLivenessAuthorizationId] =
    useState<string | null>(null);

  const [faceImage, setFaceImage] =
    useState<string | null>(null);

  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] =
    useState<boolean>(false);

  // ------------------------------------------------------------
  // PIN state
  // ------------------------------------------------------------

  const [pin, setPin] =
    useState<string>('');

  const [pinError, setPinError] =
    useState<string | null>(null);

  // ------------------------------------------------------------
  // Step 1: Identify officer
  // ------------------------------------------------------------

  const handleIdentifyOfficer = async () => {
    const identifier = policeIdInput.trim();

    if (!identifier) {
      setIdentifyError(
        'Please enter your Police ID or Service Number.'
      );
      return;
    }

    setIsCheckingDoc(true);
    setIdentifyError(null);
    setVerifiedOfficerDoc(null);

    // Reset previous authentication state.
    setFacialVerified(false);
    setFacialError(null);
    setFaceChallenge(null);
    setLivenessAuthorizationId(null);
    setFaceImage(null);
    setFacialProgress(0);
    setPin('');
    setPinError(null);

    try {
      /*
       * This lookup is only an eligibility/UX check.
       *
       * The actual authentication is still performed server-side
       * by /api/auth/login.
       */
      const officerDoc =
        await fetchAndVerifyPoliceOfficer(identifier);

      setVerifiedOfficerDoc(officerDoc);

      setStep('FACIAL_SCAN');
    } catch (err: any) {
      setIdentifyError(
        err?.message ||
        'Officer eligibility check failed.'
      );
    } finally {
      setIsCheckingDoc(false);
    }
  };

  // ------------------------------------------------------------
  // Camera cleanup
  // ------------------------------------------------------------

  const stopFacialCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // ------------------------------------------------------------
  // Step 2: Real biometric challenge + liveness
  // ------------------------------------------------------------

  const startFacialCamera = async () => {
    const policeId =
      verifiedOfficerDoc?.police_id ||
      policeIdInput.trim();

    if (!policeId) {
      setFacialError(
        'Police ID is missing. Please return to the identity step.'
      );
      return;
    }

    setIsScanningFace(true);
    setFacialProgress(0);
    setFacialError(null);
    setFacialVerified(false);
    setFaceChallenge(null);
    setLivenessAuthorizationId(null);
    setFaceImage(null);

    try {
      // --------------------------------------------------------
      // 1. Request a real liveness challenge
      // --------------------------------------------------------

      const challengeResponse = await fetch(
        '/api/auth/face/challenge',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            police_id: policeId,
          }),
          cache: 'no-store',
        }
      );

      const challengeData =
        await challengeResponse.json();

      if (
        !challengeResponse.ok ||
        !challengeData?.success
      ) {
        throw new Error(
          challengeData?.error ||
          'Unable to start facial verification.'
        );
      }

      if (
        !challengeData.challenge_id ||
        !challengeData.instruction
      ) {
        throw new Error(
          'The biometric service returned an invalid challenge.'
        );
      }

      setFaceChallenge({
        challenge_id:
          challengeData.challenge_id,

        challenge:
          challengeData.challenge,

        instruction:
          challengeData.instruction,

        expires_in_seconds:
          challengeData.expires_in_seconds ?? 45,
      });

      // --------------------------------------------------------
      // 2. Request browser camera
      // --------------------------------------------------------

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera access is not supported by this browser.'
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error(
          'Camera preview could not be initialized.'
        );
      }

      videoRef.current.srcObject = stream;

      await videoRef.current.play();

      setCameraActive(true);

      // --------------------------------------------------------
      // 3. Give officer time to read instruction
      // --------------------------------------------------------

      await new Promise<void>((resolve) =>
        setTimeout(resolve, 1500)
      );

      // --------------------------------------------------------
      // 4. Capture liveness frames
      // --------------------------------------------------------

      const frames: File[] = [];

      const canvas =
        document.createElement('canvas');

      const captureFrame =
        async (): Promise<File | null> => {
          const video = videoRef.current;

          if (
            !video ||
            video.readyState < 2 ||
            !video.videoWidth ||
            !video.videoHeight
          ) {
            return null;
          }

          const width = video.videoWidth;
          const height = video.videoHeight;

          canvas.width = width;
          canvas.height = height;

          const context =
            canvas.getContext('2d');

          if (!context) {
            return null;
          }

          context.drawImage(
            video,
            0,
            0,
            width,
            height
          );

          return new Promise<File | null>(
            (resolve) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(null);
                    return;
                  }

                  resolve(
                    new File(
                      [blob],
                      `liveness-frame-${frames.length + 1}.jpg`,
                      {
                        type: 'image/jpeg',
                        lastModified:
                          Date.now(),
                      }
                    )
                  );
                },
                'image/jpeg',
                0.85
              );
            }
          );
        };

      /*
       * Capture 10 frames across approximately 2.5 seconds.
       *
       * The biometric service requires at least 5 frames.
       */
      for (let i = 0; i < 10; i++) {
        const frame =
          await captureFrame();

        if (frame) {
          frames.push(frame);
        }

        setFacialProgress(
          Math.round(
            ((i + 1) / 10) * 75
          )
        );

        await new Promise<void>(
          (resolve) =>
            setTimeout(resolve, 250)
        );
      }

      if (frames.length < 5) {
        throw new Error(
          'Unable to capture enough facial frames. Please keep your face visible and try again.'
        );
      }

      // --------------------------------------------------------
      // 5. Submit frames to our Next.js server
      // --------------------------------------------------------

      const formData =
        new FormData();

      formData.append(
        'police_id',
        policeId
      );

      formData.append(
        'challenge_id',
        challengeData.challenge_id
      );

      for (const frame of frames) {
        formData.append(
          'frames',
          frame,
          frame.name
        );
      }

      setFacialProgress(85);

      const livenessResponse =
        await fetch(
          '/api/auth/face/liveness',
          {
            method: 'POST',
            body: formData,
            cache: 'no-store',
          }
        );

      const livenessData =
        await livenessResponse.json();

      if (
        !livenessResponse.ok ||
        !livenessData?.success ||
        livenessData.liveness_verified !== true
      ) {
        throw new Error(
          livenessData?.error ||
          'Facial liveness verification failed.'
        );
      }

      const fileToDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(
                new Error('Unable to read facial verification image.')
              );
            }
          };

          reader.onerror = () =>
            reject(
              new Error('Unable to read facial verification image.')
            );

          reader.readAsDataURL(file);
        });

      const finalFaceImage =
        await fileToDataUrl(frames[frames.length - 1]);

      setFaceImage(finalFaceImage);

      // --------------------------------------------------------
      // 6. Receive server-generated authorization
      // --------------------------------------------------------

      const authorizationId =
        livenessData.liveness_authorization_id;

      if (!authorizationId) {
        throw new Error(
          'Liveness was verified, but no authentication authorization was issued.'
        );
      }

      setLivenessAuthorizationId(
        authorizationId
      );

      setFacialProgress(100);
      setFacialVerified(true);

      // Liveness is finished; release camera.
      stopFacialCamera();

      // Move directly to PIN entry.
      setStep('PIN_INPUT');
    } catch (error: any) {
      console.error(
        'Facial liveness verification failed:',
        error
      );

      setFacialVerified(false);
      setLivenessAuthorizationId(null);
      setFaceImage(null);

      setFacialError(
        error?.message ||
        'Facial verification failed. Please try again.'
      );

      stopFacialCamera();
    } finally {
      setIsScanningFace(false);
    }
  };

  // ------------------------------------------------------------
  // Step 3: PIN keypad
  // ------------------------------------------------------------

  const handlePinPress = (
    digit: string
  ) => {
    if (pin.length >= 6) {
      return;
    }

    setPin(
      (previous) =>
        previous + digit
    );

    setPinError(null);
  };

  const handlePinBackspace = () => {
    setPin(
      (previous) =>
        previous.slice(0, -1)
    );

    setPinError(null);
  };

  // ------------------------------------------------------------
  // Step 3: Real server authentication
  // ------------------------------------------------------------

  const handlePinSubmit = async () => {
    if (pin.length !== 6) {
      setPinError(
        'Please enter your complete 6-digit Officer Security PIN.'
      );
      return;
    }

    const policeId =
      verifiedOfficerDoc?.police_id ||
      policeIdInput.trim();

    if (!policeId) {
      setPinError(
        'Police ID is missing. Please restart authentication.'
      );
      return;
    }

    if (!livenessAuthorizationId) {
      setPinError(
        'Facial verification authorization is missing. Please complete the facial scan again.'
      );
      return;
    }

    if (!faceImage) {
      setPinError(
        'Facial verification image is missing. Please complete the facial scan again.'
      );
      setStep('FACIAL_SCAN');
      return;
    }

    setPinError(null);

    try {
      /*
       * The updated AuthContext will send:
       *
       * police_id
       * pin
       * face_image
       * liveness_authorization_id
       *
       * to /api/auth/login.
       */
      const success =
        await authenticatePoliceOfficer(
          policeId,
          pin,
          livenessAuthorizationId,
          faceImage || ''
        );

      if (success) {
        setStep('SUCCESS');
      } else {
        setPinError(
          authError ||
          'Face + PIN verification failed.'
        );
      }
    } catch (error: any) {
      console.error(
        'Police authentication failed:',
        error
      );

      setPinError(
        error?.message ||
        'Face + PIN verification failed.'
      );
    }
  };

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white overflow-y-auto font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/90 border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-white relative z-10 space-y-4 my-auto backdrop-blur-xl">

        <div className="h-2 w-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500" />

        {/* Header */}
        <div className="px-6 pt-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-700 to-indigo-950 text-amber-300 flex items-center justify-center border-2 border-sky-400/40 shadow-lg">
              <Shield className="w-7 h-7 text-amber-300 fill-amber-300/20" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight uppercase">
                  SafeRwanda Traffic Police
                </h1>

                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  FACE + PIN AUTH
                </span>
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Official Police Duty Authentication Portal
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-[10px] font-mono text-slate-400">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              POLICE_OFFICERS DB VERIFIED
            </span>

            <span>
              DOM: saferwanda.com
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 grid grid-cols-3 gap-1.5 text-[11px] font-mono font-bold">

          <div
            className={`py-1.5 rounded-xl text-center border transition-all ${step === 'IDENTIFY'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md'
                : verifiedOfficerDoc
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
          >
            1. Identity
          </div>

          <div
            className={`py-1.5 rounded-xl text-center border transition-all ${step === 'FACIAL_SCAN'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md'
                : facialVerified
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
          >
            2. Face Match
          </div>

          <div
            className={`py-1.5 rounded-xl text-center border transition-all ${step === 'PIN_INPUT' ||
                step === 'SUCCESS'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md'
                : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
          >
            3. 6-Digit PIN
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-6">

          {/* ================================================== */}
          {/* STEP 1 — IDENTIFY */}
          {/* ================================================== */}

          {step === 'IDENTIFY' && (
            <div className="space-y-5 text-center py-2">

              <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center border-2 border-sky-500 shadow-xl">
                <UserCheck className="w-9 h-9" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-white">
                  Identify Police Officer
                </h3>

                <p className="text-xs text-slate-400">
                  Enter your enrolled Police ID or Service Number.
                  Your eligibility will be checked before biometric
                  authentication.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3">

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={policeIdInput}
                    onChange={(event) =>
                      setPoliceIdInput(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !isCheckingDoc
                      ) {
                        handleIdentifyOfficer();
                      }
                    }}
                    placeholder="Enter Police ID or Service Number..."
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 text-sm font-mono font-bold rounded-2xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {identifyError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />

                    <span>
                      {identifyError}
                    </span>
                  </div>
                )}

                <button
                  onClick={
                    handleIdentifyOfficer
                  }
                  disabled={isCheckingDoc}
                  className="w-full py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCheckingDoc
                    ? 'VERIFYING ELIGIBILITY IN FIRESTORE...'
                    : 'VERIFY OFFICER & PROCEED'}

                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            </div>
          )}

          {/* ================================================== */}
          {/* STEP 2 — FACIAL LIVENESS */}
          {/* ================================================== */}

          {step === 'FACIAL_SCAN' && (
            <div className="flex flex-col items-center justify-center space-y-5 text-center">

              {/* Camera */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-sky-500 bg-slate-950 flex items-center justify-center shadow-inner">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive
                      ? 'block'
                      : 'hidden'
                    }`}
                  style={{
                    transform:
                      'scaleX(-1)',
                  }}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
                    <ScanFace className="w-16 h-16 text-sky-400 animate-pulse" />

                    <span className="text-xs font-mono font-bold text-sky-300">
                      FACIAL LIVENESS SCANNER
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 border-2 border-sky-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-emerald-400/80 rounded-full border-dashed" />

                  <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400/90 shadow-lg shadow-emerald-400/50 animate-pulse" />
                </div>

                <span className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 text-xs font-mono text-emerald-400 font-bold border border-emerald-500/40">
                  LIVENESS: {facialProgress}%
                </span>
              </div>

              {/* Challenge */}
              {faceChallenge && (
                <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">

                  <div className="flex items-center gap-2">
                    <ScanFace className="w-5 h-5 text-amber-400" />

                    <span className="text-xs font-black uppercase text-amber-300">
                      Liveness Instruction
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-black text-white">
                    {faceChallenge.instruction}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Keep your entire face visible and follow
                    the instruction naturally.
                  </p>

                  <p className="mt-2 text-[10px] font-mono text-slate-500">
                    Challenge expires in approximately{' '}
                    {faceChallenge.expires_in_seconds}s.
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">
                  {facialVerified
                    ? 'Facial Liveness Verified'
                    : isScanningFace
                      ? 'Perform the Requested Head Movement'
                      : 'Ready for Facial Verification'}
                </h3>

                <p className="text-xs text-slate-400">
                  {facialVerified
                    ? 'Your live facial movement has been verified successfully.'
                    : faceChallenge
                      ? faceChallenge.instruction
                      : 'Click “Scan & Verify Face” to begin the biometric liveness check.'}
                </p>
              </div>

              {/* Error */}
              {facialError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />

                  <span>
                    {facialError}
                  </span>
                </div>
              )}

              {/* Controls */}
              <div className="w-full max-w-md flex gap-2">

                <button
                  onClick={
                    startFacialCamera
                  }
                  disabled={
                    isScanningFace
                  }
                  className="flex-1 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />

                  <span>
                    {isScanningFace
                      ? 'VERIFYING LIVENESS...'
                      : facialVerified
                        ? 'SCAN AGAIN'
                        : 'SCAN & VERIFY FACE'}
                  </span>
                </button>

              </div>

              {facialVerified && (
                <button
                  onClick={() => {
                    stopFacialCamera();
                    setStep(
                      'PIN_INPUT'
                    );
                  }}
                  className="w-full max-w-md py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>
                    PROCEED TO PIN
                  </span>

                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

            </div>
          )}

          {/* ================================================== */}
          {/* STEP 3 — PIN */}
          {/* ================================================== */}

          {(step === 'PIN_INPUT' ||
            step === 'SUCCESS') && (
              <div className="space-y-5 text-center">

                <div className="space-y-1">
                  <h3 className="text-base font-black text-white flex items-center justify-center gap-2">
                    <KeyRound className="w-5 h-5 text-amber-400" />

                    Enter 6-Digit Officer Security PIN
                  </h3>

                  <p className="text-xs text-slate-400">
                    Enter your personal 6-digit Security Authorization PIN.
                  </p>
                </div>

                {/* PIN indicators */}
                <div className="flex items-center justify-center space-x-2.5 py-2">
                  {[0, 1, 2, 3, 4, 5].map(
                    (index) => (
                      <div
                        key={index}
                        className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-mono font-black transition-all ${pin.length > index
                            ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 shadow-lg'
                            : 'border-slate-700 bg-slate-950 text-slate-600'
                          }`}
                      >
                        {pin.length >
                          index
                          ? '●'
                          : ''}
                      </div>
                    )
                  )}
                </div>

                {/* PIN error */}
                {pinError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-2 max-w-md mx-auto">
                    <AlertCircle className="w-4 h-4 shrink-0" />

                    <span>
                      {pinError}
                    </span>
                  </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">

                  {[
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6',
                    '7',
                    '8',
                    '9',
                  ].map((digit) => (
                    <button
                      key={digit}
                      onClick={() =>
                        handlePinPress(
                          digit
                        )
                      }
                      disabled={
                        isAuthenticating ||
                        step === 'SUCCESS'
                      }
                      className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}

                  <button
                    onClick={
                      handlePinBackspace
                    }
                    disabled={
                      isAuthenticating ||
                      step === 'SUCCESS'
                    }
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 font-black text-xs cursor-pointer"
                  >
                    DEL
                  </button>

                  <button
                    onClick={() =>
                      handlePinPress('0')
                    }
                    disabled={
                      isAuthenticating ||
                      step === 'SUCCESS'
                    }
                    className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm cursor-pointer"
                  >
                    0
                  </button>

                  <button
                    onClick={
                      handlePinSubmit
                    }
                    disabled={
                      isAuthenticating ||
                      pin.length !== 6 ||
                      step === 'SUCCESS'
                    }
                    className="py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-colors shadow-lg cursor-pointer"
                  >
                    {isAuthenticating
                      ? 'VERIFYING...'
                      : 'VERIFY ACCESS'}
                  </button>
                </div>

              </div>
            )}

          {/* ================================================== */}
          {/* SUCCESS */}
          {/* ================================================== */}

          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-2">

              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-white">
                  Access Granted
                </h3>

                <p className="text-xs text-slate-400">
                  Facial liveness, facial identity and PIN
                  authentication were verified successfully.
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};