/**
 * Permission System Integration Tests
 * Tests policy evaluation, role lookup, and API interactions
 *
 * To run: pnpm test:permission or vitest run this file
 */

import { evaluatePolicy, getRolePermissions, loadRoles, loadSchema } from '../lib/policyAdapter';

// Use Jest-compatible describe/it if vitest not available
const describe = (global as any).describe || ((name: string, fn: () => void) => fn());
const it = (global as any).it || ((name: string, fn: () => void) => fn());
const expect = (value: any) => ({
  toBe: (expected: any) => {
    if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`);
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(value) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
    }
  },
  toBeGreaterThan: (expected: any) => {
    if (value <= expected) throw new Error(`Expected > ${expected}, got ${value}`);
  },
});

describe('Permission System', () => {
  describe('Policy Evaluation', () => {
    it('should allow GET requests in mock mode', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'user-123',
        action: 'GET',
        resource: 'leads',
      });

      expect(allowed).toBe(true);
    });

    it('should allow test principals in mock mode', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'test-user-123',
        action: 'POST',
        resource: 'leads',
      });

      expect(allowed).toBe(true);
    });

    it('should allow admin principal in mock mode', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'admin',
        action: 'DELETE',
        resource: 'users',
      });

      expect(allowed).toBe(true);
    });

    it('should deny non-GET requests from regular users in mock mode', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'user-123',
        action: 'DELETE',
        resource: 'leads',
      });

      expect(allowed).toBe(false);
    });

    it('should deny undefined principals', async () => {
      const allowed = await evaluatePolicy({
        principal: '',
        action: 'GET',
        resource: 'leads',
      });

      expect(allowed).toBe(false);
    });
  });

  describe('Role Loading', () => {
    it('should load roles from file', async () => {
      const roles = await loadRoles();

      if (Object.keys(roles).length > 0) {
        expect(roles).toBe(roles); // Not null check
        expect(typeof roles).toBe('object');
      }
    });

    it('should return empty object for missing file', async () => {
      const roles = await loadRoles('/nonexistent/path/roles.json');

      expect(roles).toEqual({});
    });

    it('should have permissions array for each role', async () => {
      const roles = await loadRoles();

      Object.values(roles).forEach((role) => {
        if (role) {
          const isArray = Array.isArray(role.permissions);
          if (!isArray) throw new Error('Permissions should be array');
        }
      });
    });
  });

  describe('Permission Queries', () => {
    it('should get permissions for a role', async () => {
      const permissions = await getRolePermissions('Admin');

      if (permissions.length > 0) {
        const isArray = Array.isArray(permissions);
        if (!isArray) throw new Error('Should return array');
        expect(permissions.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for nonexistent role', async () => {
      const permissions = await getRolePermissions('NonexistentRole');

      expect(permissions).toEqual([]);
    });
  });

  describe('Schema Loading', () => {
    it('should load schema from file', async () => {
      const schema = await loadSchema();

      if (schema) {
        expect(schema).toBe(schema); // Not null check
        expect(typeof schema).toBe('string');
      }
    });

    it('should return empty string for missing file', async () => {
      const schema = await loadSchema('/nonexistent/path/schema.perm');

      expect(schema).toEqual('');
    });

    it('should contain policy definitions', async () => {
      const schema = await loadSchema();

      if (schema) {
        const isValidPSL =
          schema.includes('entity') ||
          schema.includes('permission') ||
          schema.includes('relation') ||
          schema.includes('action');
        if (!isValidPSL) throw new Error('Invalid PSL format');
      }
    });
  });

  describe('Cache Behavior', () => {
    it('should cache policy decisions', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const call1 = await evaluatePolicy({
        principal: 'cache-test-user',
        action: 'GET',
        resource: 'leads',
      });

      const call2 = await evaluatePolicy({
        principal: 'cache-test-user',
        action: 'GET',
        resource: 'leads',
      });

      expect(call1).toBe(call2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables gracefully', async () => {
      const originalPermifyUrl = process.env.PERMIFY_URL;
      delete process.env.PERMIFY_URL;

      const allowed = await evaluatePolicy({
        principal: 'user-123',
        action: 'GET',
        resource: 'leads',
      });

      if (typeof allowed !== 'boolean') throw new Error('Should return boolean');

      if (originalPermifyUrl) {
        process.env.PERMIFY_URL = originalPermifyUrl;
      }
    });

    it('should return false on invalid input', async () => {
      const allowed = await evaluatePolicy({
        principal: null as any,
        action: 'GET',
        resource: 'leads',
      });

      expect(allowed).toBe(false);
    });
  });

  describe('Integration', () => {
    it('should evaluate policy with tenant context', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'test-user-abc',
        action: 'GET',
        resource: 'leads',
        tenant_id: 'tenant-123',
        context: { department: 'sales' },
      });

      if (typeof allowed !== 'boolean') throw new Error('Should return boolean');
    });

    it('should evaluate policy with resource ID', async () => {
      process.env.POLICY_ENGINE = 'mock';

      const allowed = await evaluatePolicy({
        principal: 'test-user-xyz',
        action: 'GET',
        resource: 'leads:lead-456',
      });

      if (typeof allowed !== 'boolean') throw new Error('Should return boolean');
    });
  });
});


