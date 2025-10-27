import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/session';

/**
 * Validate Session API Route
 * 
 * Checks if the current session cookie is valid.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromSession();
    
    if (!user) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
    
    return NextResponse.json({ valid: true, user });
  } catch (error: any) {
    console.error('[Validate] Session validation error:', error);
    return NextResponse.json(
      { valid: false, message: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}

