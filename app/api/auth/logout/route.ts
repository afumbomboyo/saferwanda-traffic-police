import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'police_duty_session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Police session terminated successfully.',
  });

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
