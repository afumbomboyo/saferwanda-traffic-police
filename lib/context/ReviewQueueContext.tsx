'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
  ViolationSession, 
  ExceptionReason, 
  ViolationStatus, 
  ViolationType, 
  VehicleRegistryMatch, 
  OfficerProfile, 
  MetricStats 
} from '../types';
import { INITIAL_VIOLATION_SESSIONS, MOCK_OFFICER } from '../data/mockData';
import { 
  subscribeToFirestoreViolations, 
  saveViolationToFirestore, 
  seedInitialViolationsToFirestore 
} from '../services/violationsService';
import { RealViolationRecord } from '../types';

// Simulated National Vehicle Registry Database lookup
const SIMULATED_REGISTRY: Record<string, VehicleRegistryMatch> = {
  'RAB 892 A': {
    found: true,
    plateNumber: 'RAB 892 A',
    ownerName: 'Jean-Paul Nkurunziza',
    ownerNationalId: '1 1985 8 0041230 1 88',
    ownerPhone: '+250 788 341 902',
    make: 'Toyota',
    model: 'Corolla',
    color: 'Dark Blue',
    bodyType: 'Sedan',
    manufactureYear: 2019,
    chassisNumber: 'JT111AB2940294812',
    registrationStatus: 'ACTIVE',
  },
  'RAC 459 C': {
    found: true,
    plateNumber: 'RAC 459 C',
    ownerName: 'Mutesi Divine',
    ownerNationalId: '1 1992 7 0019284 0 45',
    ownerPhone: '+250 783 109 444',
    make: 'TVS',
    model: 'Apache RTR 160',
    color: 'Red',
    bodyType: 'Motorcycle',
    manufactureYear: 2021,
    chassisNumber: 'MD2A15EB8MW901823',
    registrationStatus: 'STOLEN_ALERT',
  },
  'RAE 301 X': {
    found: true,
    plateNumber: 'RAE 301 X',
    ownerName: 'Kigali Express Logistics Ltd',
    ownerNationalId: 'TIN 102948129',
    ownerPhone: '+250 788 900 111',
    make: 'Isuzu',
    model: 'FVR Cargo',
    color: 'Grey',
    bodyType: 'Heavy Truck',
    manufactureYear: 2022,
    chassisNumber: 'ISZ99102948102',
    registrationStatus: 'ACTIVE',
  },
  'RAD 110 B': {
    found: true,
    plateNumber: 'RAD 110 B',
    ownerName: 'Claire Mugisha',
    ownerNationalId: '1 1990 7 0038192 1 12',
    ownerPhone: '+250 788 112 334',
    make: 'Hyundai',
    model: 'Elantra',
    color: 'Silver',
    bodyType: 'Sedan',
    manufactureYear: 2020,
    registrationStatus: 'ACTIVE',
  },
  'RDF 902 A': {
    found: true,
    plateNumber: 'RDF 902 A',
    ownerName: 'SAMU Emergency Medical Services Rwanda',
    make: 'Toyota',
    model: 'Land Cruiser Ambulance',
    color: 'White',
    bodyType: 'Van / Special',
    registrationStatus: 'ACTIVE',
  },
};

interface ReviewQueueContextType {
  sessions: ViolationSession[];
  activeSession: ViolationSession | null;
  activeSessionId: string | null;
  officer: OfficerProfile;
  stats: MetricStats;
  filterReason: ExceptionReason | 'ALL';
  filterStatus: ViolationStatus | 'ALL';
  searchQuery: string;
  selectSession: (sessionId: string) => void;
  nextSession: () => void;
  prevSession: () => void;
  approveSession: (
    sessionId: string,
    correctedPlate: string,
    violationType: ViolationType,
    fineAmountRwf: number,
    notes?: string
  ) => void;
  rejectSession: (sessionId: string, reason: string) => void;
  flagSession: (sessionId: string, note: string) => void;
  lookupPlateInRegistry: (plateNumber: string) => VehicleRegistryMatch;
  setFilterReason: (reason: ExceptionReason | 'ALL') => void;
  setFilterStatus: (status: ViolationStatus | 'ALL') => void;
  setSearchQuery: (query: string) => void;
  resetMockData: () => void;
}

const ReviewQueueContext = createContext<ReviewQueueContextType | undefined>(undefined);

export const ReviewQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ViolationSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('saferwanda_police_sessions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved sessions:', e);
        }
      }
    }
    return INITIAL_VIOLATION_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const pending = INITIAL_VIOLATION_SESSIONS.find(s => s.status === 'PENDING_MANUAL_REVIEW');
    return pending ? pending.sessionId : INITIAL_VIOLATION_SESSIONS[0].sessionId;
  });

  const [officer, setOfficer] = useState<OfficerProfile>(MOCK_OFFICER);
  const [filterReason, setFilterReason] = useState<ExceptionReason | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<ViolationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscribe to real-time Firestore violations collection updates & seed if needed
  useEffect(() => {
    // Attempt seeding initial data into Firestore if empty
    seedInitialViolationsToFirestore(INITIAL_VIOLATION_SESSIONS);

    // Subscribe to Firestore `violations` collection changes
    const unsubscribe = subscribeToFirestoreViolations((firestoreSessions) => {
      if (firestoreSessions && firestoreSessions.length > 0) {
        setSessions(firestoreSessions);
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('saferwanda_police_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Active Session computation
  const activeSession = useMemo(() => {
    return sessions.find(s => s.sessionId === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // Metric stats computation
  const stats: MetricStats = useMemo(() => {
    const pending = sessions.filter(s => s.status === 'PENDING_MANUAL_REVIEW').length;
    const automatic = sessions.filter(s => s.status === 'AUTOMATIC_ENFORCEMENT' || s.realRecord?.enforcement.status === 'pending_payment').length;
    const approved = sessions.filter(s => s.status === 'APPROVED_CITATION_ISSUED').length;
    const dismissed = sessions.filter(s => s.status === 'REJECTED_DISMISSED').length;
    const flagged = sessions.filter(s => s.status === 'FLAGGED_FOR_INVESTIGATION').length;

    return {
      pendingReviews: pending,
      automaticEnforcementsToday: automatic,
      approvedToday: approved,
      dismissedToday: dismissed,
      flaggedToday: flagged,
      avgReviewTimeSeconds: 42,
      autoEnforcementPassRate: 94.6, // 94.6% of pipeline passes automatically
      totalCapturesToday: 14280,
    };
  }, [sessions]);

  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const pendingQueue = useMemo(() => {
    return sessions.filter(s => s.status === 'PENDING_MANUAL_REVIEW');
  }, [sessions]);

  const nextSession = () => {
    if (!pendingQueue.length) return;
    const currentIndex = pendingQueue.findIndex(s => s.sessionId === activeSessionId);
    if (currentIndex >= 0 && currentIndex < pendingQueue.length - 1) {
      setActiveSessionId(pendingQueue[currentIndex + 1].sessionId);
    } else if (pendingQueue.length > 0) {
      setActiveSessionId(pendingQueue[0].sessionId);
    }
  };

  const prevSession = () => {
    if (!pendingQueue.length) return;
    const currentIndex = pendingQueue.findIndex(s => s.sessionId === activeSessionId);
    if (currentIndex > 0) {
      setActiveSessionId(pendingQueue[currentIndex - 1].sessionId);
    }
  };

  const lookupPlateInRegistry = (plateNumber: string): VehicleRegistryMatch => {
    const cleanStr = plateNumber.trim().toUpperCase();
    if (SIMULATED_REGISTRY[cleanStr]) {
      return SIMULATED_REGISTRY[cleanStr];
    }
    return {
      found: false,
      registrationStatus: 'UNREGISTERED',
    };
  };

  const approveSession = async (
    sessionId: string,
    correctedPlate: string,
    violationType: ViolationType,
    fineAmountRwf: number,
    notes?: string
  ) => {
    const registryLookup = lookupPlateInRegistry(correctedPlate);
    const targetSession = sessions.find(s => s.sessionId === sessionId);

    if (targetSession) {
      const updatedRealRecord: RealViolationRecord = {
        violation_id: targetSession.realRecord?.violation_id || targetSession.sessionId,
        camera_id: targetSession.realRecord?.camera_id || targetSession.camera.cameraId,
        identity: targetSession.realRecord?.identity || {
          violation_id: targetSession.sessionId,
          violation_session_id: `SESS-${targetSession.sessionId}`,
        },
        violation: {
          type: violationType.toLowerCase(),
          timestamp: targetSession.timestamp,
          fine_amount_rwf: fineAmountRwf,
        },
        vehicle: {
          plate: correctedPlate,
          plate_detected: true,
          owner_name: registryLookup.ownerName || targetSession.realRecord?.vehicle.owner_name || null,
          owner_phone: registryLookup.ownerPhone || targetSession.realRecord?.vehicle.owner_phone || null,
          owner_email: targetSession.realRecord?.vehicle.owner_email || null,
          make: registryLookup.make || targetSession.realRecord?.vehicle.make,
          model: registryLookup.model || targetSession.realRecord?.vehicle.model,
          color: registryLookup.color || targetSession.realRecord?.vehicle.color,
        },
        recognition: {
          status: 'recognized',
          plate_detected: true,
          plate_confidence: 1.0,
          ocr_confidence: 1.0,
          plate_detection_confidence: 1.0,
          processed_at: new Date().toISOString(),
        },
        evidence: targetSession.realRecord?.evidence || { snapshot_score: 0.95 },
        enforcement: {
          status: 'approved',
          fine_generated: true,
          notification_sent: true,
          payment_status: 'pending',
        },
      };

      // Persist to Firestore `violations` collection
      try {
        await saveViolationToFirestore(updatedRealRecord);
      } catch (err) {
        console.warn('Firestore save attempted (updating local state):', err);
      }
    }

    setSessions(prev =>
      prev.map(s => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            status: 'APPROVED_CITATION_ISSUED',
            registryMatch: registryLookup.found ? registryLookup : s.registryMatch,
            officerReview: {
              reviewedByOfficerId: officer.officerId,
              reviewedByOfficerName: officer.name,
              reviewedAt: new Date().toISOString(),
              originalAiPlate: s.aiDetection.suggestedPlate,
              correctedPlate: correctedPlate,
              violationType: violationType,
              fineAmountRwf: fineAmountRwf,
              notes: notes,
            },
          };
        }
        return s;
      })
    );

    // Update officer stats
    setOfficer(prev => ({
      ...prev,
      reviewsCompletedToday: prev.reviewsCompletedToday + 1,
    }));

    // Auto navigate to next pending item
    nextSession();
  };

  const rejectSession = async (sessionId: string, reason: string) => {
    const targetSession = sessions.find(s => s.sessionId === sessionId);

    if (targetSession) {
      const updatedRealRecord: RealViolationRecord = {
        violation_id: targetSession.realRecord?.violation_id || targetSession.sessionId,
        camera_id: targetSession.realRecord?.camera_id || targetSession.camera.cameraId,
        identity: targetSession.realRecord?.identity || {
          violation_id: targetSession.sessionId,
          violation_session_id: `SESS-${targetSession.sessionId}`,
        },
        violation: {
          type: targetSession.realRecord?.violation.type || 'speeding',
          timestamp: targetSession.timestamp,
          fine_amount_rwf: 0,
        },
        vehicle: targetSession.realRecord?.vehicle || {
          plate: null,
          plate_detected: false,
          owner_name: null,
          owner_phone: null,
          owner_email: null,
        },
        recognition: targetSession.realRecord?.recognition || {
          status: 'not_recognized',
          plate_detected: false,
          plate_confidence: null,
          ocr_confidence: null,
          plate_detection_confidence: null,
        },
        evidence: targetSession.realRecord?.evidence || { snapshot_score: 0.2 },
        enforcement: {
          status: 'dismissed',
          fine_generated: false,
          notification_sent: false,
          payment_status: 'not_generated',
        },
      };

      try {
        await saveViolationToFirestore(updatedRealRecord);
      } catch (err) {
        console.warn('Firestore save attempted (updating local state):', err);
      }
    }

    setSessions(prev =>
      prev.map(s => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            status: 'REJECTED_DISMISSED',
            officerReview: {
              reviewedByOfficerId: officer.officerId,
              reviewedByOfficerName: officer.name,
              reviewedAt: new Date().toISOString(),
              originalAiPlate: s.aiDetection.suggestedPlate,
              correctedPlate: s.aiDetection.suggestedPlate,
              violationType: 'SPEEDING',
              fineAmountRwf: 0,
              rejectionReason: reason,
            },
          };
        }
        return s;
      })
    );

    setOfficer(prev => ({
      ...prev,
      reviewsCompletedToday: prev.reviewsCompletedToday + 1,
    }));

    nextSession();
  };

  const flagSession = async (sessionId: string, note: string) => {
    const targetSession = sessions.find(s => s.sessionId === sessionId);

    if (targetSession) {
      const updatedRealRecord: RealViolationRecord = {
        violation_id: targetSession.realRecord?.violation_id || targetSession.sessionId,
        camera_id: targetSession.realRecord?.camera_id || targetSession.camera.cameraId,
        identity: targetSession.realRecord?.identity || {
          violation_id: targetSession.sessionId,
          violation_session_id: `SESS-${targetSession.sessionId}`,
        },
        violation: {
          type: 'suspected_cloned_plate',
          timestamp: targetSession.timestamp,
          fine_amount_rwf: 0,
        },
        vehicle: targetSession.realRecord?.vehicle || {
          plate: targetSession.aiDetection.suggestedPlate || null,
          plate_detected: Boolean(targetSession.aiDetection.suggestedPlate),
          owner_name: null,
          owner_phone: null,
          owner_email: null,
        },
        recognition: targetSession.realRecord?.recognition || {
          status: 'low_confidence',
          plate_detected: Boolean(targetSession.aiDetection.suggestedPlate),
          plate_confidence: 0.5,
          ocr_confidence: 0.5,
          plate_detection_confidence: 0.5,
        },

        evidence: targetSession.realRecord?.evidence || { snapshot_score: 0.5 },
        enforcement: {
          status: 'flagged',
          fine_generated: false,
          notification_sent: false,
          payment_status: 'investigating',
        },
      };

      try {
        await saveViolationToFirestore(updatedRealRecord);
      } catch (err) {
        console.warn('Firestore save attempted (updating local state):', err);
      }
    }

    setSessions(prev =>
      prev.map(s => {
        if (s.sessionId === sessionId) {
          return {
            ...s,
            status: 'FLAGGED_FOR_INVESTIGATION',
            officerReview: {
              reviewedByOfficerId: officer.officerId,
              reviewedByOfficerName: officer.name,
              reviewedAt: new Date().toISOString(),
              originalAiPlate: s.aiDetection.suggestedPlate,
              correctedPlate: s.aiDetection.suggestedPlate,
              violationType: 'SUSPECTED_CLONED_PLATE',
              fineAmountRwf: 0,
              flagReason: note,
            },
          };
        }
        return s;
      })
    );

    setOfficer(prev => ({
      ...prev,
      reviewsCompletedToday: prev.reviewsCompletedToday + 1,
    }));

    nextSession();
  };

  const resetMockData = () => {
    setSessions(INITIAL_VIOLATION_SESSIONS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saferwanda_police_sessions');
    }
  };


  return (
    <ReviewQueueContext.Provider
      value={{
        sessions,
        activeSession,
        activeSessionId,
        officer,
        stats,
        filterReason,
        filterStatus,
        searchQuery,
        selectSession,
        nextSession,
        prevSession,
        approveSession,
        rejectSession,
        flagSession,
        lookupPlateInRegistry,
        setFilterReason,
        setFilterStatus,
        setSearchQuery,
        resetMockData,
      }}
    >
      {children}
    </ReviewQueueContext.Provider>
  );
};

export const useReviewQueue = () => {
  const context = useContext(ReviewQueueContext);
  if (!context) {
    throw new Error('useReviewQueue must be used within a ReviewQueueProvider');
  }
  return context;
};
