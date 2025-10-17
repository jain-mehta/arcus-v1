# Firebase Command Center — SaaS Architecture Level 3 (Definitive Implementation Blueprint)

Last updated: 2025-10-13

Purpose
-------
This Level 3 document is the final, comprehensive blueprint for implementing the Firebase Command Center as a multi-tenant SaaS product. It expands Level 0, Level 1, and Level 2 documents into a prescriptive plan for engineering teams (backend, frontend, QA, DevOps, security), including API definitions, database schemas, migration steps, microservice boundaries, event topology, CI/CD, IaC, testing matrices, monitoring and runbooks, security policies, and developer workflows. This file is intended to be the single point of truth before development begins.

Scope & audience
-----------------
- Audience: engineering teams building and operating the SaaS platform.
- Scope: full server-side architecture, infra, CI/CD, data migration, runtime behavior, and operational processes. UI implementation details are out of scope except where needed to define API contracts and data shapes.

Executive summary
-----------------
- App stack: Next.js (App Router) + TypeScript for frontend and API gateway. Services written in Node.js/TypeScript using TypeORM and deployed as containerized services.
- Auth and Identity: Supabase Auth as the canonical identity provider. JWTs as short-lived tokens; sessions table for revocation.
- Authorization: Permify (recommended) or Ory Keto as the policy engine for decision-time authorization.
- Data: Per-org Postgres databases (recommended) or per-org schemas (alternative). NoSQL store (MongoDB Atlas) for logs and audit trails. Supabase Storage for attachments.
- Messaging: Pub/Sub adapter pattern with initial implementations for Supabase Realtime and NATS.
- Observability: PostHog for product analytics, Prometheus+Grafana for metrics, MongoDB logs for tracing, Sentry optional for crash reporting.
- CI/CD & IaC: GitHub Actions pipelines + Terraform for infra provisioning (Supabase, MongoDB Atlas, NATS) and Docker images stored at container registry.

Contract & implementation overview
----------------------------------
This document defines:
- Full API contracts (OpenAPI YAMLs in `openapi/` expected)
- Control-plane and tenant DDL and TypeORM migrations
- Microservice boundaries and responsibilities
- Event topology with schemas and delivery semantics
- Operational runbooks, monitoring and SLOs
- Data retention and backup policies
- Developer process: branching, feature flags, module packaging, release procedures

Standards & conventions
-----------------------
- Code: TypeScript, ESLint (Airbnb or project standard), Prettier enforced via GitHub Actions.
- API: OpenAPI v3 for all public/internal endpoints. Each endpoint maps to x-policy-action.
- Ids: UUIDv4 for DB entities, `legacy_id` column for Firestore traceability.
- Time: all timestamps in UTC with `timestamp with time zone`.
- Transactions: domain writes + event inserts + audit logs must be in a single DB transaction where possible.
- Idempotency: all public POST endpoints that create upstream side-effects accept `Idempotency-Key` header.

Table of contents
-----------------
1. Microservice boundaries
2. Full API contracts (summarized; OpenAPI files generated next)
3. Database schemas & migration plan (control-plane + tenant)
4. Event topology & schemas
5. Sequence diagrams (textual + mermaid)
6. CI/CD & IaC plans
7. Testing matrices
8. Monitoring, alerting & runbooks
9. Security, compliance & data protection
10. Session invalidation & permission revocation
11. Feature flag strategy
12. Module packaging, versioning & release strategy
13. Developer workflow & branching
14. Appendix: commands, file locations, and next steps


## 1 Microservice boundaries
We recommend a modular-monolith to start (single Next.js app) with clear module boundaries, then extract into microservices per module as needed. When extracting, follow these service boundaries:

1.1 Control-plane service (single global service)
- Responsibilities:
  - Tenant metadata and lifecycle (TenantMetadata)
  - Sessions / revocation management
  - Policy change publishing and audit
  - Migration jobs tracking
  - Billing metadata and quota enforcement
- Tech: TypeORM, Postgres, REST admin API, policy engine connector
- Deployment: single replicated instance behind load balancer; scaled by control plane load

1.2 Auth & Gateway (Next.js API + middleware)
- Responsibilities:
  - JWT validation and token exchange
  - Request-level policy checks (via policy engine)
  - Tenant routing and DB connection resolution
  - Rate limiting, CORS, CSRF protections
  - Serving front-end
- Tech: Next.js, middleware, edge-friendly deployment (Vercel/Node server)

1.3 Tenant services (domain modules) — deployable per module per tenant or as shared services with per-tenant DB routing
- Examples: Users, Vendors, Inventory, Sales, POs, Communication, KPI
- Responsibilities:
  - Domain logic, DB access, event emission
  - Provide module-level API endpoints under `/api/<module>`
- Initial deployment: shared instances with tenant routing; later per-module microservices if scale requires

1.4 Background workers
- Responsibilities: migration tasks, email workers, event processors, analytics pipelines
- Tech: Node.js workers running in containers or serverless functions (Supabase Edge Functions where feasible)

1.5 Policy Engine
- Responsibilities: decision-time authorization, policy enforcement
- Tech: Permify hosted or Ory Keto deployed via Docker; policy admin UI in control-plane

1.6 Logging & Analytics
- Responsibilities: collect events, forward to PostHog, store detailed logs in MongoDB Atlas
- Tech: Log forwarder service (Node.js) that subscribes to events and pushes to PostHog and log store

1.7 Pub/Sub / Event bus
- Responsibilities: publish/subscribe domain events, guarantee delivery semantics, dead-letter handling
- Tech: NATS (recommended for higher throughput) or Supabase Realtime for simple in-app subscriptions

Service communication
- Synchronous: REST/HTTP + policy engine calls
- Asynchronous: events via Pub/Sub adapter with at-least-once delivery and idempotent handlers

## 2 Full API contracts (summarized)
The full OpenAPI definitions will be added to `openapi/` folder. Below are the detailed contracts for critical endpoints (auth, sessions, users, roles, vendors, purchase_orders). Each includes request/response schemas and status codes.

2.1 Auth & Session endpoints (OpenAPI snippets)

POST /api/auth/login
- Description: Exchange Supabase id_token for platform access_token with server session record.
- Security: none (accept id_token), but endpoints that issue tokens must be rate-limited and monitored.
- Request body JSON Schema:
  - id_token: string (required)
  - device_info?: object
- Responses:
  - 200: { access_token: string, refresh_token?: string, expires_in: number, token_type: 'Bearer', session_id: string }
  - 400: invalid token
  - 429: rate limit
- Side-effects:
  - Validate id_token with Supabase Admin API
  - Create `sessions` in control-plane with `jti` (session_id)

GET /api/auth/me
- Security: Bearer
- Response: 200 { id, email, name, roles: ["roleId"], tenant: { org_slug }}

POST /api/auth/logout
- Security: Bearer
- Request: { session_id?: string }
- Response: 204
- Side-effects: mark session.revoked_at

2.2 Users
POST /api/users
- Security: Bearer (requires policy check: users.create)
- Request: { email, name?, roleId?, invite?: boolean, metadata?: object }
- Response: 201 { id, email, name, roleId }
- Side-effects: Create Supabase user via admin API if not existing; create tenant user; emit user.created event

GET /api/users/{id}
- Security: Bearer (policy: users.view)
- Response: 200 user schema or 404

2.3 Roles
POST /api/roles
- Security: Bearer (policy: roles.manage)
- Request: { name, permissions: [{ action, resource, condition? }] }
- Response: 201 role
- Side-effects: upsert role in tenant DB, push policy delta to policy engine, record in policy_changes

POST /api/roles/import
- Accept JSON file, validate, apply roles to tenant DB and push to policy engine

2.4 Vendors & Purchase Orders
POST /api/vendors
- Security: Bearer (policy: vendors.create)
- Request: { name, metadata, documents? }
- Response: 201 vendor
- Side-effects: create vendor record, write event, store attachments in Supabase Storage

POST /api/purchase-orders
- Security: Bearer (policy: po.create)
- Request: { vendor_id, lines: [{ product_id, qty, price }], metadata }
- Response: 201 { id, status }
- Side-effects: transactional write, event emission, audit log

API design notes
- All APIs must include `x-policy-action` in OpenAPI for policy mapping and automated policy import tooling.
- All sensitive API responses must strip PII unless caller policy allows.
- All POST endpoints that mutate state accept `Idempotency-Key` header and implement idempotency.

## 3 Database schemas & migration plans
This section contains control-plane and tenant DDL and the migration plan from Firestore.

3.1 Control-plane DDL (authoritative)
Files: `migrations/control/20251013_create_control_tables.sql` (already added)

Control-plane tables:
- sessions (id, user_id, jti, issued_at, expires_at, revoked_at, device_info, last_seen)
- user_mappings (id, legacy_uid, supabase_user_id, created_at)
- tenant_metadata (id, org_slug, db_connection_string, plan, created_at)
- policy_changes (id, author, delta, applied_at)
- migration_jobs (id, name, status, last_processed_key, metadata, created_at, updated_at)

3.2 Tenant DDL (authoritative)
Files: `migrations/tenant/<org>/` per-tenant migrations generated by TypeORM or SQL
Core tenant tables:
- users (id, email, name, metadata, legacy_id, created_at)
- roles (id, name, permissions JSONB, legacy_id)
- vendors (id, name, metadata, legacy_id, created_at)
- purchase_orders (id, vendor_id, created_by, status, metadata, created_at)
- events (id, type, payload, created_at)
- audit_logs (id, request_id, tenant_id, user_id, module, action, resource, policy_trace, timestamp, meta)

3.3 Migration plan (FireStore -> Postgres)
Phases:
- Phase 0: prepare control-plane (provision Supabase, Postgres instances, policy engine, and create `user_mappings`, `sessions`, `tenant_metadata` tables).
- Phase 1: Auth sync — provision Supabase users, create `user_mappings` between Firebase UID and Supabase user id.
- Phase 2: Roles & policies — export Firestore roles and push canonical policy into policy engine; validate parity with local checks.
- Phase 3: Module-by-module migration — run idempotent migration scripts for Vendors, Products, POs, etc. Use `legacy_id` for each migrated row.
- Phase 4: Canaries & cutover — run per-module read-switch and Canary tenants, validate E2E.
- Phase 5: Full cutover and decommission Firestore (only after reconciliation).

Migration scripts guidelines:
- Implement as resumable batch jobs with progress persisted in `migration_jobs`.
- Use controlled throttling and backoff; respect Supabase rate limits.
- Provide reconciliation jobs to reconcile counts and data fidelity.

## 4 Event topology & schemas
Event storage and publishing model:
- Each domain write emits an event with `id` (uuid) and `created_at`.
- Event written to tenant `events` table in same transaction as domain write.
- Event published to Pub/Sub adapter after commit.
- Consumers subscribe with idempotency on `event.id`.

Event examples (canonical):
- user.created
- role.updated
- purchase_order.created
- inventory.reserved
- message.sent

Event schema sample (JSON Schema provided in `events/schemas/`):
{
  "$id": "purchase_order.created",
  "type": "object",
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "tenant_id": { "type": "string", "format": "uuid" },
    "payload": { "type": "object" }
  },
  "required": ["id", "tenant_id", "payload"]
}

Delivery semantics: at-least-once for PoC. Support for ordering via per-tenant sequence numbers if needed.

## 5 Sequence diagrams
Below are mermaid-style textual diagrams to paste into mermaid-live or documentation systems.

5.1 Login and session issuance

sequenceDiagram
  participant Client
  participant NextAPI as Next.js API
  participant Supabase as Supabase Auth
  participant Control as Control-Plane DB

  Client->>Supabase: signIn(email/password)
  Supabase->>Client: id_token
  Client->>NextAPI: POST /api/auth/login { id_token }
  NextAPI->>Supabase: verify id_token
  Supabase-->>NextAPI: user info
  NextAPI->>Control: create session (jti)
  Control-->>NextAPI: session created
  NextAPI-->>Client: access_token (+jti), refresh cookie

5.2 Authorize request

sequenceDiagram
  participant Client
  participant NextAPI
  participant Control
  participant Policy as Policy Engine

  Client->>NextAPI: GET /api/vendors
  NextAPI->>Policy: decision(principal, action, resource)
  Policy-->>NextAPI: allow/deny
  NextAPI->>Control: check session jti revoked?
  Control-->>NextAPI: session ok
  NextAPI-->>Client: 200 with data

5.3 Create PO (transactional write + event)

sequenceDiagram
  participant Client
  participant NextAPI
  participant TenantDB
  participant Events
  participant PubSub
  participant Audit

  Client->>NextAPI: POST /api/purchase-orders
  NextAPI->>TenantDB: begin transaction
  TenantDB->>TenantDB: insert purchase_orders
  TenantDB->>TenantDB: insert events
  TenantDB-->>NextAPI: commit
  NextAPI->>PubSub: publish purchase_order.created
  NextAPI->>Audit: write audit log
  NextAPI-->>Client: 201 { id }

## 6 CI/CD & IaC plans
6.1 Infrastructure as Code (IaC)
- Use Terraform to manage Supabase provisioning (if supported by cloud provider), MongoDB Atlas resources, NATS, and DNS/Network.
- Keep state in Terraform Cloud or a secure S3 + remote state locking.
- Reuse module patterns for tenant DB provisioning.

6.2 CI/CD pipelines (GitHub Actions)
- Branch policy: PRs must pass lint, type-check, unit tests, and run a subset of integration tests.
- Pipeline steps for PRs:
  - checkout
  - install deps
  - lint + typecheck
  - unit tests
  - run lightweight integration tests (using local DB via Docker)
- Pipeline steps for main/merge to main:
  - run full tests (including Playwright E2E in staging)
  - build container images and push to registry
  - run migration validation (dry-run)
  - deploy to staging
- Production deploys via GitHub Release / manual promotion with approval gates and smoke tests.

6.3 Migrations & schema changes
- Migrations stored in repo via TypeORM migration files.
- CI runs `typeorm migration:show` and `migration:generate` validation steps.
- Online migrations strategy:
  - Make additive changes first (new columns, tables)
  - Backfill data in background jobs
  - Swap reads to new columns and remove old fields in a later migration

## 7 Testing matrices
Matrix describes test types, scope, and sample coverage targets.

7.1 Unit tests
- Scope: business logic, policy adapter mocks, repository unit tests
- Tools: Vitest / Jest
- Target: 80% coverage per module

7.2 Integration tests
- Scope: repository + DB, middleware + policy engine test double
- Tools: Node test runner, Docker Compose for Postgres
- Target: cover critical flows (login, create user, create PO, permission change)

7.3 E2E tests
- Scope: full stack with staging infra (Supabase, Policy Engine, MongoDB)
- Tools: Playwright
- Target: nightly runs + pre-release runs

7.4 Performance tests
- Scope: API throughput, DB write contention, migration scripts
- Tools: k6 or Artillery
- Target: identify bottlenecks; baseline tps for purchase_orders write path

7.5 Security tests
- Scope: OWASP top-10, auth bypass, key rotation, policy tampering
- Tools: ZAP, custom scripts
- Schedule: weekly automated scans + manual pen-test before GA

## 8 Monitoring, alerting & runbooks
8.1 Monitoring stack
- Metrics: Prometheus + Grafana for service metrics and DB health
- Traces: OpenTelemetry collector sending traces to Honeycomb or Grafana Tempo
- Logs: MongoDB Atlas (hot store) + archived S3 cold store
- Alerts: PagerDuty integration for high-severity incidents

8.2 SLOs & SLAs
- Availability: 99.95% for control-plane, 99.9% for tenant services (monitor per-tenant failures)
- Error rate: <0.1% 5xx for API
- Latency: 95th percentile < 500ms for common endpoints

8.3 Runbooks (short)
- Incident: high error rate (>1%)
  - Step 1: check control-plane DB health
  - Step 2: check policy engine health
  - Step 3: verify recent deployment and roll back
- Incident: policy-engine down
  - Step 1: enable fail-open or degrade to conservative deny depending on policy
  - Step 2: activate cached allow-lists for safe short window
  - Step 3: alert on-call

## 9 Security, compliance & data protection
9.1 Secrets management
- Store secrets in GitHub Secrets / Vault. Rotate keys periodically.
9.2 Data encryption
- DB: provider-managed at rest encryption
- Application-level: encrypt integration secrets and PII fields
9.3 Access control
- Principle of least privilege for service accounts
- Admin actions require multi-step approval via control-plane UI and audit logging
9.4 Audit & retention
- Audit logs stored in MongoDB with retention 90 days hot; archive to S3 for 7 years per compliance needs

## 10 Session invalidation & permission revocation
10.1 Session flow
- JWTs issued on login include `jti` referencing `sessions.id`.
- Middleware verifies JWT signature and `exp`, then performs revocation check by querying `sessions` (control-plane).

10.2 Revocation flow (permission change)
- When a role changes or a user's permissions change:
  - Update role in tenant DB
  - Push policy delta to policy engine
  - Query affected user ids
  - Mark sessions for those users as revoked (`revoked_at`)
  - Optionally publish `user.permissions.revoked` events
- Subsequent requests will fail revocation check and require re-authentication.

10.3 Performance considerations
- Revocation check is a single read to control-plane; if high QPS, use read-replicas or caching on the middleware with short TTLs.

## 11 Feature flag strategy
- Use LaunchDarkly or open-source Unleash for flags
- Flags defined per-module and per-tenant
- Flag lifecycle: create -> test (staging) -> enable for canary tenants -> ramp -> full rollout
- Provide `flags` API in control-plane to expose flags to frontend and backend

## 12 Module packaging, versioning & release
- Module structure: `src/modules/<module>` with `module.json` manifest (name, version, migrations, featureFlags)
- Versioning: semantic versioning per module (major.minor.patch)
- Packaging: export module migrations + API contract for shipping module to customers or microservice extraction

## 13 Release & rollback strategies
- Canary release pattern: deploy to small subset of tenants, validate metrics and logs, then promote
- Rollback: keep previous container image and database rollback scripts (if destructive changes, follow multi-step migration protocol)
- Blue/Green for control-plane where possible; maintain read-only fallback to Firestore during critical phases

## 14 Developer workflow & branching
- Branching model: GitHub Flow (feature branches) + protected `main` branch
- PR requirements: must pass lint, typecheck, unit tests, and integration smoke tests before merge
- Code owners for sensitive areas (auth, migrations, policy) require review from security/infra
- Local dev setup:
  - `npm run dev` (Next.js)
  - `docker-compose up` for control-plane Postgres, tenant Postgres, NATS, MongoDB, policy-engine test double

## 15 Testing & validation before cutover
- Run full migration in staging and execute end-to-end Playwright tests and reconciliation reports
- Run security scan and pen-test on staging
- Performance benchmark for purchase_orders and migration scripts

## 16 Data retention & backup policies
- Daily snapshots for control-plane DB retained 30 days hot, 1 year cheap, archived to S3 for 7 years
- Tenant DB backups: daily full snapshot + PITR (if supported by provider)
- Audit logs: 90 days hot in MongoDB, archive to S3 monthly

## 17 Ops, support & runbooks (excerpts)
- On-call rotation: documented and integrated with PagerDuty
- Post-incident reviews: mandatory within 48 hours
- Playbook: step-by-step for major incidents included in internal runbook repo (not in this document)

## Appendix: implementation artifacts (where to find)
- Level 0: `SAAS_ARCHITECTURE.md`
- Level 1: `SAAS_ARCHITECTURE_level_1.md`
- Level 2: `SAAS_ARCHITECTURE_level_2.md`
- Control migrations: `migrations/control/20251013_create_control_tables.sql`
- Entities: `src/lib/entities/*` (control + tenant samples)
- Control DataSource: `src/lib/controlDataSource.ts`
- Tenant DataSource: `src/lib/tenantDataSource.ts`


## Next steps (immediate tasks)
- Confirm ORM vs Sequelize choice (default: TypeORM)
- Confirm tenancy model (default: per-org DB)
- Finalize policy engine vendor (Permify recommended)
- Generate OpenAPI YAML files and client SDKs
- Implement middleware PoC and policy adapter
- Run staging migration and E2E tests



*** End of Level 3
