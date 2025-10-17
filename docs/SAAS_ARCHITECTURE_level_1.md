# Firebase Command Center — SaaS Architecture Level 1 (Detailed)

Last updated: 2025-10-13

Purpose
-------
This Level 1 architecture document expands the authoritative Level 0 `SAAS_ARCHITECTURE.md` into a developer-ready, module-by-module and service-by-service blueprint. It provides concrete data models, API contracts, data-flows, tenancy/connection routing, TypeORM examples, session and policy-engine integration patterns, Pub/Sub adapter design, logging/audit guidance, and migration skeletons. The goal is to be directly actionable by developers to start implementing services.

Scope & audience
----------------
- Audience: backend engineers, infra engineers, and senior full-stack devs.
- Scope: server-side modules, database designs, policy integration, session lifecycle, migration, and operational guidance. This does not include UI-level components beyond API contracts.

Assumptions & decisions inherited from Level 0
---------------------------------------------
- Supabase Auth is the canonical identity provider. JWTs are primary tokens.
- Sessions are short-lived JWTs validated per-request; the control plane maintains a `sessions` table for revocation.
- Live policy engine (Permify or Ory Keto) is the authoritative decision source.
- Use TypeORM (default) or Sequelize; TypeORM examples are used here.
- Tenancy: default recommendation is per-org database; per-org schema is supported as a cost-optimized alternative.
- Logs and audits are stored in a NoSQL DB for retention and queryability; PostHog is the telemetry/analytics store.

Deliverables in this doc
------------------------
- Module-level responsibilities and service APIs
- Data model and TypeORM entity examples
- Tenancy routing and connection management
- Session validation, revocation, and middleware sample for Next.js
- Policy engine integration and policy lifecycle
- Pub/Sub adapter and events bus design
- Logging, audit schema and retention guidance
- Migration skeletons and runbook for users & roles
- Checklist and next implementation tasks

## 1 — Module-level breakdown and APIs
Each module lives under `src/modules/<module-name>` and exports a module manifest `module.json`.

Manifest sample (module.json)
{
  "name": "vendor",
  "version": "1.0.0",
  "migrations": ["migrations/20251013_create_vendors.sql"],
  "featureFlags": ["vendors.enabled"],
  "deps": ["users"]
}

General API patterns
- Server actions: `src/modules/<module>/server/actions.ts` (exported named functions used by Next.js server actions).
- REST: `src/modules/<module>/api/*.ts` for external API endpoints (authentication + policy checks enforced).
- Events: modules emit domain events to central event bus (see Pub/Sub adapter) and write audit entries.

1.1 User Management & RBAC
Responsibilities:
- CRUD users, manage invites, map legacy UIDs
- CRUD roles and permissions catalog
- Export/import role definitions

APIs (examples):
- POST /api/users (create user) — body: {email, name, orgId, roleId}
- GET /api/users/:id — returns user profile and role(s)
- POST /api/roles — create role with permissions
- POST /api/roles/import — import role JSON to policy engine

1.2 Vendor Management
Responsibilities: vendor onboarding, vendor docs, material mappings
APIs:
- GET /api/vendors?orgId={org}
- POST /api/vendors {name, metadata, documents}
- POST /api/vendors/:id/documents (signed upload)

1.3 Inventory & Product Master
Responsibilities: product catalog, warehouses, stock movements
APIs:
- GET /api/products
- POST /api/products
- POST /api/inventory/transfer

1.4 Sales & Quotation, Supply Chain, HRMS, Communication, KPI
- Similar patterns: clear CRUD + event emitters + audit writes. Specifics are module scoped.

## 2 — Data model and TypeORM examples
Use a primary control-plane DB for global metadata and tenant routing (TenantMetadata, Sessions, UserMappings). Each tenant has a transactional DB/schema for business tables.

2.1 Control-plane entities (TypeORM)
Path: `src/lib/entities/control` — these run in the global metadata DB.

Example: `src/lib/entities/control/UserMapping.ts`

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'user_mappings' })
export class UserMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  legacy_uid: string; // firebase uid

  @Index({ unique: true })
  @Column({ type: 'text' })
  supabase_user_id: string;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  created_at: Date;
}

Example: `Session` entity

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'text' })
  user_id: string; // supabase user id

  @Column({ type: 'timestamp with time zone' })
  issued_at: Date;

  @Column({ type: 'timestamp with time zone' })
  expires_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revoked_at: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  device_info: any;
}

Example: `TenantMetadata` entity

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'tenant_metadata' })
export class TenantMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  org_slug: string;

  @Column({ type: 'text' })
  db_connection_string: string; // for per-org DB

  @Column({ type: 'jsonb', default: () => "'{}'" })
  plan: any; // billing / quota info
}

2.2 Tenant entities (per-tenant DB/schema)
Example: `User`, `Role` in tenant DB

import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;
}

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'jsonb' })
  permissions: any; // canonical policy fragment; synced to policy engine
}

2.3 Indexing & partitioning guidance
- Use GIN indexes on JSONB permission blobs where you filter on keys.
- For tenant DBs, consider partitioning large tables (events, audit_logs) by time.

## 3 — Tenancy routing & connection management
Two topologies

A) Per-org DB (recommended)
- TenantMetadata contains `db_connection_string`.
- A tenant router (singleton) establishes TypeORM connection pools per tenant lazily.
- Use a connection manager to reuse connections; keep max connections controlled via pooling.

Sample Connection Manager (pseudo):

import { DataSource } from 'typeorm';
import { TenantMetadata } from './entities/control/TenantMetadata';

const connectionCache = new Map<string, DataSource>();

export async function getTenantDataSource(orgSlug: string) {
  if (connectionCache.has(orgSlug)) return connectionCache.get(orgSlug)!;
  const meta = await controlPlaneRepo.findOneBy({ org_slug: orgSlug });
  const ds = new DataSource({ type: 'postgres', url: meta.db_connection_string, entities: tenantEntities });
  await ds.initialize();
  connectionCache.set(orgSlug, ds);
  return ds;
}

B) Per-org schema
- Use a single DB connection. Set `search_path` per connection to tenant schema before queries.
- Create migration tooling that applies schema-level migrations.

Security notes
- Rotate DB credentials per-tenant periodically.
- Limit connection pool per tenant to avoid resource exhaustion.

## 4 — Session validation & revocation flow (Next.js middleware)
This example shows how to validate Supabase JWT and check `sessions` table on each request.

Middleware sketch (server-side)

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getControlRepo } from '@/lib/controlDataSource';
import { Session } from '@/lib/entities/control/Session';

export async function middleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.redirect('/login');
  const token = authHeader.replace('Bearer ', '');

  // Verify JWT signature (Supabase public key)
  const payload = jwt.verify(token, process.env.SUPABASE_JWK || '', { algorithms: ['RS256'] });
  const userId = payload.sub as string;

  // Check session revocation
  const repo = getControlRepo(Session);
  const session = await repo.findOneBy({ id: payload.jti });
  if (!session || session.revoked_at) {
    return new NextResponse(null, { status: 401 });
  }

  // Attach user info to request (example)
  (req as any).user = { id: userId, tenant: payload['tenant'] };

  return NextResponse.next();
}

Notes:
- Use JWT `jti` to map to session.id. If Supabase JWTs don't include `jti`, issue a short-lived session token on login that you store in sessions table and return as a cookie or bearer token.
- For performance, verify signature locally; revocation check is a single DB read. Consider a read-replica for control plane if traffic is very high.

## 5 — Policy engine integration (Permify / Ory)
Policy request pattern
1) The app constructs a decision request: { principal: userId, action: 'vendors.create', resource: { org: orgSlug, vendorId } }
2) Call policy engine API: POST /v1/decision
3) Policy engine returns allow/deny and optionally a trace.

Sample decision call (node)

import fetch from 'node-fetch';

export async function checkPolicy(userId, action, resource) {
  const resp = await fetch(process.env.POLICY_ENGINE_URL + '/v1/decision', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.POLICY_ENGINE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ principal: userId, action, resource })
  });
  const data = await resp.json();
  return data.allow === true;
}

Policy lifecycle
- Author policies and role bindings in SQL backed control-plane UI.
- On change: push policy deltas to the policy engine and record the change in `policy_changes` table for audit.
- Tests: include policy unit tests that exercise boundaries (e.g., manager can view team orders but not edit others').

Caching guidance
- No long-lived caches. Use per-request memoization only.
- If you need faster checks, generate ephemeral allow-lists from the policy engine with short TTL and use them for that time slice.

## 6 — Pub/Sub adapter & event bus
Event bus table (tenant DB or control plane for global events)

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

Adapter pattern (pseudo)

interface PubSubAdapter {
  publish(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload) => Promise<void>): Promise<void>;
}

Implementations:
- SupabaseRealtimeAdapter (for in-app low throughput)
- NATSAdapter
- GCPPubSubAdapter

Event flow example
- When a PO is created: write PO row (tenant DB), emit `purchase_order.created` event to the bus, write audit log, and publish to adapter.
- Background processors subscribe to `purchase_order.created` for downstream tasks (inventory reservation, notifications).

## 7 — Logging & audit
- Audit log model (NoSQL): document with { request_id, tenant_id, user_id, module, action, resource, policy_trace, timestamp, meta }
- Denormalize policy_trace into log for easy forensic review.
- Retention: keep hot logs for 90 days, archive to cold storage (S3) or cheaper tiers thereafter.
- Provide a log-forwarder that listens to events and writes summaries to PostHog.

## 8 — Migration skeletons & runbook
8.1 Users & Roles migration script (pseudo)
- Read users/roles from Firestore in batches.
- For each user: create Supabase user if missing (via Supabase Admin API), insert mapping in `user_mappings`, and create tenant user in tenant DB.
- For roles: migrate role definition to tenant DB and push canonical policy to policy engine.

Idempotency
- Use `legacy_id` (original Firestore doc id) when creating rows; upsert on conflict to ensure idempotent operations.

Resumability
- Persist progress markers in `migration_jobs` table with last_processed_doc and state.

8.2 Runbook (high-level)
- Create staging migration run and validate with E2E tests.
- For production, freeze writes for a short maintenance window if dual-write isn't feasible.
- Validate counts and run reconciliation jobs.

## 9 — Security & operational notes
- Enforce per-tenant RBAC for DB access in control plane tooling.
- Rotate keys and use short-lived credentials for background workers.
- Rate limit policy engine and add retries / circuit-breaker patterns.

## 10 — Checklist & next steps
- [x] Draft Level 1 doc (this file)
- [ ] Implement TypeORM entities and migration files (todo 2)
- [ ] Implement session middleware PoC (todo 3)
- [ ] Implement policy engine PoC (todo 4)
- [ ] Create migration scripts for users & roles and test in staging (todo 5)
- [ ] Review with architecture and infra teams (todo 6)

Appendix: Helpful snippets & references
- TypeORM docs: https://typeorm.io/
- Permify docs: https://docs.permify.co/
- Ory Keto docs: https://www.ory.sh/keto/
- Supabase Auth JWT docs: https://supabase.com/docs/guides/auth



