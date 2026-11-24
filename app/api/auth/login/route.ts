import { NextResponse } from 'next/server';
import crypto from 'crypto';
import argon2 from 'argon2';

import { adminDb } from '../../../../lib/firebase/admin';

const FACE_PROVIDER_API_URL = process.env.FACE_PROVIDER_API_URL;
const BIOMETRIC_API_KEY = process.env.BIOMETRIC_API_KEY;
const POLICE_SESSION_SECRET = process.env.POLICE_SESSION_SECRET;

const SESSION_COOKIE_NAME = 'police_duty_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 hours

function base64UrlEncode(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createSignedSession(payload: Record<string, unknown>): string {
  if (!POLICE_SESSION_SECRET) {
    throw new Error('POLICE_SESSION_SECRET is not configured.');
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', POLICE_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `${encodedPayload}.${signature}`;
}

function normalizeIdentifier(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getOfficerProfile(officerRecord: any) {
  const policeId =
    officerRecord.identity?.police_id ??
    officerRecord.police_id ??
    '';

  const station =
    officerRecord.employment?.station ??
    officerRecord.station ??
    '';

  return {
    officerId: policeId,
    policeId,
    serviceNumber:
      officerRecord.service_number ??
      officerRecord.identity?.service_number ??
      '',
    badgeNumber:
      officerRecord.service_number ??
      officerRecord.identity?.service_number ??
      policeId,
    name:
      officerRecord.identity?.full_name ??
      officerRecord.name ??
      'Police Officer',
    rank:
      officerRecord.role?.rank ??
      officerRecord.rank ??
      '',
    station,
    district:
      officerRecord.employment?.district ??
      officerRecord.district ??
      '',
    department:
      officerRecord.employment?.department ??
      officerRecord.department ??
      '',
    role:
      typeof officerRecord.role === 'string'
        ? officerRecord.role
        : officerRecord.role?.title ?? '',
    shiftStartedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  console.log('========== POLICE LOGIN ROUTE HIT ==========');

  try {
    /*
     * ------------------------------------------------------------
     * 1. Validate request
     * ------------------------------------------------------------
     */

    const body = await request.json();

    const policeId = normalizeIdentifier(
      body.police_id ?? body.service_number
    );

    const pin = normalizeIdentifier(body.pin);

    /*
     * The browser sends the captured face as a base64 data URL:
     *
     * data:image/jpeg;base64,...
     *
     * We deliberately do NOT accept face_payload anymore.
     */

    const faceImage =
      typeof body.face_image === 'string'
        ? body.face_image
        : '';

    const livenessAuthorizationId =
      normalizeIdentifier(body.liveness_authorization_id);

    if (!policeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Police ID or service number is required.',
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        {
          success: false,
          error: 'A valid 6-digit PIN is required.',
        },
        { status: 400 }
      );
    }

    if (!faceImage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial verification image is required.',
        },
        { status: 400 }
      );
    }

    if (!livenessAuthorizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'A valid liveness verification is required.',
        },
        { status: 400 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 2. Find police officer
     * ------------------------------------------------------------
     *
     * No default/demo Police ID.
     */

    let officerSnapshot = await adminDb
      .collection('police_officers')
      .where('identity.police_id', '==', policeId)
      .limit(1)
      .get();

    /*
     * If the identifier was not a police ID, also allow
     * service-number lookup.
     */

    if (officerSnapshot.empty) {
      officerSnapshot = await adminDb
        .collection('police_officers')
        .where('identity.service_number', '==', policeId)
        .limit(1)
        .get();
    }

    if (officerSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Police officer credentials could not be verified.',
        },
        { status: 401 }
      );
    }

    const officerDocRef = officerSnapshot.docs[0];
    const officerRecord = officerDocRef.data();

    const actualPoliceId =
      officerRecord.identity?.police_id ??
      officerRecord.police_id ??
      '';

    /*
     * ------------------------------------------------------------
     * 3. Check officer status
     * ------------------------------------------------------------
     */

    const status = officerRecord.status;

    if (status !== 'active' && status !== 'enrollment_ready') {
      return NextResponse.json(
        {
          success: false,
          error: 'Officer is not authorized to authenticate.',
        },
        { status: 403 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 4. Confirm face enrollment
     * ------------------------------------------------------------
     */

    const face = officerRecord.enrollment?.face;
    const enrollment = officerRecord.enrollment;

    const faceEnrolled =
      face?.enrolled === true ||
      enrollment?.face?.enrolled === true;

    if (!faceEnrolled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial authentication has not been enrolled for this officer.',
        },
        { status: 403 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 5. Confirm PIN enrollment
     * ------------------------------------------------------------
     */

    const pinAuthentication =
      officerRecord.enrollment?.pin;

    console.log('========== PIN STRUCTURE DEBUG ==========');

    console.log({
      hasEnrollment: !!officerRecord.enrollment,
      enrollmentKeys: officerRecord.enrollment
        ? Object.keys(officerRecord.enrollment)
        : [],
      hasEnrollmentPin: !!officerRecord.enrollment?.pin,
      enrollmentPinKeys: officerRecord.enrollment?.pin
        ? Object.keys(officerRecord.enrollment.pin)
        : [],
      pinConfigured:
        officerRecord.enrollment?.pin?.configured,
      pinAlgorithm:
        officerRecord.enrollment?.pin?.algorithm,
      pinHashPresent:
        typeof officerRecord.enrollment?.pin?.hash === 'string',
    });

    if (
      !pinAuthentication?.configured ||
      !pinAuthentication?.hash
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Officer PIN authentication has not been configured.',
        },
        { status: 403 }
      );
    }

    /*
     * ------------------------------------------------------------
     * 6. Validate liveness authorization
     * ------------------------------------------------------------
     *
     * The authorization must:
     *
     * - exist
     * - belong to this officer
     * - have verified === true
     * - not already be used
     * - not be expired
     */

    const livenessRef = adminDb
      .collection('police_face_liveness')
      .doc(livenessAuthorizationId);

    const livenessSnapshot = await livenessRef.get();

    if (!livenessSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Liveness authorization could not be found.',
        },
        { status: 401 }
      );
    }

    const livenessRecord = livenessSnapshot.data();

    if (
      livenessRecord?.policeId !== actualPoliceId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Liveness authorization does not belong to this officer.',
        },
        { status: 401 }
      );
    }

    if (livenessRecord?.verified !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Liveness verification was not successful.',
        },
        { status: 401 }
      );
    }

    if (livenessRecord?.used === true) {
      return NextResponse.json(
        {
          success: false,
          error: 'This liveness authorization has already been used.',
        },
        { status: 401 }
      );
    }

    if (livenessRecord?.expiresAt) {
      const expiresAt =
        typeof livenessRecord.expiresAt.toDate === 'function'
          ? livenessRecord.expiresAt.toDate()
          : new Date(livenessRecord.expiresAt);

      if (expiresAt.getTime() <= Date.now()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Liveness authorization has expired.',
          },
          { status: 401 }
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * 7. Verify face against enrolled biometric template
     * ------------------------------------------------------------
     */

    if (!FACE_PROVIDER_API_URL) {
      throw new Error(
        'FACE_PROVIDER_API_URL is not configured.'
      );
    }

    if (!BIOMETRIC_API_KEY) {
      throw new Error(
        'BIOMETRIC_API_KEY is not configured.'
      );
    }

    let imageBuffer: Buffer;

    try {
      /*
       * Accept data URLs from the browser.
       */

      const match = faceImage.match(
        /^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/
      );

      if (!match) {
        throw new Error('Invalid facial image format.');
      }

      imageBuffer = Buffer.from(match[2], 'base64');

      if (!imageBuffer.length) {
        throw new Error('Facial image is empty.');
      }

      /*
       * Protect the backend from accidentally receiving
       * an extremely large image.
       */

      if (imageBuffer.length > 10 * 1024 * 1024) {
        throw new Error('Facial image is too large.');
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid facial verification image.',
        },
        { status: 400 }
      );
    }

    const formData = new FormData();

    formData.append(
      'police_id',
      actualPoliceId
    );

    formData.append(
      'image',
      new Blob([new Uint8Array(imageBuffer)], {
        type: 'image/jpeg',
      }),
      'face.jpg'
    );

    const biometricController =
      new AbortController();

    const biometricTimeout = setTimeout(
      () => biometricController.abort(),
      20_000
    );

    let biometricResponse: Response;

    console.log('========== BIOMETRIC REQUEST ==========');
    console.log('Police ID:', actualPoliceId);
    console.log('Provider URL:', FACE_PROVIDER_API_URL);
    console.log('Has API key:', Boolean(BIOMETRIC_API_KEY));
    console.log('Image buffer bytes:', imageBuffer.length);
    console.log('=======================================');

    try {
      biometricResponse = await fetch(
        `${FACE_PROVIDER_API_URL}/v1/face/verify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${BIOMETRIC_API_KEY}`,
          },
          body: formData,
          signal: biometricController.signal,
          cache: 'no-store',
        }
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial verification service is temporarily unavailable.',
        },
        { status: 503 }
      );
    } finally {
      clearTimeout(biometricTimeout);
    }

    let biometricResult: any = null;

    try {
      biometricResult = await biometricResponse.json();
    } catch {
      biometricResult = null;
    }

    console.log('========== BIOMETRIC VERIFICATION ==========');
    console.log('Police ID:', actualPoliceId);
    console.log('HTTP status:', biometricResponse.status);
    console.log('Response:', biometricResult);
    console.log('============================================');

    if (!biometricResponse.ok) {
      console.error(
        'Biometric verification failed:',
        biometricResponse.status,
        biometricResult
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Facial verification failed.',
        },
        { status: 401 }
      );
    }

    if (
      biometricResult?.success !== true ||
      biometricResult?.verified !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Facial recognition verification failed.',
        },
        { status: 401 }
      );
    }

    /*
    * ------------------------------------------------------------
    * 8. Verify Argon2id PIN
    * ------------------------------------------------------------
    */

    const pinHash = pinAuthentication.hash;

    if (
      typeof pinHash !== 'string' ||
      pinHash.length === 0
    ) {
      console.error('Police PIN hash is missing or invalid:', {
        policeId: actualPoliceId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Police PIN authentication is not configured correctly.',
        },
        { status: 403 }
      );
    }

    let pinVerified = false;

    try {
      pinVerified = await argon2.verify(pinHash, pin);
    } catch (error) {
      console.error('Argon2 PIN verification error:', {
        policeId: actualPoliceId,
        error,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Police PIN authentication failed.',
        },
        { status: 500 }
      );
    }

    if (!pinVerified) {
      console.warn('Invalid police PIN:', {
        policeId: actualPoliceId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid police ID or PIN.',
        },
        { status: 401 }
      );
    }


    /*
     * ------------------------------------------------------------
     * 9. Mark liveness authorization as consumed
     * ------------------------------------------------------------
     */

    await livenessRef.update({
      used: true,
      usedAt: new Date(),
      authenticationMethod: 'face_and_pin',
    });

    /*
     * ------------------------------------------------------------
     * 10. Create authenticated police duty session
     * ------------------------------------------------------------
     */

    if (!POLICE_SESSION_SECRET) {
      throw new Error(
        'POLICE_SESSION_SECRET is not configured.'
      );
    }

    const now = Date.now();

    const sessionPayload = {
      policeId: actualPoliceId,
      serviceNumber:
        officerRecord.service_number ??
        officerRecord.identity?.service_number ??
        '',
      officerDocumentId: officerDocRef.id,
      authenticatedAt: new Date(now).toISOString(),
      expiresAt: new Date(
        now + SESSION_DURATION_SECONDS * 1000
      ).toISOString(),
      authentication: {
        face: true,
        liveness: true,
        pin: true,
      },
    };

    const sessionToken =
      createSignedSession(sessionPayload);

    /*
     * ------------------------------------------------------------
     * 11. Build verified officer profile
     * ------------------------------------------------------------
     */

    const verifiedProfile =
      getOfficerProfile(officerRecord);

    /*
     * ------------------------------------------------------------
     * 12. Return response + HTTP-only cookie
     * ------------------------------------------------------------
     */

    const response = NextResponse.json({
      success: true,
      message:
        'Police Duty Authentication Successful.',
      officer: verifiedProfile,
      authentication: {
        faceVerified: true,
        livenessVerified: true,
        pinVerified: true,
        authenticatedAt:
          sessionPayload.authenticatedAt,
        expiresAt:
          sessionPayload.expiresAt,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;

  } catch (error: any) {
    console.error(
      'Police authentication error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Police Officer Authentication Failed.',
      },
      { status: 500 }
    );
  }
}
