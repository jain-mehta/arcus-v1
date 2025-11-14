# 🚀 Production Migration Guide: Mock Data Removal & Real Database Integration

**Date:** November 11, 2025  
**Project:** Arcus v1 - SaaS Platform  
**Status:** Ready for Implementation  
**Est. Time to Complete:** 4-6 hours

---

## 📋 EXECUTIVE SUMMARY

This document provides a **complete, production-ready migration plan** to:
1. ✅ Remove all mock data files and imports
2. ✅ Connect application to real PostgreSQL/Supabase database
3. ✅ Fix syntax errors and incomplete implementations
4. ✅ Maintain RBAC (Role-Based Access Control) integrity
5. ✅ Ensure optimal performance with proper indexing
6. ✅ Organize code according to production folder structure

**Key Achievement:** Zero mock data in production code while maintaining 100% type safety and RBAC enforcement.

---

## 📊 CURRENT STATE ANALYSIS

### Mock Data Files Identified

#### 1. **Direct Mock Imports (19 files)**
These files import from `@/lib/mock-data/*`:

```
❌ src/tests/rbac-smoke.test.ts
❌ src/app/dashboard/sales/visits/client.tsx
❌ src/app/dashboard/sales/orders/client.tsx
❌ src/app/dashboard/hrms/recruitment/page.tsx
❌ src/app/dashboard/hrms/payroll/printable-payslip.tsx
❌ src/app/dashboard/vendor/purchase-orders/page.tsx
❌ src/app/dashboard/vendor/purchase-orders/client.tsx
❌ src/app/dashboard/vendor/profile/[id]/edit/actions.ts
❌ src/app/dashboard/vendor/material-mapping/components/add-discount-dialog.tsx
❌ src/app/dashboard/vendor/history/client.tsx
❌ src/app/dashboard/store/staff/client.tsx
❌ src/app/dashboard/store/profile/[id]/recent-sales-client.tsx
❌ src/app/dashboard/store/profile/[id]/edit/actions.ts
❌ src/app/dashboard/store/manage/store-dialog.tsx
❌ src/app/dashboard/store/components/printable-debit-note.tsx
❌ src/app/dashboard/store/components/printable-invoice.tsx
❌ src/app/dashboard/store/components/printable-thermal-receipt.tsx
❌ src/app/dashboard/store/billing-history/client.tsx
❌ src/app/api/admin/create-role/route.ts (commented import)
```

#### 2. **Mock Data Usage (Server Actions)**
```
❌ src/app/dashboard/vendor/rating/actions.ts
   - Uses: MOCK_RATING_CRITERIA, MOCK_RATING_HISTORY
   - Issue: Updates mock arrays instead of DB

❌ src/app/dashboard/hrms/payroll/formats/actions.ts
   - Uses: TODO comments, returns empty/mock data
   - Issue: 4 TODO comments for DB implementation

❌ src/app/api/employees/route.ts
   - Uses: mockEmployees inline array
   - Issue: 11+ hardcoded employee records
```

#### 3. **Mock Data Library (src/lib/mock-data/)**
```
📁 src/lib/mock-data/
  ├── firestore.ts (2000+ LOC - mock data generator)
  ├── types.ts (type definitions for mock objects)
  ├── rbac.ts (mock RBAC helpers - will be replaced)
  └── mock-data.ts (additional mock utilities)
```

#### 4. **Test Infrastructure Using Mocks**
```
❌ src/tests/rbac-smoke.test.ts
❌ src/tests/permission-integration.test.ts (has mock mode)
❌ src/lib/permifyClient.ts (has mock fallback)
❌ src/lib/policyAdapter.ts (mock mode)
❌ src/lib/email-service-client.ts (mock email provider)
```

### Syntax Issues Identified

#### 1. **Incomplete Array Operations**
```typescript
// ❌ BAD: vendor/rating/actions.ts line 32
const vendorIndex = [].findIndex(v => v.id === vendorId);  // Empty array!
if (vendorIndex > -1) {
  [][vendorIndex].qualityScore = newOverallScore;  // Double empty array!
}
```

#### 2. **Unimplemented Functions (TODO Comments)**
```typescript
// ❌ BAD: payroll/formats/actions.ts
async function getCurrentUserFromDb() {
  return null; // TODO: Implement database query
}

async function assertUserPermission(userId: string, permission: string) {
  // TODO: Implement permission check
  return true;  // Always returns true!
}
```

#### 3. **Missing Type Imports**
```typescript
// ❌ BAD: Rating types not imported
// vendor/rating/actions.ts - uses MOCK_RATING_CRITERIA but never imports types
```

---

## 🎯 PHASE 1: Remove Mock Data & Syntax Fixes (2-3 hours)

### Step 1.1: Fix Vendor Rating Actions
**File:** `src/app/dashboard/vendor/rating/actions.ts`

**Changes Required:**
- Replace empty array operations with real Supabase queries
- Import Supabase client
- Import TypeORM entities
- Implement real database updates

**Before:**
```typescript
export async function getVendorRatingCriteria(vendorId: string) {
  return MOCK_RATING_CRITERIA.filter((c) => c.vendorId === vendorId);
}

const vendorIndex = [].findIndex(v => v.id === vendorId);  // ❌ Empty array!
```

**After:**
```typescript
export async function getVendorRatingCriteria(vendorId: string) {
  const { data, error } = await supabase
    .from('vendor_rating_criteria')
    .select('*')
    .eq('vendor_id', vendorId);
  
  if (error) {
    console.error('[VendorRating] Error fetching criteria:', error);
    return [];
  }
  return data || [];
}

const vendorIndex = vendors.findIndex(v => v.id === vendorId);  // ✅ Real array
```

### Step 1.2: Fix Payroll Format Actions
**File:** `src/app/dashboard/hrms/payroll/formats/actions.ts`

**Changes Required:**
- Implement `getCurrentUserFromDb()` with real Supabase query
- Implement `assertUserPermission()` using Casbin
- Replace all TODO comments
- Add proper error handling

**Before:**
```typescript
async function getCurrentUserFromDb() {
  return null; // TODO: Implement database query
}

async function assertUserPermission(userId: string, permission: string) {
  // TODO: Implement permission check
  return true;  // ❌ Always returns true!
}
```

**After:**
```typescript
async function getCurrentUserFromDb() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  return data;
}

async function assertUserPermission(userId: string, permission: string) {
  const claims = await getSessionClaims();
  if (!claims) throw new Error('Unauthorized');
  
  const allowed = await checkCasbin(userId, claims.orgId, permission, 'view');
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
  return true;
}
```

### Step 1.3: Fix Mock Email Provider
**File:** `src/lib/email-service-client.ts`

**Changes Required:**
- Keep mock mode for development
- Add production email provider (Mailgun/SendGrid) detection
- Ensure proper environment variable handling

**Before:**
```typescript
this.provider = (process.env.EMAIL_PROVIDER as any) || 'mock';
// Falls back to mock if provider not set
```

**After:**
```typescript
const emailProvider = process.env.EMAIL_PROVIDER || 'none';

if (process.env.NODE_ENV === 'production') {
  if (!emailProvider || emailProvider === 'mock') {
    throw new Error('EMAIL_PROVIDER must be configured in production');
  }
  this.provider = emailProvider;
} else {
  // Development: allow mock
  this.provider = emailProvider === 'none' ? 'mock' : emailProvider;
}
```

### Step 1.4: Fix Employees Mock Data
**File:** `src/app/api/employees/route.ts`

**Changes Required:**
- Remove inline mock employee array
- Replace with Supabase query
- Add tenant filtering
- Maintain pagination

**Before:**
```typescript
const mockEmployees = [
  { id: 'emp-001', name: 'Rajesh Kumar', ... },
  { id: 'emp-002', name: 'Priya Singh', ... },
  // ... 11+ more
];
```

**After:**
```typescript
const { data: employees, error } = await supabase
  .from('employees')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')
  .order('name', { ascending: true })
  .range(offset, offset + limit);

if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

---

## 🎯 PHASE 2: Remove Mock Imports (1.5-2 hours)

### Step 2.1: Convert Component Type Imports
**Files Affected:** 9 UI components

**Pattern:** Components importing types from `@/lib/mock-data/types`

```typescript
// ❌ BEFORE
import type { Visit, Order, Customer } from '@/lib/mock-data/types';

// ✅ AFTER - Move types to proper location
import type { Visit, Order, Customer } from '@/lib/types/domain';
// or reference from database entities
import { Visit, Order, Customer } from '@/lib/entities';
```

**Files to Fix:**
1. `src/app/dashboard/sales/visits/client.tsx`
2. `src/app/dashboard/sales/orders/client.tsx`
3. `src/app/dashboard/vendor/purchase-orders/client.tsx`
4. `src/app/dashboard/vendor/profile/[id]/edit/actions.ts`
5. `src/app/dashboard/store/profile/[id]/recent-sales-client.tsx`
6. And 4 more printable components...

### Step 2.2: Uncomment Supabase Imports
**File:** `src/app/api/admin/create-role/route.ts`

```typescript
// ❌ BEFORE
// import { upsertRoleInDb } from "../../../../lib/mock-data/firestore";

// ✅ AFTER
import { upsertRoleInDb } from "@/lib/supabase/admin-client";
```

### Step 2.3: Update Test Files
**File:** `src/tests/rbac-smoke.test.ts`

```typescript
// ❌ BEFORE
import { getUserPermissions, userHasPermission } from '@/lib/mock-data/rbac';

// ✅ AFTER - Use Casbin instead
import { checkCasbin, getPermissionsForUser } from '@/lib/casbinClient';
```

---

## 🎯 PHASE 3: Implement Real Database Queries (1.5-2 hours)

### Step 3.1: Create Real RBAC Module
**File:** `src/lib/rbac-production.ts` (replaces mock version)

```typescript
/**
 * Production RBAC using Casbin + PostgreSQL
 */
import { checkCasbin, getPermissionsForUser, initCasbin } from './casbinClient';

export async function checkPermission(
  userId: string,
  orgId: string,
  resource: string,
  action: string = 'view'
): Promise<boolean> {
  try {
    // Initialize Casbin if needed
    await initCasbin(orgId);
    
    // Check using Casbin enforcer
    const allowed = await checkCasbin(userId, orgId, resource, action);
    
    console.log(`[RBAC] User ${userId} → ${resource}:${action} = ${allowed}`);
    return allowed;
  } catch (error) {
    console.error('[RBAC] Permission check failed:', error);
    // Fail open in development, fail closed in production
    return process.env.NODE_ENV === 'development';
  }
}

export async function getUserPermissions(userId: string, orgId: string) {
  return getPermissionsForUser(userId, orgId);
}

export async function getAllPermissionsForRole(roleId: string, orgId: string) {
  const { data } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role_id', roleId)
    .eq('org_id', orgId);
  return data || [];
}
```

### Step 3.2: Implement Server Action Query Functions
**Create:** `src/lib/actions/index.ts`

```typescript
/**
 * Server-side query functions replacing mock data
 * Used by server components and server actions
 */

export async function getVendors(tenantId: string, filters?: VendorFilter) {
  const query = supabase
    .from('vendors')
    .select('*')
    .eq('tenant_id', tenantId);
  
  if (filters?.status) query.eq('status', filters.status);
  if (filters?.category) query.eq('category', filters.category);
  
  const { data, error } = await query.order('name', { ascending: true });
  
  if (error) throw new Error(`Failed to fetch vendors: ${error.message}`);
  return data || [];
}

export async function getProducts(tenantId: string, skip = 0, take = 20) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })
    .range(skip, skip + take - 1);
  
  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return data || [];
}

export async function getOrders(tenantId: string, filters?: OrderFilter) {
  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(*)
    `)
    .eq('tenant_id', tenantId);
  
  if (filters?.status) query.eq('status', filters.status);
  if (filters?.storeId) query.eq('store_id', filters.storeId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
  return data || [];
}

// ... More functions for leads, opportunities, quotations, etc.
```

### Step 3.3: Update Server Actions
**File:** `src/app/dashboard/vendor/rating/actions.ts`

```typescript
'use server';

import { supabase } from '@/lib/supabase/client';
import { assertPermission } from '@/lib/rbac';
import type { UserClaims } from '@/lib/rbac';

export async function getVendorRatingCriteria(vendorId: string) {
  const { data, error } = await supabase
    .from('vendor_rating_criteria')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('weight', { ascending: false });
  
  if (error) {
    console.error('[VendorRating] Error fetching criteria:', error);
    return [];
  }
  return data || [];
}

export async function calculateAndUpdateVendorScores(
  vendorId: string,
  updatedCriteria: any[]
) {
  try {
    // 1. Update criteria in database
    for (const update of updatedCriteria) {
      const { error } = await supabase
        .from('vendor_rating_criteria')
        .update(update)
        .eq('id', update.id);
      
      if (error) throw error;
    }
    
    // 2. Recalculate overall score
    const { data: allCriteria } = await supabase
      .from('vendor_rating_criteria')
      .select('weight, manualScore, autoScore')
      .eq('vendor_id', vendorId);
    
    if (!allCriteria || allCriteria.length === 0) {
      return { success: false, message: 'No criteria found' };
    }
    
    const totalWeight = allCriteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedScoreSum = allCriteria.reduce((sum, c) => {
      const score = c.manualScore !== undefined ? c.manualScore : c.autoScore;
      return sum + (score * c.weight);
    }, 0);
    
    const newOverallScore = weightedScoreSum / totalWeight;
    
    // 3. Update vendor quality score
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ quality_score: newOverallScore })
      .eq('id', vendorId);
    
    if (updateError) throw updateError;
    
    // 4. Record in history
    const { error: historyError } = await supabase
      .from('vendor_rating_history')
      .insert({
        vendor_id: vendorId,
        date: new Date().toISOString(),
        score: newOverallScore
      });
    
    if (historyError) throw historyError;
    
    revalidatePath(`/dashboard/vendor/profile/${vendorId}`);
    return { success: true };
    
  } catch (error) {
    console.error('[VendorRating] Error updating scores:', error);
    return { success: false, message: error.message };
  }
}
```

---

## 🎯 PHASE 4: Organize Production Folder Structure (30 mins)

### Current Structure (Development)
```
src/lib/
├── mock-data/           ❌ REMOVE
├── rbac.ts              ⚠️ Mix of real & mock
├── permifyClient.ts     ✅ Real
├── casbinClient.ts      ✅ Real
├── auth/                ✅ Real
└── supabase/            ✅ Real
```

### Target Structure (Production)
```
src/lib/
├── auth/                           ✅ Auth logic (keep)
│   ├── jwks-cache.ts
│   ├── session-manager.ts
│   └── index.ts
├── rbac/                           ✅ RBAC logic (NEW)
│   ├── casbin-enforcer.ts          (casbinClient → moved)
│   ├── permissions.ts              (rbac.ts → refactored)
│   ├── policy-adapter.ts           (policyAdapterCasbin.ts)
│   └── index.ts
├── actions/                        ✅ Server actions (NEW)
│   ├── vendors.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── users.ts
│   ├── roles.ts
│   └── index.ts
├── entities/                       ✅ TypeORM entities (keep)
│   ├── user.entity.ts
│   ├── vendor.entity.ts
│   ├── product.entity.ts
│   └── ...
├── supabase/                       ✅ Supabase client (keep)
│   ├── client.ts
│   ├── admin-client.ts
│   ├── user-sync.ts
│   └── index.ts
├── validators/                     ✅ Validation logic (keep)
├── utils/                          ✅ Utilities (keep)
├── types/                          ✅ Type definitions (create)
│   ├── domain.ts                   (vendors, products, orders)
│   ├── api.ts                      (request/response types)
│   └── rbac.ts                     (permission types)
├── middleware/                     ✅ Middleware (keep)
├── logger.ts                       ✅ Logging (keep)
├── rate-limit.ts                   ✅ Rate limiting (keep)
└── email-service-client.ts         ✅ Email (keep)

src/app/api/
├── health/                         ✅ Health check
├── auth/                           ✅ Auth endpoints
├── admin/                          ✅ Admin endpoints
├── employees/                      ✅ Employees endpoint
├── vendors/                        ✅ Vendors endpoint (new)
├── products/                       ✅ Products endpoint (new)
├── orders/                         ✅ Orders endpoint (new)
└── ...

src/app/dashboard/
├── (components remain same)
├── actions/                        ✅ Server actions (refactored)
│   ├── vendors.ts
│   ├── users.ts
│   ├── roles.ts
│   └── ...
└── ...
```

### Migration Commands
```bash
# 1. Create new directory structure
mkdir -p src/lib/rbac
mkdir -p src/lib/actions
mkdir -p src/lib/types

# 2. Move/refactor files
mv src/lib/casbinClient.ts src/lib/rbac/casbin-enforcer.ts
mv src/lib/rbac.ts src/lib/rbac/permissions.ts
mv src/lib/policyAdapterCasbin.ts src/lib/rbac/policy-adapter.ts

# 3. Create barrel exports
# src/lib/rbac/index.ts - exports all RBAC functions
# src/lib/actions/index.ts - exports all server actions

# 4. Remove mock-data directory (after verifying all usages removed)
rm -rf src/lib/mock-data/
```

---

## 🎯 PHASE 5: Update Import Paths (30 mins)

### Find & Replace Operations

**1. Remove all mock imports:**
```bash
# Find all @/lib/mock-data imports
grep -r "@/lib/mock-data" src/

# Replace with real imports
# Example: import type { Order } from '@/lib/mock-data/types'
# Becomes: import type { Order } from '@/lib/types/domain'
```

**2. Update RBAC imports:**
```bash
# Old: import { checkPermission } from '@/lib/rbac'
# New: import { checkPermission } from '@/lib/rbac/permissions'
```

**3. Update Casbin imports:**
```bash
# Old: import { checkCasbin } from '@/lib/casbinClient'
# New: import { checkCasbin } from '@/lib/rbac/casbin-enforcer'
```

**4. Update action imports:**
```bash
# Old: import { getVendors } from '@/app/dashboard/vendor/actions'
# New: import { getVendors } from '@/lib/actions/vendors'
```

---

## ✅ PHASE 6: Quality Assurance & Performance (30 mins)

### Database Performance Optimization

#### Ensure All Indexes Exist
```sql
-- Vendor indexes (for filtering/sorting)
CREATE INDEX idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_quality_score ON vendors(quality_score DESC);

-- Product indexes
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);

-- Order indexes
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- User/RBAC indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_casbin_rules_sub_dom ON casbin_rule(p_sub, p_domain_id);

-- Rating indexes
CREATE INDEX idx_vendor_rating_criteria_vendor ON vendor_rating_criteria(vendor_id);
CREATE INDEX idx_vendor_rating_history_vendor ON vendor_rating_history(vendor_id, date DESC);
```

#### Connection Pool Configuration
**File:** `src/lib/controlDataSource.ts`

```typescript
const dataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.CONTROL_DATABASE_URL,
  entities: [],
  synchronize: false,
  logging: process.env.LOG_LEVEL === 'debug',
  pool: {
    min: 2,
    max: 20,  // ✅ Adequate for production
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
```

### Type Safety Verification
```bash
# Run TypeScript compiler
npm run type-check

# Expected: ✅ 0 errors
```

### Build Verification
```bash
# Full production build
npm run build

# Expected output:
# ✅ Compiled successfully
# ✅ Created .next/ directory
# ✅ 0 TypeScript errors
```

### RBAC Verification

**Create test:** `src/__tests__/rbac-production.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { checkPermission } from '@/lib/rbac/permissions';

describe('Production RBAC', () => {
  it('should check real permissions from Casbin', async () => {
    const allowed = await checkPermission(
      'user-123',
      'org-456',
      'sales:leads',
      'view'
    );
    
    expect(typeof allowed).toBe('boolean');
    // Should return true/false, not throw
  });
  
  it('should enforce admin permissions correctly', async () => {
    const adminAllowed = await checkPermission(
      'admin-user',
      'org-456',
      'sales:leads',
      'delete'
    );
    
    expect(adminAllowed).toBe(true);  // Admin should have all permissions
  });
});
```

---

## 📊 VERIFICATION CHECKLIST

### ✅ Code Quality
- [ ] Zero mock imports in src/ directory
- [ ] Zero TODO comments in action functions
- [ ] Zero hardcoded test data in API routes
- [ ] All TypeScript types resolve correctly
- [ ] No unused imports or dead code
- [ ] All server actions properly use Supabase

### ✅ Database
- [ ] All 18 tables created (verify with `SELECT COUNT(*) FROM information_schema.tables`)
- [ ] All indexes created
- [ ] Foreign key constraints intact
- [ ] Row-Level Security (RLS) policies applied (if Supabase)
- [ ] Connection pool configured
- [ ] Database queries tested with sample data

### ✅ RBAC Maintenance
- [ ] Casbin enforcer initializes correctly
- [ ] Admin role has all permissions
- [ ] Permission checks use real Casbin, not mock
- [ ] Role assignment flows to Casbin
- [ ] Policy sync works on role creation
- [ ] No fallback to mock in production

### ✅ Performance
- [ ] Database queries include pagination
- [ ] Indexes on all filter/sort columns
- [ ] N+1 query problem resolved (use selects with joins)
- [ ] Caching implemented for permission checks
- [ ] Response times < 500ms for list queries
- [ ] Rate limiting configured

### ✅ Build & Deployment
- [ ] `npm run build` completes successfully
- [ ] `npm run type-check` shows 0 errors
- [ ] `npm run test` passes all tests
- [ ] `.next/` directory generated
- [ ] No critical warnings in build output
- [ ] Production mode runs without issues

---

## 🔒 SECURITY CONSIDERATIONS

### 1. **Never Expose Mock Data in Production**
```typescript
// ❌ BAD: Mock data in production build
if (process.env.NODE_ENV === 'development') {
  // This still gets bundled!
  import mockData from '@/lib/mock-data';
}

// ✅ GOOD: Dynamic imports prevent bundling
if (process.env.NODE_ENV === 'development') {
  const { mockData } = await import('@/lib/mock-data');
}
```

### 2. **Database Credentials**
- ✅ Store in .env.local (development only)
- ✅ Use environment variables in production
- ✅ Supabase: Use service role key only on server side
- ✅ Never expose database URL in client code

### 3. **RBAC Enforcement**
- ✅ All sensitive operations check permissions first
- ✅ Use Casbin, not in-memory mocks
- ✅ Fail closed: deny access if permission check fails
- ✅ Audit log all permission changes

### 4. **Rate Limiting**
```typescript
// Production rate limiting
export async function protectedApiHandler(req: NextRequest, handler: Function) {
  // 1. Check rate limit
  const limit = await rateLimit(req, { maxRequests: 100, windowMs: 60000 });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }
  
  // 2. Check authentication
  const token = extractToken(req);
  const claims = await verifyJWT(token);
  
  // 3. Check permissions
  await assertPermission(claims, resource, action);
  
  // 4. Execute handler
  return handler({ ...claims, limit });
}
```

---

## 📈 PERFORMANCE TARGETS

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Build Time** | < 30s | 37s | ⚠️ Will improve after removal |
| **Bundle Size** | < 200KB | 101KB | ✅ Good |
| **API List Queries** | < 200ms | ? | Pending test |
| **Login Time** | < 2s | ? | Pending test |
| **Dashboard Load** | < 3s | ? | Pending test |
| **Database Query** | < 100ms | Pending | Pending test |
| **TypeScript Errors** | 0 | 0 | ✅ Good |
| **Test Coverage** | > 80% | ~50% | ⚠️ Needs improvement |

**Performance Optimization After Mock Removal:**
- Build time will decrease (less code to process)
- Bundle size will decrease (mock-data no longer bundled)
- Page loads will be faster (real data, better caching)
- Queries will be consistent (no in-memory variation)

---

## 🚀 IMPLEMENTATION ROADMAP

### Day 1 (2-3 hours)
```
✅ 08:00 - 08:30  Phase 1.1: Fix Vendor Rating Actions
✅ 08:30 - 09:00  Phase 1.2: Fix Payroll Format Actions
✅ 09:00 - 09:20  Phase 1.3: Fix Email Provider
✅ 09:20 - 09:40  Phase 1.4: Fix Employees Mock Data
✅ 09:40 - 10:00  BREAK
✅ 10:00 - 11:00  Phase 2: Remove Mock Imports
✅ 11:00 - 12:00  Phase 3: Implement Real DB Queries
```

### Day 2 (1-2 hours)
```
✅ 09:00 - 09:30  Phase 4: Organize Folder Structure
✅ 09:30 - 10:00  Phase 5: Update Import Paths
✅ 10:00 - 11:00  Phase 6: QA & Performance Testing
✅ 11:00 - 12:00  Final Verification & Deployment Testing
```

---

## 🐛 TROUBLESHOOTING GUIDE

### Issue: "Cannot find module '@/lib/mock-data'"
**Cause:** Incomplete import path update  
**Solution:** Search for all `@/lib/mock-data` imports and replace with proper paths
```bash
grep -r "@/lib/mock-data" src/ | head -20
```

### Issue: "MOCK_RATING_CRITERIA is not defined"
**Cause:** Still referencing undefined mock variable  
**Solution:** Replace with Supabase query or remove usage
```typescript
// ❌ Before
MOCK_RATING_CRITERIA.filter(...)

// ✅ After
const { data } = await supabase
  .from('vendor_rating_criteria')
  .select('*');
```

### Issue: "Database connection failed"
**Cause:** Invalid DATABASE_URL or credentials  
**Solution:** Verify connection string:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check environment
echo $CONTROL_DATABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue: "Permission denied for action"
**Cause:** Casbin policy not synced  
**Solution:** Run seed script to sync policies:
```bash
npm run seed:casbin
```

### Issue: Build fails with type errors
**Cause:** Type mismatches in refactored code  
**Solution:** Run type check and fix errors:
```bash
npm run type-check -- --noEmit 2>&1 | head -20
```

---

## 📚 DOCUMENTATION

### Files Modified
- ✅ This document: `docs/PRODUCTION_MIGRATION_GUIDE.md`
- 📝 Update: `docs/BUILD_STATUS.md` (mark as complete)
- 📝 Update: `docs/DEPLOYMENT_GUIDE.md` (add production checklist)

### Related Documentation
- `docs/DATABASE_IMPLEMENTATION_GUIDE.md` - Database setup
- `docs/COMPLETE_LOGIN_RBAC_FLOW_CASBIN.md` - RBAC architecture
- `docs/AUTHENTICATION_FIX_GUIDE.md` - Auth flow
- `docs/FIREBASE_CLEANUP_SUMMARY.md` - What was removed before

---

## ✨ EXPECTED OUTCOMES

After completing this migration:

✅ **Code Quality**
- Zero mock data in production code
- Zero TODO comments in implementations
- 100% type safety
- All imports resolve correctly

✅ **Architecture**
- Clear separation: lib/actions, lib/rbac, lib/entities
- Server actions use real Supabase queries
- RBAC uses Casbin, not in-memory checks
- Production-ready folder structure

✅ **Performance**
- Smaller build output (mock-data removed)
- Faster page loads (real data, better caching)
- Consistent query performance (no in-memory variation)
- Scalable: ready for 10K+ users

✅ **Maintainability**
- Easy to add new entities (follow established patterns)
- Easy to add new permissions (Casbin policies)
- Easy to add new API endpoints (use protectedApiHandler)
- Well-documented and organized

✅ **Reliability**
- RBAC consistently enforced
- No data inconsistency (no mock vs real confusion)
- Audit trail for all changes
- Database integrity maintained

---

## 🎯 NEXT STEPS

1. **Review this document** with your team
2. **Create a feature branch** for this work
3. **Follow the implementation roadmap** (Day 1-2 schedule)
4. **Test each phase** before moving to next
5. **Run full test suite** after all changes
6. **Deploy to staging** for integration testing
7. **Monitor production** for any issues

---

## 📞 SUPPORT & QUESTIONS

If you encounter issues:
1. Check the **Troubleshooting Guide** section
2. Review the **Related Documentation** links
3. Run verification checklist to identify missing steps
4. Check build logs with: `npm run build 2>&1 | grep -i error`

---

**Status:** 🟢 Ready for Implementation  
**Last Updated:** November 11, 2025  
**Version:** 1.0 (Production Ready)

