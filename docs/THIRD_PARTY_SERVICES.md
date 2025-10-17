# Third-Party Services Inventory — Firebase Command Center

Last updated: 2025-10-13

Purpose
-------
A single, authoritative inventory of every third-party service and tool the platform will integrate with. This file groups services by function, lists recommended providers, required environment variables, integration notes, priority (phase), and quick provisioning steps. Use this to create accounts, populate secrets, and plan integrations before code cleanup and migration.

How to use
----------
1. Review each category and confirm provider choices (defaults recommended).
2. Provision accounts and store keys/secrets in your secrets manager (GitHub Secrets, Vault).
3. Populate `ENV` values shown below into CI/CD and environment configurations.
4. Follow the integration notes when wiring SDKs, webhooks, or infra.

Legend
------
- Priority: Phase 0 = essential for cutover, Phase 1 = recommended soon after, Phase 2 = optional / scaling
- Env var examples: canonical names to add to secrets manager or `.env` files

---

## 1. Authentication & Identity
Priority: Phase 0

1. Supabase Auth (recommended)
- Purpose: canonical identity provider; issues JWTs, manages users, social logins, magic links.
- Recommended plan: free/dev → paid for production as needed.
- Integration: server-side Supabase Admin API for user management; client SDK for sign-in flows.
- Env vars:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY (client)
  - SUPABASE_SERVICE_ROLE_KEY (server)
  - SUPABASE_JWKS_URL (optional)
- Quick steps:
  1. Create Supabase project.
  2. Enable auth providers you need (email, social).
  3. Generate service role key and store it securely.

2. CSRF Protection
- Purpose: defend state-changing requests from CSRF attacks.
- Implementation: Next.js middleware + `csrf` or built-in patterns; no third-party account.
- Priority: Phase 0

3. JWT / JWKS
- Purpose: standard token verification using Supabase JWKS endpoint.
- Env var: SUPABASE_JWKS_URL or automatically fetch via SUPABASE_URL
- Priority: Phase 0

---

## 2. Databases & ORM
Priority: Phase 0

1. Supabase Postgres (recommended) — primary DB
- Purpose: transactional storage, per-tenant DBs or per-schema tenancy.
- Integration: TypeORM (recommended) or Sequelize.
- Env vars:
  - CONTROL_DATABASE_URL (global control-plane)
  - DATABASE_URL (if single/shared tenant DB)
  - Per-tenant connection strings stored in `tenant_metadata`.
- Quick steps:
  1. Provision Supabase project and database.
  2. Create service role key and DB connection URL.

2. TypeORM (recommended) / Sequelize
- Purpose: ORM and migration tooling.
- Packages to install: `typeorm`, `pg`, `reflect-metadata` for TypeORM.
- No third-party account required.
- Priority: Phase 0

3. MongoDB Atlas (for logs & audit)
- Purpose: append-only audit logs, flexible queries, long-term retention.
- Env var: MONGODB_URI, MONGODB_DB_NAME
- Priority: Phase 0

4. Redis / Upstash (optional)
- Purpose: ephemeral caches, rate-limiting, small TTL data.
- Env var: REDIS_URL, REDIS_PASSWORD
- Priority: Phase 1

---

## 3. Policy & Authorization Engine
Priority: Phase 0

1. Permify (recommended) or Ory Keto (alternative)
- Purpose: decision-time authorization; centralized policies and role bindings.
- Integration: push policy deltas from control-plane; call decision API at request time.
- Env vars:
  - POLICY_ENGINE_URL
  - POLICY_ENGINE_KEY
  - POLICY_ENGINE_ADMIN_URL (if applicable)
- Quick steps:
  1. Create account or deploy Ory Keto instance.
  2. Create admin API key and service key.
  3. Wire control-plane to push policy deltas and to query decisions.

---

## 4. Realtime & Pub/Sub
Priority: Phase 0 (Supabase Realtime) → Phase 1 (NATS for scale)

1. Supabase Realtime
- Purpose: in-app subscriptions and simple real-time features.
- Env vars: included in SUPABASE_URL; SUPABASE_REALTIME_URL (optional)
- Priority: Phase 0

2. NATS (recommended for high throughput) or GCP Pub/Sub / Kafka
- Purpose: cross-service eventing, background job triggers, higher throughput needs.
- Env vars: NATS_URL, NATS_CREDS
- Priority: Phase 1

---

## 5. Object Storage
Priority: Phase 0

1. Supabase Storage (recommended) or AWS S3
- Purpose: attachments, signed upload URLs, storage metadata.
- Env vars:
  - SUPABASE_SERVICE_ROLE_KEY (for server uploads)
  - If S3: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
- Integration notes: client upload via signed URLs; server validates metadata and access.

---

## 6. Logging, Audit & Long-Term Storage
Priority: Phase 0

1. MongoDB Atlas (recommended)
- Purpose: audit logs, policy traces, forensic investigations.
- Env vars: MONGODB_URI, MONGODB_DB_NAME

2. S3 / GCS (archive)
- Purpose: cold storage for archived logs and DB snapshots.
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME

3. ELK (optional, Phase 2)
- Purpose: advanced log analytics and searching.
- Env vars: ELASTIC_URL, ELASTIC_API_KEY

---

## 7. Analytics & Product Telemetry
Priority: Phase 0

1. PostHog (recommended)
- Purpose: product analytics, funnels, feature usage, event tracking.
- Env vars: POSTHOG_API_KEY, POSTHOG_HOST (if self-hosted)
- Integration: client & server SDKs, forward events from log-forwarder.

2. Google Analytics (optional)
- Purpose: marketing/traffic analytics on public pages
- Env var: GA_MEASUREMENT_ID

---

## 8. Monitoring & Observability
Priority: Phase 1

1. Prometheus + Grafana
- Purpose: metrics collection and dashboards for services and DBs.
- Env vars: PROMETHEUS_ENDPOINT, GRAFANA_API_KEY

2. OpenTelemetry + Traces (Honeycomb / Tempo)
- Purpose: distributed tracing for requests and policy calls.
- Env vars: OTEL_EXPORTER_URL, OTEL_SERVICE_NAME

3. Sentry (optional) or PostHog error tracking
- Purpose: crash/error reporting
- Env var: SENTRY_DSN

---

## 9. Error Tracking & Security Scanning
Priority: Phase 0/1

1. Snyk / Dependabot
- Purpose: dependency vulnerability scanning and alerts.
- Env: SNYK_TOKEN (if using Snyk)

2. OWASP ZAP / Security scanning
- Purpose: automated security scans for staging.
- Env: ZAP config (no account required for local runs)

3. External pen-test vendor (pre-GA)
- Purpose: manual security validation
- Priority: Phase 1 (before GA)

---

## 10. Email & Messaging
Priority: Phase 0

1. SendGrid (recommended) or Mailgun
- Purpose: transactional emails (invites, password resets, notifications)
- Env vars: SENDGRID_API_KEY, EMAIL_FROM

2. Twilio / MSG91 (optional)
- Purpose: SMS/WhatsApp notifications
- Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

---

## 11. Payments & Billing
Priority: Phase 1

1. Stripe (recommended) or Razorpay
- Purpose: subscriptions, invoicing, usage billing
- Integration: webhooks, signed event handling, mapping tenant -> subscription
- Env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

---

## 12. Feature Flags
Priority: Phase 1

1. LaunchDarkly (commercial) or Unleash (open-source)
- Purpose: per-tenant/per-module progressive rollout of features
- Env vars: FEATURE_FLAGS_SDK_KEY, FEATURE_FLAGS_API_KEY

---

## 13. CI/CD & Build
Priority: Phase 0

1. GitHub Actions (recommended) or vercel 
- Purpose: lint, test, build, run migrations, deploy
- Secrets to set in CI: CONTROL_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTHOG_API_KEY, MONGODB_URI, NATS_URL, STRIPE_SECRET_KEY, DOCKER_REGISTRY creds

2. Docker & Container Registry
- Purpose: containerize services and push images
- Options: GitHub Container Registry (GHCR), Docker Hub, AWS ECR
- Env vars: DOCKER_REGISTRY, DOCKER_USERNAME, DOCKER_PASSWORD or GHCR_PAT

3. Terraform / Pulumi
- Purpose: IaC provisioning of Supabase, MongoDB Atlas, NATS, DNS, etc.
- Env vars: TF_BACKEND config, cloud provider credentials

---

## 14. Testing & QA Tools
Priority: Phase 0

1. Playwright (existing) — E2E testing
- Env vars: PLAYWRIGHT_TEST_URL

2. Jest / Vitest — unit tests

3. Postman / Newman — API contract testing

4. k6 / Artillery — performance testing (Phase 1)

---

## 15. AI & Automation
Priority: Phase 1/2

1. Firebase (AI / Pub/Sub hooks)
- Purpose: AI feature triggers, model orchestration where required
- Env vars: FIREBASE_SERVICE_ACCOUNT (base64 JSON), FIREBASE_PROJECT_ID

2. LLM Providers (OpenAI, Anthropic, etc.) — future
- Env vars: OPENAI_API_KEY, OTHER_LLM_KEYS

---

## 16. Secrets Management & Vaults
Priority: Phase 0

1. GitHub Secrets for repo-level secrets (quick start)
2. HashiCorp Vault (recommended for production) or cloud-managed secret stores
- Env vars: VAULT_ADDR, VAULT_TOKEN (for vault operator), or cloud key names

---

## 17. Backups & Archive
Priority: Phase 0

1. AWS S3 / GCS for snapshot/archive
- Env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME

2. Cloud provider DB snapshot features (enable PITR if supported)

---

## 18. Incident Management & On-call
Priority: Phase 0

1. PagerDuty / Opsgenie
- Purpose: incident escalation
- Env vars: PAGERDUTY_API_KEY

---

## 19. Developer Tools & Productivity
Priority: Phase 0

1. Postman (collections) for API exploration
2. README and OpenAPI files in `openapi/`
3. Local dev via Docker Compose (templates in repo)

---

## Environment Variables (canonical list)
Create the following keys in your secrets manager. This canonical list maps to entries above; where per-tenant connection strings are needed, store them in `tenant_metadata` in control DB.

- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_JWKS_URL
- CONTROL_DATABASE_URL
- DATABASE_URL (if shared)
- MONGODB_URI
- POSTHOG_API_KEY
- POSTHOG_HOST
- POLICY_ENGINE_URL
- POLICY_ENGINE_KEY
- NATS_URL
- NATS_CREDS
- REDIS_URL
- SENDGRID_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- FIREBASE_SERVICE_ACCOUNT
- DOCKER_REGISTRY
- DOCKER_TOKEN
- TF_BACKEND credentials (as needed)
- SENTRY_DSN (optional)
- SNYK_TOKEN (if used)
- PAGERDUTY_API_KEY
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET_NAME

---

## Provisioning checklist (quick)
1. Create Supabase project; note SUPABASE_URL and generate service role key. Store in secrets.
2. Provision MongoDB Atlas cluster; create app user and whitelist CI IPs; store MONGODB_URI.
3. Create PostHog project and API key; store POSTHOG_API_KEY.
4. Deploy or configure Policy Engine (Permify / Ory); create API keys and store POLICY_ENGINE_* secrets.
5. Choose and provision Pub/Sub (NATS) if needed; store connection details.
6. Create SendGrid account and API key; verify sending domain and store key.
7. Create GitHub repo secrets and CI pipeline variables (CONTROL_DATABASE_URL, etc.).
8. Provision Docker registry and store credentials for CI.
9. (Optional) Provision Stripe and set webhook endpoints; store webhook secret.

---

## Next actions I can take
- Generate a CSV/Secrets matrix with (service, env var, description, scope, owner) to import into secret stores.
- Create Terraform skeletons for Phase 0 infra (Supabase, MongoDB Atlas, NATS, S3) and add to repo as `infra/`.
- Produce OpenAPI YAML files for core services (`openapi/`) to enable client SDK generation.

Tell me which of the next actions you'd like me to do and confirm if you want defaults changed (ORM choice: TypeORM vs Sequelize; tenancy: per-org DB vs per-schema; policy engine: Permify vs Ory).