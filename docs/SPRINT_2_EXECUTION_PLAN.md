# Sprint 2 Execution Plan - Tenant Provisioning & Auth Migration

**Start Date:** October 27, 2024  
**Duration:** 2 weeks (70 hours)  
**Status:** 🚀 IN PROGRESS  

---

## 🎯 Sprint 2 Goals

1. ✅ **Tenant Provisioning** — Create per-tenant databases via Supabase Admin API
2. ✅ **Supabase Auth Integration** — JWT + Session management + Revocation
3. ✅ **Core Domain Entities** — Vendor, Product, Purchase Order, Sales Order
4. ✅ **Data Seeding** — Mock → PostgreSQL migration
5. ✅ **E2E Tests** — Tenant creation → Auth → Permission checks

---

## 📋 Task Breakdown (Priority Order)

### Phase 2.1: Tenant Provisioning (10 hours) — STARTING NOW

#### Task 2.1.1: Supabase Admin API Client
**Files:**
- `src/lib/supabase/admin-client.ts` — Initialize Admin Client
- `src/lib/supabase/tenant-provisioning.ts` — Tenant creation logic

**Deliverable:**
```typescript
async function createTenantDatabase(tenantId, tenantName) {
  // 1. Call Supabase Admin API
  // 2. Create new PostgreSQL database
  // 3. Store connection string in control-plane
  // 4. Run migrations
  // 5. Return database URL
}
```

#### Task 2.1.2: Tenant DataSource Factory
**File:** `src/lib/tenantDataSource.ts` (ENHANCE existing)

**Deliverable:**
```typescript
async function getTenantDataSource(tenantId: string) {
  // Get from control-plane metadata
  // Initialize TypeORM DataSource
  // Cache for 1 hour
  // Return ready-to-use DataSource
}
```

#### Task 2.1.3: Provision Tenant CLI Script
**File:** `scripts/provision-tenant.mjs`

**Usage:**
```bash
pnpm run provision:tenant --tenant-id="acme-corp" --region="us-east-1"
```

---

### Phase 2.2: Supabase Auth Integration (12 hours)

#### Task 2.2.1: JWKS Verification
**File:** `src/lib/auth/jwks-cache.ts`

**Deliverable:**
- Cache SUPABASE_JWKS_URL keys
- Verify RS256 signatures
- Auto-refresh every 1 hour

#### Task 2.2.2: Session & Revocation
**Files:**
- `src/lib/auth/session-manager.ts` — Issue + revoke sessions
- Update `src/app/api/auth/login/route.ts`
- Update `src/app/api/auth/logout/route.ts`

**Deliverable:**
- Issue JWT with `jti` claim
- Store jti in sessions table
- Revoke by deleting session row

#### Task 2.2.3: Update Middleware
**File:** `src/middleware.ts` (ENHANCE existing)

**Deliverable:**
- Extract JWT from cookies
- Verify signature via JWKS
- Check jti in sessions table
- Validate not expired/revoked

---

### Phase 2.3: Core Domain Entities (20 hours)

#### Task 2.3.1-2.3.7: Seven Entity Models
**Files:**
```
src/entities/domain/
  ├── vendor.entity.ts
  ├── product.entity.ts
  ├── purchase-order.entity.ts
  ├── purchase-order-item.entity.ts
  ├── sales-order.entity.ts
  ├── sales-order-item.entity.ts
  ├── inventory.entity.ts
  └── employee.entity.ts
```

**With:**
- Relationships (vendor → products, PO ↔ SOLines)
- Indexes on frequently queried columns
- Soft deletes where applicable
- Timestamps (created, updated)

---

### Phase 2.4: Data Migration & Seeding (8 hours)

#### Task 2.4.1: Mock → PostgreSQL
**Files:**
- `scripts/migrate-mocks-to-postgres.ts`
- `scripts/seed-tenant-demo.ts`

#### Task 2.4.2: Per-Tenant Seeding
**Deliverable:**
```bash
pnpm run seed:tenant --tenant-id="demo" --include-mock-data
```

---

### Phase 2.5: Integration Tests & E2E (8 hours)

#### Task 2.5.1: Auth Tests
- Login flow
- JWT generation
- Session revocation
- Permission checks

#### Task 2.5.2: E2E Playwright Tests
- Create tenant
- Register user
- Login
- Create vendor
- Permission-gated actions

---

## 📊 Effort Estimate

| Phase | Hours | Status |
|-------|-------|--------|
| 2.1 Tenant Provisioning | 10h | 🔜 STARTING |
| 2.2 Supabase Auth | 12h | ⏳ QUEUED |
| 2.3 Domain Entities | 20h | ⏳ QUEUED |
| 2.4 Data Migration | 8h | ⏳ QUEUED |
| 2.5 Tests + Docs | 8h | ⏳ QUEUED |
| **TOTAL** | **70h** | **🚀 IN PROGRESS** |

---

## 🏗️ Architecture for Sprint 2

```
Tenant Request
    │
    ▼
┌──────────────────────────────┐
│ Tenant Provisioning CLI      │
│ scripts/provision-tenant.mjs │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ Supabase Admin API Client    │
    │ src/lib/supabase/admin.ts    │
    └──────────────┬───────────────┘
                   │
                   ▼
            ┌─────────────────┐
            │ Create New DB   │
            │ on Supabase     │
            └────────┬────────┘
                     │
        ┌────────────┴─────────────┐
        ▼                          ▼
  Store URL in          Run Migrations
  control-plane         (TypeORM)
  tenant_metadata       
                     
        ┌────────────┬─────────────┐
        ▼            ▼             ▼
   Session       User Mapping   Seed Demo
   Table         Table          Data
```

---

## 🔐 Credentials Ready

✅ **Supabase:**
- SUPABASE_ANON_KEY ✓
- SUPABASE_SERVICE_ROLE_KEY ✓
- SUPABASE_JWKS_URL ✓
- DATABASE_URL ✓

✅ **Firebase:**
- API Keys ✓
- Service Account (SA JSON) ✓

✅ **Other:**
- Gemini API Key ✓
- MongoDB URI ✓

---

## ✅ Checklist for Sprint 2 Start

- [x] Environment variables loaded
- [x] Build passes (0 errors)
- [x] Control-plane database ready
- [x] Permission system deployed
- [x] Docker Compose ready
- [ ] Tenant provisioning script → START HERE
- [ ] Supabase Admin API integration
- [ ] Domain entities created
- [ ] Auth flow updated
- [ ] E2E tests written
- [ ] Sprint 2 complete

---

## 🚀 Next Action: Task 2.1.1

**Create Supabase Admin Client**

Start with: `src/lib/supabase/admin-client.ts`

This will:
1. Initialize Supabase Admin Client with SERVICE_ROLE_KEY
2. Implement `createTenantDatabase()` function
3. Handle errors gracefully
4. Log operations to policy_sync_logs

Ready to proceed? Confirm and I'll start coding!
