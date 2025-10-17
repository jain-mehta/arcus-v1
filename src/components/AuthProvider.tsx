/**
 * Authentication Provider
 * 
 * Wraps the entire application and provides authentication state via context.
 * Handles Firebase Auth state changes and session cookie synchronization.
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import type { User } from '@/lib/firebase/types';
import type { PermissionMap } from '@/lib/rbac';
import { AuthContext, type AuthContextValue } from '@/lib/auth-context';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // User is signed in - create session cookie
        try {
          const idToken = await fbUser.getIdToken();
          
          // Exchange ID token for session cookie
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            console.error('Failed to create session cookie');
          }

          // Fetch full user data from Firestore
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            
            // Fetch permissions
            const permResponse = await fetch('/api/auth/permissions');
            if (permResponse.ok) {
              const permData = await permResponse.json();
              setPermissions(permData.permissions);
            }
          }
        } catch (error) {
          console.error('Error setting up session:', error);
        }
      } else {
        // User is signed out
        setUser(null);
        setPermissions(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Session creation handled by onAuthStateChanged listener
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local state
      setUser(null);
      setFirebaseUser(null);
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const value: AuthContextValue = {
    firebaseUser,
    user,
    permissions,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
