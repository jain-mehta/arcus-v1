# 🎯 IMPLEMENTATION START GUIDE

**Status:** Ready to Execute  
**Version:** Sprint 2.5 - API Integration Phase  
**Start Date:** October 26, 2025  

---

## ⚡ QUICK START: What Happens Now

This document breaks down exactly what needs to be built next, in order of execution.

---

## 🔴 BLOCKER STATUS

### Current Blockers (Must resolve first):
```
❌ Middleware: Not yet implementing JWT verification properly
   ↓ Blocks: All API routes
   ↓ Fix: Enhance middleware.ts with verifyJWT() + permify checks

❌ API Endpoints: Not yet created
   ↓ Blocks: Testing, frontend integration
   ↓ Fix: Create CRUD endpoints for all domain entities

❌ Permify Integration: Only scaffolded, not tested
   ↓ Blocks: Permission checks on endpoints
   ↓ Fix: Test permifyClient with real schema
```

---

## 📋 EXECUTION ORDER (STRICT)

### **STEP 1: Enhance Middleware** (4 hours) - START HERE ⭐

**Why First:** All subsequent API routes depend on working middleware

**File:** `middleware.ts`

**Current Code:**
```typescript
// ❌ Only checks for session cookie existence
const sessionCookie = req.cookies.get('__session');
if (!sessionCookie || !sessionCookie.value) {
  // redirect to login
}
```

**What to Add:**

1. **Extract JWT from Authorization header**
```typescript
// Check both Authorization header and cookies
const authHeader = req.headers.get('authorization');
const jwt = authHeader?.split(' ')[1] || req.cookies.get('auth-token')?.value;
```

2. **Verify JWT signature**
```typescript
import { verifyJWT, isSessionValid } from '@/lib/auth/jwks-cache';

try {
  const claims = await verifyJWT(jwt);
  // JWT is valid, extract user context
  const { sub: userId, app_metadata } = claims;
  const tenantId = app_metadata?.tenant_id;
  const jti = claims.jti;
} catch (error) {
  // JWT invalid, reject
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

3. **Check session validity (revocation check)**
```typescript
const isValid = await isSessionValid(jti);
if (!isValid) {
  return NextResponse.json({ error: 'Session revoked' }, { status: 401 });
}
```

4. **Set request context for API handlers**
```typescript
// Method A: Add to request headers (for server components)
const requestHeaders = new Headers(req.headers);
requestHeaders.set('x-user-id', userId);
requestHeaders.set('x-tenant-id', tenantId);
requestHeaders.set('x-jti', jti);

// Method B: Store in response (accessible in handlers)
const response = NextResponse.next();
response.headers.set('x-user-id', userId);
response.headers.set('x-tenant-id', tenantId);
```

**Implementation Checklist:**
- [ ] Extract JWT from Authorization header
- [ ] Call verifyJWT() for signature verification
- [ ] Call isSessionValid() for revocation check
- [ ] Extract user context (userId, tenantId, jti)
- [ ] Set context headers for API handlers
- [ ] Handle errors gracefully (401 responses)
- [ ] Test with valid JWT, invalid JWT, revoked JWT

**Time:** 4 hours  
**Complexity:** Medium (JWT handling, async in middleware)

---

### **STEP 2: Create Base API Handler Pattern** (2 hours)

**Why Next:** Establish consistent pattern for all endpoints

**Create File:** `src/lib/api-helpers.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { DataSource } from 'typeorm';
import { getTenantDataSource } from '@/lib/tenantDataSource';
import { checkPermission } from '@/lib/permifyClient';

/**
 * Protected API handler wrapper
 * Handles:
 * - User context extraction from headers
 * - Tenant DataSource initialization
 * - Permission checking
 * - Error handling
 */
export async function protectedApiHandler<T>(
  req: NextRequest,
  handler: (context: {
    userId: string;
    tenantId: string;
    jti: string;
    dataSource: DataSource;
    body?: any;
  }) => Promise<T>
) {
  try {
    // 1. Extract context from headers (set by middleware)
    const userId = req.headers.get('x-user-id');
    const tenantId = req.headers.get('x-tenant-id');
    const jti = req.headers.get('x-jti');

    if (!userId || !tenantId || !jti) {
      return NextResponse.json({ error: 'Missing context' }, { status: 400 });
    }

    // 2. Get tenant DataSource
    const dataSource = await getTenantDataSource(tenantId);

    // 3. Parse request body if POST/PUT/PATCH
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method)
      ? await req.json()
      : undefined;

    // 4. Call handler
    const result = await handler({
      userId,
      tenantId,
      jti,
      dataSource,
      body,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * Permission-checked handler
 * Adds permission check before executing handler
 */
export async function permissionCheckedHandler<T>(
  req: NextRequest,
  action: string, // e.g., 'vendor:create'
  handler: (context: any) => Promise<T>
) {
  return protectedApiHandler(req, async (context) => {
    // Check permission via Permify
    const allowed = await checkPermission(
      context.userId,
      action,
      `tenant:${context.tenantId}`,
      context.tenantId
    );

    if (!allowed) {
      throw new Error(`Permission denied: ${action}`);
    }

    return handler(context);
  });
}
```

**Time:** 2 hours  
**Files to Create:** 1 (`src/lib/api-helpers.ts`)

---

### **STEP 3: Create Vendor Endpoints** (4 hours)

**Why Here:** Vendor is simplest domain entity, good template for others

**Files to Create:**
```
src/app/api/vendors/
├── route.ts                  → GET (list) & POST (create)
└── [id]/
    └── route.ts             → GET, PUT (update), DELETE
```

**`src/app/api/vendors/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Vendor } from '@/entities/domain/vendor.entity';
import { permissionCheckedHandler } from '@/lib/api-helpers';

// GET /api/vendors - List all vendors for tenant
export async function GET(req: NextRequest) {
  return permissionCheckedHandler(
    req,
    'vendor:read',
    async ({ tenantId, dataSource }) => {
      const vendorRepo = dataSource.getRepository(Vendor);
      const vendors = await vendorRepo.find({
        where: { tenant_id: tenantId },
        order: { created_at: 'DESC' },
      });
      return { vendors, count: vendors.length };
    }
  );
}

// POST /api/vendors - Create new vendor
export async function POST(req: NextRequest) {
  return permissionCheckedHandler(
    req,
    'vendor:create',
    async ({ tenantId, userId, dataSource, body }) => {
      const vendorRepo = dataSource.getRepository(Vendor);
      
      const vendor = vendorRepo.create({
        tenant_id: tenantId,
        ...body,
        created_by: userId,
      });
      
      await vendorRepo.save(vendor);
      return { vendor, message: 'Vendor created' };
    }
  );
}
```

**`src/app/api/vendors/[id]/route.ts`:**
```typescript
// GET, PUT, DELETE by ID
// Follow same pattern
```

**Time:** 4 hours  
**Files to Create:** 2

---

### **STEP 4: Create Product Endpoints** (3 hours)

**Similar pattern to Vendor**

**Files to Create:**
```
src/app/api/products/
├── route.ts                  → GET & POST
└── [id]/
    └── route.ts             → GET, PUT, DELETE
```

**Time:** 3 hours

---

### **STEP 5: Create Purchase Order Endpoints** (4 hours)

**More complex - includes approval workflow**

**Files to Create:**
```
src/app/api/purchase-orders/
├── route.ts                  → GET & POST
└── [id]/
    ├── route.ts             → GET, PUT, DELETE
    ├── approve/
    │   └── route.ts         → POST (approve)
    └── receive-goods/
        └── route.ts         → POST (mark as received)
```

**Approvals workflow:**
```typescript
// POST /api/purchase-orders/{id}/approve
export async function POST(req: NextRequest) {
  return permissionCheckedHandler(
    req,
    'purchase_order:approve',
    async ({ tenantId, userId, dataSource }) => {
      const poRepo = dataSource.getRepository(PurchaseOrder);
      
      const po = await poRepo.findOne({
        where: { id, tenant_id: tenantId },
      });
      
      if (!po) throw new Error('PO not found');
      if (po.status !== 'draft') throw new Error('Cannot approve non-draft PO');
      
      po.status = 'confirmed';
      po.approved_by = userId;
      po.approved_at = new Date();
      
      await poRepo.save(po);
      return { po, message: 'PO approved' };
    }
  );
}
```

**Time:** 4 hours

---

### **STEP 6: Create Sales Order Endpoints** (4 hours)

**Similar to Purchase Orders**

**Files to Create:**
```
src/app/api/sales-orders/
├── route.ts
└── [id]/
    ├── route.ts
    ├── confirm/
    │   └── route.ts
    └── ship/
        └── route.ts
```

**Time:** 4 hours

---

### **STEP 7: Create Inventory Endpoints** (3 hours)

**Read-mostly with stock adjustment capability**

**Files to Create:**
```
src/app/api/inventory/
├── route.ts                  → GET (list stock levels)
└── [id]/
    ├── route.ts             → GET details
    ├── adjust/
    │   └── route.ts         → POST (adjust stock)
    └── history/
        └── route.ts         → GET (stock history)
```

**Time:** 3 hours

---

### **STEP 8: Create Employee Endpoints** (2 hours)

**User management with role assignment**

**Files to Create:**
```
src/app/api/employees/
├── route.ts
├── [id]/
│   ├── route.ts
│   └── roles/
│       └── route.ts         → PUT (assign roles)
└── me/
    └── route.ts             → GET (current user profile)
```

**Time:** 2 hours

---

## 📊 API ENDPOINTS MATRIX

Once complete, you'll have:

| Endpoint | Method | Auth | Permission | Status |
|----------|--------|------|------------|--------|
| `/api/vendors` | GET | ✅ | vendor:read | 🔜 |
| `/api/vendors` | POST | ✅ | vendor:create | 🔜 |
| `/api/vendors/{id}` | GET | ✅ | vendor:read | 🔜 |
| `/api/vendors/{id}` | PUT | ✅ | vendor:update | 🔜 |
| `/api/vendors/{id}` | DELETE | ✅ | vendor:delete | 🔜 |
| `/api/products` | GET | ✅ | product:read | 🔜 |
| `/api/products` | POST | ✅ | product:create | 🔜 |
| ... (same pattern for all entities) | ... | ✅ | ... | 🔜 |
| `/api/purchase-orders/{id}/approve` | POST | ✅ | purchase_order:approve | 🔜 |
| `/api/sales-orders/{id}/confirm` | POST | ✅ | sales_order:confirm | 🔜 |
| `/api/inventory/{id}/adjust` | POST | ✅ | inventory:adjust | 🔜 |
| `/api/employees/{id}/roles` | PUT | ✅ | employee:manage_roles | 🔜 |

---

## ⏱️ TOTAL EFFORT SUMMARY

| Task | Hours | Status |
|------|-------|--------|
| 1. Middleware JWT | 4 | 🔜 |
| 2. API Helpers | 2 | 🔜 |
| 3. Vendor Endpoints | 4 | 🔜 |
| 4. Product Endpoints | 3 | 🔜 |
| 5. PO Endpoints | 4 | 🔜 |
| 6. SO Endpoints | 4 | 🔜 |
| 7. Inventory Endpoints | 3 | 🔜 |
| 8. Employee Endpoints | 2 | 🔜 |
| **TOTAL** | **~26 hours** | 🔜 |

**Timeline:** 6-7 days with 4 hours/day  

---

## 🚀 START COMMAND

```bash
# When ready, I'll implement:
pnpm run build  # Ensure no errors
pnpm run lint   # Pass linting

# Then start with Middleware...
```

---

## ✅ HOW TO VERIFY COMPLETION

### After Middleware (Step 1):
```bash
# Should NOT have any errors
pnpm run typecheck

# Middleware should load
curl -v http://localhost:3000/dashboard
```

### After Each API Endpoint:
```bash
# Test with curl
curl -H "Authorization: Bearer {JWT}" \
  http://localhost:3000/api/vendors

# Should return:
# { "vendors": [...], "count": N }
```

### After All Endpoints:
```bash
# Run integration tests
pnpm run test  # Should all pass

# Run E2E
pnpm run test:e2e
```

---

## 🎯 YOUR DECISION POINT

**Are you ready for me to proceed with Step 1 (Middleware)?**

If YES:
1. Confirm you want me to start implementing
2. I'll create all files step-by-step
3. You can review and approve each step
4. We'll iterate until production-ready

If you have questions:
1. Ask about any specific task
2. Clarify architecture decisions
3. Discuss timeline or scope changes
4. Identify any blocking issues

---

**I'm standing by, ready to execute! 🚀**

