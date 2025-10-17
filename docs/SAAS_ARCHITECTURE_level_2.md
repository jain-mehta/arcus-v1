now we# Firebase Command Center — SaaS Architecture Level 2 (API, Data-Flow & Implementation)

Last updated: 2025-10-13

Purpose
-------
This Level 2 document translates the Level 1 module-level design into actionable API contracts, database DDL, event models, sequence flows, security requirements, and an operational runbook. It's written for engineers implementing services, APIs, infra, and migration scripts.

Scope
-----
- API contracts for Auth, Users, Roles, Sessions, Vendors, Products, Purchase Orders
- Control-plane DDL and tenant DDL (SQL + TypeORM migration guidance)
- Event schemas and Pub/Sub adapter specs
- Sequence flows (login, authorize request, create PO, permission change, migration flow)
- Security policies and operational runbook

Assumptions & constraints
------------------------
- Supabase Auth as identity provider; JWTs are canonical tokens.
- TypeORM is the reference ORM. If you prefer Sequelize, the same DDL applies; adapt examples accordingly.
- Default tenancy: per-org DB. Per-org schema alternative described where relevant.
- Policy engine: support Permify and Ory Keto; examples use a generic policy API.

Contents
--------
1. API contracts (OpenAPI skeletons)
2. Control-plane DDL (SQL) + TypeORM migration notes
3. Tenant DDL (SQL) + TypeORM entity mapping notes
4. Event models & Pub/Sub adapter
5. Sequence flows (textual diagrams)
6. Security & compliance requirements
7. Operational runbook and rollout plan
8. Appendix: CLI & scripts examples

## 1 — API contracts (OpenAPI skeletons)
Below are compact OpenAPI-style skeletons (YAML-like) for the core endpoints. They include auth requirements and sample payloads.

1.1 Auth & Sessions

POST /api/auth/login
- Auth: Bearer (Supabase) or body token
- Request: { id_token: string }
- Response: { access_token: string, refresh_token?: string, expires_in: number, token_type: 'Bearer', session_id: string }

POST /api/auth/logout
- Auth: Bearer
- Request: { session_id?: string }
- Response: 204 No Content

GET /api/auth/me
- Auth: Bearer
- Response: { id, email, name, roles: ["tenant:roleId"], tenant: { org_slug } }

1.2 Users

POST /api/users
- Auth: Bearer (requires admin.manage_users)
- Request: { email, name?, roleId?, invite?: boolean }
- Response: 201 { id, email, name, roleId }

GET /api/users/{id}
- Auth: Bearer (requires users.view)
- Response: 200 { id, email, name, metadata }

1.3 Roles

POST /api/roles
- Auth: Bearer (requires roles.manage)
- Request: { name, permissions: [{ action: string, resource: string, condition?: object }] }
- Response: 201 { id, name, permissions }

POST /api/roles/import
- Auth: Bearer (requires roles.manage)
- Request: { rolesJson: object }
- Response: 200 { imported: number }

1.4 Vendor / Products / POs (examples)

POST /api/vendors
- Auth: Bearer (requires vendors.create)
- Request: { name, metadata, documents?: [ { name, signedUrl } ] }
- Response: 201 { id, name }

POST /api/purchase-orders
- Auth: Bearer (requires po.create)
- Request: { vendor_id, lines: [{ product_id, qty, price }], metadata }
- Response: 201 { id, status: 'created', created_at }

OpenAPI notes
- Each protected endpoint includes an `x-policy-action` header or annotation mapping endpoint -> policy action for easy policy import.

## 2 — Control-plane DDL (SQL) + TypeORM migration notes
Control-plane runs on a central metadata DB. This includes sessions, tenant metadata, user mappings, policy changes, migration jobs.

2.1 SQL DDL (Postgres)

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  jti TEXT UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  device_info JSONB NULL,
  last_seen TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- user_mappings
CREATE TABLE IF NOT EXISTS user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_uid TEXT UNIQUE NOT NULL,
  supabase_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- tenant_metadata
CREATE TABLE IF NOT EXISTS tenant_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_slug TEXT UNIQUE NOT NULL,
  db_connection_string TEXT NOT NULL,
  plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- policy_changes
CREATE TABLE IF NOT EXISTS policy_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  delta JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- migration_jobs
CREATE TABLE IF NOT EXISTS migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_processed_key TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

2.2 TypeORM migration notes
- Use TypeORM's migration generators or write SQL-based migrations in `src/migrations/control`.
- Each migration file should be idempotent and safe to re-run if aborted.

## 3 — Tenant DDL (SQL) + TypeORM mapping notes
Tenant DBs host domain tables (users, roles, vendors, products, orders, events).

3.1 Core tenant SQL (example)

-- users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NULL,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  permissions JSONB NOT NULL,
  legacy_id TEXT NULL
);

-- vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- events (tenant-scoped)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

3.2 TypeORM mapping notes
- Keep entities lightweight and use repository pattern.
- Provide `legacy_id` fields for idempotent migration.
- Use explicit transactional boundaries when writing domain data + events + audit rows.

## 4 — Event models & Pub/Sub adapter
Define canonical event schemas for domain events. Store a copy in tenant `events` table and publish via adapter.

4.1 Event schema: `purchase_order.created`
{
  "id": "uuid",
  "tenant_id": "uuid",
  "type": "purchase_order.created",
  "payload": {
    "po_id": "uuid",
    "vendor_id": "uuid",
    "created_by": "uuid",
    "lines": [{ "product_id": "uuid", "qty": number, "price": number }]
  },
  "created_at": "timestamp"
}

4.2 Adapter contract (TypeScript)

export interface PubSubAdapter {
  publish(topic: string, payload: any): Promise<void>;
  subscribe(topic: string, handler: (payload: any) => Promise<void>): Promise<void>;
}

4.3 Delivery guarantees
- Use at-least-once delivery for initial PoC. Event handler must be idempotent using `event.id`.
- For higher guarantees, integrate with ack-based systems (NATS, Pub/Sub) and implement dead-letter queues.

## 5 — Sequence flows (textual diagrams)
5.1 Login (Supabase Auth -> Session issuance)

Client -> Supabase Auth: signIn(email/password)
Supabase -> Client: ID token
Client -> Next.js /api/auth/login: { id_token }
Next.js -> Supabase Admin: verify id_token, fetch user
Next.js -> control-plane: create Session entry (jti or generated session id)
Next.js -> Client: return access_token (with jti) and set refresh cookie

5.2 Authorize request (middleware)

Client -> Next.js (API)
Next.js middleware: verify JWT signature -> read `jti` -> control-plane sessions repo to ensure not revoked
Next.js -> policy engine: decision request (principal, action, resource)
Policy engine -> Next.js: allow/deny
If allow -> proceed to handler; else -> 403

5.3 Create Purchase Order

Client -> Next.js POST /api/purchase-orders
Middleware -> validate + policy check
Handler -> begin transaction
Handler -> insert purchase_orders row
Handler -> insert event row in tenant events table
Handler -> insert audit log in NoSQL
Handler -> publish event via PubSubAdapter
Commit transaction
Respond 201 { id }

5.4 Permission change & session revocation

Admin -> Next.js POST /api/roles/:roleId/permissions (change)
Handler -> update role row in tenant DB
Handler -> write policy delta to `policy_changes` in control-plane and push to policy engine
Handler -> find affected users via role membership queries
Handler -> mark `sessions` for those users as revoked (set revoked_at)
Result: subsequent requests fail revocation check

5.5 Migration flow (Firestore -> Tenant DB)

Migration process -> read Firestore batch
For each doc: upsert tenant row using `legacy_id`
Write progress to `migration_jobs`
On completion: mark migration job complete

## 6 — Security & compliance requirements
- Token validation: always validate JWT signature and `exp` locally using Supabase's JWKS.
- Session revocation: check `sessions` table for `revoked_at` on each request.
- Least privilege: background jobs use tenant-scoped service accounts with minimal permissions.
- Encryption: at-rest encryption for DBs (managed by provider) and application-level encryption for sensitive fields (integration tokens).
- Auditability: every mutation writes an audit entry to the NoSQL audit store with policy_trace and request_id.
- Rate limiting & WAF: front the API with rate limits and WAF rules to prevent abuse.

## 7 — Operational runbook & rollout plan
7.1 Local dev
- Docker Compose: Postgres (control + tenant), local policy engine test double, local NoSQL (MongoDB), and Supabase Auth emulator (or test Supabase project).

7.2 Staging
- Provision Supabase project, policy engine instance, MongoDB Atlas dev cluster.
- Run full migration against staging and execute Playwright E2E tests.

7.3 Production cutover steps
1) Provision Supabase Auth and create user mappings table
2) Run users & roles migration, sync to policy engine and validate
3) Enable tenant DBs and shard a small subset of tenants (canary)
4) Gradually increase traffic to new stacks; maintain Firestore read-only fallback for old tenants until validated
5) Decommission Firestore once reconciliation completes

7.4 Backout plan
- Keep Firestore read adapters available and switch reads back if severe issues occur.
- Retain `legacy_id` mapping to reconcile late writes.

## 8 — Appendix: CLI & scripts examples
8.1 Example migration call (node)

node scripts/migrate/firestore-to-postgres.mjs --collection users --batch-size 500

8.2 Health check endpoint
GET /api/health
Response: { ok: true, db: 'ok', policy_engine: 'ok', storage: 'ok' }



## Next actions & deliverables
- Generate OpenAPI YAML files for core endpoints (todo 2)
- Produce TypeORM migration SQLs for control-plane tables (todo 3)
- Implement the Next.js middleware PoC (todo 5)
- Build migration script skeletons and test in staging (todo 6)



