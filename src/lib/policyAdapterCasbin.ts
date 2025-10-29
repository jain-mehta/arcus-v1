/**
 * Policy Adapter for Casbin RBAC
 * 
 * Provides a high-level API for managing roles and permissions
 * Integrates with Casbin for authorization enforcement
 * 
 * This adapter provides:
 * - Role management (create, update, delete roles)
 * - Permission assignment to roles
 * - User-role assignment
 * - Permission inheritance through role hierarchy
 * - Policy synchronization and caching
 */

import {
  checkCasbin,
  addPolicy,
  removePolicy,
  addRoleForUser,
  removeRoleForUser,
  getRolesForUser,
  getUsersForRole,
  getPermissionsForUser,
  loadPoliciesFromJSON,
  exportPolicies,
  initCasbin,
} from './casbinClient';

export interface RoleDefinition {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  permissions: Permission[];
  inherits?: string[]; // Roles this role inherits from
}

export interface Permission {
  resource: string;
  action: string;
  effect?: 'allow' | 'deny';
}

export interface PolicyCheckRequest {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
}

/**
 * Check if user can perform action on resource
 */
export async function checkPolicy(req: PolicyCheckRequest): Promise<boolean> {
  try {
    const allowed = await checkCasbin({
      userId: req.userId,
      organizationId: req.organizationId,
      resource: req.resource,
      action: req.action,
    });

    console.log(
      `[PolicyAdapter] ${allowed ? '✅ ALLOW' : '❌ DENY'} user:${req.userId} ${req.action} ${req.resource}`
    );

    return allowed;
  } catch (error) {
    console.error('[PolicyAdapter] Check failed:', error);
    return false;
  }
}

/**
 * Create a new role with permissions
 */
export async function createRole(role: RoleDefinition): Promise<boolean> {
  try {
    const roleId = `role:${role.id}`;

    // Add permissions for the role
    for (const perm of role.permissions) {
      await addPolicy({
        subject: roleId,
        organizationId: role.organizationId,
        resource: perm.resource,
        action: perm.action,
        effect: perm.effect || 'allow',
      });
    }

    // Handle role inheritance if specified
    if (role.inherits && role.inherits.length > 0) {
      for (const parentRole of role.inherits) {
        await addRoleForUser({
          userId: role.id, // The role itself acts as a user in this context
          role: parentRole,
          organizationId: role.organizationId,
        });
      }
    }

    console.log(`[PolicyAdapter] ✅ Created role: ${role.id} with ${role.permissions.length} permissions`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to create role:', error);
    return false;
  }
}

/**
 * Update role permissions (replaces all existing permissions)
 */
export async function updateRolePermissions(
  roleId: string,
  organizationId: string,
  permissions: Permission[]
): Promise<boolean> {
  try {
    // Remove all existing policies for this role
    const enforcer = await initCasbin();
    const domain = `org:${organizationId}`;
    const subject = `role:${roleId}`;

    // Get existing policies
    const existingPolicies = await enforcer.getFilteredPolicy(0, subject, domain);

    // Remove old policies
    for (const policy of existingPolicies) {
      await enforcer.removePolicy(...policy);
    }

    // Add new permissions
    for (const perm of permissions) {
      await addPolicy({
        subject,
        organizationId,
        resource: perm.resource,
        action: perm.action,
        effect: perm.effect || 'allow',
      });
    }

    console.log(`[PolicyAdapter] ✅ Updated role ${roleId} with ${permissions.length} permissions`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to update role permissions:', error);
    return false;
  }
}

/**
 * Delete a role and all its permissions
 */
export async function deleteRole(roleId: string, organizationId: string): Promise<boolean> {
  try {
    const enforcer = await initCasbin();
    const domain = `org:${organizationId}`;
    const subject = `role:${roleId}`;

    // Remove all policies for this role
    const policies = await enforcer.getFilteredPolicy(0, subject, domain);
    for (const policy of policies) {
      await enforcer.removePolicy(...policy);
    }

    // Remove all role assignments
    const users = await getUsersForRole(roleId, organizationId);
    for (const userId of users) {
      await removeRoleForUser({ userId, role: roleId, organizationId });
    }

    console.log(`[PolicyAdapter] ✅ Deleted role: ${roleId}`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to delete role:', error);
    return false;
  }
}

/**
 * Assign a role to a user
 */
export async function assignUserRole(
  userId: string,
  roleId: string,
  organizationId: string
): Promise<boolean> {
  try {
    await addRoleForUser({ userId, role: roleId, organizationId });
    console.log(`[PolicyAdapter] ✅ Assigned role ${roleId} to user ${userId}`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to assign role:', error);
    return false;
  }
}

/**
 * Remove a role from a user
 */
export async function revokeUserRole(
  userId: string,
  roleId: string,
  organizationId: string
): Promise<boolean> {
  try {
    await removeRoleForUser({ userId, role: roleId, organizationId });
    console.log(`[PolicyAdapter] ✅ Revoked role ${roleId} from user ${userId}`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to revoke role:', error);
    return false;
  }
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string, organizationId: string): Promise<string[]> {
  try {
    const roles = await getRolesForUser(userId, organizationId);
    return roles;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to get user roles:', error);
    return [];
  }
}

/**
 * Get all permissions for a user (including inherited from roles)
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<Permission[]> {
  try {
    const permissions = await getPermissionsForUser(userId, organizationId);
    // Map to ensure correct type
    return permissions.map(p => ({
      resource: p.resource,
      action: p.action,
      effect: (p.effect === 'deny' ? 'deny' : 'allow') as 'allow' | 'deny',
    }));
  } catch (error) {
    console.error('[PolicyAdapter] Failed to get user permissions:', error);
    return [];
  }
}

/**
 * Initialize default roles and permissions for an organization
 */
export async function initializeDefaultPolicies(organizationId: string): Promise<void> {
  console.log(`[PolicyAdapter] Initializing default policies for org:${organizationId}`);

  const defaultPolicies = {
    organizationId,
    roles: {
      admin: {
        permissions: [
          { resource: '*', action: '*', effect: 'allow' as const },
        ],
      },
      sales_manager: {
        permissions: [
          { resource: 'sales:*', action: '*', effect: 'allow' as const },
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
          { resource: 'reports:sales', action: 'view', effect: 'allow' as const },
          { resource: 'reports:sales', action: 'export', effect: 'allow' as const },
        ],
      },
      sales_executive: {
        permissions: [
          { resource: 'sales:leads', action: 'view', effect: 'allow' as const },
          { resource: 'sales:leads', action: 'create', effect: 'allow' as const },
          { resource: 'sales:leads', action: 'edit', effect: 'allow' as const },
          { resource: 'sales:opportunities', action: 'view', effect: 'allow' as const },
          { resource: 'sales:opportunities', action: 'create', effect: 'allow' as const },
          { resource: 'sales:quotations', action: 'view', effect: 'allow' as const },
          { resource: 'sales:quotations', action: 'create', effect: 'allow' as const },
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
        ],
      },
      store_manager: {
        permissions: [
          { resource: 'store:*', action: '*', effect: 'allow' as const },
          { resource: 'inventory:stock', action: 'view', effect: 'allow' as const },
          { resource: 'reports:store', action: 'view', effect: 'allow' as const },
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
        ],
      },
      inventory_manager: {
        permissions: [
          { resource: 'inventory:*', action: '*', effect: 'allow' as const },
          { resource: 'vendor:*', action: 'view', effect: 'allow' as const },
          { resource: 'reports:inventory', action: 'view', effect: 'allow' as const },
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
        ],
      },
      hr_manager: {
        permissions: [
          { resource: 'hrms:*', action: '*', effect: 'allow' as const },
          { resource: 'reports:hrms', action: 'view', effect: 'allow' as const },
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
        ],
      },
      viewer: {
        permissions: [
          { resource: 'dashboard:*', action: 'view', effect: 'allow' as const },
          { resource: 'reports:*', action: 'view', effect: 'allow' as const },
        ],
      },
    },
  };

  try {
    await loadPoliciesFromJSON(defaultPolicies);
    console.log(`[PolicyAdapter] ✅ Default policies initialized for org:${organizationId}`);
  } catch (error) {
    console.error('[PolicyAdapter] Failed to initialize default policies:', error);
    throw error;
  }
}

/**
 * Export all policies for an organization (for backup/audit)
 */
export async function exportOrganizationPolicies(organizationId: string): Promise<any> {
  try {
    const data = await exportPolicies(organizationId);
    return {
      organizationId,
      exportedAt: new Date().toISOString(),
      ...data,
    };
  } catch (error) {
    console.error('[PolicyAdapter] Failed to export policies:', error);
    return null;
  }
}

/**
 * Sync policies from a role definition (used by admin UI)
 */
export async function syncRoleDefinition(role: RoleDefinition): Promise<boolean> {
  try {
    // Update or create the role
    await updateRolePermissions(role.id, role.organizationId, role.permissions);
    console.log(`[PolicyAdapter] ✅ Synced role definition: ${role.id}`);
    return true;
  } catch (error) {
    console.error('[PolicyAdapter] Failed to sync role definition:', error);
    return false;
  }
}
