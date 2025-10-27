/**
 * POST /api/auth/signup
 * 
 * Register a new user with email and password using Supabase Auth.
 * Creates both auth.users (Supabase managed) and public.users (app managed) records.
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "organizationId": "org-uuid" (optional)
 * }
 * 
 * Response (201):
 * {
 *   "success": true,
 *   "user": { "id": "uuid", "email": "user@example.com" },
 *   "message": "User created successfully. Please check your email to confirm."
 * }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { signUp, createUserProfile } from '@/lib/supabase/auth';
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';
import { getSupabaseServerClient } from '@/lib/supabase/client';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .min(1, 'Password is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationId: z.string().uuid('Invalid organization ID').optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (auth preset)
    const rateLimitResponse = await rateLimit(req, RateLimitPresets.auth);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, organizationId } = validation.data;

    // Check if user already exists (via server client)
    const supabaseAdmin = getSupabaseServerClient();
    if (supabaseAdmin) {
      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser && !checkError) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Sign up user with Supabase Auth
    const { data, error } = await signUp(email, password);

    if (error) {
      console.error('[Auth] Signup error:', error.message);

      // Handle specific errors
      if (error.message?.includes('already')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('[Auth] No user returned from Supabase signup');
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Create user profile in public.users table
    const profileCreated = await createUserProfile(
      data.user.id,
      email,
      {
        first_name: firstName,
        last_name: lastName,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
      }
    );

    if (!profileCreated) {
      console.warn('[Auth] Failed to create user profile, but auth user created:', data.user.id);
      // Don't fail signup if profile creation fails - auth succeeded
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          createdAt: data.user.created_at,
        },
        message: 'User created successfully. Please check your email to confirm.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Auth] Signup handler error:', error);

    return NextResponse.json(
      {
        error: 'Failed to create account. Please try again.',
      },
      { status: 500 }
    );
  }
}

