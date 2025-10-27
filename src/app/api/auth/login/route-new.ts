/**
 * POST /api/auth/login
 * Login with email and password (PostgreSQL-based)
 * Returns JWT access token and refresh token
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { validateBody, emailSchema } from '@/lib/validation';
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (strict for login attempts)
    const limitResponse = await rateLimit(req, RateLimitPresets.auth);
    if (limitResponse) return limitResponse;

    // Parse and validate request body
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Get device info and IP for audit logging
    const userAgent = req.headers.get('user-agent') || undefined;
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 
                     req.headers.get('x-real-ip') || 
                     undefined;

    const deviceInfo = {
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Attempt login
    const result = await loginUser(
      { email, password },
      deviceInfo,
      ipAddress
    );

    // Set refresh token as HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          isEmailVerified: result.user.isEmailVerified,
        },
        organization: result.organization ? {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
        } : null,
        role: result.role ? {
          id: result.role.id,
          name: result.role.name,
          permissions: result.role.permissions,
        } : null,
      },
      { status: 200 }
    );

    // Set refresh token cookie
    response.cookies.set('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Auth] Login error:', error);

    // Handle specific error messages
    if (error.message.includes('Invalid email or password')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (error.message.includes('locked')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    if (error.message.includes('deactivated')) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

