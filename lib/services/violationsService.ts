import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  onSnapshot, 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { RealViolationRecord, ViolationSession, CameraMetadata } from '../types';
import { mapFirestoreDocToCamera } from './camerasService';

const VIOLATIONS_COLLECTION = 'violations';
const CAMERAS_COLLECTION = 'cameras';

function parseTimestampString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

/**
 * Map Firestore document data from `violations` collection to ViolationSession for UI components.
 * Accepts optional cameraMap to populate exact camera details based on `camera_id`.
 */
export function mapFirestoreDocToSession(
  docId: string, 
  data: any, 
  cameraMap?: Record<string, CameraMetadata>
): ViolationSession {
  const sessionId =
    data.identity?.violation_session_id ||
    data.violation_id ||
    docId;

  const cameraId =
    data.camera_id ||
    data.identity?.camera_id ||
    'CAM_001';

  const timestamp = parseTimestampString(
    data.created_at ||
    data.violation?.first_seen ||
    data.processing?.persisted_at ||
    data.violation?.timestamp
  );

  const plate =
    data.vehicle?.plate ||
    data.identity?.plate ||
    null;

  const ownerName = data.vehicle?.owner_name || null;
  const ownerPhone = data.vehicle?.owner_phone || null;
  const ownerEmail = data.vehicle?.owner_email || null;

  const violationTypeRaw =
    data.violation?.violation_type ||
    data.violation?.type ||
    'speeding';

  const ocrConfidence =
    typeof data.recognition?.ocr_confidence === 'number'
      ? data.recognition.ocr_confidence
      : 0.94;

  const plateConfidence =
    typeof data.recognition?.plate_confidence === 'number'
      ? data.recognition.plate_confidence
      : ocrConfidence;

  const confidencePercent = Math.round(
    (plateConfidence > 1 ? plateConfidence / 100 : plateConfidence) * 100
  );

  // Parse evidence snapshot
  let bestSnapshotUrl = data.evidence?.bestSnapshotUrl;
  if (!bestSnapshotUrl && data.evidence?.snapshot) {
    const snap = data.evidence.snapshot;
    if (typeof snap === 'string' && snap.trim().length > 0) {
      if (snap.startsWith('data:') || snap.startsWith('http://') || snap.startsWith('https://')) {
        bestSnapshotUrl = snap;
      } else {
        bestSnapshotUrl = `data:image/jpeg;base64,${snap}`;
      }
    }
  }

  if (!bestSnapshotUrl) {
    bestSnapshotUrl =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230f172a"/><text x="400" y="225" font-family="sans-serif" font-size="20" fill="%2338bdf8" text-anchor="middle">ALPR ENFORCEMENT SNAPSHOT</text></svg>';
  }

  const realRecord: RealViolationRecord = {
    violation_id: sessionId,
    camera_id: cameraId,
    identity: {
      violation_id: sessionId,
      violation_session_id: sessionId,
    },
    violation: {
      type: violationTypeRaw,
      timestamp: timestamp,
      first_seen: data.violation?.first_seen,
      last_seen: data.violation?.last_seen,
      finalized_at: data.violation?.finalized_at,
      fine_amount_rwf: data.violation?.fine_amount_rwf || 20000,
    },
    vehicle: {
      plate: plate,
      plate_detected: data.vehicle?.plate_detected ?? Boolean(plate),
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      make: data.vehicle?.make,
      model: data.vehicle?.model,
      color: data.vehicle?.color,
    },
    recognition: {
      status: data.recognition?.status || 'recognized',
      plate_detected: data.recognition?.plate_detected ?? Boolean(plate),
      plate_confidence: plateConfidence,
      ocr_confidence: ocrConfidence,
      plate_detection_confidence: data.recognition?.plate_detection_confidence ?? 0.91,
      processed_at: data.recognition?.processed_at,
    },
    evidence: {
      snapshot_url: bestSnapshotUrl,
      snapshot_score: data.evidence?.snapshot_score ?? 0.92,
      bounding_box: data.evidence?.bounding_box ?? undefined,
    },
    enforcement: {
      status: data.enforcement?.status || (ownerName && plate ? 'pending_payment' : 'police_review'),
      fine_generated: data.enforcement?.fine_generated ?? Boolean(ownerName && plate),
      notification_sent: data.enforcement?.notification_sent ?? Boolean(ownerName && plate),
      payment_status: data.enforcement?.payment_status || (ownerName && plate ? 'pending' : 'not_generated'),
    },
  };

  const isAuto = Boolean(ownerName && plate && confidencePercent >= 75);

  // Look up camera metadata from cameraMap (populated from `cameras` collection in DB by camera_id)
  let matchedCamera: CameraMetadata;

  if (cameraMap && cameraMap[cameraId]) {
    matchedCamera = cameraMap[cameraId];
  } else {
    // Construct camera object adhering strictly to the DB Camera schema
    const camName =
      data.camera?.name ||
      data.camera_name ||
      data.location_name ||
      data.location?.name ||
      data.location?.road ||
      `Camera ${cameraId}`;

    const road = data.camera?.location?.road || data.location?.road || camName;
    const district = data.camera?.location?.district || data.location?.district || data.location_district || 'Gasabo';
    const city = data.camera?.location?.city || data.location?.city || 'Kigali';
    const lat = typeof (data.camera?.location?.latitude ?? data.location?.latitude) === 'number'
      ? (data.camera?.location?.latitude ?? data.location?.latitude)
      : -1.944;
    const lng = typeof (data.camera?.location?.longitude ?? data.location?.longitude) === 'number'
      ? (data.camera?.location?.longitude ?? data.location?.longitude)
      : 30.061;

    const org = data.camera?.owner?.organization || data.owner?.organization || 'SafeRwanda Enforcement';
    const allowedEvents = Array.isArray(data.camera?.rules?.allowed_events)
      ? data.camera.rules.allowed_events
      : Array.isArray(data.rules?.allowed_events)
      ? data.rules.allowed_events
      : [];

    const webhookUrl = data.camera?.webhook_url || data.webhook_url;

    matchedCamera = {
      cameraId,
      name: camName,
      locationName: road || camName,
      sector: district,
      district: district,
      city: city,
      province: city.includes('Kigali') ? 'Kigali City' : city,
      coordinates: { lat, lng },
      organization: org,
      allowedEvents,
      webhookUrl,
      trafficEnforcement: data.services?.traffic_enforcement ?? true,
      liveStream: data.services?.live_stream ?? false,
      services: {
        traffic_enforcement: data.services?.traffic_enforcement ?? true,
        live_stream: data.services?.live_stream ?? false,
        information_storage: data.services?.information_storage ?? false,
        abnormal_activity_alert: data.services?.abnormal_activity_alert ?? false,
        information_retrieval: data.services?.information_retrieval ?? false,
      },
      status: 'ONLINE',
      recordedSpeedKmh: 0,
      speedLimitKmh: 60,
      laneNumber: 1,
      lastPingTime: 'Active',
      rawDoc: data.camera || data,
    };
  }

  return {
    sessionId: sessionId,
    timestamp: timestamp,
    exceptionReason: isAuto
      ? 'NONE_AUTOMATIC'
      : !plate
      ? 'NO_PLATE_DETECTED'
      : 'LOW_CONFIDENCE_OCR',
    status: isAuto
      ? 'AUTOMATIC_ENFORCEMENT'
      : data.enforcement?.status === 'approved'
      ? 'APPROVED_CITATION_ISSUED'
      : data.enforcement?.status === 'dismissed'
      ? 'REJECTED_DISMISSED'
      : data.enforcement?.status === 'flagged'
      ? 'FLAGGED_FOR_INVESTIGATION'
      : 'PENDING_MANUAL_REVIEW',
    urgencyScore: isAuto ? 1 : 4,
    camera: matchedCamera,
    evidenceSnapshots: {
      bestSnapshotUrl: bestSnapshotUrl,
      contextSnapshotUrl:
        data.evidence?.contextSnapshotUrl ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230f172a"/><text x="400" y="225" font-family="sans-serif" font-size="20" fill="%2338bdf8" text-anchor="middle">CONTEXT SNAPSHOT</text></svg>',
      plateCropUrl:
        data.evidence?.plateCropUrl ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" fill="%23ffffff"/><text x="200" y="70" font-family="monospace" font-size="28" fill="%23000000" text-anchor="middle">RAB123A</text></svg>',
    },
    aiDetection: {
      suggestedPlate: plate || '',
      overallConfidence: confidencePercent,
      characterConfidences: [],
      aiVehicleClass: data.vehicle?.make || 'Sedan',
      aiVehicleColor: data.vehicle?.color || 'Dark Grey',
    },
    registryMatch: {
      found: Boolean(ownerName),
      plateNumber: plate || undefined,
      ownerName: ownerName || undefined,
      ownerPhone: ownerPhone || undefined,
      make: data.vehicle?.make,
      model: data.vehicle?.model,
      color: data.vehicle?.color,
      registrationStatus: ownerName ? 'ACTIVE' : 'UNREGISTERED',
    },
    realRecord: realRecord,
  };
}

/**
 * Fetch all violations from Firestore `violations` collection.
 * Joins with `cameras` collection by `camera_id`.
 */
export async function fetchViolationsFromFirestore(): Promise<ViolationSession[]> {
  try {
    // 1. Fetch camera details to build lookup map by camera_id
    const cameraMap: Record<string, CameraMetadata> = {};
    try {
      const cameraSnap = await getDocs(collection(db, CAMERAS_COLLECTION));
      cameraSnap.forEach((cSnap) => {
        const cData = cSnap.data();
        const mappedCam = mapFirestoreDocToCamera(cSnap.id, cData);
        cameraMap[mappedCam.cameraId] = mappedCam;
      });
    } catch (cErr) {
      console.warn('Unable to load cameras for violation mapping:', cErr);
    }

    // 2. Fetch violations
    const colRef = collection(db, VIOLATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const results: ViolationSession[] = [];

    snapshot.forEach((docSnap) => {
      results.push(mapFirestoreDocToSession(docSnap.id, docSnap.data(), cameraMap));
    });

    return results;
  } catch (error) {
    console.error('Error fetching violations from Firestore:', error);
    return [];
  }
}

/**
 * Live real-time listener for Firestore `violations` collection.
 * Subscribes to both `cameras` and `violations` collections so that changes to either
 * dynamically update camera metadata on each violation session.
 */
export function subscribeToFirestoreViolations(
  onData: (sessions: ViolationSession[]) => void,
  onError?: (err: Error) => void
) {
  let cameraMap: Record<string, CameraMetadata> = {};
  let latestViolationDocs: Array<{ id: string; data: any }> = [];

  const emitMappedSessions = () => {
    const items: ViolationSession[] = [];
    latestViolationDocs.forEach((docItem) => {
      items.push(mapFirestoreDocToSession(docItem.id, docItem.data, cameraMap));
    });
    onData(items);
  };

  // 1. Subscribe to cameras collection to keep cameraMap updated
  const unsubscribeCameras = onSnapshot(
    collection(db, CAMERAS_COLLECTION),
    (camSnapshot) => {
      const newMap: Record<string, CameraMetadata> = {};
      camSnapshot.forEach((cDoc) => {
        const cData = cDoc.data();
        const mappedCam = mapFirestoreDocToCamera(cDoc.id, cData);
        newMap[mappedCam.cameraId] = mappedCam;
      });
      cameraMap = newMap;
      emitMappedSessions();
    },
    (err) => {
      console.warn('Cameras subscription error inside violations listener:', err);
    }
  );

  // 2. Subscribe to violations collection
  const unsubscribeViolations = onSnapshot(
    collection(db, VIOLATIONS_COLLECTION),
    (snapshot) => {
      latestViolationDocs = [];
      snapshot.forEach((docSnap) => {
        latestViolationDocs.push({ id: docSnap.id, data: docSnap.data() });
      });
      emitMappedSessions();
    },
    (error) => {
      console.warn('Firestore violations subscription error:', error);
      if (onError) onError(error);
    }
  );

  return () => {
    unsubscribeCameras();
    unsubscribeViolations();
  };
}

/**
 * Save or update violation in Firestore `violations` collection.
 */
export async function saveViolationToFirestore(record: RealViolationRecord): Promise<void> {
  try {
    const docRef = doc(db, VIOLATIONS_COLLECTION, record.violation_id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error(`Failed to save violation ${record.violation_id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Seed initial violations into Firestore `violations` collection if empty.
 */
export async function seedInitialViolationsToFirestore(initialSessions: ViolationSession[]): Promise<void> {
  try {
    const colRef = collection(db, VIOLATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      console.log('Seeding initial violations to Firestore collection `violations`...');
      for (const session of initialSessions) {
        if (session.realRecord) {
          await saveViolationToFirestore(session.realRecord);
        }
      }
    }
  } catch (error) {
    console.warn('Seeding initial violations skipped or failed:', error);
  }
}
