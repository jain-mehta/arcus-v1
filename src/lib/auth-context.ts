/**
 * Authentication Context (Supabase Edition)
 * 
 * Defines the shape of the authentication context used throughout the app.
 * Using Supabase Auth to Supabase Auth.
 */

import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  name?: string;
  orgId?: string;
  roleIds?: string[];
}

export interface AuthContextValue {
  /** Current user data from Supabase auth + user profile */
  user: User | null;
  /** Loading state during auth initialization */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with email and password */
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  /** Sign out and clear session */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

