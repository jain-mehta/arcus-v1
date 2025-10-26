# 🚀 COMPLETE DEVELOPMENT EXECUTION ROADMAP

**Current Date:** October 26, 2025  
**Project:** Arcus v1 - Multi-Tenant SaaS Platform  
**Architecture:** Per-tenant DB + Supabase Auth + Permify Policy Engine  
**Status:** 🟡 **65% COMPLETE** (Core infrastructure done, Integration & UI remaining)

---

## 📊 COMPLETION STATUS BY COMPONENT

| Component | Status | Progress | Priority |
|-----------|--------|----------|----------|
| **Control-Plane Infrastructure** | 🟢 DONE | 100% | ✅ |
| **Domain Entities** | 🟢 DONE | 100% | ✅ |
| **Auth Layer (JWKS + Sessions)** | 🟢 DONE | 100% | ✅ |
| **Tenant Provisioning** | 🟢 DONE | 100% | ✅ |
| **Middleware (JWT Verification)** | 🟡 PARTIAL | 40% | 🔥 HIGH |
| **Policy Engine (Permify)** | 🟡 PARTIAL | 30% | 🔥 HIGH |
| **API Endpoints** | 🟡 PARTIAL | 25% | 🔥 HIGH |
| **Data Seeding & Migration** | 🔴 TODO | 0% | ⚠️ MEDIUM |
| **Testing (Unit/Integration/E2E)** | 🔴 TODO | 0% | ⚠️ MEDIUM |
| **CI/CD & GitHub Actions** | 🔴 TODO | 0% | ⚠️ MEDIUM |
| **Documentation** | 🟡 PARTIAL | 50% | ⚠️ MEDIUM |
| **Integrations (PostHog, Sentry, etc)** | 🔴 TODO | 0% | 📋 LOW |
| **Infrastructure (Terraform)** | 🔴 TODO | 0% | 📋 LOW |

---

## ✅ WHAT'S ALREADY COMPLETE

### 1. **Control-Plane Database Infrastructure** ✅
- **Status:** 100% DONE
- **Files:** 
  - ✅ `src/entities/control/session.entity.ts` - Session tracking
  - ✅ `src/entities/control/user_mapping.entity.ts` - Auth user → tenant mapping
  - ✅ `src/entities/control/tenant_metadata.entity.ts` - Tenant provisioning info
  - ✅ `src/lib/controlDataSource.ts` - TypeORM connection factory
  - ✅ `migrations/control/20251013_create_control_tables.sql` - DDL

### 2. **Domain Entities** ✅
- **Status:** 100% DONE
- **Files:**
  - ✅ `src/entities/domain/vendor.entity.ts` (70 LOC)
  - ✅ `src/entities/domain/product.entity.ts` (75 LOC)
  - ✅ `src/entities/domain/purchase-order.entity.ts` (90 LOC)
  - ✅ `src/entities/domain/sales-order.entity.ts` (85 LOC)
  - ✅ `src/entities/domain/inventory.entity.ts` (70 LOC)
  - ✅ `src/entities/domain/employee.entity.ts` (100 LOC)

### 3. **Auth Layer** ✅
- **Status:** 100% DONE
- **Files:**
  - ✅ `src/lib/auth/jwks-cache.ts` - JWKS verification (160 LOC)
  - ✅ `src/lib/auth/session-manager.ts` - Session management (250 LOC)

### 4. **Tenant Provisioning** ✅
- **Status:** 100% DONE
- **Files:**
  - ✅ `src/lib/supabase/admin-client.ts` - Admin API client (160 LOC)
  - ✅ `scripts/provision-tenant.mjs` - Provisioning CLI (130 LOC)

### 5. **Infrastructure** ✅
- **Status:** 90% DONE
- **Files:**
  - ✅ `docker-compose.dev.yml` - Local dev stack (PostgreSQL, Redis, MinIO)
  - ✅ `Dockerfile` - Multi-stage Next.js build
  - ✅ `package.json` - All dependencies installed
  - 🟡 `.env.template` - Exists but needs updates
  - 🟡 `docker-compose.prod.yml` - Not yet created

### 6. **Documentation** 🟡
- **Status:** 50% DONE
- **Files:**
  - ✅ `docs/SPRINT_2_SESSION_SUMMARY.md` - Comprehensive overview
  - ✅ `docs/SPRINT_2_QUICK_REFERENCE.md` - Code examples
  - ✅ `docs/SPRINT_2_PROGRESS.md` - Detailed technical progress
  - 🟡 `docs/SPRINT_2_INDEX.md` - Navigation guide
  - 🟡 Missing: `docs/DEVELOPERS_GUIDE.md`, `docs/MIGRATION_RUNBOOK.md`, `docs/DOCKER_SETUP.md`

---

## 🔥 HIGH PRIORITY WORK (DO NEXT - 4-5 days)

### TASK 1: Enhance Middleware with JWT Verification (4-6 hours)

**Current State:** Cookie-based session check  
**Required State:** JWT RS256 verification + JTI revocation check + Permify policy call

**File:** `middleware.ts`

**What to add:**
```typescript
import { verifyJWT, isSessionValid } from '@/lib/auth/jwks-cache';
import { getPolicy } from '@/lib/permifyClient';

// 1. Extract JWT from Authorization header
// 2. Verify RS256 signature (JWKS cache)
// 3. Check jti in control-plane DB (revocation)
// 4. Extract tenant_id from claims
// 5. Call Permify for resource check (optional)
// 6. Set request context for API handlers
```

**Estimated Effort:** 4 hours  
**Dependencies:** ✅ Already complete (JWKS cache, session-manager, permifyClient)

---

### TASK 2: Create Core API Endpoints (8-10 hours)

**Files to create/enhance:**

**A. Tenant Management APIs** (`src/app/api/tenants/`)
```
route.ts         → GET /api/tenants (list)
[id]/route.ts    → GET/PUT/DELETE /api/tenants/{id}
[id]/sync.ts     → POST /api/tenants/{id}/sync-policies
```

**B. Vendor APIs** (`src/app/api/vendors/`)
```
route.ts              → GET/POST /api/vendors
[id]/route.ts        → GET/PUT/DELETE /api/vendors/{id}
[id]/orders.ts       → GET /api/vendors/{id}/orders
```

**C. Product APIs** (`src/app/api/products/`)
```
route.ts              → GET/POST /api/products
[id]/route.ts        → GET/PUT/DELETE /api/products/{id}
[id]/inventory.ts    → GET /api/products/{id}/inventory
```

**D. Purchase Order APIs** (`src/app/api/purchase-orders/`)
```
route.ts                  → GET/POST /api/purchase-orders
[id]/route.ts            → GET/PUT/DELETE /api/purchase-orders/{id}
[id]/approve.ts          → POST /api/purchase-orders/{id}/approve
[id]/receive-goods.ts    → POST /api/purchase-orders/{id}/receive-goods
```

**E. Sales Order APIs** (`src/app/api/sales-orders/`)
```
route.ts                  → GET/POST /api/sales-orders
[id]/route.ts            → GET/PUT/DELETE /api/sales-orders/{id}
[id]/confirm.ts          → POST /api/sales-orders/{id}/confirm
[id]/ship.ts             → POST /api/sales-orders/{id}/ship
```

**Pattern for each:**
```typescript
// 1. Extract JWT from request
// 2. Verify JWT & get tenant context
// 3. Get tenant DataSource
// 4. Check permissions via Permify
// 5. Execute database query
// 6. Return 200 or 403/401
```

**Estimated Effort:** 8 hours  
**Dependencies:** ✅ Middleware (Task 1), Permify client, domain entities

---

### TASK 3: Enhance Permify Integration (6-8 hours)

**Current State:** Policy adapter & client exist but not fully tested  
**Required State:** Full schema sync, policy checks on API calls

**Files to enhance:**
- `src/lib/permifyClient.ts` - Policy checking
- `src/lib/policyAdapter.ts` - Schema translation
- `scripts/sync-policies.mjs` - Policy sync CLI

**What to add:**
```typescript
// 1. Enhance permifyClient:
export async function checkPermission(
  userId: string,
  action: string,
  resource: string,
  tenantId: string
): Promise<boolean> {
  // Call Permify API
  // Return true/false
}

// 2. Add permission decorators for API routes:
@RequirePermission('inventory:view')
export async function GET(req) { }

// 3. Enhance policy sync:
export async function syncPolicies(tenantId: string) {
  // Fetch schema from src/policy/schema.yaml
  // Push to Permify
  // Log audit trail
}
```

**Estimated Effort:** 6 hours  
**Dependencies:** ✅ permifyClient.ts already exists

---

## ⚠️ MEDIUM PRIORITY WORK (5-8 days)

### TASK 4: Data Migration & Seeding (6-8 hours)

**Files to create:**
```
scripts/seed/
├── control-plane.seed.ts    → Seed control-plane with roles
├── domain.seed.ts           → Seed domain entities
├── tenants/
│   ├── demo.seed.ts        → Demo tenant fixture
│   ├── production.seed.ts   → Prod tenant template
│   └── test.seed.ts        → Test tenant fixture
```

**What each does:**
```typescript
// control-plane.seed.ts
- Create default roles: admin, manager, user
- Create default permissions
- Create test users

// domain.seed.ts
- Create sample vendors
- Create sample products
- Create sample POs/SOs
- Create sample employees

// tenant.seed.ts
- Link test data to specific tenant
- Set up company details
- Create hierarchies
```

**Commands:**
```bash
pnpm run seed:control-plane
pnpm run seed:domain --tenant="demo"
pnpm run seed:fixtures --env="test"
```

**Estimated Effort:** 6 hours  
**Dependencies:** ✅ Domain entities, controlDataSource

---

### TASK 5: Unit & Integration Tests (8-10 hours)

**Files to create:**
```
src/__tests__/
├── middleware.test.ts           → JWT verification
├── auth/
│   ├── jwks-cache.test.ts       → JWKS verification
│   └── session-manager.test.ts  → Session revocation
├── auth-middleware.test.ts      → Full auth flow
├── lib/
│   ├── permifyClient.test.ts    → Policy checking
│   └── tenantDataSource.test.ts → Tenant DB access
└── api/
    ├── vendors.test.ts
    ├── products.test.ts
    └── purchase-orders.test.ts
```

**Test Coverage:**
- ✅ Middleware: Valid JWT, invalid JWT, revoked JWT, expired JWT
- ✅ Auth layer: JWKS cache, signature verification, session validity
- ✅ API routes: CRUD operations, permission checks, tenant isolation
- ✅ Database: Correct table access, RLS enforcement

**Estimated Effort:** 8 hours  
**Dependencies:** ✅ All previous tasks

---

### TASK 6: E2E Tests (Playwright) (6-8 hours)

**Files to create:**
```
e2e/
├── auth.spec.ts          → Login, logout, session management
├── tenant-crud.spec.ts   → Create/read/update/delete tenant
├── vendor.spec.ts        → Vendor CRUD operations
├── product.spec.ts       → Product CRUD operations
├── purchase-order.spec.ts → Full PO workflow
└── multi-tenant.spec.ts  → Data isolation between tenants
```

**What each tests:**
```typescript
// auth.spec.ts
- User login creates JWT
- JWT stored in localStorage/cookies
- API calls include JWT
- Logout revokes session
- Old JWT rejected

// vendor.spec.ts
- Create vendor form works
- List vendors shows only current tenant's
- Edit vendor updates correctly
- Delete vendor soft-deletes
- Search/filter works

// purchase-order.spec.ts
- Create PO form works
- Approval workflow functions
- Goods receipt updates inventory
- Invoice generation works
```

**Estimated Effort:** 6 hours  
**Dependencies:** ✅ API endpoints, UI pages

---

## 📋 LOWER PRIORITY WORK (8-12 days)

### TASK 7: GitHub Actions CI/CD (4-6 hours)

**Files to create:**
```
.github/workflows/
├── ci.yml              → Lint, test, build on every PR
├── deploy-staging.yml  → Deploy to staging on merge
└── sync-policies.yml   → Sync policies before deploy
```

**What each does:**
```yaml
ci.yml:
  - Run: pnpm lint
  - Run: pnpm test
  - Run: pnpm build
  - Run: pnpm test:e2e (with Docker)

deploy-staging.yml:
  - Build Docker image
  - Push to registry
  - Run: pnpm run sync:policies
  - Deploy to staging
  - Run smoke tests
```

**Estimated Effort:** 4 hours  
**Dependencies:** ✅ All tests complete

---

### TASK 8: Complete Documentation (4-6 hours)

**Files to create:**
```
docs/
├── DEVELOPERS_GUIDE.md       → How to run locally, add features
├── DOCKER_SETUP.md           → Docker & docker-compose guide
├── MIGRATION_RUNBOOK.md      → Step-by-step tenant migration
├── SECRETS_MANAGEMENT.md     → .env, secrets, credentials
├── API_DOCUMENTATION.md      → OpenAPI/Swagger reference
├── ARCHITECTURE.md           → System design & diagrams
└── TROUBLESHOOTING.md        → Common issues & solutions
```

**Estimated Effort:** 4 hours  
**Dependencies:** ✅ All features complete

---

### TASK 9: Observability & Monitoring (4-6 hours)

**Files to create:**
```
src/lib/
├── analytics.ts          → PostHog integration
├── error-reporting.ts    → Sentry integration
├── metrics.ts            → Prometheus metrics
└── logging.ts            → Structured logging
```

**What to track:**
- Auth events (login, logout, JWT verify, session revoke)
- API performance (endpoint latency, error rates)
- Database queries (slow queries, connection pool)
- Permission checks (allowed/denied actions)
- Errors (exceptions, validation failures)

**Estimated Effort:** 4 hours  
**Dependencies:** ✅ All API endpoints

---

### TASK 10: Infrastructure as Code (4-6 hours)

**Files to create:**
```
terraform/
├── main.tf          → Provider, outputs
├── variables.tf     → Input variables
├── control-plane.tf → Control-plane DB setup
├── tenant.tf        → Per-tenant DB template
└── s3.tf            → MinIO/S3 setup
```

**What to provision:**
- Supabase control-plane database
- Per-tenant database template
- S3 buckets for uploads
- Redis cache (optional)
- RDS backup configuration

**Estimated Effort:** 4 hours  
**Dependencies:** ✅ Infrastructure decision made

---

## 🎯 PRIORITIZED EXECUTION PLAN

### **WEEK 1 (Days 1-5): Core API & Middleware**
| Task | Day | Hours | Status |
|------|-----|-------|--------|
| Middleware: JWT verification | 1-2 | 4 | 🟡 BLOCKED |
| Permify policy integration | 1-2 | 6 | 🟡 BLOCKED |
| API endpoints: Vendors | 2-3 | 4 | 🟡 BLOCKED |
| API endpoints: Products | 2-3 | 3 | 🟡 BLOCKED |
| API endpoints: Orders | 3-4 | 4 | 🟡 BLOCKED |
| Integration test setup | 4-5 | 3 | 🟡 BLOCKED |

**Total:** ~24 hours / 5 days  
**Deliverable:** Working API endpoints with auth & permissions

---

### **WEEK 2 (Days 6-10): Data & Testing**
| Task | Day | Hours | Status |
|------|-----|-------|--------|
| Data seeding scripts | 6 | 6 | 🟡 BLOCKED |
| Unit tests (auth, db) | 6-7 | 4 | 🟡 BLOCKED |
| Integration tests | 7-8 | 4 | 🟡 BLOCKED |
| E2E tests (Playwright) | 8-9 | 6 | 🟡 BLOCKED |
| Bug fixes & refinement | 9-10 | 4 | 🟡 BLOCKED |

**Total:** ~24 hours / 5 days  
**Deliverable:** Full test coverage, data in databases, quality assurance

---

### **WEEK 3 (Days 11-15): DevOps & Documentation**
| Task | Day | Hours | Status |
|------|-----|-------|--------|
| GitHub Actions CI/CD | 11 | 4 | 🟡 BLOCKED |
| Observability (PostHog, Sentry) | 11-12 | 4 | 🟡 BLOCKED |
| Infrastructure (Terraform) | 12-13 | 4 | 🟡 BLOCKED |
| Documentation | 13-14 | 6 | 🟡 BLOCKED |
| Staging deployment PoC | 14-15 | 6 | 🟡 BLOCKED |

**Total:** ~24 hours / 5 days  
**Deliverable:** Automated deployments, monitoring, complete documentation

---

## 📦 DEPENDENCY CHAIN

```
Week 1: Middleware & Permify
    ↓
Week 1: API Endpoints
    ↓
Week 2: Data Seeding
    ↓
Week 2: Testing
    ↓
Week 3: CI/CD & DevOps
    ↓
Week 3: Documentation & Staging
```

---

## 🔧 YOUR INVOLVEMENT CHECKLIST

### Phase 1: Infrastructure Validation (You can help with)
- [ ] Review middleware JWT verification approach
- [ ] Validate Permify policy schema mapping
- [ ] Confirm API endpoint structure
- [ ] Review database query patterns

### Phase 2: Testing & QA (You can help with)
- [ ] Test auth flows (login, logout, multi-device)
- [ ] Test API CRUD operations
- [ ] Test multi-tenant isolation
- [ ] Test permission enforcement

### Phase 3: Deployment & Go-Live (You can help with)
- [ ] Configure staging environment
- [ ] Run smoke tests
- [ ] Configure monitoring & alerts
- [ ] Create runbooks for operations

---

## 🚀 IMMEDIATE NEXT STEPS

### For Me (AI Assistant):
1. ✅ Analyze current code state (DONE)
2. ✅ Create comprehensive roadmap (DONE - this document)
3. 🔜 **AWAIT YOUR CONFIRMATION** on approach
4. 🔜 Implement Middleware JWT verification (Task 1)
5. 🔜 Implement API endpoints (Task 2)
6. 🔜 Implement Permify integration (Task 3)
7. 🔜 Continue through all remaining tasks

### For You (Project Owner):
1. **Review this roadmap** - Does it align with your vision?
2. **Confirm priority** - Should I start with Middleware or APIs?
3. **Identify blockers** - Any dependencies or constraints I should know?
4. **Approve patterns** - Review proposed API structure & test approach
5. **Schedule checkpoints** - Daily sync or weekly reviews?

---

## 📊 TIME ESTIMATION SUMMARY

| Phase | Component | Hours | Days |
|-------|-----------|-------|------|
| **Week 1** | Middleware + APIs | 24 | 5 |
| **Week 2** | Seeding + Testing | 24 | 5 |
| **Week 3** | DevOps + Docs | 24 | 5 |
| **TOTAL** | **Full Launch** | **72** | **15** |

**With continuous work:** ~3 weeks to production-ready  
**With part-time work:** ~6-8 weeks to production-ready

---

## ❓ HOW TO USE THIS ROADMAP

1. **Read it top-to-bottom** - Understand the big picture
2. **Focus on HIGH PRIORITY section** - Start there
3. **Match tasks to your timeline** - Realistic milestones
4. **Check dependencies** - Don't skip prerequisites
5. **Communicate blockers** - Tell me what's blocking progress
6. **Review deliverables** - Validate outputs before moving on

---

## 💬 QUESTIONS FOR YOU

### Architecture
- [ ] **Middleware:** Should JWT be in Authorization header or cookies?
- [ ] **Permify:** Mock mode or real Permify server?
- [ ] **API:** RESTful or GraphQL?
- [ ] **Database:** Single control-plane with managed per-tenant, or fully isolated?

### Scope
- [ ] **MVP Features:** Vendor + Product + PO + SO, or just Vendor + Product?
- [ ] **User Management:** RBAC only or ABAC?
- [ ] **Reporting:** Dashboard needed for MVP?

### Timeline
- [ ] **Target Launch:** Date?
- [ ] **Concurrent Users:** Expected scale?
- [ ] **Feature Parity:** Need all 10 modules or subset?

### Resources
- [ ] **Your availability:** Daily? Bi-weekly?
- [ ] **Other team members:** QA, DevOps, Product?
- [ ] **Budget constraints:** Infrastructure, services?

---

**Status:** 🟡 **AWAITING YOUR INPUT TO PROCEED**

Please confirm:
1. Are you ready for me to start implementation?
2. Which task should I begin with (Middleware or APIs)?
3. Should we schedule daily syncs or weekly reviews?
4. Any blockers or constraints I should know about?

**I'm ready to execute on your signal!** 🚀

