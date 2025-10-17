import { NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME, buildSessionSetCookieHeader } from '@/lib/session';

/**
 * Logout API Route
 * 
 * Clears the session cookie to log out the user.
 */
export async function POST(req: Request) {
  try {
    // Clear server-side cookie store (Next's cookies API)
    await clearSessionCookie();

    // Also send an explicit Set-Cookie header that expires the cookie in the browser.
    // This is important when a cookie was originally set with a Domain attribute
    // (or when the runtime's cookie delete doesn't serialize the domain), because
    // the browser will only remove a cookie when the name+domain+path match.
  const deleteCookie = buildSessionSetCookieHeader('', 0);

  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', deleteCookie);

  return res;
  } catch (error: any) {
    console.error('[Logout] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message }, 
      { status: 500 }
    );
  }
}
