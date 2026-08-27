import { NextRequest, NextResponse } from 'next/server';

import { verifyAuthenticationResponse } from '@simplewebauthn/server';

import { adminDb } from '@/lib/firebase/admin';
import { webauthnConfig } from '@/lib/webauthn/server';

// ---------------------------------------------------------------------------
// POST /api/police/webauthn/auth-verify
//
// Step 2 of the WebAuthn authentication ceremony.
// Receives the signed assertion from the browser, verifies:
//   ✓ credential ID belongs to the claimed officer
//   ✓ challenge matches the one we issued
//   ✓ origin and RP ID match our server config
//   ✓ cryptographic signature against the stored public key
//   ✓ userVerification flag (biometric was performed)
//   ✓ counter (replay-attack protection)
//
// On success: updates the counter, clears the challenge, returns verified=true.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const policeId = String(body?.policeId ?? '').trim();
    const response = body?.response;

    if (!policeId) {
      return NextResponse.json(
        { error: 'Police ID is required' },
        { status: 400 }
      );
    }

    if (!response) {
      return NextResponse.json(
        { error: 'WebAuthn authentication response is required' },
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
        { error: 'Police officer not found' },
        { status: 404 }
      );
    }

    if (officersSnapshot.size > 1) {
      return NextResponse.json(
        {
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
          error: `Police ID mismatch for officer record: ${policeId}`,
        },
        { status: 403 }
      );
    }

    const status = officer?.status;
    if (status !== 'enrollment_ready' && status !== 'active') {
      return NextResponse.json(
        { error: 'Officer is not authorized to authenticate' },
        { status: 403 }
      );
    }

    const fingerprint = officer?.enrollment?.fingerprint ?? {};
    if (fingerprint.enrolled !== true) {
      return NextResponse.json(
        { error: 'Fingerprint authentication is not enrolled for this officer' },
        { status: 403 }
      );
    }

    if (fingerprint.provider !== 'webauthn_platform') {
      return NextResponse.json(
        { error: 'This officer is not configured for WebAuthn platform authentication' },
        { status: 403 }
      );
    }

    const credentialId = fingerprint.credential_id as string | undefined;
    if (!credentialId) {
      return NextResponse.json(
        { error: 'No enrolled WebAuthn credential is stored for this officer' },
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
        { error: 'WebAuthn credential not registered' },
        { status: 403 }
      );
    }

    const credentialDoc = credentialSnapshot.docs[0];
    const storedCredential = credentialDoc.data();

    if (storedCredential?.police_id !== policeId) {
      console.warn('WebAuthn credential ownership mismatch', {
        credentialId,
        claimedPoliceId: policeId,
        actualOwner: storedCredential?.police_id,
      });

      return NextResponse.json(
        {
          error: 'WebAuthn credential does not belong to this officer',
        },
        { status: 403 }
      );
    }

    const expectedChallenge =
      (officer?.enrollment?.fingerprint?.authentication_challenge as string | undefined) ??
      (storedCredential?.challenge as string | undefined);

    if (!expectedChallenge) {
      return NextResponse.json(
        {
          error:
            'Authentication challenge not found or already consumed. Start again.',
        },
        { status: 400 }
      );
    }

    const assertionCredentialId = response.id as string | undefined;
    if (!assertionCredentialId) {
      return NextResponse.json(
        { error: 'Credential ID missing from assertion' },
        { status: 400 }
      );
    }

    if (assertionCredentialId !== credentialId) {
      return NextResponse.json(
        {
          error: 'Assertion credential does not match the enrolled officer credential',
        },
        { status: 403 }
      );
    }

    const publicKey = Uint8Array.from(
      Buffer.from(String(storedCredential.public_key ?? ''), 'base64')
    );

    if (!storedCredential.public_key) {
      return NextResponse.json(
        { error: 'Stored WebAuthn public key is missing' },
        { status: 400 }
      );
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: webauthnConfig.origin,
      expectedRPID: webauthnConfig.rpID,
      credential: {
        id: storedCredential.credential_id as string,
        publicKey,
        counter: Number(storedCredential.counter ?? 0),
        transports: (storedCredential.transports as AuthenticatorTransport[]) ?? [],
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Fingerprint verification failed' },
        { status: 401 }
      );
    }

    await Promise.all([
      credentialDoc.ref.update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
        challenge: null,
        challenge_created_at: null,
      }),
      officerDoc.ref.update({
        'enrollment.fingerprint.authentication_challenge': null,
        'enrollment.fingerprint.authentication_challenge_created_at': null,
      }),
    ]);

    return NextResponse.json({
      success: true,
      verified: true,
      factor: 'fingerprint',
      police_id: policeId,
      credential_id: credentialId,
    });
  } catch (error: any) {
    console.error('WebAuthn authentication verification error:', error);

    return NextResponse.json(
      {
        error: error?.message ?? 'Fingerprint authentication failed',
      },
      { status: 500 }
    );
  }
}
