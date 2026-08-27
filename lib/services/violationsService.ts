import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { RealViolationRecord, ViolationSession } from '../types';

const VIOLATIONS_COLLECTION = 'violations';

// Map Firestore document data to ViolationSession format for UI components
export function mapFirestoreDocToSession(docId: string, data: any): ViolationSession {
  const realRecord: RealViolationRecord = {
    violation_id: data.violation_id || docId,
    camera_id: data.camera_id || 'CAM_001',
    identity: data.identity || {
      violation_id: data.violation_id || docId,
      violation_session_id: data.identity?.violation_session_id || `SESS-${docId}`,
    },
    violation: {
      type: data.violation?.type || 'speeding',
      timestamp: data.violation?.timestamp || data.timestamp || new Date().toISOString(),
      first_seen: data.violation?.first_seen,
      last_seen: data.violation?.last_seen,
      finalized_at: data.violation?.finalized_at,
      fine_amount_rwf: data.violation?.fine_amount_rwf || 20000,
    },
    vehicle: {
      plate: data.vehicle?.plate ?? null,
      plate_detected: data.vehicle?.plate_detected ?? Boolean(data.vehicle?.plate),
      owner_name: data.vehicle?.owner_name ?? null,
      owner_phone: data.vehicle?.owner_phone ?? null,
      owner_email: data.vehicle?.owner_email ?? null,
      make: data.vehicle?.make,
      model: data.vehicle?.model,
      color: data.vehicle?.color,
    },
    recognition: {
      status: data.recognition?.status || 'recognized',
      plate_detected: data.recognition?.plate_detected ?? Boolean(data.vehicle?.plate),
      plate_confidence: data.recognition?.plate_confidence ?? 0.94,
      ocr_confidence: data.recognition?.ocr_confidence ?? 0.94,
      plate_detection_confidence: data.recognition?.plate_detection_confidence ?? 0.91,
      processed_at: data.recognition?.processed_at,
    },
    evidence: data.evidence || {
      snapshot_score: 0.92,
    },
    enforcement: {
      status: data.enforcement?.status || 'pending_payment',
      fine_generated: data.enforcement?.fine_generated ?? true,
      notification_sent: data.enforcement?.notification_sent ?? true,
      payment_status: data.enforcement?.payment_status || 'pending',
    },
  };

  const isAuto = realRecord.enforcement.status === 'pending_payment';
  const confidencePercent = realRecord.recognition.plate_confidence 
    ? realRecord.recognition.plate_confidence * 100 
    : 90;

  return {
    sessionId: realRecord.violation_id,
    timestamp: realRecord.violation.timestamp || new Date().toISOString(),
    exceptionReason: isAuto ? 'NONE_AUTOMATIC' : (realRecord.vehicle.plate ? 'LOW_CONFIDENCE_OCR' : 'NO_PLATE_DETECTED'),
    status: isAuto ? 'AUTOMATIC_ENFORCEMENT' : 'PENDING_MANUAL_REVIEW',
    urgencyScore: isAuto ? 1 : 4,
    camera: {
      cameraId: realRecord.camera_id,
      locationName: `KN 5 Rd Corridor (${realRecord.camera_id})`,
      sector: 'Remera',
      district: 'Gasabo',
      province: 'Kigali City',
      coordinates: { lat: -1.9536, lng: 30.0906 },
      recordedSpeedKmh: 84,
      speedLimitKmh: 60,
      laneNumber: 1,
      status: 'ONLINE',
      lastPingTime: 'Just now',
    },
    evidenceSnapshots: {
      bestSnapshotUrl: data.evidence?.bestSnapshotUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230f172a"/><text x="400" y="225" font-family="sans-serif" font-size="20" fill="%2338bdf8" text-anchor="middle">ALPR ENFORCEMENT SNAPSHOT</text></svg>',
      contextSnapshotUrl: data.evidence?.contextSnapshotUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230f172a"/><text x="400" y="225" font-family="sans-serif" font-size="20" fill="%2338bdf8" text-anchor="middle">CONTEXT SNAPSHOT</text></svg>',
      plateCropUrl: data.evidence?.plateCropUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><rect width="400" height="120" fill="%23ffffff"/><text x="200" y="70" font-family="monospace" font-size="28" fill="%23000000" text-anchor="middle">RAB123A</text></svg>',
    },
    aiDetection: {
      suggestedPlate: realRecord.vehicle.plate || '',
      overallConfidence: confidencePercent,
      characterConfidences: [],
      aiVehicleClass: realRecord.vehicle.make || 'Sedan',
      aiVehicleColor: realRecord.vehicle.color || 'Dark Grey',
    },
    registryMatch: {
      found: Boolean(realRecord.vehicle.owner_name),
      plateNumber: realRecord.vehicle.plate || undefined,
      ownerName: realRecord.vehicle.owner_name || undefined,
      ownerPhone: realRecord.vehicle.owner_phone || undefined,
      make: realRecord.vehicle.make,
      model: realRecord.vehicle.model,
      color: realRecord.vehicle.color,
      registrationStatus: realRecord.vehicle.owner_name ? 'ACTIVE' : 'UNREGISTERED',
    },
    realRecord: realRecord,
  };
}

// Fetch all violations from Firestore `violations` collection
export async function fetchViolationsFromFirestore(): Promise<ViolationSession[]> {
  try {
    const colRef = collection(db, VIOLATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const results: ViolationSession[] = [];

    snapshot.forEach(docSnap => {
      results.push(mapFirestoreDocToSession(docSnap.id, docSnap.data()));
    });

    return results;
  } catch (error) {
    console.error('Error fetching violations from Firestore:', error);
    return [];
  }
}

// Live real-time listener for Firestore `violations` collection
export function subscribeToFirestoreViolations(
  onData: (sessions: ViolationSession[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, VIOLATIONS_COLLECTION);
  
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ViolationSession[] = [];
      snapshot.forEach(docSnap => {
        items.push(mapFirestoreDocToSession(docSnap.id, docSnap.data()));
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore subscription error (falling back to initial data):', error);
      if (onError) onError(error);
    }
  );
}

// Save or update violation in Firestore `violations` collection
export async function saveViolationToFirestore(record: RealViolationRecord): Promise<void> {
  try {
    const docRef = doc(db, VIOLATIONS_COLLECTION, record.violation_id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error(`Failed to save violation ${record.violation_id} to Firestore:`, error);
    throw error;
  }
}

// Seed initial violations into Firestore `violations` collection if empty
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

