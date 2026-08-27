import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// -----------------------------------------------------------------------
// Firebase Admin SDK singleton
// Must only be imported in server-side code (API routes, Server Components).
// -----------------------------------------------------------------------

function createAdminApp(): App {
  // Reuse existing app on hot-reload in dev
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    let serviceAccount: any;

    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. ' +
        'Make sure it is a single-line JSON string in your .env.local file. ' +
        `Parse error: ${(e as Error).message}`
      );
    }

    // The private key in a single-line JSON env var has literal \n sequences.
    // Restore them to real newlines so the PEM is valid.
    if (
      serviceAccount.private_key &&
      typeof serviceAccount.private_key === 'string' &&
      !serviceAccount.private_key.includes('\n')
    ) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id ?? projectId,
    });
  }

  // Fall back to Application Default Credentials (works in Firebase Studio / GCF / Cloud Run)
  console.warn(
    'FIREBASE_SERVICE_ACCOUNT_JSON not set. ' +
    'Falling back to Application Default Credentials (ADC).'
  );

  return initializeApp({ projectId });
}

const adminApp = createAdminApp();

export const adminDb = getFirestore(adminApp);
