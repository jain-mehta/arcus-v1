# Sprint Execution Checklist & Development Roadmap
**Status:** Development Started - October 26, 2025
**Target Completion:** MVP in 10 days, Full Platform in 15 days

---

## 📋 Phase Overview

This document tracks the complete development roadmap with:
- ✅ = Completed
- 🟡 = In Progress
- 🔴 = Not Started
- ⚠️ = Blocked / Needs User Action

---

## 🔑 CRITICAL: User Action Items (DO THIS FIRST)

### 1️⃣ **Permify Setup** ⚠️ (USER ACTION REQUIRED)

**What:** Create a Permify instance and get API credentials
**Where:** https://console.permify.co

**Steps:**
1. Go to https://console.permify.co and create an account
2. Create a new workspace (e.g., "Arcus-v1-Dev")
3. Navigate to Settings → API Keys
4. Copy:
   - `PERMIFY_API_KEY` (write access)
   - `PERMIFY_WORKSPACE_ID`
   - `PERMIFY_API_URL` (usually `https://api.permify.co`)
5. Create `.env.local` entry:
   ```
   PERMIFY_API_KEY=YOUR_API_KEY_HERE
   PERMIFY_WORKSPACE_ID=YOUR_WORKSPACE_ID_HERE
   PERMIFY_API_URL=https://api.permify.co
   PERMIFY_SCHEMA_NAME=arcus-v1
   ```

**Timeline:** 5 minutes
**Deliverable:** `.env.local` updated with Permify credentials

---

### 2️⃣ **Docker Setup & Validation** ⚠️ (USER ACTION REQUIRED)

**What:** Ensure Docker is installed and running

**Steps:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and launch Docker Desktop
3. Verify installation:
   ```powershell
   docker --version
   docker ps
   ```
4. If Docker Desktop is running, you should see no errors

**Timeline:** 10 minutes (or already have it)
**Deliverable:** Docker daemon running, `docker --version` works

---

### 3️⃣ **Supabase Tenant Setup** ⚠️ (USER ACTION - OPTIONAL FOR LOCAL DEV)

**What:** Create a Supabase account for per-tenant databases

**Steps:**
1. Go to https://supabase.com and sign up
2. Create a new project (e.g., "arcus-v1-dev")
3. Copy connection string from Settings → Database
4. (LOCAL DEV ONLY) If using Docker Postgres, skip this step
5. If using hosted Supabase:
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

**Timeline:** 5 minutes (or use Docker Postgres for local dev)
**Deliverable:** Connection string for control-plane DB

---

## 📅 Sprint Schedule

### **Sprint 1: Infrastructure Foundation** (Oct 27 - Nov 10)

**Goal:** Control-plane DB, Docker setup, Auth infrastructure, Domain entities

| Task # | Task Name | Status | Hours | Blocker? | Notes |
|--------|-----------|--------|-------|----------|-------|
| 1.1 | Control-plane TypeORM entities | 🟡 IN-PROGRESS | 3 | - | session, user_mapping, tenant_metadata, policy_sync_log |
| 1.2 | Control-plane migrations | 🟡 IN-PROGRESS | 2 | 1.1 | SQL files for control-plane tables |
| 1.3 | Tenant DB factory & provisioning | 🟡 IN-PROGRESS | 4 | 1.2 | CLI script for provisioning new tenants |
| 1.4 | Docker Compose setup | 🟡 IN-PROGRESS | 3 | - | Postgres, Redis, MinIO, app container |
| 1.5 | Local env & secrets management | 🟡 IN-PROGRESS | 2 | - | .env.template, setup docs |
| 1.6 | Domain entities (6 models) | ✅ COMPLETED | 5 | - | Vendor, Product, PO, SO, Inventory, Employee |
| 1.7 | Domain migrations | ✅ COMPLETED | 3 | - | SQL files for domain tables |
| 1.8 | Auth infrastructure (JWKS, sessions) | ✅ COMPLETED | 4 | - | JWT verification, session management |

**Sprint 1 Total:** ~22 hours remaining

---

### **Sprint 2: API & Business Logic** (Nov 13 - Nov 24)

**Goal:** API endpoints, Permify integration, Middleware enhancement

| Task # | Task Name | Status | Hours | Blocker? | Notes |
|--------|-----------|--------|-------|----------|-------|
| 2.1 | Middleware enhancement (JWT + Permify) | 🔴 NOT-STARTED | 4 | 1.1, 1.2 | Add JWT verification, session check, permission gate |
| 2.2 | Permify client & schema sync | 🔴 NOT-STARTED | 5 | - | Policy engine integration, sync-policies CLI |
| 2.3 | Vendor API endpoints | 🔴 NOT-STARTED | 5 | 2.1 | GET, POST, PUT, DELETE endpoints + tests |
| 2.4 | Product API endpoints | 🔴 NOT-STARTED | 5 | 2.1 | SKU management, pricing, attributes |
| 2.5 | Purchase Order APIs | 🔴 NOT-STARTED | 6 | 2.1 | CRUD + approval workflow + receive goods |
| 2.6 | Sales Order APIs | 🔴 NOT-STARTED | 6 | 2.1 | CRUD + confirmation + shipping workflow |
| 2.7 | Inventory APIs | 🔴 NOT-STARTED | 4 | 2.1 | Stock levels, adjustments, valuations |
| 2.8 | Employee & User APIs | 🔴 NOT-STARTED | 4 | 2.1 | User management, role assignment |

**Sprint 2 Total:** ~39 hours

---

### **Sprint 3: Testing, Docs & DevOps** (Nov 27 - Dec 8)

**Goal:** Comprehensive testing, CI/CD, documentation, observability

| Task # | Task Name | Status | Hours | Blocker? | Notes |
|--------|-----------|--------|-------|----------|-------|
| 3.1 | Integration tests (data layer) | 🔴 NOT-STARTED | 6 | 2.1-2.8 | Test against Docker Postgres |
| 3.2 | E2E tests (Playwright) | 🔴 NOT-STARTED | 6 | 2.1-2.8 | Auth flow, multi-tenant isolation, workflows |
| 3.3 | Unit tests (middleware, auth, DB) | 🔴 NOT-STARTED | 4 | 2.1 | JWT verification, session mgmt, policy checks |
| 3.4 | Seed data & developer fixtures | 🔴 NOT-STARTED | 3 | 2.1 | Mock vendors, products, test data |
| 3.5 | GitHub Actions CI/CD | 🔴 NOT-STARTED | 3 | - | Lint, test, build, policy-sync job |
| 3.6 | Observability (PostHog, Sentry) | 🔴 NOT-STARTED | 3 | - | Analytics, error tracking |
| 3.7 | Documentation (RUN_LOCALLY, DEVELOPERS_GUIDE) | 🔴 NOT-STARTED | 4 | All | Complete developer guides |
| 3.8 | Terraform IaC skeleton | 🔴 NOT-STARTED | 2 | - | Placeholder infrastructure |

**Sprint 3 Total:** ~31 hours

---

## 🔨 IMMEDIATE NEXT STEPS (TODAY)

### Build Order (Must Follow This Sequence)

1. **Control-plane entities** → Creates foundation for sessions/revocation
2. **Control-plane migrations** → Database structure ready
3. **Docker Compose** → Local dev environment
4. **Tenant provisioning script** → Can create test tenants
5. **Middleware enhancement** → JWT + Permify support (BLOCKER for all APIs)
6. **Permify schema sync** → Enable policy engine
7. **API endpoints** → Business logic (depends on 5)
8. **Tests** → Validation (depends on 7)
9. **Documentation** → Final polish
10. **Full build & validation** → Ready for production

---

## 📊 Current Code Status

### ✅ Already Completed
- Domain entities (Vendor, Product, PO, SO, Inventory, Employee)
- Domain migrations
- Auth infrastructure (JWKS, session manager)
- Supabase admin provisioning client
- Docker Compose template (exists)

### 🟡 Partially Done
- Middleware (40%) - Has cookie check, needs JWT verification
- Permify integration (20%) - Client scaffolded, not tested

### 🔴 Not Started
- Middleware enhancement (JWT verification)
- All API endpoints (30+ endpoints)
- Testing suite (unit, integration, E2E)
- Seeding scripts
- CI/CD pipelines
- Complete documentation
- Observability setup

---

## ⏱️ Time Estimates

| Phase | Hours | Days @ 8h/day | Target Completion |
|-------|-------|---------------|-------------------|
| Sprint 1 Remaining | 22 | 3 | Oct 29 |
| Sprint 2 (APIs) | 39 | 5 | Nov 3 |
| Sprint 3 (Tests/Docs) | 31 | 4 | Nov 7 |
| **Total** | **92** | **12** | **Nov 7** |

*Note: Aggressive timeline assumes continuous 8h/day work and no blockers*

---

## 🚀 Build Starting Now

Agent is commencing implementation in this order:
1. ✅ Control-plane entities + migrations
2. ✅ Docker Compose validation
3. ✅ Tenant provisioning enhancement
4. ✅ Middleware JWT verification
5. ✅ Permify schema + sync
6. ✅ API endpoints (core 8)
7. ✅ Testing suite
8. ✅ Seeding + documentation
9. ✅ CI/CD setup
10. ✅ Final build validation

---

## 🎯 Success Criteria

- [ ] All control-plane entities created with migrations
- [ ] Docker Compose runs without errors
- [ ] Tenant provisioning CLI works (can create new tenant DB)
- [ ] Middleware validates JWT tokens (valid, invalid, revoked)
- [ ] At least 3 API endpoints working (Vendor CRUD)
- [ ] Permify schema synced and policies enforceable
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass (full workflow)
- [ ] E2E tests pass (auth → API → data isolation)
- [ ] `pnpm run build` completes without errors
- [ ] Documentation complete and accurate
- [ ] Can run entire platform with `docker-compose up`

---

## 📝 Notes

**User Responsibilities:**
1. Provide Permify API credentials (5 min)
2. Ensure Docker Desktop is running (already done?)
3. Review & approve schema changes (when shown)
4. Test integrations with real Permify instance (will do together)
5. Validate multi-tenant data isolation (manual QA)

**Developer Responsibilities (Agent):**
1. Code implementation (all files)
2. Unit & integration tests
3. Build validation (`pnpm run build`)
4. Documentation updates
5. Daily progress updates

---

## 📞 Check-in Points

**Daily Updates:**
- [ ] 1:00 PM - Sprint 1 completion check
- [ ] 3:00 PM - Sprint 2 progress (middleware + APIs)
- [ ] 5:00 PM - Daily build validation
- [ ] EOD - Todo list update + blocker identification

---

**Document Version:** 1.0
**Last Updated:** October 26, 2025
**Next Review:** October 27, 2025
