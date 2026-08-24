export type ExceptionReason = 
  | 'NO_PLATE_DETECTED' 
  | 'LOW_CONFIDENCE_OCR' 
  | 'REGISTRY_MISMATCH' 
  | 'UNREGISTERED_VEHICLE';

export type ViolationStatus = 
  | 'PENDING_MANUAL_REVIEW' 
  | 'APPROVED_CITATION_ISSUED' 
  | 'REJECTED_DISMISSED' 
  | 'FLAGGED_FOR_INVESTIGATION';

export type ViolationType = 
  | 'SPEEDING' 
  | 'RED_LIGHT_VIOLATION' 
  | 'ILLEGAL_OVERTAKING' 
  | 'UNREGISTERED_DRIVING' 
  | 'BUS_LANE_INTRUSION'
  | 'SUSPECTED_CLONED_PLATE';

export interface CharacterConfidence {
  char: string;
  confidence: number; // 0 - 100
}

export interface CameraMetadata {
  cameraId: string;
  locationName: string;
  sector: string;
  district: string;
  province: 'Kigali City' | 'Northern Province' | 'Southern Province' | 'Eastern Province' | 'Western Province';
  coordinates: { lat: number; lng: number };
  recordedSpeedKmh: number;
  speedLimitKmh: number;
  laneNumber: number;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastPingTime: string;
}

export interface VehicleRegistryMatch {
  found: boolean;
  plateNumber?: string;
  ownerName?: string;
  ownerNationalId?: string;
  ownerPhone?: string;
  make?: string;
  model?: string;
  color?: string;
  bodyType?: string; // e.g. "Sedan", "SUV", "Pickup", "Bus", "Motorcycle", "Truck"
  manufactureYear?: number;
  chassisNumber?: string;
  registrationStatus?: 'ACTIVE' | 'EXPIRED' | 'STOLEN_ALERT' | 'SUSPENDED' | 'UNREGISTERED';
}

export interface OfficerReviewRecord {
  reviewedByOfficerId: string;
  reviewedByOfficerName: string;
  reviewedAt: string; // ISO Date String
  originalAiPlate: string;
  correctedPlate: string;
  violationType: ViolationType;
  fineAmountRwf: number;
  notes?: string;
  rejectionReason?: string;
  flagReason?: string;
}

export interface ViolationSession {
  sessionId: string;
  timestamp: string; // ISO String
  exceptionReason: ExceptionReason;
  status: ViolationStatus;
  urgencyScore: number; // 1 (Low) to 5 (Critical, e.g. Speed delta > 30kmh or Stolen flag)
  camera: CameraMetadata;
  evidenceSnapshots: {
    bestSnapshotUrl: string;    // Main camera image
    contextSnapshotUrl: string; // Wide angle road shot
    plateCropUrl: string;       // Zoomed crop of license plate area
  };
  aiDetection: {
    suggestedPlate: string;
    overallConfidence: number; // Percentage 0 - 100
    characterConfidences: CharacterConfidence[];
    aiVehicleClass: string;    // Predicted vehicle type from visual classifier
    aiVehicleColor: string;    // Predicted color
  };
  registryMatch: VehicleRegistryMatch;
  officerReview?: OfficerReviewRecord;
}

export interface OfficerProfile {
  officerId: string;
  badgeNumber: string;
  name: string;
  rank: string;
  station: string;
  district: string;
  shiftStartedAt: string;
  reviewsCompletedToday: number;
  accuracyRate: number; // percentage
  avatarUrl: string;
}

export interface MetricStats {
  pendingReviews: number;
  approvedToday: number;
  dismissedToday: number;
  flaggedToday: number;
  avgReviewTimeSeconds: number;
  autoEnforcementPassRate: number; // e.g. 94.2% automatically passed without human intervention
  totalCapturesToday: number;
}
