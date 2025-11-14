import { LRUCache } from 'lru-cache';
import fs from 'fs';
import path from 'path';
import { checkPermify, createRelation, schemaSync, PermifyRelation } from './permifyClient';

export type PolicyCheck = {
  principal: string;
  action: string;
  resource: string;
  context?: Record<string, any>;
  tenant_id?: string;
};

export interface RoleDefinition {
  name: string;
  description: string;
  permissions: string[];
  parent_role?: string;
}

const cache = new LRUCache({ max: 1000, ttl: 1000 * 60 });

/**
 * Evaluate policy - check if principal can perform action on resource
 * Uses Permify if configured, falls back to mock for local dev
 */
export async function evaluatePolicy(check: PolicyCheck): Promise<boolean> {
  if (!check || !check.principal) return false;

  const key = `${check.principal}:${check.action}:${check.resource}`;
  const cached = cache.get(key);
  if (typeof cached === 'boolean') return cached;

  try {
    const engine = process.env.POLICY_ENGINE || 'mock';
    if (engine === 'permify') {
      const allow = await checkPermify({
        principal: check.principal,
        action: check.action,
        resource: check.resource,
        context: check.context || {},
        tenant_id: check.tenant_id,
      });
      cache.set(key, allow);
      return allow;
    }
    if (engine === 'mock') {
      // Mock: allow GETs, allow principals starting with `test-`, allow admins
      const allow =
        check.action === 'GET' || check.principal?.startsWith?.('test-') ||
        check.principal === 'admin';
      cache.set(key, !!allow);
      return !!allow;
    }
  } catch (err: any) {
    const msg = err && err.message ? err.message : String(err);
    console.warn('Policy engine call failed:', msg);
  }

  // Fallback: deny by default
  cache.set(key, false);
  return false;
}

/**
 * Load roles from JSON file
 */
export async function loadRoles(filePath?: string): Promise<Record<string, RoleDefinition>> {
  const rolePath = filePath || path.join(process.cwd(), 'src/policy/roles.json');

  try {
    const content = fs.readFileSync(rolePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load roles from ${rolePath}:`, error);
    return {};
  }
}

/**
 * Load schema from PSL file
 */
export async function loadSchema(filePath?: string): Promise<string> {
  const schemaPath = filePath || path.join(process.cwd(), 'src/policy/schema.perm');

  try {
    const content = fs.readFileSync(schemaPath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to load schema from ${schemaPath}:`, error);
    return '';
  }
}

/**
 * Sync policies to Permify (schema + roles)
 */
export async function syncPolicies(tenantId: string): Promise<boolean> {
  console.log(`?? Syncing policies for tenant ${tenantId}...`);

  try {
    // 1. Load and sync schema
    const schema = await loadSchema();
    if (!schema) {
      console.error('? Schema file not found');
      return false;
    }

    console.log('?? Uploading schema to Permify...');
    const schemaSynced = await schemaSync(tenantId, schema);
    if (!schemaSynced) {
      console.error('? Failed to sync schema');
      return false;
    }
    console.log('? Schema synced');

    // 2. Load and sync roles
    const roles = await loadRoles();
    if (!roles || Object.keys(roles).length === 0) {
      console.warn('?? No roles found');
      return true;
    }

    console.log(`?? Creating ${Object.keys(roles).length} role relations...`);
    let successCount = 0;

    for (const [roleName, _roleDefn] of Object.entries(roles)) {
      const relation: PermifyRelation = {
        entity: { type: 'role', id: roleName },
        relation: 'has_permissions',
        subject: { type: 'permission_group', id: `${roleName}_permissions` },
      };

      const created = await createRelation(tenantId, relation);
      if (created) {
        successCount++;
        console.log(`  ? ${roleName}`);
      } else {
        console.log(`  ? ${roleName}`);
      }
    }

    console.log(
      `? Policy sync complete: ${successCount}/${Object.keys(roles).length} roles synced`
    );
    return true;
  } catch (error) {
    console.error('? Policy sync failed:', error);
    return false;
  }
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(roleName: string): Promise<string[]> {
  const roles = await loadRoles();
  const role = roles[roleName];

  if (!role) {
    console.warn(`Role ${roleName} not found`);
    return [];
  }

  return role.permissions || [];
}

/**
 * Check if a role has a specific permission
 */
export async function roleHasPermission(roleName: string, permission: string): Promise<boolean> {
  const permissions = await getRolePermissions(roleName);
  return permissions.includes(permission);
}

/**
 * Add permission to role (in-memory)
 */
export function addPermissionToRole(
  role: RoleDefinition,
  permission: string
): RoleDefinition {
  if (!role.permissions) {
    role.permissions = [];
  }

  if (!role.permissions.includes(permission)) {
    role.permissions.push(permission);
  }

  return role;
}

/**
 * Remove permission from role (in-memory)
 */
export function removePermissionFromRole(
  role: RoleDefinition,
  permission: string
): RoleDefinition {
  if (role.permissions) {
    role.permissions = role.permissions.filter((p) => p !== permission);
  }

  return role;
}

/**
 * Generate markdown documentation for a role
 */
export function describeRole(role: RoleDefinition): string {
  const lines = [
    `## ${role.name}`,
    role.description || '',
    '',
    `**Permissions (${role.permissions?.length || 0}):**`,
    '',
  ];

  // Group by module
  const byModule: Record<string, string[]> = {};
  (role.permissions || []).forEach((perm) => {
    const module = perm.split('_')[0];
    if (!byModule[module]) byModule[module] = [];
    byModule[module].push(perm);
  });

  Object.entries(byModule).forEach(([module, perms]) => {
    lines.push(`### ${module.toUpperCase()}`);
    perms.forEach((perm) => {
      lines.push(`- \`${perm}\``);
    });
    lines.push('');
  });

  return lines.join('');
}

export function invalidateCache(key?: string) {
  if (!key) return cache.clear();
  cache.delete(key);
}

export default { evaluatePolicy, syncPolicies, loadRoles, loadSchema };

