import { NextResponse } from 'next/server';
import { fetchViolationsFromFirestore, saveViolationToFirestore } from '../../../lib/services/violationsService';
import { INITIAL_VIOLATION_SESSIONS } from '../../../lib/data/mockData';

// GET /api/violations - Returns violation records
export async function GET() {
  try {
    const firestoreData = await fetchViolationsFromFirestore();
    if (firestoreData && firestoreData.length > 0) {
      return NextResponse.json({ success: true, count: firestoreData.length, data: firestoreData });
    }
    return NextResponse.json({ success: true, count: INITIAL_VIOLATION_SESSIONS.length, data: INITIAL_VIOLATION_SESSIONS });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch violations' },
      { status: 500 }
    );
  }
}

// POST /api/violations - Saves or updates a violation record in Firestore
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.violation_id || !body.camera_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid violation payload. Missing violation_id or camera_id.' },
        { status: 400 }
      );
    }

    await saveViolationToFirestore(body);
    return NextResponse.json({ success: true, message: `Violation ${body.violation_id} persisted to Firestore.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save violation' },
      { status: 500 }
    );
  }
}
