# Sprint 1 Detailed Task Breakdown & Execution Plan

**Sprint Duration:** Weeks 1–2 (Days 1–10, assuming 5-day work weeks)  
**Sprint Goal:** Control-plane scaffolding, local dev environment, JWT middleware PoC, foundational infrastructure  
**Team:** Backend Lead, Backend Engineer(s), DevOps, QA  

---

## Sprint 1 Overview

| Phase | Task | Effort | Owner | Status |
|-------|------|--------|-------|--------|
| **Phase A: Planning & Prep** | Gap Analysis (document) | 8h | Architect | ✅ Complete |
| **Phase A: Planning & Prep** | Sprint Planning + kickoff | 2h | All | — |
| **Phase B: Control-Plane Scaffolding** | TypeORM entities + migrations | 18h | Backend Lead | — |
| **Phase B: Control-Plane Scaffolding** | Tenant DB provisioning script | 10h | DevOps | — |
| **Phase C: Infrastructure** | Docker + compose setup | 12h | DevOps | — |
| **Phase D: Auth & Middleware** | Supabase Auth integration + middleware PoC | 10h | Backend Lead | — |
| **Phase E: Testing & Integration** | Unit + integration tests | 8h | QA / Backend | — |
| **Phase E: Testing & Integration** | Seed control-plane + fixture data | 6h | Backend Lead | — |
| **Phase F: Documentation** | Dev docs, secrets, Docker guide | 4h | Tech Writer | — |
| **Sprint 1 Total** | — | **78h** | — | — |

---

## Detailed Day-by-Day Execution Plan

### Day 1–2: Planning, Prep, Architecture Alignment

**Duration:** 1.5 days | **Owner:** Architect + all team

**Deliverables:**
- [ ] Sprint kickoff meeting (30 min): review gap analysis, confirm task breakdown, assign owners.
- [ ] Tech stack confirmation: Supabase staging endpoint, Permify sandbox, Mailgun/PostHog/Sentry keys.
- [ ] GitHub repo setup: main branch protection rules, PR template, CI secrets created.
- [ ] Assign tasks to individuals + estimate with Planning Poker.

**Success Criteria:**
- All team members understand Sprint 1 goal and their tasks.
- Tech credentials collected (not committed to repo; stored in CI secrets or shared via 1Password).
- Daily standup scheduled (9 AM, 15 min).

**Resources:**
- Gap Analysis doc (completed).
- SOW + Architecture docs (Level 0–3).

---

### Day 2–4: Control-Plane TypeORM Scaffolding (Phase B)

**Duration:** 2.5 days | **Owner:** Backend Lead

#### Task 1.2A: Design Control-Plane Entities & Schema
**Effort:** 4h | **Day:** 2–2.5

**What:** Create TypeORM entity files for control-plane:
1. `Session` — store JWTs + `jti` for revocation.
2. `UserMapping` — link system user → tenant → employee (for multi-tenant + role lookups).
3. `TenantMetadata` — store tenant name, DB connection string (encrypted), provisioning status.
4. `PolicySyncLog` — audit trail of policy pushes to Permify.

**Output files:**
```
src/entities/control/
  ├── session.entity.ts
  ├── user-mapping.entity.ts
  ├── tenant-metadata.entity.ts
  ├── policy-sync-log.entity.ts
  └── index.ts
```

**Key considerations:**
- `Session` entity must have indexed `jti`, `user_id`, `expires_at` for fast lookups + cleanup.
- `UserMapping` must have tenant_id + user_id composite key or unique index.
- `TenantMetadata` includes connection string (encrypted via `@BeforeInsert()` / `@AfterLoad()` decorator).
- `PolicySyncLog` includes schema version + old/new policy diffs for rollback traceability.

**Code sketch:**
```typescript
// Session entity
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  jti: string; // JWT ID for revocation

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('text', { nullable: true })
  claims: string; // serialized JWT claims for audit

  @Column('timestamp')
  issued_at: Date;

  @Column('timestamp')
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Index(['jti'])
  @Index(['user_id'])
  @Index(['expires_at']) // for cleanup queries
}
```

**Acceptance Criteria:**
- [ ] All 4 entity files created + decorated with TypeORM decorators.
- [ ] Indexes added for performance-critical queries (jti, user_id, tenant_id, expires_at).
- [ ] Foreign key constraints defined (if needed).
- [ ] Entity exports aggregated in `src/entities/control/index.ts`.

**LLM Model:** Sonnet 4.5 (TypeORM entity + relationship design).

---

#### Task 1.2B: Create Migrations (TypeORM or SQL)
**Effort:** 6h | **Day:** 3–3.5

**What:** Generate TypeORM migration files or raw SQL for control-plane tables.

**Output files:**
```
migrations/control/
  ├── 20251027_create_sessions_table.sql (OR .ts if TypeORM)
  ├── 20251027_create_user_mappings_table.sql
  ├── 20251027_create_tenant_metadata_table.sql
  ├── 20251027_create_policy_sync_log_table.sql
  └── 20251027_create_indices.sql (consolidate index creation)
```

**Key considerations:**
- Migrations must be **idempotent** (can be re-run safely) — use `IF NOT EXISTS`, `DROP IF EXISTS ... CASCADE`.
- Use TypeORM `Migration` class or raw SQL (recommend raw SQL for easier inspection + deployment).
- Include rollback script (`down` migration) for each.
- Set appropriate column constraints (NOT NULL, DEFAULT, CHECK).
- Include indexes for performance.

**SQL sketch:**
```sql
-- 20251027_create_sessions_table.sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  claims TEXT,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

**Acceptance Criteria:**
- [ ] All migration files created + follow naming convention (`YYYYMMDD_description.sql`).
- [ ] Each migration is idempotent + includes `IF NOT EXISTS` + index creation.
- [ ] Rollback migrations provided (or generated via TypeORM).
- [ ] Migrations can be tested locally with `psql` against test DB.

**LLM Model:** Sonnet 4.5 (SQL schema generation + constraints).

---

#### Task 1.2C: Update ControlDataSource Configuration
**Effort:** 3h | **Day:** 4

**What:** Update `src/lib/controlDataSource.ts` to use new entities + migrations.

**Changes:**
1. Import new entity files.
2. Add `entities: [Session, UserMapping, TenantMetadata, PolicySyncLog]` to DataSource options.
3. Add `migrations: ['migrations/control/*.sql']` (or TypeORM migration path).
4. Verify DataSource initialization + connection pooling config.

**Output:**
```typescript
// src/lib/controlDataSource.ts
import { DataSource } from 'typeorm';
import { Session, UserMapping, TenantMetadata, PolicySyncLog } from '@/entities/control';

export const controlDataSource = new DataSource({
  type: 'postgres',
  url: process.env.CONTROL_DATABASE_URL,
  entities: [Session, UserMapping, TenantMetadata, PolicySyncLog],
  migrations: ['migrations/control/**/*.ts'],
  synchronize: false, // Always use migrations
  logging: process.env.NODE_ENV === 'development',
});
```

**Acceptance Criteria:**
- [ ] DataSource initializes without errors (compile + runtime check).
- [ ] Entities registered + migrations discoverable.
- [ ] Connection pooling configured (min: 2, max: 10).

**LLM Model:** Haiku (small config update).

---

### Day 4–5: Tenant DB Provisioning Script (Phase B)

**Duration:** 1 day | **Owner:** DevOps

#### Task 1.5A: Create Tenant Provisioning CLI Script
**Effort:** 8h | **Day:** 4–5

**What:** Create a Node.js CLI script that:
1. Takes tenant name as input.
2. Calls Supabase Admin API to create new database.
3. Returns connection string.
4. Optionally: seeds tenant DB with default schema (migrations).

**Output files:**
```
scripts/
  ├── provision-tenant-db.mjs (Node.js ESM script)
  ├── provision-tenant-db.ps1 (PowerShell for Windows)
  └── README_PROVISIONING.md (instructions)
```

**Script flow:**
```javascript
// Pseudo-code
async function provisionTenant(tenantName, supabaseProjectId, supabaseApiKey) {
  // 1. Call Supabase Admin API: POST /v1/projects/{project_id}/databases
  // 2. Get DB credentials (host, port, user, password, dbname)
  // 3. Construct connection string
  // 4. Store tenant metadata in control-plane: TenantMetadata { tenant_id, db_url }
  // 5. Return connection string + credentials (encrypted in env)
}
```

**Key considerations:**
- Supabase Admin API requires `SUPABASE_SERVICE_ROLE_KEY` (in env secrets, not committed).
- Connection string should be encrypted/stored in control-plane DB (encrypted column).
- Error handling: retry logic for transient failures, roll back on failure.
- Logging: audit trail of who provisioned which tenant + when.

**Acceptance Criteria:**
- [ ] Script runs locally and provisions test tenant.
- [ ] Connection string returned + verified (can connect to provisioned DB).
- [ ] TenantMetadata recorded in control-plane.
- [ ] Error handling + rollback tested.

**LLM Model:** Sonnet 4.5 (multi-step provisioning logic + API calls).

---

#### Task 1.5B: Create Tenant Connection Factory Enhancement
**Effort:** 2h | **Day:** 5

**What:** Update `src/lib/tenantDataSource.ts` to dynamically create DataSource instances for each tenant.

**Changes:**
1. Accept tenant_id or connection string.
2. Fetch TenantMetadata from control DB.
3. Decrypt connection string.
4. Create + cache DataSource instance (per-tenant).

**Output:**
```typescript
// src/lib/tenantDataSource.ts
export async function getTenantDataSource(tenantId: string): Promise<DataSource> {
  // 1. Check cache
  if (tenantDataSourceCache.has(tenantId)) {
    return tenantDataSourceCache.get(tenantId);
  }

  // 2. Fetch from control DB
  const tenantMetadata = await controlDataSource
    .getRepository(TenantMetadata)
    .findOne({ where: { tenant_id: tenantId } });

  if (!tenantMetadata) throw new Error(`Tenant ${tenantId} not found`);

  // 3. Decrypt + create DataSource
  const connectionString = decrypt(tenantMetadata.db_connection_string);
  const dataSource = new DataSource({
    type: 'postgres',
    url: connectionString,
    entities: [/* domain entities */],
    synchronize: false,
  });

  await dataSource.initialize();
  tenantDataSourceCache.set(tenantId, dataSource);
  return dataSource;
}
```

**Acceptance Criteria:**
- [ ] Function fetches + caches tenant DataSources.
- [ ] Decryption works correctly.
- [ ] Cache eviction + refresh logic in place (optional for Sprint 1).

**LLM Model:** Sonnet 4.5 (DataSource factory pattern).

---

### Day 5–6: Docker & Local Dev Setup (Phase C)

**Duration:** 1.5 days | **Owner:** DevOps

#### Task 1.6A: Create Dockerfile for Next.js App
**Effort:** 4h | **Day:** 5–6

**What:** Multi-stage Dockerfile for Next.js production build + dev image.

**Output files:**
```
Dockerfile
```

**Dockerfile structure:**
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

**Acceptance Criteria:**
- [ ] Dockerfile builds locally without errors.
- [ ] Built image runs `npm start` successfully on port 3000.
- [ ] Image size < 500MB.

**LLM Model:** Sonnet 4.5 (multi-stage Docker build).

---

#### Task 1.6B: Create docker-compose.dev.yml
**Effort:** 6h | **Day:** 6

**What:** Local dev environment with Postgres, Redis, MinIO, app, healthchecks.

**Output files:**
```
docker-compose.dev.yml
```

**Compose services:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: control_db
    ports: [5432:5432]
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U devuser"], interval: 10s }

  redis:
    image: redis:7-alpine
    ports: [6379:6379]
    healthcheck: { test: ["CMD", "redis-cli", "ping"], interval: 10s }

  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: [9000:9000, 9001:9001]
    command: server /minio-data --console-address ":9001"
    volumes: [minio_data:/minio-data]
    healthcheck: { test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"], interval: 10s }

  app:
    build: .
    environment:
      CONTROL_DATABASE_URL: postgresql://devuser:devpass@postgres:5432/control_db
      NODE_ENV: development
      # ... other env vars
    ports: [3000:3000]
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    volumes: [./src:/app/src]

volumes:
  postgres_data:
  minio_data:
```

**Acceptance Criteria:**
- [ ] `docker-compose -f docker-compose.dev.yml up` starts all services.
- [ ] All healthchecks pass within 30s.
- [ ] App accessible at http://localhost:3000.
- [ ] Services shut down cleanly.

**LLM Model:** Sonnet 4.5 (Docker Compose YAML).

---

### Day 6–7: Supabase Auth + Middleware PoC (Phase D)

**Duration:** 1.5 days | **Owner:** Backend Lead

#### Task 1.4A: Implement JWT Verification Middleware
**Effort:** 6h | **Day:** 6–7

**What:** Update `src/middleware.ts` to:
1. Extract JWT from Authorization header or cookie.
2. Verify RS256 signature against Supabase JWKS.
3. Check session revocation in control-plane DB.
4. Call Permify for permission decision (stub for now).

**Output files:**
```
src/lib/auth/
  ├── jwks-cache.ts (JWKS caching + RS256 verification)
  ├── session-check.ts (session revocation lookup)
  └── permission-check.ts (Permify call wrapper)

middleware.ts (updated)
```

**Code sketch:**
```typescript
// src/middleware.ts
import { jwtVerify } from 'jose';
import { getJWKSKey } from '@/lib/auth/jwks-cache';
import { checkSessionRevoked } from '@/lib/auth/session-check';

export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Verify JWT
    const secret = await getJWKSKey(process.env.SUPABASE_JWKS_URL);
    const verified = await jwtVerify(token, secret);

    // 2. Check session revocation
    const jti = verified.payload.jti as string;
    const revoked = await checkSessionRevoked(jti);
    if (revoked) return NextResponse.json({ error: 'Session revoked' }, { status: 401 });

    // 3. Attach user to request for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', verified.payload.sub as string);
    requestHeaders.set('x-tenant-id', verified.payload.tenant_id as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

**Acceptance Criteria:**
- [ ] Middleware verifies RS256 JWT correctly against JWKS endpoint.
- [ ] Session revocation check works (happy path: session valid; edge case: session revoked → 401).
- [ ] User + tenant ID attached to request headers.
- [ ] Tests pass for all scenarios.

**LLM Model:** Sonnet 4.5 (JWT verification + TypeScript middleware).

---

#### Task 1.4B: Create Session Management Helpers
**Effort:** 3h | **Day:** 7

**What:** Update `src/lib/session.ts` to create + revoke sessions with `jti` in control DB.

**Changes:**
1. `createSession()` — generate JWT + `jti`, store Session record in control DB.
2. `revokeSession()` — mark session as revoked in control DB.
3. `validateSession()` — check if session exists + not revoked.

**Output:**
```typescript
export async function createSession(userId: string, tenantId: string, claims?: Record<string, any>) {
  // 1. Generate JWT with jti
  const jti = crypto.randomUUID();
  const token = await signJWT({
    sub: userId,
    tenant_id: tenantId,
    jti,
    ...claims,
  });

  // 2. Store in control DB
  const session = controlDataSource.getRepository(Session).create({
    jti,
    user_id: userId,
    tenant_id: tenantId,
    claims: JSON.stringify(claims),
    issued_at: new Date(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  await controlDataSource.getRepository(Session).save(session);

  return token;
}

export async function revokeSession(jti: string) {
  // Mark session as revoked (or delete)
  await controlDataSource.getRepository(Session).delete({ jti });
}

export async function validateSession(jti: string): Promise<Session | null> {
  return controlDataSource.getRepository(Session).findOne({ where: { jti } });
}
```

**Acceptance Criteria:**
- [ ] `createSession()` returns valid JWT + stores Session record.
- [ ] `revokeSession()` removes session from DB.
- [ ] `validateSession()` returns Session or null.

**LLM Model:** Sonnet 4.5 (session management + JWT signing).

---

### Day 7–8: Testing & Data Seeding (Phase E)

**Duration:** 1.5 days | **Owner:** QA + Backend Lead

#### Task 1.9A: Middleware Unit Tests
**Effort:** 4h | **Day:** 7–8

**What:** Create unit tests for middleware (JWT verification, session revocation, permission checks).

**Output files:**
```
src/__tests__/
  └── middleware.test.ts
```

**Test cases:**
```typescript
describe('middleware', () => {
  it('should pass valid JWT + non-revoked session', async () => {
    // 1. Create valid JWT + Session record
    // 2. Call middleware
    // 3. Assert NextResponse with headers set
  });

  it('should reject revoked session', async () => {
    // 1. Create JWT but mark session as revoked in DB
    // 2. Call middleware
    // 3. Assert 401 response
  });

  it('should reject invalid JWT signature', async () => {
    // 1. Create JWT with wrong key
    // 2. Call middleware
    // 3. Assert 403 response
  });

  it('should reject expired JWT', async () => {
    // 1. Create expired JWT
    // 2. Call middleware
    // 3. Assert 403 response
  });

  it('should handle missing jti claim', async () => {
    // JWT without jti
    // Assert proper error handling
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases pass.
- [ ] Coverage > 80% for middleware logic.
- [ ] Mock JWKS endpoint + control DB queries.

**LLM Model:** Sonnet 4.5 (test suite generation).

---

#### Task 1.8A: Seed Control-Plane DB
**Effort:** 4h | **Day:** 8

**What:** Create seed script that populates control DB with:
1. Admin user (for testing).
2. Default roles (ADMIN, VENDOR_MANAGER, SALES_EXEC, etc.).
3. Sample tenant metadata.

**Output files:**
```
scripts/seed/
  ├── seed-control-plane.ts (main seeder)
  ├── seed-roles.ts (role defaults)
  └── seed-tenant.ts (sample tenant)
```

**Seed data:**
```typescript
// Admin user in control DB
const adminUser = UserMapping.create({
  user_id: 'admin-user-id',
  tenant_id: 'sample-tenant-id',
  email: 'admin@example.com',
  role: 'ADMIN',
  created_at: new Date(),
});

// Sample tenant
const tenant = TenantMetadata.create({
  tenant_id: 'sample-tenant-id',
  tenant_name: 'Sample Corp',
  db_connection_string: '<encrypted>', // will be set during provisioning
  status: 'active',
  provisioned_at: new Date(),
});
```

**Acceptance Criteria:**
- [ ] Seed script runs without errors.
- [ ] Admin user + roles + tenant created in control DB.
- [ ] Verify data persistence + queries.

**LLM Model:** Sonnet 4.5 (seed data generation).

---

### Day 8–9: Documentation & Final Polish (Phase F)

**Duration:** 1 day | **Owner:** Tech Writer + DevOps

#### Task 1.7A: Create `.env.template`
**Effort:** 2h | **Day:** 8

**What:** Template env file with all required keys + descriptions.

**Output files:**
```
.env.template
```

**Content:**
```bash
# Control Plane Database (Supabase or Local Docker Postgres)
CONTROL_DATABASE_URL=postgresql://user:password@localhost:5432/control_db

# Supabase Auth (for JWT verification)
SUPABASE_JWKS_URL=https://your-supabase-project.supabase.co

# Tenant Database (provisioning)
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Keep secret!

# Permify Policy Engine
POLICY_ENGINE=mock  # or 'permify'
PERMIFY_URL=https://api.permify.example/v1/check
PERMIFY_API_KEY=your-permify-api-key

# Integrations
MAILGUN_API_KEY=your-mailgun-key
EMAIL_FROM=noreply@yourdomain.com
PUBLIC_POSTHOG_KEY=your-posthog-key
SENTRY_DSN=your-sentry-dsn

# Node environment
NODE_ENV=development
```

**Acceptance Criteria:**
- [ ] `.env.template` committed to repo.
- [ ] All required keys documented.
- [ ] Instructions on how to fill values.

**LLM Model:** Haiku (template documentation).

---

#### Task 1.7B: Create DOCKER_SETUP.md
**Effort:** 2h | **Day:** 9

**What:** Documentation for local Docker development setup.

**Output files:**
```
docs/DOCKER_SETUP.md
```

**Content outline:**
```markdown
# Docker Setup for Local Development

## Prerequisites
- Docker Desktop installed
- Docker Compose v2+
- Node.js 18+

## Getting Started
1. Copy `.env.template` to `.env.local`
2. Fill in required values (CONTROL_DATABASE_URL, etc.)
3. Run: docker-compose -f docker-compose.dev.yml up
4. Wait for healthchecks to pass (30s)
5. App available at http://localhost:3000

## Services
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MinIO: http://localhost:9001 (username: minioadmin, password: minioadmin)
- App: http://localhost:3000

## Troubleshooting
- Port conflicts: change port mapping in docker-compose.dev.yml
- DB connection refused: ensure postgres service is healthy (`docker ps`)

## Stopping
docker-compose -f docker-compose.dev.yml down
```

**Acceptance Criteria:**
- [ ] Doc is clear + actionable for new team members.
- [ ] All services documented.
- [ ] Troubleshooting section helpful.

**LLM Model:** Haiku (documentation summarization).

---

#### Task 1.13A: Create DEVELOPERS_GUIDE.md (Partial)
**Effort:** 2h | **Day:** 9

**What:** Quick reference for team (detailed version in Sprint 3).

**Content outline:**
```markdown
# Developers Guide

## Project Structure
```
src/
  ├── app/          # Next.js App Router pages + server actions
  ├── components/   # React components
  ├── entities/     # TypeORM entities
  ├── lib/          # Shared utilities (auth, DB, RBAC, etc.)
  ├── middleware.ts # Request middleware
  └── tests/        # Unit tests
```

## Adding a New Domain Entity
1. Create entity file in `src/entities/{domain}/`
2. Create migration file in `migrations/{domain}/`
3. Run migration: `pnpm typeorm migration:run`
4. Create repository + CRUD functions in `src/lib/repositories/`
5. Create server actions in `src/app/{module}/actions.ts`
6. Create tests

## Auth Flow
[Brief JWT + session explanation]

## Running Locally
See DOCKER_SETUP.md
```

**Acceptance Criteria:**
- [ ] Doc covers basic patterns (entity, migration, server action, test).
- [ ] Helpful for onboarding new developers.

**LLM Model:** Haiku (dev guide summary).

---

### Day 9–10: Sprint Wrap-Up & Validation

**Duration:** 1 day | **Owner:** All

#### Task 1.10: Integration Testing & Demo Prep
**Effort:** 4h | **Day:** 9–10

**What:**
1. Run end-to-end test flow:
   - Spin up docker-compose.
   - Run migrations on control DB.
   - Seed admin user.
   - Create JWT + session.
   - Call middleware (verify + pass).
   - Revoke session + verify 401.

2. Prepare Sprint 1 demo:
   - Show Docker setup working.
   - Show control-plane DB with tables + data.
   - Show middleware JWT verification.
   - Show session revocation in action.

**Acceptance Criteria:**
- [ ] End-to-end flow executes without errors.
- [ ] Demo runs smoothly (< 5 min).
- [ ] Recording or live demo prepared for stakeholders.

**LLM Model:** Haiku (demo notes).

---

#### Task 1.11: Sprint Review & Retrospective
**Effort:** 2h | **Day:** 10

**What:**
1. Review completed work against acceptance criteria.
2. Document blockers + solutions.
3. Retrospective: what went well, what to improve for Sprint 2.
4. Plan Sprint 2 kickoff.

---

## Success Criteria — End of Sprint 1

| Criterion | Status |
|-----------|--------|
| Control-plane TypeORM entities created + compiled | ✅ |
| Migrations run successfully on local/test DB | ✅ |
| Tenant provisioning script tested + works | ✅ |
| Docker Compose fully functional (all services healthy) | ✅ |
| Middleware verifies JWT + checks session revocation | ✅ |
| JWT middleware tests pass (happy + error cases) | ✅ |
| Control-plane seeded with admin + sample tenant | ✅ |
| `.env.template` + DOCKER_SETUP.md documented | ✅ |
| All code committed + PR reviewed + merged to main | ✅ |
| Team able to spin up local dev environment | ✅ |

---

## Risk Mitigation

### High-Risk Items
1. **Database connectivity:** Supabase Admin API might rate-limit or have latency. Solution: use local Docker Postgres for dev; test Supabase provisioning in parallel.
2. **JWKS endpoint:** Supabase JWKS URL might be slow initially. Solution: cache JWKS keys with TTL.
3. **Docker build time:** Multi-stage build might be slow on first run. Solution: pre-pull base images.

### Mitigation Actions
- [ ] Daily standup to surface blockers early.
- [ ] Pair programming for complex tasks (middleware, provisioning script).
- [ ] Slack channel for quick questions.

---

## Dependencies & Prerequisites

### Required Before Sprint Starts
- [ ] Supabase project created + service-role API key in CI secrets.
- [ ] Permify sandbox endpoint available (or mock default).
- [ ] GitHub Actions secrets created (SUPABASE_SERVICE_ROLE_KEY, etc.).
- [ ] Team access to Supabase project + Permify.

### Optional (for later sprints)
- [ ] Mailgun API key (optional for Sprint 1).
- [ ] PostHog project setup (optional for Sprint 1).
- [ ] Sentry project setup (optional for Sprint 1).

---

## Effort Summary & Burn-Down

| Phase | Task | Effort | Actual | Owner |
|-------|------|--------|--------|-------|
| A | Planning | 2h | — | All |
| B | Control entities | 18h | — | Backend Lead |
| B | Tenant provisioning | 10h | — | DevOps |
| C | Docker + Compose | 12h | — | DevOps |
| D | Auth + Middleware | 10h | — | Backend Lead |
| E | Tests | 8h | — | QA |
| E | Seeding | 6h | — | Backend Lead |
| F | Docs | 4h | — | Tech Writer |
| **Total** | — | **70h** | — | — |

**Sprint Capacity (assuming 3 engineers × 40h/week × 2 weeks):** 240h available  
**Sprint 1 Allocated:** 70h (well within capacity)  
**Remaining capacity:** 170h for ad-hoc, blocking issues, code review, testing

---

## Next Steps (Start of Sprint 2)

1. Review Sprint 1 deliverables.
2. Kick off Task 2.1: Core domain entities (Vendor, Product, PO, Sales Order, Employee).
3. Begin Permify schema mapping (parallel stream).
4. Continue any unfinished Sprint 1 tasks.

---

**Sprint 1 Plan Version:** 1.0  
**Last Updated:** October 26, 2025  
**Sprint Start Date:** October 27, 2025 (Monday)  
**Sprint End Date:** November 10, 2025 (Sunday)
