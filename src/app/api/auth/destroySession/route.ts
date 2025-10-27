/**
 * Destroy Session API Route
 * 
 * Clears the session cookie to sign out the user.
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME, buildSessionSetCookieHeader } from '@/lib/session';

export async function POST() {
  try {
    await clearSessionCookie();

  const deleteCookie = buildSessionSetCookieHeader('', 0);
  // Debug: log the deletion header so we can verify attributes match creation
  console.debug('[DestroySession] Deletion Set-Cookie header ->', deleteCookie);

  const res = NextResponse.json({ success: true });
  res.headers.append('Set-Cookie', deleteCookie);

  return res;
  } catch (error: any) {
    console.error('Session destruction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to destroy session' },
      { status: 500 }
    );
  }
}

