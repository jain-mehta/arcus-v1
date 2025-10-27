/**
 * Session Manager
 * Handles JWT issuance and session tracking for multi-tenant auth
 * 
 * Architecture:
 * - Sessions stored in control-plane PostgreSQL
 * - JTI (JWT ID) used for revocation tracking
 * - Tenant context embedded in claims
 * - Session metadata (IP, user-agent, created_at, expires_at)
 * 
 * Usage:
 *   const session = await createSession(userId, tenantId, metadata);
 *   await revokeSession(jti);
 *   const isValid = await isSessionValid(jti);
 */

import { controlDataSource } from '../controlDataSource';
import { Session } from '../../entities/control/session.entity';
import { randomBytes } from 'crypto';

interface SessionMetadata {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
}

interface SessionPayload {
  jti: string;
  userId: string;
  tenantId: string;
  expiresAt: Date;
  createdAt: Date;
  metadata: SessionMetadata;
}

/**
 * Generate unique JTI (JWT ID)
 */
export function generateJTI(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create a new session and track it in control-plane
 */
export async function createSession(
  userId: string,
  tenantId: string,
  metadata?: SessionMetadata
): Promise<SessionPayload> {
  const jti = generateJTI();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    // Create session record
    const session = sessionRepo.create({
      jti,
      user_id: userId,
      tenant_id: tenantId,
      expires_at: expiresAt,
      created_at: createdAt,
      revoked: false,
      ip_address: metadata?.ip,
      user_agent: metadata?.userAgent,
    });

    await sessionRepo.save(session);

    console.log(`? Session created: ${jti} (user: ${userId}, tenant: ${tenantId})`);

    return {
      jti,
      userId,
      tenantId,
      expiresAt,
      createdAt,
      metadata: metadata || {},
    };
  } catch (error) {
    console.error('Failed to create session:', error);
    throw new Error(`Session creation failed: ${error}`);
  }
}

/**
 * Revoke a session by JTI
 */
export async function revokeSession(jti: string): Promise<void> {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    await sessionRepo.update({ jti }, { revoked: true });

    console.log(`? Session revoked: ${jti}`);
  } catch (error) {
    console.error('Failed to revoke session:', error);
    throw new Error(`Session revocation failed: ${error}`);
  }
}

/**
 * Check if a session is valid (not revoked and not expired)
 */
export async function isSessionValid(jti: string): Promise<boolean> {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const session = await sessionRepo.findOne({ where: { jti } });

    if (!session) {
      console.warn(`Session not found: ${jti}`);
      return false;
    }

    if (session.revoked) {
      console.warn(`Session is revoked: ${jti}`);
      return false;
    }

    if (session.expires_at < new Date()) {
      console.warn(`Session is expired: ${jti}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to check session validity:', error);
    return false;
  }
}

/**
 * Get session details
 */
export async function getSession(jti: string) {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const session = await sessionRepo.findOne({ where: { jti } });

    if (!session) {
      return null;
    }

    return {
      jti: session.jti,
      user_id: session.user_id,
      tenant_id: session.tenant_id,
      revoked: session.revoked,
      expires_at: session.expires_at,
      created_at: session.created_at,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
    };
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const result = await sessionRepo.update(
      { user_id: userId, revoked: false },
      { revoked: true }
    );

    console.log(`? Revoked ${result.affected || 0} sessions for user: ${userId}`);
  } catch (error) {
    console.error('Failed to revoke all user sessions:', error);
    throw new Error(`Bulk revocation failed: ${error}`);
  }
}

/**
 * Revoke all sessions for a tenant
 */
export async function revokeAllTenantSessions(tenantId: string): Promise<void> {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const result = await sessionRepo.update(
      { tenant_id: tenantId, revoked: false },
      { revoked: true }
    );

    console.log(`? Revoked ${result.affected || 0} sessions for tenant: ${tenantId}`);
  } catch (error) {
    console.error('Failed to revoke all tenant sessions:', error);
    throw new Error(`Tenant revocation failed: ${error}`);
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const sessions = await sessionRepo.find({
      where: {
        user_id: userId,
        revoked: false,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return sessions.map((s: Session) => ({
      jti: s.jti,
      tenant_id: s.tenant_id,
      expires_at: s.expires_at,
      created_at: s.created_at,
      ip_address: s.ip_address,
    }));
  } catch (error) {
    console.error('Failed to get user active sessions:', error);
    return [];
  }
}

/**
 * Clean up expired sessions (maintenance task)
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const dataSource = await controlDataSource.initialize();
    const sessionRepo = dataSource.getRepository(Session);

    const result = await sessionRepo
      .createQueryBuilder()
      .delete()
      .where('expires_at < NOW()')
      .execute();

    console.log(`?? Cleaned up ${result.affected || 0} expired sessions`);
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}

export default {
  generateJTI,
  createSession,
  revokeSession,
  isSessionValid,
  getSession,
  revokeAllUserSessions,
  revokeAllTenantSessions,
  getUserActiveSessions,
  cleanupExpiredSessions,
};

