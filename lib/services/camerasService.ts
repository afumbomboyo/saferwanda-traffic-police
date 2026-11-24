import { 
  collection, 
  getDocs, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { CameraMetadata } from '../types';

const CAMERAS_COLLECTION = 'cameras';

export interface DbCameraLocation {
  road?: string;
  district?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface DbCameraOwner {
  organization?: string;
}

export interface DbCameraServices {
  traffic_enforcement?: boolean;
  live_stream?: boolean;
  information_storage?: boolean;
  abnormal_activity_alert?: boolean;
  information_retrieval?: boolean;
}

export interface DbCameraRules {
  allowed_events?: string[];
}

export interface DbCameraDoc {
  camera_id: string;
  name: string;
  location?: DbCameraLocation;
  owner?: DbCameraOwner;
  services?: DbCameraServices;
  rules?: DbCameraRules;
  webhook_url?: string;
}

/**
 * Map Firestore document matching the official DB schema to CameraMetadata.
 */
export function mapFirestoreDocToCamera(docId: string, data: any): CameraMetadata {
  const cameraId = data.camera_id || docId;
  const name = data.name || data.location?.road || `Camera ${cameraId}`;
  const road = data.location?.road || name;
  const district = data.location?.district || 'Kigali';
  const city = data.location?.city || 'Kigali';

  return {
    cameraId,
    name,
    locationName: name,
    sector: district,
    district: district,
    city: city,
    province: city.includes('Kigali') ? 'Kigali City' : city,
    coordinates: {
      lat: typeof data.location?.latitude === 'number' ? data.location.latitude : -1.944,
      lng: typeof data.location?.longitude === 'number' ? data.location.longitude : 30.061,
    },
    organization: data.owner?.organization || 'SafeRwanda Enforcement',
    allowedEvents: Array.isArray(data.rules?.allowed_events) ? data.rules.allowed_events : [],
    webhookUrl: data.webhook_url,
    trafficEnforcement: data.services?.traffic_enforcement === true,
    liveStream: data.services?.live_stream === true,
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
    rawDoc: data,
  };
}

/**
 * Fetch cameras from Firestore `cameras` collection.
 * FILTER: Only return cameras where services.traffic_enforcement === true.
 */
export async function fetchCamerasFromFirestore(): Promise<CameraMetadata[]> {
  try {
    const colRef = collection(db, CAMERAS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const results: CameraMetadata[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Filter: Only display cameras with traffic_enforcement === true
      if (data.services?.traffic_enforcement === true) {
        results.push(mapFirestoreDocToCamera(docSnap.id, data));
      }
    });

    return results;
  } catch (error) {
    console.error('Error fetching cameras from Firestore:', error);
    return [];
  }
}

/**
 * Live real-time listener for Firestore `cameras` collection.
 * FILTER: Only passes cameras where services.traffic_enforcement === true.
 */
export function subscribeToFirestoreCameras(
  onData: (cameras: CameraMetadata[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, CAMERAS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CameraMetadata[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.services?.traffic_enforcement === true) {
          items.push(mapFirestoreDocToCamera(docSnap.id, data));
        }
      });
      onData(items);
    },
    (error) => {
      console.warn('Firestore cameras subscription error:', error);
      if (onError) onError(error);
    }
  );
}
