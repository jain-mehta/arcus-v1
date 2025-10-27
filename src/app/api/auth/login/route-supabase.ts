/**
 * POST /api/auth/login
 * 
 * Authenticate user with email and password using Supabase Auth.
 * Returns access and refresh tokens, stores them in httpOnly cookies.
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * Response (200):
 * {
 *   "success": true,
 *   "user": { "id": "uuid", "email": "user@example.com" },
 *   "message": "Logged in successfully"
 * }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { signIn } from '@/lib/supabase/auth';
import { setAccessTokenCookie, setRefreshTokenCookie, buildSetCookieHeader } from '@/lib/supabase/session';
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (strict for login attempts)
    const rateLimitResponse = await rateLimit(req, RateLimitPresets.auth);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Attempt login with Supabase
    const { data, error } = await signIn(email, password);

    if (error) {
      // Generic error message for security
      console.error('[Auth] Login error:', error.message);

      return NextResponse.json(
        {
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    if (!data.session) {
      console.error('[Auth] No session returned from Supabase');
      return NextResponse.json(
        {
          error: 'Login failed. Please try again.',
        },
        { status: 500 }
      );
    }

    // Extract tokens from session
    const { access_token, refresh_token, user } = data.session;

    // Store tokens in httpOnly cookies
    try {
      await setAccessTokenCookie(access_token);
      if (refresh_token) {
        await setRefreshTokenCookie(refresh_token);
      }
    } catch (cookieErr) {
      console.warn('[Auth] Failed to set cookies via API, will use headers:', cookieErr);
    }

    // Prepare response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
        },
        message: 'Logged in successfully',
      },
      { status: 200 }
    );

    // Set cookies via headers (fallback/explicit)
    response.headers.append('Set-Cookie', buildSetCookieHeader('__supabase_access_token', access_token, 15 * 60));
    if (refresh_token) {
      response.headers.append('Set-Cookie', buildSetCookieHeader('__supabase_refresh_token', refresh_token, 7 * 24 * 60 * 60));
    }

    return response;
  } catch (error: any) {
    console.error('[Auth] Login handler error:', error);

    return NextResponse.json(
      {
        error: 'Login failed. Please try again.',
      },
      { status: 500 }
    );
  }
}

