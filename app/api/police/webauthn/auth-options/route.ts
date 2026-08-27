import { NextRequest, NextResponse } from 'next/server';

import { generateAuthenticationOptions } from '@simplewebauthn/server';

import { adminDb } from '@/lib/firebase/admin';
import { webauthnConfig } from '@/lib/webauthn/server';

// ---------------------------------------------------------------------------
// POST /api/police/webauthn/auth-options
//
// Step 1 of the WebAuthn authentication ceremony.
// Returns wrapped in { success, options } so the client can distinguish
// a genuine options payload from an error response at parse time.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const policeId = String(body?.policeId ?? '').trim();

    if (!policeId) {
      return NextResponse.json(
        { success: false, error: 'Police ID is required' },
        { status: 400 }
      );
    }

    const officersSnapshot = await adminDb
      .collection('police_officers')
      .where('identity.police_id', '==', policeId)
      .limit(2)
      .get();

    if (officersSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: `Police officer not found: ${policeId}` },
        { status: 404 }
      );
    }

    if (officersSnapshot.size > 1) {
      return NextResponse.json(
        {
          success: false,
          error: `Multiple police officers matched ${policeId}. Please contact support.`,
        },
        { status: 409 }
      );
    }

    const officerDoc = officersSnapshot.docs[0];
    const officer = officerDoc.data();
    const resolvedPoliceId = officer?.identity?.police_id;

    if (!resolvedPoliceId || resolvedPoliceId !== policeId) {
      return NextResponse.json(
        {
          success: false,
          error: `Police ID mismatch for officer record: ${policeId}`,
        },
        { status: 403 }
      );
    }

    const status = officer?.status;
    if (status !== 'enrollment_ready' && status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: `Officer is not authorized to authenticate (status: ${status ?? 'unknown'})`,
        },
        { status: 403 }
      );
    }

    const fingerprint = officer?.enrollment?.fingerprint ?? {};
    if (fingerprint.enrolled !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fingerprint authentication is not enrolled for this officer',
        },
        { status: 403 }
      );
    }

    if (fingerprint.provider !== 'webauthn_platform') {
      return NextResponse.json(
        {
          success: false,
          error: 'This officer is not configured for WebAuthn platform authentication',
        },
        { status: 403 }
      );
    }

    const credentialId = fingerprint.credential_id as string | undefined;
    if (!credentialId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No enrolled WebAuthn credential is stored for this officer',
        },
        { status: 403 }
      );
    }

    const credentialSnapshot = await adminDb
      .collection('webauthn_credentials')
      .where('credential_id', '==', credentialId)
      .limit(1)
      .get();

    if (credentialSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'No WebAuthn credential is registered for this officer',
        },
        { status: 403 }
      );
    }

    const credentialDoc = credentialSnapshot.docs[0];
    const storedCredential = credentialDoc.data();

    if (storedCredential?.police_id !== policeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'WebAuthn credential does not belong to this officer',
        },
        { status: 403 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      allowCredentials: [
        {
          id: credentialId,
          transports: (storedCredential.transports ?? []) as AuthenticatorTransport[],
        },
      ],
      userVerification: 'required',
      timeout: 60000,
    });

    await Promise.all([
      officerDoc.ref.update({
        'enrollment.fingerprint.authentication_challenge': options.challenge,
        'enrollment.fingerprint.authentication_challenge_created_at': new Date().toISOString(),
      }),
      credentialDoc.ref.update({
        challenge: options.challenge,
        challenge_created_at: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({ success: true, options });
  } catch (error: any) {
    console.error('WebAuthn auth-options error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Unable to start fingerprint authentication',
      },
      { status: 500 }
    );
  }
}
