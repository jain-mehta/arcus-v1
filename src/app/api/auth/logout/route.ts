import { NextResponse } from 'next/server';
import { signOut } from '@/lib/supabase/auth';
import { clearSessionCookies } from '@/lib/supabase/session';

/**
 * POST /api/auth/logout
 * 
 * Sign out user by clearing session cookies and signout from Supabase.
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */
export async function POST() {
  try {
    // Clear session cookies
    await clearSessionCookies();

    // Sign out from Supabase (this is optional, mainly clears client sessions)
    await signOut().catch((err) => {
      console.warn('[Auth] Supabase signOut warning (non-critical):', err);
    });

    // Build response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Clear cookies via headers (explicit)
      response.headers.append('Set-Cookie', '__supabase_access_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      response.headers.append('Set-Cookie', '__supabase_refresh_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
      return response;
    } catch (error: any) {
      console.error('[Auth] Logout error:', error);
  
      // Always return 200 for logout (best effort)
      const response = NextResponse.json(
        {
          success: true,
          message: 'Logged out',
        },
        { status: 200 }
      );
  
      response.headers.append('Set-Cookie', '__supabase_access_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      response.headers.append('Set-Cookie', '__supabase_refresh_token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
      return response;
    }
  }

