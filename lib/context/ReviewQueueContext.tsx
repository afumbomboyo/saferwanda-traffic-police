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
    const approved = sessions.filter(s => s.status === 'APPROVED_CITATION_ISSUED').length;
    const dismissed = sessions.filter(s => s.status === 'REJECTED_DISMISSED').length;
    const flagged = sessions.filter(s => s.status === 'FLAGGED_FOR_INVESTIGATION').length;

    return {
      pendingReviews: pending,
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

  const approveSession = (
    sessionId: string,
    correctedPlate: string,
    violationType: ViolationType,
    fineAmountRwf: number,
    notes?: string
  ) => {
    const registryLookup = lookupPlateInRegistry(correctedPlate);

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

  const rejectSession = (sessionId: string, reason: string) => {
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

  const flagSession = (sessionId: string, note: string) => {
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
