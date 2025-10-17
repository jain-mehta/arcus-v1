/**
 * Authentication Context
 * 
 * Defines the shape of the authentication context used throughout the app.
 */

import { createContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/firebase/types';
import type { PermissionMap } from '@/lib/rbac';

export interface AuthContextValue {
  /** Current Firebase user (client-side) */
  firebaseUser: FirebaseUser | null;
  /** Current user data from Firestore */
  user: User | null;
  /** Permission map for current user's role */
  permissions: PermissionMap | null;
  /** Loading state during auth initialization */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign out and clear session */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
