import { ViolationSession, CameraMetadata, OfficerProfile, MetricStats, VehicleRegistryMatch } from '../types';

// SVG Data URI Helper to generate realistic high-resolution simulated traffic camera snapshots
function createTrafficSnapshotSvg(
  plateText: string,
  vehicleColor: string,
  vehicleType: string,
  speed: number,
  speedLimit: number,
  location: string,
  timestamp: string,
  isBlurry: boolean = false,
  isNoPlate: boolean = false
): string {
  const isOverSpeed = speed > speedLimit;
  const speedColor = isOverSpeed ? '#ef4444' : '#22c55e';
  const displayPlate = isNoPlate ? ' [ NO PLATE READ ] ' : plateText;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="60%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
      <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="blurFilter">
        <feGaussianBlur stdDeviation="${isBlurry ? '6' : '0'}" />
      </filter>
      <linearGradient id="headlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#fef08a" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Background Environment -->
    <rect width="1200" height="675" fill="url(#bgGrad)" />

    <!-- Road Markings -->
    <polygon points="100,675 450,300 750,300 1100,675" fill="url(#roadGrad)" />
    <!-- Lane Divider Lines -->
    <line x1="600" y1="300" x2="600" y2="675" stroke="#fef08a" stroke-width="4" stroke-dasharray="25,20" />
    <line x1="400" y1="675" x2="520" y2="300" stroke="#ffffff" stroke-width="2" opacity="0.6" />
    <line x1="800" y1="675" x2="680" y2="300" stroke="#ffffff" stroke-width="2" opacity="0.6" />

    <!-- Distant Streetlights & Rwandan Hills Silhouette -->
    <path d="M0,320 Q300,280 600,310 T1200,290 L1200,350 L0,350 Z" fill="#020617" opacity="0.7" />

    <!-- Vehicle Body Base -->
    <g filter="url(#blurFilter)">
      <!-- Shadow -->
      <ellipse cx="600" cy="530" rx="240" ry="40" fill="#000000" opacity="0.7" />

      <!-- Car Body -->
      <path d="M420,510 L440,430 C460,370 520,350 600,350 C680,350 740,370 760,430 L780,510 Q780,540 750,540 L450,540 Q420,540 420,510 Z" fill="${vehicleColor}" stroke="#475569" stroke-width="3" />
      <!-- Windshield -->
      <path d="M465,430 C480,380 530,365 600,365 C670,365 720,380 735,430 Z" fill="#38bdf8" opacity="0.4" stroke="#0284c7" stroke-width="2" />
      <!-- Headlights / Taillights (Rear view) -->
      <rect x="435" y="470" width="60" height="25" rx="6" fill="#dc2626" opacity="0.9" />
      <rect x="705" y="470" width="60" height="25" rx="6" fill="#dc2626" opacity="0.9" />
      <rect x="440" y="475" width="50" height="15" rx="4" fill="#ef4444" />
      <rect x="710" y="475" width="50" height="15" rx="4" fill="#ef4444" />

      <!-- Rear Bumper & License Plate Housing -->
      <rect x="520" y="495" width="160" height="36" rx="4" fill="#0f172a" stroke="#64748b" stroke-width="2" />

      <!-- License Plate Plate Geometry -->
      <g>
        <!-- Rwandan Plate Background (Yellow top bar, white body, Rwandan flag motif icon) -->
        <rect x="526" y="500" width="148" height="26" rx="3" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
        <rect x="526" y="500" width="148" height="5" fill="#0284c7" />
        <rect x="526" y="505" width="148" height="2" fill="#eab308" />
        <rect x="526" y="507" width="148" height="2" fill="#22c55e" />
        
        <!-- Text on Plate -->
        <text x="600" y="521" font-family="'Courier New', monospace" font-weight="900" font-size="14" fill="#090d16" text-anchor="middle" letter-spacing="2">
          ${displayPlate}
        </text>
      </g>
    </g>

    <!-- AI Bounding Box Overlay -->
    <rect x="410" y="340" width="380" height="210" rx="8" fill="none" stroke="${isOverSpeed ? '#ef4444' : '#3b82f6'}" stroke-width="2" stroke-dasharray="8,6" />
    <!-- Bounding Box Corner Brackets -->
    <path d="M410,360 L410,340 L430,340" stroke="${isOverSpeed ? '#ef4444' : '#3b82f6'}" stroke-width="4" fill="none" />
    <path d="M790,360 L790,340 L770,340" stroke="${isOverSpeed ? '#ef4444' : '#3b82f6'}" stroke-width="4" fill="none" />
    <path d="M410,530 L410,550 L430,550" stroke="${isOverSpeed ? '#ef4444' : '#3b82f6'}" stroke-width="4" fill="none" />
    <path d="M790,530 L790,550 L770,550" stroke="${isOverSpeed ? '#ef4444' : '#3b82f6'}" stroke-width="4" fill="none" />

    <!-- ALPR Plate Detection Box Target -->
    <rect x="518" y="493" width="164" height="40" rx="4" fill="none" stroke="#eab308" stroke-width="2.5" />
    <text x="520" y="488" font-family="sans-serif" font-size="11" font-weight="bold" fill="#eab308">ALPR ROI [PLATE_ROI_1]</text>

    <!-- Camera OS D/HUD Overlay (Police Radar & Telemetry) -->
    <rect x="20" y="20" width="1160" height="50" rx="8" fill="#090d16" opacity="0.85" stroke="#334155" stroke-width="1" />
    
    <!-- Telemetry Information -->
    <text x="40" y="42" font-family="monospace" font-size="13" fill="#94a3b8">CAM ID: <tspan fill="#f8fafc" font-weight="bold">${location}</tspan></text>
    <text x="340" y="42" font-family="monospace" font-size="13" fill="#94a3b8">TIME: <tspan fill="#f8fafc" font-weight="bold">${timestamp}</tspan></text>
    <text x="640" y="42" font-family="monospace" font-size="13" fill="#94a3b8">RADAR SPEED: <tspan fill="${speedColor}" font-weight="bold" font-size="15">${speed} km/h</tspan> (LIMIT: ${speedLimit} km/h)</text>
    <text x="1020" y="42" font-family="monospace" font-size="13" fill="#94a3b8">DELTA: <tspan fill="${speedColor}" font-weight="bold">+${Math.max(0, speed - speedLimit)} km/h</tspan></text>

    <!-- Crosshair Target Center -->
    <line x1="600" y1="310" x2="600" y2="360" stroke="#0284c7" stroke-width="1.5" opacity="0.7" />
    <line x1="575" y1="337" x2="625" y2="337" stroke="#0284c7" stroke-width="1.5" opacity="0.7" />

    <!-- SafeRwanda Watermark -->
    <text x="1170" y="650" font-family="sans-serif" font-size="12" font-weight="bold" fill="#64748b" text-anchor="end" opacity="0.6">SAFERWANDA ENFORCEMENT PIPELINE v4.2</text>
  </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createPlateCropSvg(plateText: string, confidenceText: string, isNoPlate: boolean = false, isDirty: boolean = false): string {
  const displayPlate = isNoPlate ? '  ??? ???  ' : plateText;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 160" width="100%" height="100%">
    <defs>
      <linearGradient id="plateBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="${isDirty ? '0.8' : '0.05'}" numOctaves="3" result="noise" />
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${isDirty ? '0.6' : '0.05'} 0" />
        <feComposite operator="in" in2="SourceGraphic" />
      </filter>
    </defs>

    <rect width="500" height="160" fill="#0f172a" />

    <!-- License Plate Frame -->
    <g transform="translate(30, 20)">
      <!-- Main Plate Body -->
      <rect x="0" y="0" width="440" height="120" rx="10" fill="url(#plateBg)" stroke="#1e293b" stroke-width="4" />
      
      <!-- Rwandan Colors Banner Top -->
      <rect x="0" y="0" width="440" height="18" rx="8" fill="#0284c7" />
      <rect x="0" y="18" width="440" height="6" fill="#eab308" />
      <rect x="0" y="24" width="440" height="6" fill="#22c55e" />
      
      <text x="220" y="14" font-family="sans-serif" font-weight="bold" font-size="10" fill="#ffffff" text-anchor="middle" letter-spacing="2">REPUBLIC OF RWANDA</text>

      <!-- Dirty / Mud Overlay if applicable -->
      ${isDirty ? `<rect x="0" y="0" width="440" height="120" fill="#78350f" opacity="0.55" filter="url(#noise)"/>` : ''}

      <!-- License Plate Characters -->
      <text x="220" y="85" font-family="'Courier New', monospace" font-weight="900" font-size="44" fill="#090d16" text-anchor="middle" letter-spacing="6">
        ${displayPlate}
      </text>

      <!-- Hologram / Seal -->
      <circle cx="45" cy="70" r="14" fill="#eab308" opacity="0.3" stroke="#ca8a04" stroke-width="1" />
      <text x="45" y="73" font-family="sans-serif" font-size="8" font-weight="bold" fill="#854d0e" text-anchor="middle">RRA</text>
    </g>

    <!-- Crop Grid Guides -->
    <line x1="30" y1="20" x2="50" y2="20" stroke="#3b82f6" stroke-width="3" />
    <line x1="30" y1="20" x2="30" y2="40" stroke="#3b82f6" stroke-width="3" />
    <line x1="470" y1="20" x2="450" y2="20" stroke="#3b82f6" stroke-width="3" />
    <line x1="470" y1="20" x2="470" y2="40" stroke="#3b82f6" stroke-width="3" />

    <text x="470" y="152" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="end">CONFIDENCE: ${confidenceText}</text>
  </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial Mock Sessions representing realistic Traffic Police Enforcement & Exceptions across Rwanda
export const INITIAL_VIOLATION_SESSIONS: ViolationSession[] = [
  // 1. AUTOMATIC ENFORCEMENT CASE (Matching exact prompt schema)
  {
    sessionId: 'VIO-CAM_001-20260824-001',
    timestamp: '2026-08-24T09:42:31.000Z',
    exceptionReason: 'NONE_AUTOMATIC',
    status: 'AUTOMATIC_ENFORCEMENT',
    urgencyScore: 1,
    camera: {
      cameraId: 'CAM_001',
      locationName: 'KN 3 Rd - City Center Corridor',
      sector: 'Nyarugenge',
      district: 'Nyarugenge',
      province: 'Kigali City',
      coordinates: { lat: -1.9441, lng: 30.0619 },
      recordedSpeedKmh: 45,
      speedLimitKmh: 50,
      laneNumber: 1,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T09:43:00Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('RAB123A', '#1e293b', 'Sedan', 45, 50, 'KN 3 Rd - City Center', '09:42:31'),
      contextSnapshotUrl: createTrafficSnapshotSvg('RAB123A', '#1e293b', 'Sedan', 45, 50, 'KN 3 Rd - City Center', '09:42:31'),
      plateCropUrl: createPlateCropSvg('RAB123A', '94.0%', false, false),
    },
    aiDetection: {
      suggestedPlate: 'RAB123A',
      overallConfidence: 94.0,
      characterConfidences: [
        { char: 'R', confidence: 96 },
        { char: 'A', confidence: 95 },
        { char: 'B', confidence: 94 },
        { char: '1', confidence: 93 },
        { char: '2', confidence: 94 },
        { char: '3', confidence: 92 },
        { char: 'A', confidence: 94 },
      ],
      aiVehicleClass: 'Sedan',
      aiVehicleColor: 'Dark Grey',
    },
    registryMatch: {
      found: true,
      plateNumber: 'RAB123A',
      ownerName: 'John Doe',
      ownerPhone: '+25078XXXXXXX',
      make: 'Toyota',
      model: 'RAV4',
      color: 'Dark Grey',
      registrationStatus: 'ACTIVE',
    },
    realRecord: {
      violation_id: "VIO-CAM_001-20260824-001",
      camera_id: "CAM_001",
      identity: {
        violation_id: "VIO-CAM_001-20260824-001",
        violation_session_id: "VIO-CAM_001-20260824-103012-a8f31c"
      },
      violation: {
        type: "loitering",
        timestamp: "2026-08-24T09:42:31.000Z",
        first_seen: "2026-08-24T09:42:01.000Z",
        last_seen: "2026-08-24T09:42:31.000Z",
        finalized_at: "2026-08-24T09:42:41.000Z",
        fine_amount_rwf: 20000
      },
      vehicle: {
        plate: "RAB123A",
        plate_detected: true,
        owner_name: "John Doe",
        owner_phone: "+25078XXXXXXX",
        owner_email: "john@example.com",
        make: "Toyota",
        model: "RAV4",
        color: "Dark Grey"
      },
      recognition: {
        status: "recognized",
        plate_detected: true,
        plate_confidence: 0.94,
        ocr_confidence: 0.94,
        plate_detection_confidence: 0.91,
        processed_at: "2026-08-24T09:42:38.000Z"
      },
      evidence: {
        snapshot_score: 0.9234,
        bounding_box: {
          x1: 720,
          y1: 621,
          x2: 1464,
          y2: 2151
        }
      },
      enforcement: {
        status: "pending_payment",
        fine_generated: true,
        notification_sent: true,
        payment_status: "pending"
      }
    }
  },

  // 2. POLICE REVIEW CASE (Matching exact prompt schema)
  {
    sessionId: 'VIO-CAM_002-20260824-002',
    timestamp: '2026-08-24T09:45:00.000Z',
    exceptionReason: 'NO_PLATE_DETECTED',
    status: 'PENDING_MANUAL_REVIEW',
    urgencyScore: 5,
    camera: {
      cameraId: 'CAM_002',
      locationName: 'KG 11 Ave - Remera Hub',
      sector: 'Remera',
      district: 'Gasabo',
      province: 'Kigali City',
      coordinates: { lat: -1.9589, lng: 30.1123 },
      recordedSpeedKmh: 68,
      speedLimitKmh: 60,
      laneNumber: 2,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T09:45:15Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('NO PLATE', '#991b1b', 'Pickup', 68, 60, 'KG 11 Ave - Remera', '09:45:00', true, true),
      contextSnapshotUrl: createTrafficSnapshotSvg('NO PLATE', '#991b1b', 'Pickup', 68, 60, 'KG 11 Ave - Remera', '09:45:00', false, true),
      plateCropUrl: createPlateCropSvg('??? ???', '0.0%', true, true),
    },
    aiDetection: {
      suggestedPlate: '',
      overallConfidence: 0,
      characterConfidences: [],
      aiVehicleClass: 'Pickup',
      aiVehicleColor: 'Red',
    },
    registryMatch: {
      found: false,
      registrationStatus: 'UNREGISTERED',
    },
    realRecord: {
      violation_id: "VIO-CAM_002-20260824-002",
      camera_id: "CAM_002",
      identity: {
        violation_id: "VIO-CAM_002-20260824-002",
        violation_session_id: "VIO-CAM_002-20260824-094500-b9e42d"
      },
      violation: {
        type: "line_crossing",
        timestamp: "2026-08-24T09:45:00.000Z",
        fine_amount_rwf: 25000
      },
      vehicle: {
        plate: null,
        plate_detected: false,
        owner_name: null,
        owner_phone: null,
        owner_email: null
      },
      recognition: {
        status: "not_recognized",
        plate_detected: false,
        plate_confidence: null,
        ocr_confidence: null,
        plate_detection_confidence: null
      },
      evidence: {
        snapshot_score: 0.2100
      },
      enforcement: {
        status: "police_review",
        fine_generated: false,
        notification_sent: false,
        payment_status: "not_generated"
      }
    }
  },

  // 3. Additional Automatic Enforcement Case (Speeding 98% confidence)
  {
    sessionId: 'VIO-CAM_003-20260824-003',
    timestamp: '2026-08-24T09:50:12.000Z',
    exceptionReason: 'NONE_AUTOMATIC',
    status: 'AUTOMATIC_ENFORCEMENT',
    urgencyScore: 2,
    camera: {
      cameraId: 'CAM_003',
      locationName: 'RN4 Expressway - Musanze Toll Gate',
      sector: 'Muhoza',
      district: 'Musanze',
      province: 'Northern Province',
      coordinates: { lat: -1.5002, lng: 29.6335 },
      recordedSpeedKmh: 98,
      speedLimitKmh: 80,
      laneNumber: 1,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T09:51:00Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('RAC 459 C', '#0f766e', 'SUV', 98, 80, 'RN4 Musanze', '09:50:12'),
      contextSnapshotUrl: createTrafficSnapshotSvg('RAC 459 C', '#0f766e', 'SUV', 98, 80, 'RN4 Musanze', '09:50:12'),
      plateCropUrl: createPlateCropSvg('RAC 459 C', '98.0%', false, false),
    },
    aiDetection: {
      suggestedPlate: 'RAC 459 C',
      overallConfidence: 98.0,
      characterConfidences: [
        { char: 'R', confidence: 99 },
        { char: 'A', confidence: 99 },
        { char: 'C', confidence: 98 },
        { char: ' ', confidence: 100 },
        { char: '4', confidence: 97 },
        { char: '5', confidence: 98 },
        { char: '9', confidence: 97 },
        { char: ' ', confidence: 100 },
        { char: 'C', confidence: 98 },
      ],
      aiVehicleClass: 'SUV',
      aiVehicleColor: 'Dark Teal',
    },
    registryMatch: {
      found: true,
      plateNumber: 'RAC 459 C',
      ownerName: 'Mutesi Divine',
      ownerPhone: '+250783109444',
      make: 'TVS',
      model: 'Apache RTR 160',
      color: 'Red',
      registrationStatus: 'ACTIVE',
    },
    realRecord: {
      violation_id: "VIO-CAM_003-20260824-003",
      camera_id: "CAM_003",
      identity: {
        violation_id: "VIO-CAM_003-20260824-003",
        violation_session_id: "VIO-CAM_003-20260824-095012-c7f91a"
      },
      violation: {
        type: "speeding",
        timestamp: "2026-08-24T09:50:12.000Z",
        first_seen: "2026-08-24T09:50:00.000Z",
        last_seen: "2026-08-24T09:50:12.000Z",
        finalized_at: "2026-08-24T09:50:20.000Z",
        fine_amount_rwf: 50000
      },
      vehicle: {
        plate: "RAC 459 C",
        plate_detected: true,
        owner_name: "Mutesi Divine",
        owner_phone: "+250783109444",
        owner_email: "mutesi@example.com",
        make: "TVS",
        model: "Apache RTR 160",
        color: "Red"
      },
      recognition: {
        status: "recognized",
        plate_detected: true,
        plate_confidence: 0.98,
        ocr_confidence: 0.98,
        plate_detection_confidence: 0.96,
        processed_at: "2026-08-24T09:50:15.000Z"
      },
      evidence: {
        snapshot_score: 0.9650,
        bounding_box: { x1: 650, y1: 580, x2: 1380, y2: 2020 }
      },
      enforcement: {
        status: "pending_payment",
        fine_generated: true,
        notification_sent: true,
        payment_status: "pending"
      }
    }
  },

  // 4. Police Review Case - LOW CONFIDENCE OCR
  {
    sessionId: 'SESS-RW-2026-8801',
    timestamp: '2026-08-24T10:42:15Z',
    exceptionReason: 'LOW_CONFIDENCE_OCR',
    status: 'PENDING_MANUAL_REVIEW',
    urgencyScore: 4,
    camera: {
      cameraId: 'CAM-KGL-04',
      locationName: 'KN 5 Rd - Kimihurura Junction',
      sector: 'Kimihurura',
      district: 'Gasabo',
      province: 'Kigali City',
      coordinates: { lat: -1.9536, lng: 30.0906 },
      recordedSpeedKmh: 84,
      speedLimitKmh: 60,
      laneNumber: 2,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T10:45:00Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('RAB 892 A', '#1e3a8a', 'Sedan', 84, 60, 'KN 5 Rd - Kimihurura', '10:42:15'),
      contextSnapshotUrl: createTrafficSnapshotSvg('RAB 892 A', '#1e3a8a', 'Sedan', 84, 60, 'KN 5 Rd - Kimihurura', '10:42:15'),
      plateCropUrl: createPlateCropSvg('RAB 892 A', '68.4%', false, false),
    },
    aiDetection: {
      suggestedPlate: 'RAB 892 A',
      overallConfidence: 68.4,
      characterConfidences: [
        { char: 'R', confidence: 99 },
        { char: 'A', confidence: 98 },
        { char: 'B', confidence: 95 },
        { char: ' ', confidence: 100 },
        { char: '8', confidence: 52 },
        { char: '9', confidence: 48 },
        { char: '2', confidence: 91 },
        { char: ' ', confidence: 100 },
        { char: 'A', confidence: 92 },
      ],
      aiVehicleClass: 'Sedan',
      aiVehicleColor: 'Dark Blue',
    },
    registryMatch: {
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
    realRecord: {
      violation_id: "SESS-RW-2026-8801",
      camera_id: "CAM-KGL-04",
      identity: {
        violation_id: "SESS-RW-2026-8801",
        violation_session_id: "SESS-RW-2026-8801-104215"
      },
      violation: {
        type: "speeding",
        timestamp: "2026-08-24T10:42:15Z",
        fine_amount_rwf: 25000
      },
      vehicle: {
        plate: "RAB 892 A",
        plate_detected: true,
        owner_name: null, // Low confidence -> owner review needed
        owner_phone: null,
        owner_email: null
      },
      recognition: {
        status: "low_confidence",
        plate_detected: true,
        plate_confidence: 0.684,
        ocr_confidence: 0.684,
        plate_detection_confidence: 0.720,
        processed_at: "2026-08-24T10:42:18Z"
      },
      enforcement: {
        status: "police_review",
        fine_generated: false,
        notification_sent: false,
        payment_status: "not_generated"
      }
    }
  },

  // 5. Police Review Case - REGISTRY MISMATCH
  {
    sessionId: 'SESS-RW-2026-8803',
    timestamp: '2026-08-24T10:29:40Z',
    exceptionReason: 'REGISTRY_MISMATCH',
    status: 'PENDING_MANUAL_REVIEW',
    urgencyScore: 5,
    camera: {
      cameraId: 'CAM-NYB-02',
      locationName: 'Nyabugogo Bus Terminal Corridor',
      sector: 'Gitega',
      district: 'Nyarugenge',
      province: 'Kigali City',
      coordinates: { lat: -1.9402, lng: 30.0450 },
      recordedSpeedKmh: 72,
      speedLimitKmh: 50,
      laneNumber: 3,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T10:45:00Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('RAC 459 C', '#0f766e', 'SUV', 72, 50, 'Nyabugogo Corridor', '10:29:40'),
      contextSnapshotUrl: createTrafficSnapshotSvg('RAC 459 C', '#0f766e', 'SUV', 72, 50, 'Nyabugogo Corridor', '10:29:40'),
      plateCropUrl: createPlateCropSvg('RAC 459 C', '96.2%', false, false),
    },
    aiDetection: {
      suggestedPlate: 'RAC 459 C',
      overallConfidence: 96.2,
      characterConfidences: [
        { char: 'R', confidence: 98 },
        { char: 'A', confidence: 99 },
        { char: 'C', confidence: 97 },
        { char: ' ', confidence: 100 },
        { char: '4', confidence: 95 },
        { char: '5', confidence: 96 },
        { char: '9', confidence: 94 },
        { char: ' ', confidence: 100 },
        { char: 'C', confidence: 95 },
      ],
      aiVehicleClass: 'SUV',
      aiVehicleColor: 'Green / Dark Teal',
    },
    registryMatch: {
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
    realRecord: {
      violation_id: "SESS-RW-2026-8803",
      camera_id: "CAM-NYB-02",
      identity: {
        violation_id: "SESS-RW-2026-8803",
        violation_session_id: "SESS-RW-2026-8803-102940"
      },
      violation: {
        type: "speeding",
        timestamp: "2026-08-24T10:29:40Z",
        fine_amount_rwf: 25000
      },
      vehicle: {
        plate: "RAC 459 C",
        plate_detected: true,
        owner_name: null, // Registry mismatch flag
        owner_phone: null,
        owner_email: null
      },
      recognition: {
        status: "recognized",
        plate_detected: true,
        plate_confidence: 0.962,
        ocr_confidence: 0.962,
        plate_detection_confidence: 0.950,
        processed_at: "2026-08-24T10:29:45Z"
      },
      enforcement: {
        status: "police_review",
        fine_generated: false,
        notification_sent: false,
        payment_status: "not_generated"
      }
    }
  },

  // 6. Approved Officer Review Record
  {
    sessionId: 'SESS-RW-2026-8805',
    timestamp: '2026-08-24T09:55:00Z',
    exceptionReason: 'LOW_CONFIDENCE_OCR',
    status: 'APPROVED_CITATION_ISSUED',
    urgencyScore: 2,
    camera: {
      cameraId: 'CAM-KGL-04',
      locationName: 'KN 5 Rd - Kimihurura Junction',
      sector: 'Kimihurura',
      district: 'Gasabo',
      province: 'Kigali City',
      coordinates: { lat: -1.9536, lng: 30.0906 },
      recordedSpeedKmh: 78,
      speedLimitKmh: 60,
      laneNumber: 2,
      status: 'ONLINE',
      lastPingTime: '2026-08-24T10:45:00Z',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: createTrafficSnapshotSvg('RAD 110 B', '#475569', 'Sedan', 78, 60, 'KN 5 Rd - Kimihurura', '09:55:00'),
      contextSnapshotUrl: createTrafficSnapshotSvg('RAD 110 B', '#475569', 'Sedan', 78, 60, 'KN 5 Rd - Kimihurura', '09:55:00'),
      plateCropUrl: createPlateCropSvg('RAD 110 B', '71.0%', false, false),
    },
    aiDetection: {
      suggestedPlate: 'RAD 110 B',
      overallConfidence: 71.0,
      characterConfidences: [
        { char: 'R', confidence: 99 },
        { char: 'A', confidence: 98 },
        { char: 'D', confidence: 60 },
        { char: ' ', confidence: 100 },
        { char: '1', confidence: 95 },
        { char: '1', confidence: 96 },
        { char: '0', confidence: 55 },
        { char: ' ', confidence: 100 },
        { char: 'B', confidence: 92 },
      ],
      aiVehicleClass: 'Sedan',
      aiVehicleColor: 'Silver',
    },
    registryMatch: {
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
    officerReview: {
      reviewedByOfficerId: 'TRP-8842',
      reviewedByOfficerName: 'Capt. E. Habimana',
      reviewedAt: '2026-08-24T10:02:10Z',
      originalAiPlate: 'RAD 110 B',
      correctedPlate: 'RAD 110 B',
      violationType: 'SPEEDING',
      fineAmountRwf: 25000,
      notes: 'Plate clearly reads RAD 110 B despite glare on character D.',
    },
    realRecord: {
      violation_id: "SESS-RW-2026-8805",
      camera_id: "CAM-KGL-04",
      identity: {
        violation_id: "SESS-RW-2026-8805",
        violation_session_id: "SESS-RW-2026-8805-095500"
      },
      violation: {
        type: "speeding",
        timestamp: "2026-08-24T09:55:00Z",
        fine_amount_rwf: 25000
      },
      vehicle: {
        plate: "RAD 110 B",
        plate_detected: true,
        owner_name: "Claire Mugisha",
        owner_phone: "+250 788 112 334",
        owner_email: "claire@example.com"
      },
      recognition: {
        status: "recognized",
        plate_detected: true,
        plate_confidence: 0.71,
        ocr_confidence: 0.71,
        plate_detection_confidence: 0.75,
        processed_at: "2026-08-24T09:55:05Z"
      },
      enforcement: {
        status: "approved",
        fine_generated: true,
        notification_sent: true,
        payment_status: "pending"
      }
    }
  }
];


export const MOCK_OFFICER: OfficerProfile = {
  officerId: 'TRP-8842',
  badgeNumber: 'RW-POL-09182',
  name: 'Capt. Emmanuel Habimana',
  rank: 'Senior Traffic Inspector',
  station: 'Rwanda National Police Traffic Headquarters',
  district: 'Remera, Kigali City',
  shiftStartedAt: '2026-08-24T06:00:00Z',
  reviewsCompletedToday: 42,
  accuracyRate: 99.4,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
};

export const MOCK_CAMERAS: CameraMetadata[] = [
  {
    cameraId: 'CAM-KGL-04',
    locationName: 'KN 5 Rd - Kimihurura Junction',
    sector: 'Kimihurura',
    district: 'Gasabo',
    province: 'Kigali City',
    coordinates: { lat: -1.9536, lng: 30.0906 },
    recordedSpeedKmh: 84,
    speedLimitKmh: 60,
    laneNumber: 2,
    status: 'ONLINE',
    lastPingTime: 'Just now',
  },
  {
    cameraId: 'CAM-KGL-12',
    locationName: 'KG 11 Ave - Remera Hub',
    sector: 'Remera',
    district: 'Gasabo',
    province: 'Kigali City',
    coordinates: { lat: -1.9589, lng: 30.1123 },
    recordedSpeedKmh: 98,
    speedLimitKmh: 60,
    laneNumber: 1,
    status: 'ONLINE',
    lastPingTime: 'Just now',
  },
  {
    cameraId: 'CAM-NYB-02',
    locationName: 'Nyabugogo Bus Terminal Corridor',
    sector: 'Gitega',
    district: 'Nyarugenge',
    province: 'Kigali City',
    coordinates: { lat: -1.9402, lng: 30.0450 },
    recordedSpeedKmh: 72,
    speedLimitKmh: 50,
    laneNumber: 3,
    status: 'ONLINE',
    lastPingTime: '2 mins ago',
  },
  {
    cameraId: 'CAM-MSZ-01',
    locationName: 'RN4 Expressway - Musanze Toll Gate',
    sector: 'Muhoza',
    district: 'Musanze',
    province: 'Northern Province',
    coordinates: { lat: -1.5002, lng: 29.6335 },
    recordedSpeedKmh: 92,
    speedLimitKmh: 80,
    laneNumber: 1,
    status: 'ONLINE',
    lastPingTime: '5 mins ago',
  },
  {
    cameraId: 'CAM-HYE-01',
    locationName: 'Huye University Avenue - RN2',
    sector: 'Ngoma',
    district: 'Huye',
    province: 'Southern Province',
    coordinates: { lat: -2.5967, lng: 29.7394 },
    recordedSpeedKmh: 54,
    speedLimitKmh: 50,
    laneNumber: 1,
    status: 'ONLINE',
    lastPingTime: '10 mins ago',
  },
  {
    cameraId: 'CAM-RWA-08',
    locationName: 'Rwamagana Highway - East Corridor',
    sector: 'Kigabiro',
    district: 'Rwamagana',
    province: 'Eastern Province',
    coordinates: { lat: -1.9487, lng: 30.4347 },
    recordedSpeedKmh: 60,
    speedLimitKmh: 60,
    laneNumber: 2,
    status: 'DEGRADED',
    lastPingTime: '18 mins ago',
  },
];
