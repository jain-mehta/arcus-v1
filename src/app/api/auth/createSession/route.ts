/**
 * Create Session Cookie API Route
 * 
 * Exchanges a Firebase ID token for a session cookie.
 * This allows server-side authentication for 7 days.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Create session cookie from ID token
    const sessionCookie = await createSessionCookie(idToken);

    // Set cookie
    await setSessionCookie(sessionCookie);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 401 }
    );
  }
}

