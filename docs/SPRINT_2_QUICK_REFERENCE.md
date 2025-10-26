# Sprint 2 Quick Reference Guide

## New Modules & APIs

### 1. JWKS Cache & JWT Verification

**File:** `src/lib/auth/jwks-cache.ts`

```typescript
import { verifyJWT, isJWTExpired, decodeJWTUnsafe } from '@/lib/auth/jwks-cache';

// Verify JWT signature (full pipeline)
try {
  const claims = await verifyJWT(authToken);
  console.log('User:', claims.sub);
  console.log('Tenant:', claims.app_metadata?.tenant_id);
} catch (error) {
  console.error('Invalid token:', error.message);
}

// Check if JWT is expired
const expired = isJWTExpired(claims);

// Decode without verification (unsafe - debugging only)
const payload = decodeJWTUnsafe(authToken);
```

### 2. Session Management

**File:** `src/lib/auth/session-manager.ts`

```typescript
import {
  createSession,
  revokeSession,
  isSessionValid,
  getSession,
  revokeAllUserSessions,
  getUserActiveSessions,
  cleanupExpiredSessions,
} from '@/lib/auth/session-manager';

// Create session when user logs in
const session = await createSession(userId, tenantId, {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
});
console.log('New session:', session.jti); // Use as session ID

// Check if session is still valid
const isValid = await isSessionValid(jti);

// Get session details
const sessionDetails = await getSession(jti);

// Logout user (revoke single session)
await revokeSession(jti);

// Logout all user sessions (multi-device logout)
await revokeAllUserSessions(userId);

// Get user's active sessions
const sessions = await getUserActiveSessions(userId);
sessions.forEach(s => console.log(`Device: ${s.ip_address}, Expires: ${s.expires_at}`));

// Cleanup (run periodically, e.g., nightly cron)
await cleanupExpiredSessions();
```

### 3. Tenant Provisioning

**File:** `src/lib/supabase/admin-client.ts`

```typescript
import {
  createTenantDatabase,
  listTenantDatabases,
  deleteTenantDatabase,
  healthCheck,
} from '@/lib/supabase/admin-client';

// Create new tenant database
const tenantDb = await createTenantDatabase('acme-corp', 'ACME-001');
console.log('Database URL:', tenantDb.databaseUrl);

// List all tenant databases
const allTenants = await listTenantDatabases();

// Delete tenant database
await deleteTenantDatabase('acme-corp');

// Health check
const health = await healthCheck();
console.log('Supabase Status:', health); // true or error
```

### 4. Tenant Provisioning CLI

**Command:** `pnpm run provision:tenant --tenant-id="acme" --tenant-name="Acme Corp"`

```bash
# Provision new tenant
pnpm run provision:tenant --tenant-id="acme" --tenant-name="Acme Corp"

# Output:
# 🔄 Provisioning tenant: acme
# ✅ Database created: acme_prod_db
# 📊 Tenant registered in control-plane
# 🔗 Connection: postgresql://postgres:****@db.supabase.co:5432/acme_prod_db
#
# Next steps:
#   1. pnpm run migrate:domain -- --tenant-id="acme"
#   2. pnpm run migrate:domain -- --tenant-id="acme" --seed
```

### 5. Domain Table Migrations

**Command:** `pnpm run migrate:domain -- --tenant-id="acme" [--seed]`

```bash
# Apply migrations to tenant database
pnpm run migrate:domain -- --tenant-id="acme"

# Apply migrations + seed sample data
pnpm run migrate:domain -- --tenant-id="acme" --seed
```

---

## Domain Entities Reference

### Vendor (Supplier Management)

```typescript
interface Vendor {
  id: UUID;
  tenant_id: UUID;
  name: string;
  vendor_code?: string; // VS001
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  tax_id?: string; // GST ID
  bank_details?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
    upiId?: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  rating?: number; // 0-5
  total_orders?: number;
  total_spent?: number;
}
```

### Product (SKU Catalog)

```typescript
interface Product {
  id: UUID;
  tenant_id: UUID;
  sku: string; // UNIQUE
  name: string;
  category?: string;
  sub_category?: string;
  unit?: string; // pieces, kg, etc.
  unit_price: number;
  selling_price?: number;
  tax_rate?: number;
  hsn_code?: string; // India
  barcode?: string;
  reorder_level?: number;
  status: 'active' | 'discontinued' | 'draft';
  attributes?: Record<string, any>; // JSON
}
```

### Purchase Order (PO)

```typescript
interface PurchaseOrder {
  id: UUID;
  tenant_id: UUID;
  po_number: string; // UNIQUE - PO-2024-001
  vendor_id: UUID;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';
  po_date: Date;
  expected_delivery_date?: Date;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  line_items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  approved_by?: string;
  approved_at?: Date;
}
```

### Sales Order (SO)

```typescript
interface SalesOrder {
  id: UUID;
  tenant_id: UUID;
  so_number: string; // UNIQUE - SO-2024-001
  customer_id: UUID;
  status: 'draft' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  so_date: Date;
  expected_delivery_date?: Date;
  shipment_mode?: string; // Ground, Air, Express
  tracking_number?: string;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  line_items?: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}
```

### Inventory

```typescript
interface Inventory {
  id: UUID;
  tenant_id: UUID;
  product_id: UUID;
  warehouse_location: string; // Main Warehouse, Branch A
  quantity_on_hand: number;
  quantity_reserved?: number;
  quantity_in_transit?: number;
  quantity_damaged?: number;
  avg_cost_per_unit?: number;
  valuation: number; // qty * cost
  last_received_date?: Date;
  last_issued_date?: Date;
}
```

### Employee

```typescript
interface Employee {
  id: UUID;
  tenant_id: UUID;
  auth_user_id: UUID; // Links to Supabase Auth
  employee_code: string; // EMP001
  first_name: string;
  last_name?: string;
  email: string;
  department?: string; // Sales, Procurement, Warehouse
  designation?: string; // Manager, Associate
  role: string; // employee, manager, admin
  roles?: string[]; // Multi-role
  permissions?: string[]; // Direct assignment
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  metadata?: {
    lastLogin?: Date;
    loginCount?: number;
  };
}
```

---

## Architecture Flow

### User Login Flow

```
1. User inputs credentials
2. Supabase Auth validates
3. JWT issued with RS256 signature + jti + app_metadata
4. Frontend stores JWT (localStorage/sessionStorage)
5. Browser sends JWT in Authorization header
6. Next.js middleware intercepts request
7. Middleware verifies JWT signature (JWKS cache)
8. Middleware checks session validity (jti in control-plane)
9. Middleware sets user context (res.locals or cookies)
10. API route executes with tenant context
11. Database queries filtered by tenant_id (RLS)
12. Response sent to client
```

### Multi-Tenant Data Isolation

```
┌─ Control Plane (Master DB) ─────────────────┐
│  ├─ Sessions (all tenants)                  │
│  ├─ User Mappings (auth_user_id → tenant)  │
│  └─ Tenant Metadata                         │
└──────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Tenant 1 │ │Tenant 2 │ │Tenant N │
   │  DB     │ │  DB     │ │  DB     │
   ├─ vendors│ │vendors  │ │vendors  │
   ├─products│ │products │ │products │
   └─────────┘ └─────────┘ └─────────┘
```

### Session Revocation

```
1. User clicks "Logout"
2. Frontend calls /api/auth/logout
3. API calls revokeSession(jti)
4. Session marked as revoked in control-plane
5. All existing JWTs with that jti rejected
6. (Optional) JWT not valid until expiry anyway
7. New login issues new jti
```

---

## Configuration

### Environment Variables (Needed for Sprint 2)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://asuxcwlbzspsifvigmov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWKS_URL=https://asuxcwlbzspsifvigmov.supabase.co/.well-known/jwks.json

# Control Plane Database
DATABASE_URL=postgresql://postgres:...@db.supabase.co:5432/postgres

# Optional: Per-Tenant DB Connection Pooling
TENANT_DB_POOL_SIZE=10
TENANT_DB_IDLE_TIMEOUT=30000
```

---

## TypeORM Data Source Setup (For Per-Tenant Queries)

```typescript
// src/lib/tenantDataSource.ts
import { DataSource } from 'typeorm';
import { Vendor } from '@/entities/domain/vendor.entity';
import { Product } from '@/entities/domain/product.entity';
// ... etc

export async function getTenantDataSource(tenantId: string) {
  const connectionString = process.env[`TENANT_${tenantId}_DATABASE_URL`];
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: connectionString,
    entities: [Vendor, Product, PurchaseOrder, SalesOrder, Inventory, Employee],
    synchronize: false, // Use migrations
  });

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}

// Usage in API route:
const tenantDS = await getTenantDataSource(userTenantId);
const vendors = await tenantDS.getRepository(Vendor).find();
```

---

## SQL Queries Reference

### Check Session Validity

```sql
-- Check if user session is still valid
SELECT * FROM sessions 
WHERE jti = 'abc123....' 
  AND revoked = false 
  AND expires_at > NOW();
```

### List Active Sessions

```sql
-- Get all active sessions for user
SELECT jti, tenant_id, ip_address, created_at, expires_at
FROM sessions
WHERE user_id = 'user-uuid'
  AND revoked = false
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

### Inventory Status

```sql
-- Check low stock items
SELECT p.name, i.quantity_on_hand, i.reorder_level
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.tenant_id = 'tenant-uuid'
  AND i.quantity_on_hand <= i.reorder_level;
```

### Outstanding Orders

```sql
-- Unpaid purchase orders
SELECT po_number, vendor_id, total_amount, po_date
FROM purchase_orders
WHERE tenant_id = 'tenant-uuid'
  AND payment_status IN ('pending', 'partial')
  AND status != 'cancelled'
ORDER BY po_date ASC;
```

---

## Common Tasks

### Task: Logout All Devices

```typescript
// In API route: POST /api/auth/logout-all

import { revokeAllUserSessions } from '@/lib/auth/session-manager';

export async function POST(req: Request) {
  const { userId } = await req.json();
  
  await revokeAllUserSessions(userId);
  
  return Response.json({ success: true, message: 'All sessions revoked' });
}
```

### Task: Emergency Tenant Lockdown

```typescript
// In admin API: POST /api/admin/tenant/{id}/lockdown

import { revokeAllTenantSessions } from '@/lib/auth/session-manager';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await revokeAllTenantSessions(params.id);
  
  return Response.json({ 
    success: true, 
    message: `All sessions for tenant ${params.id} revoked` 
  });
}
```

### Task: Verify Tenant Database

```bash
# Connect to tenant-specific database
psql postgresql://postgres:****@db.supabase.co:5432/acme_prod_db

# Check tables created
\dt

# Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

# Sample query
SELECT COUNT(*) FROM vendors WHERE tenant_id = 'acme-uuid';
```

---

## Troubleshooting

### "Session not found"
- Check JTI is correct
- Verify session didn't expire (check expires_at)
- Confirm user is accessing correct tenant

### "JWT verification failed"
- Ensure SUPABASE_JWKS_URL is correct
- Check JWKS cache isn't stale (manual invalidate if needed)
- Verify issuer matches token

### "RLS policy prevents insert"
- Confirm app.current_tenant_id is set in middleware
- Check user's tenant_id matches request tenant_id
- Verify table has RLS enabled

### "Cannot find tenant database"
- Run `pnpm run provision:tenant` for missing tenant
- Check tenant_id format (should be UUID or slug)
- Verify database URL in environment

---

## Security Checklist

- [ ] JWT tokens only in Authorization header (not query params)
- [ ] HTTPS enforced in production
- [ ] JWKS caching TTL set to < 1 hour
- [ ] Session cleanup job runs daily
- [ ] Revoked sessions checked on every request
- [ ] Tenant_id validated from JWT claims (not user input)
- [ ] RLS policies tested for data leakage
- [ ] Rate limiting on /login endpoint
- [ ] Audit log for all permission checks
- [ ] PII fields encrypted at rest (production)

---

**Last Updated:** 2024-10-28  
**Version:** Sprint 2 - Auth & Tenant Infrastructure  
**Status:** ✅ Ready for Integration Testing

