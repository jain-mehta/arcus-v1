/**
 * Supabase Client Configuration
 * 
 * Initializes Supabase client for authentication, database, and real-time features.
 * Works in both client and server environments.
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL: Base URL (e.g., https://asuxcwlbzspsifvigmov.supabase.co)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Anon/public key for client-side operations
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for server-side operations (never expose to client)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Client-side Supabase client
 * Uses anon key - safe to expose to browser
 * Used for: authentication, real-time subscriptions
 */
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Server-side Supabase client
 * Uses service role key - NEVER expose to client
 * Used for: admin operations, database mutations on protected tables
 * 
 * WARNING: Only use this in server-side code (API routes, middleware, etc.)
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Supabase] Service role key not available. Server operations will fail.');
    return null;
  }

return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});
}

/**
 * Get Supabase URL for API calls
 */
export function getSupabaseUrl(): string {
  return SUPABASE_URL!;
}

/**
 * Get Supabase JWKS endpoint for token verification
 */
export function getSupabaseJwksUrl(): string {
  return `${SUPABASE_URL}/auth/v1/jwks`;
}

export default supabaseClient;

