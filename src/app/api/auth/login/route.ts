import { NextResponse } from 'next/server';
import { createSessionCookie, buildSessionSetCookieHeader, setSessionCookie } from '@/lib/session';

/**
 * Login API Route
 *
 * Receives an ID token from the client (after Firebase Auth sign-in),
 * creates a server-side session cookie and returns a JSON response.
 *
 * Note:
 * - This implementation sets the cookie header directly so the cookie
 *   is available to the browser on subsequent requests.
 * - In production, the cookie will include Secure; in development it will not.
 */

const DEFAULT_SESSION_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'Missing ID token' },
        { status: 400 }
      );
    }

    // Create session cookie from Firebase ID token
    const sessionCookie = await createSessionCookie(idToken);

    // Persist server-side cookie via Next cookies() API
    try {
      await setSessionCookie(sessionCookie);
    } catch (err) {
      // If setSessionCookie fails in your runtime, we'll still send a Set-Cookie header
      console.warn('[Login] setSessionCookie failed, falling back to header:', err);
    }

    // Build Set-Cookie header (for the browser) using centralized helper
    const maxAge = Number(process.env.SESSION_COOKIE_MAX_AGE) || DEFAULT_SESSION_AGE_SECONDS;
    const setCookieHeader = buildSessionSetCookieHeader(sessionCookie, maxAge);

    const res = NextResponse.json({ success: true, message: 'Session created successfully' }, { status: 200 });
    res.headers.append('Set-Cookie', setCookieHeader);

    return res;
  } catch (error: any) {
    console.error('[Login] Error creating session:', error);

    // If you want to explicitly clear any stale session cookie on error:
    const res = NextResponse.json(
      { success: false, message: error?.message || 'Failed to create session' },
      { status: 500 }
    );

    // Optionally clear cookie on error (uncomment if desired)
    // res.headers.append('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');

    return res;
  }
}
