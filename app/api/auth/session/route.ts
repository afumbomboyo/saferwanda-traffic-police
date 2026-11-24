import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { adminDb } from '../../../../lib/firebase/admin';

const SESSION_COOKIE_NAME = 'police_duty_session';

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function verifySignedSession(token: string): Record<string, any> | null {
  try {
    const secret = process.env.POLICE_SESSION_SECRET;

    if (!secret) {
      console.error('POLICE_SESSION_SECRET is not configured.');
      return null;
    }

    const parts = token.split('.');

    if (parts.length !== 2) {
      return null;
    }

    const [encodedPayload, providedSignature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    const providedBuffer = Buffer.from(providedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    );

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (typeof payload.expiresAt === 'string') {
      if (new Date(payload.expiresAt).getTime() <= Date.now()) {
        return null;
      }
    } else if (
      typeof payload.exp === 'number' &&
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Police session verification error:', error);
    return null;
  }
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

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get(
    SESSION_COOKIE_NAME
  )?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        session: null,
      },
      { status: 401 }
    );
  }

  const session = verifySignedSession(sessionCookie);

  if (!session) {
    const response = NextResponse.json(
      {
        success: false,
        authenticated: false,
        session: null,
      },
      { status: 401 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: '',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  }

  let officerProfile: any = null;

  try {
    if (session.officerDocumentId) {
      const docSnap = await adminDb
        .collection('police_officers')
        .doc(session.officerDocumentId as string)
        .get();

      if (docSnap.exists) {
        officerProfile = getOfficerProfile(docSnap.data());
      }
    } else if (session.policeId) {
      const querySnap = await adminDb
        .collection('police_officers')
        .where('identity.police_id', '==', session.policeId)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        officerProfile = getOfficerProfile(querySnap.docs[0].data());
      }
    }
  } catch (error) {
    console.error('Error fetching officer for verified session:', error);
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    session,
    officer: officerProfile,
  });
}
