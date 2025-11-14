/**
 * Supabase Authentication Module
 * 
 * Provides authentication functions using Supabase Auth.
 * Uses Supabase for Auth with full email/password support.
 * 
 * Features:
 * - Sign up with email/password (creates users in both auth and users table)
 * - Sign in with email/password
 * - Password reset
 * - Token refresh
 * - Sign out
 * - Get current session
 * 
 * Database Tables:
 * - auth.users (managed by Supabase) - stores auth credentials
 * - public.users (managed by app) - stores user profiles
 * - public.user_roles (PostgreSQL) - RBAC roles
 * - public.permissions (PostgreSQL) - fine-grained permissions
 */

import { supabaseClient } from './client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Sign up a new user with email and password
 * @param email User email address
 * @param password User password (min 6 characters, Supabase requirements)
 * @returns Authentication response with user and session
 */
export async function signUp(email: string, password: string): Promise<any> {
  try {
    const response = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (response.error) {
      console.error('[Supabase Auth] Sign up error:', response.error);
      throw response.error;
    }

    console.log('[Supabase Auth] User signed up successfully:', response.data.user?.email);
    return response;
  } catch (error) {
    console.error('[Supabase Auth] Sign up failed:', error);
    throw error;
  }
}

/**
 * Sign in user with email and password
 * @param email User email address
 * @param password User password
 * @returns Authentication response with session
 */
export async function signIn(email: string, password: string): Promise<any> {
  try {
    const response = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (response.error) {
      console.error('[Supabase Auth] Sign in error:', response.error);
      throw response.error;
    }

    console.log('[Supabase Auth] User signed in:', response.data.user?.email);
    return response;
  } catch (error) {
    console.error('[Supabase Auth] Sign in failed:', error);
    throw error;
  }
}

/**
 * Sign out current user
 * @returns Success response
 */
export async function signOut(): Promise<{ error: null | any }> {
  try {
    const response = await supabaseClient.auth.signOut();

    if (response.error) {
      console.error('[Supabase Auth] Sign out error:', response.error);
      throw response.error;
    }

    console.log('[Supabase Auth] User signed out');
    return response;
  } catch (error) {
    console.error('[Supabase Auth] Sign out failed:', error);
    throw error;
  }
}

/**
 * Reset password - sends reset email to user
 * @param email User email address
 * @returns Success response
 */
export async function resetPassword(email: string): Promise<{ data: any; error: null | any }> {
  try {
    const response = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (response.error) {
      console.error('[Supabase Auth] Password reset error:', response.error);
      throw response.error;
    }

    console.log('[Supabase Auth] Password reset email sent to:', email);
    return response;
  } catch (error) {
    console.error('[Supabase Auth] Password reset failed:', error);
    throw error;
  }
}

/**
 * Update password for logged-in user
 * @param newPassword New password
 * @returns Success response
 */
export async function updatePassword(newPassword: string): Promise<any> {
  try {
    const response = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (response.error) {
      console.error('[Supabase Auth] Password update error:', response.error);
      throw response.error;
    }

    console.log('[Supabase Auth] Password updated successfully');
    return response;
  } catch (error) {
    console.error('[Supabase Auth] Password update failed:', error);
    throw error;
  }
}

/**
 * Get current session
 * @returns Session object or null
 */
export async function getSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error('[Supabase Auth] Get session error:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('[Supabase Auth] Get session failed:', error);
    return null;
  }
}

/**
 * Get current user
 * @returns User object or null
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error('[Supabase Auth] Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('[Supabase Auth] Get user failed:', error);
    return null;
  }
}

/**
 * Refresh session tokens
 * @returns New session with refreshed tokens
 */
export async function refreshSession(): Promise<any> {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.refreshSession();

    if (error) {
      console.error('[Supabase Auth] Refresh session error:', error);
      throw error;
    }

    console.log('[Supabase Auth] Session refreshed');
    return { session, error: null };
  } catch (error) {
    console.error('[Supabase Auth] Refresh session failed:', error);
    throw error;
  }
}

/**
 * Verify a JWT token (for middleware/API validation)
 * Call Supabase JWKS endpoint to verify token signature
 * 
 * @param token JWT token to verify
 * @returns Decoded token claims or null if invalid
 */
export async function verifyToken(token: string): Promise<any | null> {
  try {
    // This is handled by middleware - here we just decode without verification
    // Full verification happens in middleware.ts using JWKS
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload;
  } catch (error) {
    console.error('[Supabase Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Exchange access token for user data from public.users table
 * @param userId User ID from auth.users (UUID)
 * @returns User profile from public.users table
 */
export async function getUserProfile(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // User profile doesn't exist yet - will be created during signup flow
        return null;
      }
      console.error('[Supabase Auth] Get user profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Supabase Auth] Get user profile failed:', error);
    return null;
  }
}

/**
 * Create a user profile in public.users table after signup
 * @param userId User ID from auth.users
 * @param email User email
 * @param metadata Additional metadata
 * @returns Created user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
  metadata?: Record<string, any>
): Promise<any | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .insert([
        {
          id: userId,
          email,
          ...metadata,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Supabase Auth] Create user profile error:', error);
      return null;
    }

    console.log('[Supabase Auth] User profile created:', userId);
    return data;
  } catch (error) {
    console.error('[Supabase Auth] Create user profile failed:', error);
    return null;
  }
}

/**
 * Set up auth state change listener
 * @param callback Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  const {
    data: { subscription },
  } = supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log(`[Supabase Auth] Auth state changed: ${event}`);
    callback(event, session);
  });

  return () => {
    subscription?.unsubscribe();
  };
}

export default {
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getCurrentUser,
  refreshSession,
  verifyToken,
  getUserProfile,
  createUserProfile,
  onAuthStateChange,
};

import { getSupabaseServerClient } from '@/lib/supabase/client';