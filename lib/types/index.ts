export type ExceptionReason = 
  | 'NO_PLATE_DETECTED' 
  | 'LOW_CONFIDENCE_OCR' 
  | 'REGISTRY_MISMATCH' 
  | 'UNREGISTERED_VEHICLE'
  | 'NONE_AUTOMATIC';

export type ViolationStatus = 
  | 'AUTOMATIC_ENFORCEMENT'
  | 'PENDING_MANUAL_REVIEW' 
  | 'APPROVED_CITATION_ISSUED' 
  | 'REJECTED_DISMISSED' 
  | 'FLAGGED_FOR_INVESTIGATION';

export type ViolationType = 
  | 'loitering'
  | 'line_crossing'
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
  violationType: ViolationType | string;
  fineAmountRwf: number;
  notes?: string;
  rejectionReason?: string;
  flagReason?: string;
}

export interface ViolationIdentity {
  violation_id: string;
  violation_session_id: string;
}

export interface ViolationInfo {
  type: string; // e.g. "loitering", "line_crossing", "speeding", etc.
  timestamp?: string;
  first_seen?: string;
  last_seen?: string;
  finalized_at?: string;
  fine_amount_rwf?: number;
}

export interface VehicleInfo {
  plate: string | null;
  plate_detected: boolean;
  owner_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  make?: string;
  model?: string;
  color?: string;
}

export interface RecognitionInfo {
  status: 'recognized' | 'not_recognized' | 'low_confidence' | string;
  plate_detected: boolean;
  plate_confidence: number | null;
  ocr_confidence: number | null;
  plate_detection_confidence: number | null;
  processed_at?: string;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface EvidenceInfo {
  snapshot_url?: string;
  snapshot_score?: number;
  bounding_box?: BoundingBox;
}

export interface EnforcementInfo {
  status: 'pending_payment' | 'police_review' | 'paid' | 'dismissed' | 'approved' | 'flagged' | string;
  fine_generated: boolean;
  notification_sent: boolean;
  payment_status: 'pending' | 'not_generated' | 'paid' | 'failed' | string;
}

export interface RealViolationRecord {
  violation_id: string;
  camera_id: string;
  identity?: ViolationIdentity;
  violation: ViolationInfo;
  vehicle: VehicleInfo;
  recognition: RecognitionInfo;
  evidence?: EvidenceInfo;
  enforcement: EnforcementInfo;
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
  realRecord?: RealViolationRecord;
}

export interface PoliceOfficerEnrollment {
  completed: boolean;
  fingerprint: {
    enrolled: boolean;
    credential_id?: string;
  };
  face: {
    enrolled: boolean;
    reference_id?: string;
  };
  pin: {
    configured: boolean;
  };
}

export interface PoliceOfficerDoc {
  police_id: string;
  service_number: string;
  name: string;
  rank: string;
  station: string;
  department: string;
  role: string;
  status: 'active' | 'pending_enrollment' | 'enrollment_ready' | 'suspended' | 'deactivated';
  enrollment: PoliceOfficerEnrollment;
}

export interface OfficerProfile {
  officerId: string;
  policeId?: string;
  serviceNumber?: string;
  badgeNumber: string;
  name: string;
  rank: string;
  station: string;
  district: string;
  department?: string;
  role?: string;
  shiftStartedAt: string;
  reviewsCompletedToday: number;
  accuracyRate: number; // percentage
  avatarUrl: string;
}


export interface MetricStats {
  pendingReviews: number;
  automaticEnforcementsToday: number;
  approvedToday: number;
  dismissedToday: number;
  flaggedToday: number;
  avgReviewTimeSeconds: number;
  autoEnforcementPassRate: number; // e.g. 94.2% automatically passed without human intervention
  totalCapturesToday: number;
}

