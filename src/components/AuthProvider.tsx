/**
 * Authentication Provider - Supabase Edition
 * 
 * Wraps the entire application and provides authentication state via context.
 * Handles Supabase Auth state changes and JWT cookie management.
 * 
 * Uses Supabase for Auth with Supabase Auth for email/password authentication.
 */

'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase/client';
import { onAuthStateChange } from '@/lib/supabase/auth';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AuthContext, type AuthContextValue, type User } from '@/lib/auth-context';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupAuthListener = async () => {
      try {
        // Get initial session
        const {
          data: { session: initialSession },
        } = await supabaseClient.auth.getSession();

        if (initialSession?.user) {
          setSupabaseUser(initialSession.user);
          setSession(initialSession);
          setUser({
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            displayName: initialSession.user.user_metadata?.full_name,
          });
        }

        // Subscribe to auth state changes
        unsubscribe = onAuthStateChange((event, newSession) => {
          console.log('[AuthProvider] Auth state changed:', event);

          if (newSession) {
            setSession(newSession);
            setSupabaseUser(newSession.user);
            setUser({
              id: newSession.user.id,
              email: newSession.user.email || '',
              displayName: newSession.user.user_metadata?.full_name,
            });
            setError(null);
          } else {
            setSession(null);
            setSupabaseUser(null);
            setUser(null);
            setError(null);
          }
        });
      } catch (err) {
        console.error('[AuthProvider] Setup error:', err);
        setError(err instanceof Error ? err.message : 'Setup failed');
      } finally {
        setLoading(false);
      }
    };

    setupAuthListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sign in failed');
      }

      // Auth state will be updated by listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...metadata }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Sign up failed');
      }

      // Auth state will be updated by listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Sign out failed');
      }

      // Clear local state
      setSession(null);
      setSupabaseUser(null);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextValue = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

