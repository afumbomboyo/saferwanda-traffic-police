import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

import { adminDb } from '../../../../../lib/firebase/admin';

const FACE_PROVIDER_API_URL = process.env.FACE_PROVIDER_API_URL;
const BIOMETRIC_API_KEY = process.env.BIOMETRIC_API_KEY;

export async function POST(request: Request) {
  try {
    if (!FACE_PROVIDER_API_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'FACE_PROVIDER_API_URL is not configured.',
        },
        { status: 500 }
      );
    }

    if (!BIOMETRIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'BIOMETRIC_API_KEY is not configured.',
        },
        { status: 500 }
      );
    }

    const incomingForm = await request.formData();

    const policeId = incomingForm.get('police_id');
    const challengeId = incomingForm.get('challenge_id');

    if (
      typeof policeId !== 'string' ||
      !policeId.trim() ||
      typeof challengeId !== 'string' ||
      !challengeId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'police_id and challenge_id are required.',
        },
        { status: 400 }
      );
    }

    const officerSnapshot = await adminDb
      .collection('police_officers')
      .where('identity.police_id', '==', policeId.trim())
      .limit(1)
      .get();

    if (officerSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: `Police Officer with ID "${policeId}" not found.`,
        },
        { status: 404 }
      );
    }

    const officerRecord = officerSnapshot.docs[0].data();

    console.log('POLICE LIVENESS DEBUG:', {
      policeId,
      documentId: officerSnapshot.docs[0].id,
      status: officerRecord.status,
      face: officerRecord.enrollment?.face,
      faceEnrolled: officerRecord.enrollment?.face?.enrolled,
    });

    const officerStatus = officerRecord.status;

    if (
      officerStatus !== 'active' &&
      officerStatus !== 'enrollment_ready'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Officer is not authorized to authenticate.',
        },
        { status: 403 }
      );
    }

    if (officerRecord.enrollment?.face?.enrolled !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial biometric enrollment has not been completed for this officer.',
        },
        { status: 403 }
      );
    }

    /*
     * Forward only the expected multipart fields to the biometric service.
     */
    const biometricForm = new FormData();

    biometricForm.append('police_id', policeId.trim());
    biometricForm.append('challenge_id', challengeId.trim());

    const frames = incomingForm.getAll('frames');

    if (frames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one liveness frame is required.',
        },
        { status: 400 }
      );
    }

    for (const frame of frames) {
      if (!(frame instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid liveness frame received.',
          },
          { status: 400 }
        );
      }

      biometricForm.append('frames', frame, frame.name || 'frame.jpg');
    }

    const biometricResponse = await fetch(
      `${FACE_PROVIDER_API_URL}/v1/face/liveness`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${BIOMETRIC_API_KEY}`,
        },
        body: biometricForm,
        cache: 'no-store',
      }
    );

    const biometricData = await biometricResponse.json().catch(() => null);

    if (!biometricResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            biometricData?.detail ||
            biometricData?.error ||
            'Biometric liveness verification failed.',
          biometric: biometricData,
        },
        { status: biometricResponse.status }
      );
    }

    if (
      !biometricData ||
      biometricData.liveness_verified !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial liveness verification failed.',
          biometric: biometricData,
        },
        { status: 401 }
      );
    }

    /*
     * Liveness has now been successfully verified by the biometric service.
     *
     * Create a short-lived, one-time authorization record.
     *
     * The browser never creates or controls this record.
     */
    const authorizationId = crypto.randomUUID();

    const now = Date.now();

    // Keep this authorization short-lived.
    // It is only intended to bridge liveness -> PIN verification.
    const expiresAt = Timestamp.fromMillis(now + 60_000);

    await adminDb
      .collection('police_face_liveness')
      .doc(authorizationId)
      .set({
        authorizationId,
        policeId: policeId.trim(),
        challengeId: challengeId.trim(),

        verified: true,
        used: false,

        processing: false,

        source: 'traffic_police_login',

        createdAt: Timestamp.fromMillis(now),
        expiresAt,

        biometric: {
          provider: biometricData.provider || 'unknown',
          framesProcessed: biometricData.frames_processed ?? null,
          framesRequired: biometricData.frames_required ?? null,
          movementScore: biometricData.movement_score ?? null,
        },
      });

    return NextResponse.json({
      success: true,

      liveness_verified: true,

      police_id: policeId.trim(),
      challenge_id: challengeId.trim(),

      liveness_authorization_id: authorizationId,

      expires_in_seconds: 60,

      biometric: biometricData,
    });

  } catch (error: any) {
    console.error('Liveness authentication error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Facial liveness authentication failed.',
      },
      { status: 500 }
    );
  }
}
