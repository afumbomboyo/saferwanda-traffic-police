import { NextResponse } from 'next/server';

const FACE_PROVIDER_API_URL = process.env.FACE_PROVIDER_API_URL;
const BIOMETRIC_API_KEY = process.env.BIOMETRIC_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const policeId =
      typeof body.police_id === 'string'
        ? body.police_id.trim()
        : '';

    if (!policeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Police ID is required.',
        },
        { status: 400 }
      );
    }

    if (!FACE_PROVIDER_API_URL || !BIOMETRIC_API_KEY) {
      console.error(
        'Biometric service configuration is missing.'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Facial authentication service is not configured.',
        },
        { status: 500 }
      );
    }

    const formData = new FormData();

    formData.append('police_id', policeId);

    const controller = new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      10_000
    );

    let biometricResponse: Response;

    try {
      biometricResponse = await fetch(
        `${FACE_PROVIDER_API_URL}/v1/face/challenge`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${BIOMETRIC_API_KEY}`,
          },
          body: formData,
          signal: controller.signal,
          cache: 'no-store',
        }
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            'Facial authentication service is temporarily unavailable.',
        },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }

    const result = await biometricResponse.json();

    if (!biometricResponse.ok || result?.success !== true) {
      return NextResponse.json(
        {
          success: false,
          error:
            result?.message ||
            result?.error ||
            'Unable to create facial liveness challenge.',
        },
        { status: biometricResponse.status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge_id: result.challenge_id,
      police_id: result.police_id,
      challenge: result.challenge,
      instruction: result.instruction,
      expires_in_seconds: result.expires_in_seconds,
    });

  } catch (error) {
    console.error(
      'Face challenge API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to start facial verification.',
      },
      { status: 500 }
    );
  }
}
