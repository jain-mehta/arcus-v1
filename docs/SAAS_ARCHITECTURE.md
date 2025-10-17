
# Firebase Command Center — Authoritative SaaS Architecture (master)

Last updated: 2025-10-13

Purpose
-------
This is the authoritative, final architecture reference for the Firebase Command Center migration to a free-first SaaS platform. It reflects the project's required decisions:

- Replace Firebase Authentication with Supabase Authentication as the canonical auth provider for core user management.
- Use JWTs as the primary session/authorization token; maintain a session invalidation table for immediate revocation.
- Use a live policy engine (Permify or Ory Keto) for granular authorization and avoid durable permission caches for decision-time checks.
- Replace Prisma with a battle-tested relational ORM (TypeORM or Sequelize) per team preference; examples here use TypeORM.
- Store long-term logs in a NoSQL store (MongoDB Atlas or managed Firestore) and use PostHog for analytics and product telemetry.
- Containerize services with Docker for reproducible builds and local parity.
- Adopt per-organization tenancy via separate database instances or per-org schemas (no global `org_id` reliance for row-level tenancy by default).
- Use Firebase services selectively for AI/ML augmentation (model orchestration, embeddings, or GenAI connectors) where required.

Design goals & constraints
-------------------------
- Free-first: use free or free-tier services for early-stage customers (Supabase free tier, PostHog cloud free tier, MongoDB Atlas free tier where possible).
- Security-first: strong CSRF, CORS, rate-limiting, security headers, and least-privilege service accounts.
- Live authorization: policy engine must be authoritative for permission decisions (no long-term caching of permissions; ephemeral caching for single-request optimization allowed).
- Instant session invalidation: changing permissions or disabling a user must immediately prevent access via a dedicated `sessions`/`revocations` table checked at request time.
- Modular productization: support shipping modules independently (module manifest + migrations + feature flags per org).

Executive summary (short)
-------------------------
- App: Next.js (App Router) + TypeScript — front-end and server actions.
- Auth: Supabase Auth (email, magic link, social). JWTs as bearer tokens; store short-lived refresh tokens as required by Supabase.
- Sessions: JWTs validated per request; a server-side `sessions` table contains revoked/active session records for instant invalidation.
- Authorization: Permify or Ory Keto as the policy engine; use the engine for decision-time checks. Keep policy and role definitions in SQL for editing and audit.
- DB/ORM: Supabase Postgres for central DB services; tenancy handled with per-org databases or dedicated schemas. Use TypeORM (or Sequelize) for migrations, models, and runtime access.
- Logs & analytics: PostHog for product analytics; store server logs and audit trails in a NoSQL database (MongoDB Atlas or managed Firestore) for flexible querying and retention.
- Storage: Supabase Storage for attachments; multi-region bucket if needed for enterprise.
- Realtime/pubsub: Supabase Realtime for simple pub/sub; integrate a Pub/Sub adapter (NATS/Redis streams/GCP Pub/Sub) for higher throughput.
- Observability: PostHog (product analytics) + dedicated log store for traces/search + Sentry optional for crash reporting.

Why these choices (brief)
------------------------
- Supabase Auth provides a low-friction migration path from Firebase Auth (email/password, magic links) while providing JWTs and server APIs.
- A policy engine (Permify/Ory) centralizes complex, dynamic authorization and keeps decision logic auditable and testable.
- TypeORM/Sequelize are mature ORMs with robust migration tooling and runtime behavior for enterprise workloads; the repo's TypeScript ecosystem pairs well with TypeORM.
- NoSQL logs offer flexible schema, high write throughput, and cheaper long-term retention than relational systems.

High-level architecture
-----------------------
Components and responsibilities:

- Client (browser/mobile): authenticates with Supabase Auth, receives JWTs and refresh tokens. Calls Next.js server for server-side-rendered pages and API routes.
- Next.js app (API + server actions): acts as the gateway and host for business modules. On each request it:
  1. Validates the JWT signature and expiry.
  2. Looks up the session record in the `sessions` table to ensure it's not revoked.
  3. Calls the policy engine (Permify/Ory) to evaluate permission for the requested resource/action.
  4. Executes domain logic using TypeORM repositories against the tenant database/schema.
- Policy engine (Permify/Ory): accepts queries like "can user X perform action Y on resource Z" and returns allow/deny with a policy trace for auditing.
- Datastore(s):
  - Postgres (Supabase) for transactional domain data. Tenancy per-org via separate DB or isolated schema.
  - NoSQL (MongoDB or Firestore) for audit logs, event streams, and high-volume append-only writes.
  - Supabase Storage for binary attachments.
- Realtime & Pub/Sub: Supabase Realtime for low-latency subscriptions; an optional Pub/Sub adapter (NATS/GCP PubSub) for cross-service events and background job triggers.
- Analytics: PostHog for user/product behaviour; server events forwarded to PostHog and backed up to NoSQL logs.

Tenancy model (recommended)
--------------------------
Two supported tenancy approaches — choose one depending on scale and cost:

1) Per-org database (recommended for strict isolation and compliance)
   - Each organization gets its own Postgres database instance (or managed DB). This is the cleanest isolation model and simplifies backups, restores, and per-customer scaling.
   - Routing: a tenant router service maps request's organization to a DB connection string. Keep a small metadata DB (global) that stores tenant lifecycle info and billing status.

2) Per-org schema (cost-reduced isolation)
   - All tenants share a single Postgres instance, but each tenant has its own schema. Enforce schema-based isolation in the app and migrations.
   - Use DB-level role separation and connection pooling per schema to avoid noisy neighbors.

Important: stop relying on a single global `org_id` column as the only tenancy enforcement. New services should not assume global row-level tenancy without cross-checks.

Authentication & Sessions
-------------------------
- Supabase Auth is the canonical identity provider. It issues JWTs (signed by Supabase) and optionally issues refresh tokens.
- Request validation steps:
  1. Verify JWT signature and expiry using Supabase public key.
  2. Query `sessions` table (or `revocations`) to ensure the token isn't revoked. The `sessions` table stores session_id, user_id, issued_at, expires_at, last_seen, device_info, and revoked_at.
  3. If token is valid, attach user claims (role, tenant_id) from the policy engine or user store to the request context.

Session invalidation and revocation
----------------------------------
- Maintain a canonical `sessions` table in the global control plane DB. When permissions change or an admin revokes access, mark the user's session(s) as revoked with `revoked_at`.
- Short-lived JWTs + server-side revocation checks provide near-instant session invalidation without relying on long-lived server sessions.

Authorization: live policy engine
--------------------------------
- Use Permify or Ory Keto for decision-time checks. The app queries the policy engine with the user's principal and the resource/action. The engine returns allow/deny and a trace for audit.
- Policy lifecycle:
  - Policies and role mappings are authored in the control plane (SQL-backed), versioned, and pushed to the policy engine.
  - Changes to policies are audited and take effect immediately.
- Implementation notes:
  - Keep a lightweight local policy cache for the request lifetime only; always consult the policy engine on each meaningful decision.
  - For complex authorization where performance matters, compute allow lists or ephemeral tokens from the policy engine and use them for short durations.

Permission caching: ephemeral-only
--------------------------------
- Do not persist long-lived permission caches. If you need micro-optimizations, use in-request or per-transaction caches only.
- Rely on the policy engine for authoritative decisions and on the `sessions` table for revocation.

ORM and Data Access
-------------------
- Use TypeORM (recommended) or Sequelize. Provide a thin repository layer that isolates ORM usage from business logic.
- Keep migration scripts in the repo and run them using CI/CD. For per-tenant DBs, maintain a migrations catalog per-tenant.

Logging, Analytics & Observability
---------------------------------
- Product analytics: PostHog (events forwarded from server and client).
- Server logs & audit trails: write to a NoSQL store (MongoDB Atlas / managed Firestore) so you can query and retain at low cost. Include request_id, user_id, tenant_id, action, and full policy trace for audit entries.
- Error/crash reporting: optional Sentry integration for crashes, but keep PostHog as the main analytics store.

Realtime & Pub/Sub
-------------------
- Supabase Realtime for lightweight in-app subscriptions.
- For cross-service and high-throughput eventing, use an adapter pattern with implementations for NATS, GCP Pub/Sub, or Kafka depending on deployment.

Security hardening
------------------
- Enforce CORS and CSRF protections in the Next.js middleware. Use the SameSite cookie attribute and/or use Authorization headers for JWT bearer tokens.
- Rate-limit critical endpoints (login, password reset, sensitive admin routes) at the API gateway level.
- Add HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) via middleware.
- Encrypt sensitive data at rest (application-level encryption for tokens/secrets stored in DB).
- Use WAF and standard DDoS protections offered by hosting providers.

Billing & metering
-------------------
- Keep a global billing metadata service (control-plane) that tracks each tenant's usage metrics (API calls, storage, seats, modules enabled).
- Provide per-tenant quotas (rate limits, storage caps) enforced by the gateway.
- Export metering data to PostHog and to a cost-aggregation job that posts invoice-ready summaries.

Module productization
---------------------
- Modules remain folders under `src/modules/<module>` with a `module.json` manifest. Each manifest declares DB migrations, feature flags, and any external integrations.
- To ship an individual module to a customer, provide:
  - migration SQL for tenant DB/schema
  - module config + feature flags
  - sampling of API endpoints needed for that module

Migration approach (high-level, authoritative)
-------------------------------------------
Follow a cautious, auditable migration path:

1) Prepare control-plane: implement a small global metadata DB and `sessions` table. Deploy policy engine and integrate with the Next.js gateway.

2) Migrate Auth to Supabase:
   - Provision Supabase Auth and sync primary user emails/ids. Use email as canonical identifier where possible.
   - Issue supabase JWTs to clients and map legacy UIDs to new supabase user ids in a `user_mappings` table.

3) Implement per-tenant DB routing and TypeORM repository scaffolding. Keep old Firestore adapter live for reads during the migration window.

4) Migrate users & roles first. Migrate role definitions and policies into the policy engine and validate parity with existing Firestore behaviors.

5) Migrate transactional modules one-by-one (Vendor, Inventory, Sales, POs, etc.) using idempotent migration scripts and `legacy_id` fields to reconcile.

6) Cutover strategy: prefer read-switch per module, validate in staging, do a controlled production cutover with feature-flag rollout.

7) Post-cutover: run reconciliation and decommission Firestore resources when confident.

Migration implementation details & artifacts to deliver next
---------------------------------------------------------
- TypeORM entity models for core modules and tenant scaffolding
- `sessions` / `revocations` schema and middleware example for request-time validation
- Policy engine integration examples (Permify/Ory) and policy import scripts
- Migration scripts for users & roles (idempotent, resumable)
- Pub/Sub adapter skeleton and event bus table design
- Logging adapter that writes audit events to NoSQL and forwards key events to PostHog

Operational runbook (short)
---------------------------
- Local dev: `npm run dev` + Docker Compose that starts Postgres instances (one or many), a local policy engine (or test double), and a local NoSQL log store.
- CI/CD: GitHub Actions run lint/tests, run TypeORM migrations against staging DBs, and deploy Next.js on Vercel.
- Health checks: `/api/health` verifying policy engine connectivity, DB connectivity, and storage access.

Quality gates & security checks
------------------------------
- Pre-deploy: TypeScript typechecks, ESLint, unit tests, Playwright E2E (smoke), and migration dry-run.
- Runtime: policy-engine health, session store health, backup verification, and audit log delivery checks.

Costs & free-tier guidance
-------------------------
- Use Supabase free tier for early stages; plan per-tenant DB pricing for enterprise customers.
- Use PostHog cloud free tier initially; move to self-hosted PostHog or a managed analytics plan as usage grows.
- MongoDB Atlas free tier or Firestore free-tier for log storage depending on query needs.

Appendix: Short checklist (next steps to execute now)
---------------------------------------------------
- [ ] Confirm TypeORM vs Sequelize choice. (Default: TypeORM recommended)
- [ ] Provision a Supabase Auth project and record public keys for JWT validation.
- [ ] Implement `sessions` table schema and request middleware in `src/lib/session.ts` to verify revocations.
- [ ] Scaffold policy engine integration (Permify/Ory) and import current roles/policies.
- [ ] Generate TypeORM entity models for `users`, `roles`, `sessions`, and `tenant_metadata`.
- [ ] Create migration script to sync users/roles from Firestore -> Postgres and populate `user_mappings`.
- [ ] Provide a small PoC adapter demonstrating request-time JWT validation + session revocation + policy check.

Next immediate deliverable (I will produce when you say "Start step 1")
-------------------------------------------------------------------------
- TypeORM entity models + migrations for core entities (users, roles, sessions, tenant_metadata) and a small PoC Next.js middleware demonstrating JWT validation + session revocation + policy engine check.

If you'd like me to begin, say "Start step 1" and I will create the TypeORM models, migrations, middleware, and a minimal PoC adapter next.

