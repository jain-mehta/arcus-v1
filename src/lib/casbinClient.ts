/**
 * Casbin RBAC Client - Authorization Engine
 * 
 * Replaces Permify with Casbin for role-based access control
 * 
 * Features:
 * - Domain-based multi-tenancy (organizationId)
 * - Hierarchical roles with inheritance
 * - Resource-level permissions with wildcard support
 * - Dynamic policy management (runtime add/remove)
 * - Policy persistence with TypeORM adapter
 * - Audit logging integration
 * 
 * Permission Format:
 * - Subject: user:{userId}
 * - Domain: org:{organizationId}
 * - Object: resource path (e.g., 'sales:leads:*', 'store:pos:access')
 * - Action: operation (e.g., 'view', 'create', 'edit', 'delete', '*')
 */

import { newEnforcer, Enforcer } from 'casbin';
import TypeORMAdapter from 'typeorm-adapter';
import path from 'path';
import { getControlRepo } from './controlDataSource';
import { PolicySyncLog } from '../entities/control/policy-sync-log.entity';

let enforcer: Enforcer | null = null;

/**
 * Initialize Casbin enforcer with TypeORM adapter
 */
export async function initCasbin(): Promise<Enforcer> {
  if (enforcer) {
    return enforcer;
  }

  try {
    // Check if Supabase connection URL is available
    const supabaseDbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    
    if (!supabaseDbUrl) {
      console.warn('⚠️  SUPABASE_DB_URL or DATABASE_URL not set - Casbin will run in memory mode without persistence');
      // Return a basic enforcer without database persistence
      const modelPath = path.join(process.cwd(), 'casbin_model.conf');
      enforcer = await newEnforcer(modelPath);
      return enforcer;
    }

    // Use TypeORM adapter with Supabase connection string
    const adapter = await TypeORMAdapter.newAdapter({
      type: 'postgres',
      url: supabaseDbUrl,
    });

    // Load Casbin model
    const modelPath = path.join(process.cwd(), 'casbin_model.conf');
    enforcer = await newEnforcer(modelPath, adapter);

    // Enable auto-save to persist policy changes
    enforcer.enableAutoSave(true);

    console.log('✅ Casbin enforcer initialized successfully');
    return enforcer;
  } catch (error) {
    console.error('❌ Failed to initialize Casbin:', error);
    throw error;
  }
}

/**
 * Get or initialize Casbin enforcer
 */
export async function getEnforcer(): Promise<Enforcer> {
  if (!enforcer) {
    return await initCasbin();
  }
  return enforcer;
}

/**
 * Permission Check Request
 */
export interface CasbinCheckRequest {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
  tenantId?: string;
}

/**
 * Check if user has permission for a specific action on a resource
 * 
 * @param req - Permission check request
 * @returns true if permission granted, false otherwise
 * 
 * @example
 * ```typescript
 * const allowed = await checkCasbin({
 *   userId: 'user123',
 *   organizationId: 'org456',
 *   resource: 'sales:leads',
 *   action: 'view'
 * });
 * ```
 */
export async function checkCasbin(req: CasbinCheckRequest): Promise<boolean> {
  const startTime = Date.now();
  const tenantId = req.tenantId || req.organizationId;

  try {
    const enforcer = await getEnforcer();

    // Format: sub, dom, obj, act
    const subject = `user:${req.userId}`;
    const domain = `org:${req.organizationId}`;
    const object = req.resource;
    const action = req.action;

    const allowed = await enforcer.enforce(subject, domain, object, action);
    const durationMs = Date.now() - startTime;

    // Log to PolicySyncLog for audit trail
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: allowed ? 'success' : 'denied',
          payload: JSON.stringify(req),
          response: JSON.stringify({ allowed }),
          duration_ms: durationMs,
          triggered_by: req.userId,
          sync_type: 'check',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log Casbin check:', logError);
    }

    console.log(
      `[Casbin] ${allowed ? '✅' : '❌'} ${subject} ${action} ${object} in ${domain} (${durationMs}ms)`
    );

    return allowed;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;

    // Log error
    try {
      const syncLogRepo = await getControlRepo(PolicySyncLog);
      if (syncLogRepo) {
        await syncLogRepo.insert({
          tenant_id: tenantId,
          sync_status: 'error',
          payload: JSON.stringify(req),
          response: null,
          error_message: error?.message || String(error),
          duration_ms: durationMs,
          triggered_by: req.userId,
          sync_type: 'check',
        } as any);
      }
    } catch (logError) {
      console.warn('Failed to log Casbin error:', logError);
    }

    console.error('❌ Casbin check failed:', error);
    // Fail closed: deny on error
    return false;
  }
}

/**
 * Add a policy (permission) to a role or user
 * 
 * @example
 * ```typescript
 * // Grant role 'sales_manager' permission to view all leads
 * await addPolicy({
 *   subject: 'role:sales_manager',
 *   organizationId: 'org456',
 *   resource: 'sales:leads:*',
 *   action: 'view',
 *   effect: 'allow'
 * });
 * ```
 */
export async function addPolicy(params: {
  subject: string;
  organizationId: string;
  resource: string;
  action: string;
  effect?: 'allow' | 'deny';
}): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    const { subject, organizationId, resource, action, effect = 'allow' } = params;

    const domain = `org:${organizationId}`;
    const added = await enforcer.addPolicy(subject, domain, resource, action, effect);

    console.log(
      `[Casbin] ${added ? '✅' : '⚠️'} Policy added: ${subject} ${action} ${resource} (${effect})`
    );

    return added;
  } catch (error) {
    console.error('❌ Failed to add policy:', error);
    return false;
  }
}

/**
 * Remove a policy (permission)
 */
export async function removePolicy(params: {
  subject: string;
  organizationId: string;
  resource: string;
  action: string;
  effect?: 'allow' | 'deny';
}): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    const { subject, organizationId, resource, action, effect = 'allow' } = params;

    const domain = `org:${organizationId}`;
    const removed = await enforcer.removePolicy(subject, domain, resource, action, effect);

    console.log(
      `[Casbin] ${removed ? '✅' : '⚠️'} Policy removed: ${subject} ${action} ${resource}`
    );

    return removed;
  } catch (error) {
    console.error('❌ Failed to remove policy:', error);
    return false;
  }
}

/**
 * Assign a role to a user
 * 
 * @example
 * ```typescript
 * // Assign user to 'sales_manager' role
 * await addRoleForUser({
 *   userId: 'user123',
 *   role: 'sales_manager',
 *   organizationId: 'org456'
 * });
 * ```
 */
export async function addRoleForUser(params: {
  userId: string;
  role: string;
  organizationId: string;
}): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    const { userId, role, organizationId } = params;

    const user = `user:${userId}`;
    const roleId = `role:${role}`;
    const domain = `org:${organizationId}`;

    const added = await enforcer.addRoleForUser(user, roleId, domain);

    console.log(
      `[Casbin] ${added ? '✅' : '⚠️'} Role assigned: ${user} -> ${roleId} in ${domain}`
    );

    return added;
  } catch (error) {
    console.error('❌ Failed to add role for user:', error);
    return false;
  }
}

/**
 * Remove a role from a user
 */
export async function removeRoleForUser(params: {
  userId: string;
  role: string;
  organizationId: string;
}): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    const { userId, role, organizationId } = params;

    const user = `user:${userId}`;
    const roleId = `role:${role}`;
    const domain = `org:${organizationId}`;

    const removed = await enforcer.deleteRoleForUser(user, roleId, domain);

    console.log(
      `[Casbin] ${removed ? '✅' : '⚠️'} Role removed: ${user} -x-> ${roleId} in ${domain}`
    );

    return removed;
  } catch (error) {
    console.error('❌ Failed to remove role for user:', error);
    return false;
  }
}

/**
 * Get all roles for a user in an organization
 */
export async function getRolesForUser(
  userId: string,
  organizationId: string
): Promise<string[]> {
  try {
    const enforcer = await getEnforcer();
    const user = `user:${userId}`;
    const domain = `org:${organizationId}`;

    const roles = await enforcer.getRolesForUser(user, domain);

    // Strip 'role:' prefix
    return roles.map((r) => r.replace('role:', ''));
  } catch (error) {
    console.error('❌ Failed to get roles for user:', error);
    return [];
  }
}

/**
 * Get all users with a specific role in an organization
 */
export async function getUsersForRole(
  role: string,
  organizationId: string
): Promise<string[]> {
  try {
    const enforcer = await getEnforcer();
    const roleId = `role:${role}`;
    const domain = `org:${organizationId}`;

    const users = await enforcer.getUsersForRole(roleId, domain);

    // Strip 'user:' prefix
    return users.map((u) => u.replace('user:', ''));
  } catch (error) {
    console.error('❌ Failed to get users for role:', error);
    return [];
  }
}

/**
 * Get all permissions for a user (including inherited from roles)
 */
export async function getPermissionsForUser(
  userId: string,
  organizationId: string
): Promise<Array<{ resource: string; action: string; effect: string }>> {
  try {
    const enforcer = await getEnforcer();
    const user = `user:${userId}`;
    const domain = `org:${organizationId}`;

    const permissions = await enforcer.getImplicitPermissionsForUser(user, domain);

    return permissions.map((p) => ({
      resource: p[2],
      action: p[3],
      effect: p[4] || 'allow',
    }));
  } catch (error) {
    console.error('❌ Failed to get permissions for user:', error);
    return [];
  }
}

/**
 * Batch check multiple permissions at once
 */
export async function batchCheck(
  checks: CasbinCheckRequest[]
): Promise<boolean[]> {
  try {
    const enforcer = await getEnforcer();

    const requests = checks.map((req) => [
      `user:${req.userId}`,
      `org:${req.organizationId}`,
      req.resource,
      req.action,
    ]);

    const results = await enforcer.batchEnforce(requests);
    return results;
  } catch (error) {
    console.error('❌ Batch check failed:', error);
    // Fail closed: deny all on error
    return checks.map(() => false);
  }
}

/**
 * Clear all policies for an organization (useful for tenant cleanup)
 */
export async function clearPoliciesForOrganization(
  organizationId: string
): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    const domain = `org:${organizationId}`;

    // Get all policies for this domain
    const policies = await enforcer.getFilteredPolicy(1, domain);

    // Remove all policies
    for (const policy of policies) {
      await enforcer.removePolicy(...policy);
    }

    console.log(`[Casbin] ✅ Cleared ${policies.length} policies for ${domain}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to clear policies:', error);
    return false;
  }
}

/**
 * Load policies from a JSON structure (for initial setup or migration)
 * 
 * @example
 * ```typescript
 * await loadPoliciesFromJSON({
 *   organizationId: 'org456',
 *   roles: {
 *     admin: {
 *       permissions: [
 *         { resource: '*', action: '*', effect: 'allow' }
 *       ]
 *     },
 *     sales_manager: {
 *       permissions: [
 *         { resource: 'sales:*', action: '*', effect: 'allow' },
 *         { resource: 'reports:sales', action: 'view', effect: 'allow' }
 *       ]
 *     }
 *   },
 *   users: {
 *     'user123': ['admin'],
 *     'user456': ['sales_manager']
 *   }
 * });
 * ```
 */
export async function loadPoliciesFromJSON(data: {
  organizationId: string;
  roles: {
    [roleName: string]: {
      permissions: Array<{ resource: string; action: string; effect?: 'allow' | 'deny' }>;
    };
  };
  users?: {
    [userId: string]: string[];
  };
}): Promise<void> {
  const { organizationId, roles, users = {} } = data;

  try {
    // Add role permissions
    for (const [roleName, roleData] of Object.entries(roles)) {
      const roleId = `role:${roleName}`;

      for (const perm of roleData.permissions) {
        await addPolicy({
          subject: roleId,
          organizationId,
          resource: perm.resource,
          action: perm.action,
          effect: perm.effect || 'allow',
        });
      }
    }

    // Assign users to roles
    for (const [userId, userRoles] of Object.entries(users)) {
      for (const role of userRoles) {
        await addRoleForUser({ userId, role, organizationId });
      }
    }

    console.log(`[Casbin] ✅ Loaded policies for ${organizationId}`);
  } catch (error) {
    console.error('❌ Failed to load policies from JSON:', error);
    throw error;
  }
}

/**
 * Health check - verify Casbin is working
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const enforcer = await getEnforcer();
    return enforcer !== null;
  } catch (error) {
    console.error('❌ Casbin health check failed:', error);
    return false;
  }
}

/**
 * Export all policies for an organization (for backup/migration)
 */
export async function exportPolicies(organizationId: string): Promise<{
  policies: any[];
  roles: any[];
}> {
  try {
    const enforcer = await getEnforcer();
    const domain = `org:${organizationId}`;

    const policies = await enforcer.getFilteredPolicy(1, domain);
    const roles = await enforcer.getFilteredGroupingPolicy(2, domain);

    return {
      policies,
      roles,
    };
  } catch (error) {
    console.error('❌ Failed to export policies:', error);
    return { policies: [], roles: [] };
  }
}
