# 🔐 RBAC & Performance Maintenance Strategy

**Document Created:** November 11, 2025  
**Related:** `PRODUCTION_MIGRATION_GUIDE.md`  
**Status:** ✅ Implementation Ready

---

## 🎯 RBAC INTEGRITY ASSURANCE

### Current State (Transitioning)
- ✅ Casbin enforcer implemented and working
- ✅ Database schemas created (18 tables including casbin_rule)
- ⚠️ Some server actions still use mock data
- ⚠️ Permission checks not consistently enforced in all endpoints
- ✅ Admin fallback implemented (admin@arcus.local)

### Target State (Production-Ready)
- ✅ **100% Casbin-based** permission enforcement
- ✅ **Zero fallbacks** to in-memory mock permissions
- ✅ **Consistent enforcement** across all API endpoints
- ✅ **Policy sync** on role creation/modification
- ✅ **Audit trail** for all permission changes
- ✅ **Performance optimized** with caching

---

## 🔒 RBAC MIGRATION CHECKLIST

### ✅ Phase 1: Verify Casbin Setup
```bash
# 1. Check casbin_rule table exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM casbin_rule;"
# Expected: > 0 (should have seed policies)

# 2. Check Casbin client initializes
npm run dev
# Look for logs: "[RBAC] Casbin enforcer initialized for org"

# 3. Verify seed script runs
npm run seed:casbin
# Expected: ✅ Created 17 default roles
#          ✅ Created 400+ policies
```

### ✅ Phase 2: Remove In-Memory Permission Checks
**Files to modify:**

```typescript
// ❌ OLD: src/lib/policyAdapter.ts
if (engine === 'mock') {
  return request.action === 'GET' || request.principal.startsWith('test-');
}

// ✅ NEW: Always use Casbin
const enforcer = await initCasbin(request.domain);
const allowed = await enforcer.enforce(...);
return allowed;
```

```typescript
// ❌ OLD: src/lib/permifyClient.ts
if (process.env.POLICY_ENGINE === 'mock') {
  console.log('[MOCK] Allowing access');
  return true;
}

// ✅ NEW: Always enforce via Casbin
const allowed = await checkCasbin(...);
if (!allowed) throw new Error('Permission denied');
return allowed;
```

### ✅ Phase 3: Enforce Permissions on All Endpoints
**Pattern for all protected API routes:**

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const claims = await getSessionClaims();
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check RBAC permission (REQUIRED)
    const hasPermission = await checkCasbin(
      claims.uid,
      claims.orgId,
      'resource:name',  // e.g., 'vendor:create'
      'create'          // Action being performed
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Process request
    const result = await processRequest(request);
    
    // 4. Audit log (optional but recommended)
    await logAuditEvent({
      user_id: claims.uid,
      action: 'vendor:create',
      resource_id: result.id,
      status: 'success',
      timestamp: new Date()
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### ✅ Phase 4: Implement Permission Caching
**File:** `src/lib/rbac/permission-cache.ts`

```typescript
/**
 * Cache permissions to avoid repeated Casbin checks
 * - TTL: 5 minutes
 * - Key: {userId}:{orgId}:{resource}:{action}
 */

import NodeCache from 'node-cache';

const permissionCache = new NodeCache({ stdTTL: 300 }); // 5 min TTL

export async function checkPermissionWithCache(
  userId: string,
  orgId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const cacheKey = `${userId}:${orgId}:${resource}:${action}`;
  
  // Check cache first
  const cached = permissionCache.get<boolean>(cacheKey);
  if (cached !== undefined) {
    console.log(`[RBAC-CACHE] HIT: ${cacheKey}`);
    return cached;
  }
  
  // Call Casbin if not cached
  const allowed = await checkCasbin(userId, orgId, resource, action);
  
  // Store in cache
  permissionCache.set(cacheKey, allowed);
  console.log(`[RBAC-CACHE] MISS: ${cacheKey} → ${allowed}`);
  
  return allowed;
}

export function invalidateUserCache(userId: string, orgId: string) {
  // Invalidate all permissions for a user
  const keys = permissionCache.keys();
  keys.forEach(key => {
    if (key.startsWith(`${userId}:${orgId}:`)) {
      permissionCache.del(key);
    }
  });
  console.log(`[RBAC-CACHE] Invalidated permissions for ${userId}`);
}

export function invalidateAllCache() {
  permissionCache.flushAll();
  console.log('[RBAC-CACHE] Flushed all permissions');
}
```

### ✅ Phase 5: Add Audit Logging
**File:** `src/lib/rbac/audit-log.ts`

```typescript
/**
 * Audit logging for all permission-related actions
 */

import { supabase } from '@/lib/supabase/client';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  org_id: string;
  action: string;         // e.g., 'permission:granted', 'role:assigned'
  resource_type: string;  // e.g., 'user', 'role', 'policy'
  resource_id: string;
  result: 'success' | 'denied' | 'error';
  details?: Record<string, any>;
  timestamp?: string;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString()
      });
    
    if (error) {
      console.error('[AUDIT] Log failed:', error);
    }
  } catch (error) {
    console.error('[AUDIT] Error:', error);
    // Don't throw - logging shouldn't break the request
  }
}

// Log role assignment
export async function logRoleAssignment(
  userId: string,
  orgId: string,
  roleId: string,
  result: 'success' | 'denied'
) {
  await logAudit({
    user_id: userId,
    org_id: orgId,
    action: 'role:assigned',
    resource_type: 'role',
    resource_id: roleId,
    result
  });
}

// Log permission grant
export async function logPermissionGrant(
  roleId: string,
  orgId: string,
  resource: string,
  action: string
) {
  await logAudit({
    user_id: 'system',  // Assigned by admin/system
    org_id: orgId,
    action: 'permission:granted',
    resource_type: 'policy',
    resource_id: `${resource}:${action}`,
    result: 'success'
  });
}
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Database Query Performance

#### 1. Ensure All Indexes Exist
```sql
-- RBAC/Permission Indexes
CREATE INDEX idx_casbin_rules_sub_domain 
  ON casbin_rule(p_sub, p_domain_id);
CREATE INDEX idx_casbin_rules_obj_act 
  ON casbin_rule(p_obj, p_act);
CREATE INDEX idx_user_roles_user_org 
  ON user_roles(user_id, org_id);
CREATE INDEX idx_role_permissions_role 
  ON role_permissions(role_id);

-- Data Indexes
CREATE INDEX idx_vendors_org_status 
  ON vendors(organization_id, status);
CREATE INDEX idx_products_org_sku 
  ON products(organization_id, sku);
CREATE INDEX idx_orders_org_date 
  ON orders(organization_id, created_at DESC);
CREATE INDEX idx_employees_org_dept 
  ON employees(organization_id, department);

-- User Indexes
CREATE INDEX idx_users_email 
  ON users(email);
CREATE INDEX idx_users_org 
  ON users(organization_id);
```

#### 2. Connection Pool Configuration
**File:** `src/lib/controlDataSource.ts`

```typescript
const dataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.CONTROL_DATABASE_URL,
  pool: {
    min: 2,           // Minimum connections
    max: 20,          // Maximum connections (adjust based on load)
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  logging: process.env.LOG_LEVEL === 'debug',
  maxQueryExecutionTime: 5000,  // Warn if query takes > 5s
};
```

#### 3. Query Optimization
**Pattern for list endpoints:**

```typescript
// ❌ BAD: N+1 problem
const orders = await supabase.from('orders').select('*');
for (const order of orders) {
  const customer = await supabase
    .from('customers')
    .select('*')
    .eq('id', order.customer_id)
    .single();
  order.customer = customer;
}
// This runs 1 + N queries!

// ✅ GOOD: Use joins
const { data: orders } = await supabase
  .from('orders')
  .select(`
    id, order_number, created_at, status,
    customer:customers(id, name, email),
    items:order_items(id, product_id, quantity, price)
  `)
  .eq('organization_id', orgId)
  .order('created_at', { ascending: false })
  .range(offset, offset + limit - 1);
// This runs 1 query!
```

#### 4. Response Pagination
**All list endpoints must paginate:**

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  
  const { data, count } = await supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);
  
  return NextResponse.json({
    data,
    pagination: {
      limit,
      offset,
      total: count
    }
  });
}
```

### Casbin Performance

#### 1. Lazy Initialize Enforcer
```typescript
// ✅ Good: Initialize once per org, cache it
const enforcerCache = new Map<string, Enforcer>();

export async function initCasbin(orgId: string): Promise<Enforcer> {
  if (enforcerCache.has(orgId)) {
    return enforcerCache.get(orgId)!;
  }
  
  // Initialize fresh enforcer
  const enforcer = new Enforcer(model, adapter);
  enforcerCache.set(orgId, enforcer);
  
  return enforcer;
}
```

#### 2. Batch Permission Checks
```typescript
// ✅ Good: Check multiple permissions at once
export async function checkPermissions(
  userId: string,
  orgId: string,
  permissions: Array<{ resource: string; action: string }>
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  
  for (const { resource, action } of permissions) {
    const allowed = await checkCasbin(userId, orgId, resource, action);
    results.set(`${resource}:${action}`, allowed);
  }
  
  return results;
}
```

#### 3. Monitor Casbin Performance
```typescript
// Add timing logs
export async function checkCasbin(
  userId: string,
  orgId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const start = Date.now();
  
  const enforcer = await initCasbin(orgId);
  const allowed = await enforcer.enforce(userId, orgId, resource, action);
  
  const duration = Date.now() - start;
  
  if (duration > 100) {
    console.warn(`[RBAC-PERF] Slow permission check: ${duration}ms`);
  }
  
  return allowed;
}
```

---

## 🧪 TESTING RBAC

### Unit Tests
**File:** `src/__tests__/rbac.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { checkCasbin, initCasbin } from '@/lib/rbac/casbin-enforcer';

const testOrgId = 'test-org';
const adminUserId = 'admin-user';
const regularUserId = 'regular-user';

describe('RBAC System', () => {
  beforeEach(async () => {
    // Reset enforcer for clean state
    const enforcer = await initCasbin(testOrgId);
    await enforcer.clearPolicy();
  });

  describe('Admin Permissions', () => {
    it('admin should have all permissions', async () => {
      const permissions = [
        { resource: 'vendor', action: 'view' },
        { resource: 'vendor', action: 'create' },
        { resource: 'vendor', action: 'edit' },
        { resource: 'vendor', action: 'delete' },
        { resource: 'user', action: 'manage' },
      ];

      for (const { resource, action } of permissions) {
        const allowed = await checkCasbin(
          adminUserId,
          testOrgId,
          resource,
          action
        );
        expect(allowed).toBe(true);
      }
    });
  });

  describe('Regular User Permissions', () => {
    it('user should only have view permission', async () => {
      // Assign user role that only allows view
      const enforcer = await initCasbin(testOrgId);
      await enforcer.addPolicy(regularUserId, testOrgId, 'vendor', 'view');

      expect(
        await checkCasbin(regularUserId, testOrgId, 'vendor', 'view')
      ).toBe(true);

      expect(
        await checkCasbin(regularUserId, testOrgId, 'vendor', 'create')
      ).toBe(false);
    });
  });

  describe('Role Inheritance', () => {
    it('should support role hierarchy', async () => {
      const enforcer = await initCasbin(testOrgId);
      
      // Manager role
      await enforcer.addPolicy('role:manager', testOrgId, 'vendor', 'view');
      await enforcer.addPolicy('role:manager', testOrgId, 'vendor', 'create');
      
      // User has manager role
      await enforcer.addGroupingPolicy(regularUserId, 'role:manager', testOrgId);
      
      // Should inherit manager permissions
      expect(
        await checkCasbin(regularUserId, testOrgId, 'vendor', 'view')
      ).toBe(true);
      
      expect(
        await checkCasbin(regularUserId, testOrgId, 'vendor', 'create')
      ).toBe(true);
    });
  });
});
```

### Integration Tests
**File:** `src/__tests__/rbac-integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { protectedApiHandler } from '@/lib/api-helpers';

describe('RBAC Integration', () => {
  it('should deny access to protected endpoint without permission', async () => {
    const request = createMockRequest({
      claims: { uid: 'user-123', orgId: 'org-456' },
      // User has no permissions
    });

    const response = await POST(request);
    
    expect(response.status).toBe(403);
  });

  it('should allow access with proper permission', async () => {
    const request = createMockRequest({
      claims: { uid: 'admin-123', orgId: 'org-456' },
      // Admin has all permissions
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
  });
});
```

---

## 🚨 MONITORING & ALERTS

### Performance Monitoring
**File:** `src/lib/rbac/monitoring.ts`

```typescript
interface RbacMetrics {
  checksPerSecond: number;
  averageCheckTime: number;
  cacheHitRate: number;
  deniedCount: number;
  errorCount: number;
}

export class RbacMonitor {
  private metrics = {
    totalChecks: 0,
    totalTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    denied: 0,
    errors: 0
  };

  recordCheck(duration: number, cacheHit: boolean, allowed: boolean, error?: boolean) {
    this.metrics.totalChecks++;
    this.metrics.totalTime += duration;
    
    if (cacheHit) this.metrics.cacheHits++;
    else this.metrics.cacheMisses++;
    
    if (!allowed) this.metrics.denied++;
    if (error) this.metrics.errors++;
    
    // Log if slow
    if (duration > 100) {
      console.warn(`[RBAC-SLOW] Permission check took ${duration}ms`);
    }
  }

  getMetrics(): RbacMetrics {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    return {
      checksPerSecond: this.metrics.totalChecks / (Date.now() / 1000),
      averageCheckTime: this.metrics.totalTime / this.metrics.totalChecks,
      cacheHitRate: totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0,
      deniedCount: this.metrics.denied,
      errorCount: this.metrics.errors
    };
  }
}

export const monitor = new RbacMonitor();
```

### Health Check Endpoint
**File:** `src/app/api/health/route.ts`

```typescript
export async function GET() {
  const rbacMetrics = monitor.getMetrics();
  
  return NextResponse.json({
    status: 'healthy',
    checks: {
      database: databaseHealthy,
      casbin: casbinHealthy,
      cache: cacheHealthy,
    },
    rbac: {
      checksPerSecond: rbacMetrics.checksPerSecond,
      averageCheckTime: `${rbacMetrics.averageCheckTime.toFixed(2)}ms`,
      cacheHitRate: `${(rbacMetrics.cacheHitRate * 100).toFixed(1)}%`,
    }
  });
}
```

---

## 🔍 TROUBLESHOOTING RBAC

### Issue: "Permission denied" for admin
**Cause:** Admin role not synced to Casbin  
**Solution:**
```bash
# Resync policies
npm run seed:casbin

# Check if admin policies exist
psql $DATABASE_URL -c "SELECT * FROM casbin_rule WHERE p_sub LIKE '%admin%';"
```

### Issue: Slow permission checks
**Cause:** Casbin enforcer not initialized properly  
**Solution:**
```typescript
// Clear enforcer cache to reinitialize
const keys = Array.from(enforcerCache.keys());
keys.forEach(key => enforcerCache.delete(key));

// Or restart the app
```

### Issue: Permission cache not invalidating
**Cause:** Cache not cleared on role change  
**Solution:**
```typescript
// When assigning a role, invalidate cache
await assignRoleToUser(userId, roleId);
invalidateUserCache(userId, orgId);  // ← Add this
```

---

## ✅ PRODUCTION READINESS CHECKLIST

- [ ] All API endpoints check permissions before processing
- [ ] No fallback to mock permissions
- [ ] Casbin initialized for all organizations
- [ ] Permission caching implemented
- [ ] Audit logging for all permission actions
- [ ] All indexes created on relevant tables
- [ ] Database connection pool configured
- [ ] Query N+1 problems resolved
- [ ] Monitoring/metrics in place
- [ ] Health check endpoint includes RBAC metrics
- [ ] Tests cover all permission scenarios
- [ ] Documentation updated for admins

---

**Status:** 🟢 Ready for Implementation  
**Last Updated:** November 11, 2025  
**Part of:** PRODUCTION_MIGRATION_GUIDE.md

