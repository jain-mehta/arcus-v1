/**
 * Mock Session Management
 * 
 * Provides session management utilities for development and testing.
 * In production, this would be replaced with Redis or a proper session store.
 */

import { cookies } from 'next/headers';
import { getFirebaseAdmin } from './firebase/firebase-admin';
import type { UserClaims } from './rbac';

export interface Session {
  id: string;
  userId: string;
  email?: string;
  orgId?: string;
  roleId?: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory session store (for development only)
const sessionStore = new Map<string, Session>();

/**
 * Create a new session
 */
export async function createSession(userId: string, additionalData?: Partial<Session>): Promise<Session> {
  const sessionId = generateSessionId();
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    ...additionalData,
  };

  sessionStore.set(sessionId, session);
  return session;
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<Session | null> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }

  // Check if expired
  if (session.expiresAt < new Date()) {
    sessionStore.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Get all sessions for a user
 */
export async function getSessionsForUser(userId: string): Promise<Session[]> {
  const sessions: Session[] = [];
  
  for (const [_, session] of sessionStore) {
    if (session.userId === userId && session.expiresAt > new Date()) {
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Revoke a session
 */
export async function revokeSession(sessionId: string): Promise<boolean> {
  return sessionStore.delete(sessionId);
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  let count = 0;
  
  for (const [id, session] of sessionStore) {
    if (session.userId === userId) {
      sessionStore.delete(id);
      count++;
    }
  }

  return count;
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current session from cookies
 */
export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    return null;
  }

  return getSessionById(sessionCookie.value);
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  let count = 0;
  const now = new Date();
  
  for (const [id, session] of sessionStore) {
    if (session.expiresAt < now) {
      sessionStore.delete(id);
      count++;
    }
  }

  return count;
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
