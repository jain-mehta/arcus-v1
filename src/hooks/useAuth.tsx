/**
 * Authentication Hook
 * 
 * Provides authentication state and methods throughout the application.
 * Uses Firebase Auth on client-side and manages session cookies via API routes.
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
