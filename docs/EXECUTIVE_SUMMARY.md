# Executive Summary: Firebase → Supabase Migration & Sprint 1 Roadmap

**Date:** October 26, 2025  
**Status:** Sprint Planning Complete  
**Prepared for:** Development Team, Project Stakeholders

---

## TL;DR

We are migrating the Bobs Firebase Command Center from a Firebase + in-memory mocks backend to a **Supabase + Postgres (per-tenant DBs) + Permify** architecture. 

**Sprint 1 (2 weeks, starting Oct 27)** focuses on foundational infrastructure:
- ✅ Control-plane TypeORM entities + migrations (sessions, user_mappings, tenant_metadata)
- ✅ Local Docker dev environment (Postgres, Redis, MinIO, app)
- ✅ JWT middleware PoC (Supabase JWKS + session revocation)
- ✅ Tenant provisioning script (Supabase Admin API)

**Expected outcome:** Team can spin up local dev env and test auth flow end-to-end by Nov 10.

**Total 3-sprint effort:** ~316 hours (8 weeks of full team work).

---

## Gap Analysis Summary

### What We Have
- ✅ Next.js frontend (UI complete for all modules)
- ✅ Firebase authentication (client SDK + basic session helpers)
- ✅ Mock data layer (MOCK_VENDORS, MOCK_PRODUCTS, etc. in `src/lib/firebase/firestore.ts`)
- ✅ RBAC helpers (`src/lib/rbac.ts`) — but reads from Firestore
- ✅ Server actions and dashboard pages
- ⚠️ Env keys configured (Supabase, Mailgun, PostHog, Sentry)

### What We're Building (Sprints 1–3)
- **Sprint 1:** Control-plane DB + middleware PoC + Docker dev env
- **Sprint 2:** Core domain entities (vendor, inventory, sales) + Permify integration
- **Sprint 3:** HRMS + full feature migration + CI/CD + Terraform skeleton

### Key Missing Pieces
- ❌ TypeORM entities for domain objects (vendor, product, order, employee, etc.)
- ❌ Per-tenant database provisioning
- ❌ Supabase Auth integration + JWT validation
- ❌ Docker & local dev environment
- ❌ Permify schema + policy engine integration
- ❌ Migrations (control-plane only, domain migrations TBD)
- ❌ Data transformation from mocks → Postgres

---

## Why This Architecture?

### Challenges We're Solving
1. **Data silos:** Firestore mock + scattered CSV/spreadsheets → unified Postgres per tenant
2. **No authorization control:** Hardcoded RBAC rules → live Permify policy engine
3. **Session revocation missing:** No way to invalidate sessions → control-plane sessions table + JWT revocation
4. **Manual onboarding:** Creating new customers requires manual Firestore + env setup → automated tenant provisioning via Supabase Admin API
5. **Scalability:** Monolithic mock layer → modular TypeORM entities + microservice-ready

### Why Supabase + Postgres?
- Managed PostgreSQL (no ops overhead)
- Built-in Auth (JWT, JWKS endpoint) aligns with our middleware design
- API + realtime support for future features (notifications, live dashboards)
- Per-tenant DB support for data isolation + compliance

### Why Permify?
- 230-permission RBAC system is complex; a live policy engine handles dynamic role/permission updates
- Supports hierarchies (sales exec → regional head → president)
- Audit trail for compliance
- Faster than in-repo permission checks (no DB round-trip per check)

### Why TypeORM?
- Type-safe ORM compatible with TypeScript + Next.js server actions
- Migration support (version control for DB schema)
- Repo pattern for data access (cleaner than raw queries)
- Per-tenant DataSource support built-in

---

## Deliverables — Gap Analysis

### Documentation (✅ Complete)
1. **docs/GAP_ANALYSIS_DETAILED.md** (97 KB)
   - Per-module mapping (Vendor, Inventory, Sales, HRMS, Store, Supply Chain, Auth, KPIs, Comms)
   - Status for each component (Implemented / Partial / Mock / Missing)
   - Missing deliverables per module (entity files, migrations, seed data, tests)
   - Effort estimates (hours) for each module
   - Sprint-by-sprint breakdown (Sprints 1–3, 316h total)

2. **docs/SPRINT_1_EXECUTION_PLAN.md** (65 KB)
   - Day-by-day task breakdown (Days 1–10)
   - Detailed acceptance criteria + code sketches for each task
   - LLM model recommendations (Sonnet 4.5 for complex, Haiku for simple)
   - Risk mitigation + dependencies
   - Success criteria checklist
   - Burn-down chart

---

## Sprint 1 Highlights

### Duration
Monday, Oct 27 – Sunday, Nov 10, 2025 (2 weeks, 10 business days)

### Team
- 1 Backend Lead (architect, complex TypeORM work)
- 1–2 Backend Engineers (CRUD, testing)
- 1 DevOps (Docker, provisioning, CI skeleton)
- 1 QA / Tech Writer (tests, docs)

### Key Tasks
| Task | Owner | Effort | Deliverable |
|------|-------|--------|-------------|
| Control-plane entities (sessions, user_mappings, tenant_metadata) | Backend Lead | 12h | `src/entities/control/*.ts` |
| Migrations (SQL) | Backend Lead | 6h | `migrations/control/*.sql` |
| Tenant provisioning CLI (Supabase Admin API) | DevOps | 10h | `scripts/provision-tenant-db.mjs` |
| Docker + docker-compose.dev.yml | DevOps | 12h | `Dockerfile` + `docker-compose.dev.yml` |
| JWT middleware PoC (JWKS + session revocation) | Backend Lead | 10h | `src/middleware.ts` + helpers |
| Middleware tests | QA | 8h | `src/__tests__/middleware.test.ts` |
| Seed control-plane (admin user, roles, tenant) | Backend Lead | 6h | `scripts/seed/*.ts` |
| Documentation (.env.template, Docker, Dev guide) | Tech Writer | 4h | `docs/DOCKER_SETUP.md` + `.env.template` |

**Total Sprint 1 effort:** 68 hours (well within team capacity of ~240h over 2 weeks)

### Success Criteria
- [ ] Docker Compose starts all services healthily
- [ ] Control-plane DB created + migrations run
- [ ] JWT middleware verifies tokens + checks revocation
- [ ] Team can provision test tenant + create session
- [ ] All unit tests pass
- [ ] `.env.template` + DOCKER_SETUP.md documented
- [ ] Demo: spin up local env → create JWT → verify middleware → revoke session

---

## Sprint 2 Preview (Weeks 3–4)

### Goals
- Core domain entities (TypeORM): Vendor, Product/SKU, PurchaseOrder, SalesOrder, Employee
- Permify schema mapping: convert 230 permissions to Permify relational schema
- Permify CLI: sync-policies tool to push roles/permissions
- Integrations wiring: Mailgun, PostHog, Sentry adapters
- Data migration scripts: export mocks → seed scripts for tenant DB

### Effort
~110 hours

---

## Sprint 3 Preview (Weeks 5–6)

### Goals
- Sales entities: Lead, Opportunity, Quotation, Invoice
- HRMS entities: Employee, Attendance, Leave, Payroll, Candidate
- Dashboard KPI aggregations
- GitHub Actions CI (lint, test, build, policy-sync job)
- Terraform skeleton (Supabase, S3, DNS placeholders)
- E2E Playwright tests (auth flow, vendor CRUD, sales order)
- Full documentation (DEVELOPERS_GUIDE, MIGRATION_RUNBOOK, etc.)

### Effort
~130 hours

---

## Risk Assessment

### High-Risk Items
1. **Per-tenant DB provisioning via Supabase Admin API**
   - Risk: API rate limits, credential management, cost
   - Mitigation: test with non-prod tenant first; use local Docker Postgres for dev
   
2. **Permify schema complexity**
   - Risk: 230 permissions might not translate 1:1 to Permify model
   - Mitigation: start with top 50 permissions for v1; expand iteratively

3. **Data migration from Firebase**
   - Risk: loss of data, inconsistency during transition
   - Mitigation: run Firebase + Postgres in parallel; plan rollback procedures

4. **Team velocity**
   - Risk: complex TypeORM + Supabase learning curve
   - Mitigation: pair programming on critical tasks; daily standups for blockers

### Medium-Risk Items
- JWKS endpoint caching (might be slow initially) → solution: implement cache + TTL
- Docker build time (might be 5–10 min initially) → solution: pre-pull base images
- CI secrets management (secrets might leak) → solution: scan pre-commit; GitHub secret rotation policy

---

## Technology Stack (Final)

### Frontend (No Change)
- Next.js 14 (App Router)
- React 18 + TypeScript
- shadcn UI + Tailwind CSS

### Backend (New)
- **Auth:** Supabase Auth (JWT, JWKS endpoint)
- **Database:** Supabase PostgreSQL (per-tenant)
- **ORM:** TypeORM
- **Policy Engine:** Permify (live schema + runtime checks)
- **Session Management:** Control-plane Postgres table + JWT jti
- **Observability:** PostHog (analytics), Sentry (errors), Winston/Pino (logging)
- **Email:** Mailgun
- **Storage:** MinIO (S3-compatible for dev; AWS S3 for prod)
- **Pub/Sub:** Redis (notifications, caching) — NATS optional

### DevOps & Infra
- Docker + Docker Compose (local dev)
- GitHub Actions (CI/CD)
- Terraform (IaC skeleton)
- Supabase Admin API (tenant provisioning)

---

## Timeline Summary

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| **Sprint 1** | 2 weeks | Oct 27 | Nov 10 | 📋 Planning Complete |
| **Sprint 2** | 2 weeks | Nov 13 | Nov 24 | 🔜 Kickoff Nov 11 |
| **Sprint 3** | 2 weeks | Nov 27 | Dec 8 | 🔜 TBD |
| **Buffer/Polish** | 1 week | Dec 11 | Dec 15 | 🔜 TBD |
| **UAT + Cutover** | 1 week | Dec 18 | Dec 22 | 🔜 TBD |

**Total project duration:** 8–9 weeks (late Oct → late Dec 2025)

---

## How to Use This Plan

### For Developers
1. Read `docs/GAP_ANALYSIS_DETAILED.md` to understand what's missing.
2. Follow `docs/SPRINT_1_EXECUTION_PLAN.md` day-by-day.
3. Use `.env.template` to set up local dev.
4. Follow `docs/DOCKER_SETUP.md` to spin up local environment.

### For Team Leads
1. Assign Sprint 1 tasks from the task breakdown.
2. Use effort estimates to plan team allocation.
3. Run daily standups (15 min, report blockers).
4. Track progress against acceptance criteria in `docs/SPRINT_1_EXECUTION_PLAN.md`.

### For Project Managers
1. Reference the 3-sprint timeline + effort estimates.
2. Use the risk assessment to plan mitigation.
3. Prepare stakeholder demos for end of each sprint.
4. Track scope creep (no new features during migration; only bug fixes).

### For Architects
1. Review the technical decisions in GAP_ANALYSIS (tenancy model, auth design, ORM choice).
2. Validate Permify schema mapping before Sprint 2 (see `docs/PERMIFY_SCHEMA.md` to be created).
3. Monitor dependency resolution (e.g., control-plane must be ready before middleware).

---

## Next Immediate Actions

### Before Sprint 1 Starts (Oct 27)
- [ ] **Monday Oct 27, 9 AM:** Sprint kickoff meeting (30 min). Review gap analysis, confirm task assignments.
- [ ] **Monday Oct 27, 10 AM:** Tech setup: Supabase staging project access, Permify sandbox endpoint, GitHub Actions secrets.
- [ ] **Monday Oct 27, 11 AM:** Team pair programming: Task 1.2A (entity design) kick-off.
- [ ] **Daily 9 AM:** 15-min standup (report blockers, discuss solutions).

### First Week Wins (Expected)
- Control-plane entities drafted + compiled
- Tenant provisioning script skeleton created
- Docker build + compose up successful
- One middleware test case passing

### End of Sprint 1 (Nov 10)
- Demo: spin up Docker environment + create JWT + test middleware revocation
- All acceptance criteria met
- Sprint review + retrospective

---

## Questions to Ask Before Starting

1. **Who has Supabase staging project access?** (Needed for tenant provisioning testing)
2. **Who has Permify sandbox credentials?** (Needed for policy integration in Sprint 2)
3. **Are GitHub Actions secrets already set up?** (SUPABASE_SERVICE_ROLE_KEY, etc.)
4. **Do we have a preferred dev machine OS?** (MacOS/Linux/Windows — Docker Compose works on all)
5. **Should we keep Firebase running in parallel or switch cold-turkey?** (Recommend parallel for safety)

---

## Key Metrics to Track

- **Daily Burn-Down:** Hours remaining per task (update daily during standup)
- **Code Coverage:** Aim for > 80% for new TypeORM code + middleware
- **Build Time:** Docker image build time (target < 5 min after first pull)
- **Test Pass Rate:** All unit + integration tests must pass before sprint closes
- **Deployment Readiness:** All tasks marked "✅ Complete" = sprint ready to merge

---

## Escalation Path

| Issue | Owner | Escalate To |
|-------|-------|-------------|
| Supabase API issues | DevOps | Cloud Architect |
| Permify schema question | Backend Lead | Solution Architect |
| Team blockers (external deps) | Tech Lead | Project Manager |
| Scope creep requests | Project Manager | Product Manager |

---

## Appendices

### A. Full File Structure (Post-Sprint 1)

```
src/
  ├── entities/
  │   └── control/
  │       ├── session.entity.ts
  │       ├── user-mapping.entity.ts
  │       ├── tenant-metadata.entity.ts
  │       ├── policy-sync-log.entity.ts
  │       └── index.ts
  ├── lib/
  │   ├── auth/
  │   │   ├── jwks-cache.ts
  │   │   ├── session-check.ts
  │   │   └── permission-check.ts
  │   ├── controlDataSource.ts (updated)
  │   └── tenantDataSource.ts (updated)
  ├── middleware.ts (updated)
  ├── __tests__/
  │   └── middleware.test.ts
  └── ...

migrations/
  └── control/
      ├── 20251027_create_sessions_table.sql
      ├── 20251027_create_user_mappings_table.sql
      ├── 20251027_create_tenant_metadata_table.sql
      ├── 20251027_create_policy_sync_log_table.sql
      └── 20251027_create_indices.sql

scripts/
  ├── provision-tenant-db.mjs
  ├── provision-tenant-db.ps1
  └── seed/
      ├── seed-control-plane.ts
      └── seed-roles.ts

docker/
  ├── Dockerfile
  └── docker-compose.dev.yml

docs/
  ├── GAP_ANALYSIS_DETAILED.md ✅
  ├── SPRINT_1_EXECUTION_PLAN.md ✅
  ├── DOCKER_SETUP.md 🔜
  ├── DEVELOPERS_GUIDE.md 🔜
  └── SECRETS_MANAGEMENT.md 🔜

.env.template ✅
.github/
  └── workflows/
      └── ci.yml 🔜
```

### B. Effort Breakdown by Role

| Role | Sprint 1 | Sprint 2 | Sprint 3 | Total |
|------|----------|----------|----------|-------|
| Backend Lead | 36h | 60h | 50h | 146h |
| Backend Engineer | 20h | 40h | 50h | 110h |
| DevOps | 12h | 8h | 12h | 32h |
| QA | 4h | 6h | 20h | 30h |
| **Total** | **72h** | **114h** | **132h** | **318h** |

Assuming 4 engineers, each working ~40h/week, this is ~2 weeks of full focus per sprint.

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Next Update:** November 10, 2025 (end of Sprint 1)

---

## Sign-Off

This plan is ready for team review and sprint execution. Please confirm the following by Oct 26, EOD:

- [ ] Backend Lead: Confirms entity design and migration strategy
- [ ] DevOps: Confirms Docker + provisioning script approach
- [ ] QA: Confirms test strategy and acceptance criteria
- [ ] Project Manager: Confirms timeline and team allocation
- [ ] Stakeholders: Confirms go/no-go for Sprint 1 start (Oct 27)

Contact the Solution Architect for questions or clarifications.
