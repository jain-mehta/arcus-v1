# Firebase Command Center — Detailed Architecture & Monetization Plan

Last updated: 2025-10-11

This document is a comprehensive, code-driven architecture and product roadmap for the Firebase Command Center (the "project"). It inventories the current implementation, third-party integrations, deployment and testing setup, data model and security posture, and concludes with a prioritized feature / monetization roadmap and operational recommendations.

---

## 1. Executive summary

Firebase Command Center is a Next.js (App Router) application that provides an enterprise-style operations dashboard built on Firebase (Authentication + Firestore + Admin SDK). It implements a dynamic RBAC system, organization-scoped data, multi-module features (sales, store/inventory, vendors, HRMS, orders, quotations, reports), and Genkit-powered AI workflows. The codebase is test-oriented with Playwright end-to-end tests and automation hooks for Testsprite. Hosting and CI are designed around Firebase Hosting and GitHub Actions.

This document captures the current state of all subsystems, provides recommended next steps for hardening and scaling, and outlines monetization options for evolving the project into a multi-tenant SaaS product.

---

## 2. High-level architecture (components & interactions)

- Client (browser, React + Next.js)
  - Uses Firebase Client SDK for authentication (Email/Password) on the client.
  - React components use a top-level `AuthProvider` which listens to Firebase Auth state and exchanges ID tokens with the server to create a long-lived server-side session cookie.
  - UI components and server actions (Next.js Server Actions) fetch data from the server-side API and Server Actions which call the Data Access Layer.

- Server (Next.js App Router server)
  - Server-side code uses Firebase Admin SDK to create/verify session cookies and to interact with Firestore.
  - `src/lib/firebase/firebase-admin.ts` is implemented as a guarded singleton that returns `{ auth, db }` so server modules always retrieve a valid Admin SDK instance.
  - `src/lib/firebase/firestore.ts` is the Data Access Layer (DAL): all Firestore reads/writes pass through functions here. These are server-only helpers for getting roles, users, vendors, leads, customers, orders, inventory, etc.
  - `src/lib/session.ts` centralizes session cookie creation, verification, and header-string building for consistent cookie attributes across create/destroy flows.
  - RBAC and permission resolution are implemented in `src/lib/firebase/rbac.ts` and supported by role documents in Firestore.

- Persistence
  - Primary DB: Google Firestore (document model), used for all application data (users, roles, orgs, vendors, products, inventory, quotations, orders, leads, customers, audit_logs, etc.).
  - Security rules are included in `firestore.rules` to enforce org-level isolation.

- Authentication & sessions
  - Firebase Authentication (client sign-in) + Firebase Admin `createSessionCookie()` is used to exchange a short-lived ID token for a server-managed session cookie named `__session` (7 days default).
  - Server-side session verification uses `auth.verifySessionCookie()` followed by `getSessionClaims()` which resolve additional user data from Firestore for RBAC.

- AI
  - Genkit flows with Google AI (Gemini) integration via `@genkit-ai/googleai` and `genkit` packages.
  - Configured to run in development via `genkit` utilities; used for features such as AI-driven KPI suggestions and other automated flows.

- Hosting & deployment
  - Primary hosting target: Firebase Hosting / Cloud run (apphosting.yaml, firebase.json present).
  - CI/CD: GitHub Actions workflows exist for Testsprite & Playwright (see `.github/workflows/testsprite-and-playwright.yml`).
  - Local dev: Firestore + Auth emulators supported; seed scripts exist for dev data.

- Testing
  - Playwright for E2E tests (in `e2e/` and `__tests__`), and a Node-based integration harness `scripts/test-api.mjs` for API smoke checks.
  - Testsprite integration scaffolding is present under `testsprite_tests/` with code-summary and PRD helper files.

---

## 3. Tech stack & third-party libraries (inventory)

Core frameworks
- Next.js (App Router) — `next` v15.x
- React 18
- TypeScript
- Tailwind CSS + PostCSS
- Playwright (`@playwright/test`) for E2E

Firebase ecosystem
- `firebase` (client SDK) — auth + client features
- `firebase-admin` (server) — Admin SDK for Firestore & Auth
- Firestore (production DB)
- Firebase Authentication (Email/Password)
- Firebase Hosting / App Hosting config present
- Firestore Security Rules (`firestore.rules`) and storage rules (`storage.rules`)
- Firebase Emulators supported for local dev

AI & GenAI
- `genkit`, `@genkit-ai/googleai` (Gemini integration)

UI & components
- Radix UI (multiple `@radix-ui` packages)
- Lucide icon set (`lucide-react`)
- `@hello-pangea/dnd` (drag & drop)
- `react-hook-form`, `zod` for validation
- `embla-carousel-react`, `recharts`, other UI libraries

Utilities & tooling
- `dotenv` (env management), `patch-package`
- `playwright` for tests
- `genkit-cli` for AI flows

Dev & CI/CD
- GitHub Actions workflow (Playwright + Testsprite) — `.github/workflows/testsprite-and-playwright.yml`
- Scripts for seeding (`scripts/seedTestData.js`, `seedAdminUser.cjs`, `seed-admin-role.mjs`), test harness (`scripts/test-api.mjs`) and other helpers.

Monitoring / Observability (NOT present but recommended)
- Google Analytics (frontend) — `GoogleAnalyticsProvider` and `lib/ga.ts` exist.
- No Sentry / Datadog / LogRocket currently integrated. (Recommendation below.)

Payments & Notifications (NOT implemented)
- Stripe: TODO (documented in `CURRENT_STATUS.md` as not implemented)
- SendGrid (email): TODO

---

## 4. Code structure & key files (guide)

Top-level notable files / folders:
- `src/` — application source
  - `src/app/` — Next App Router routes & pages (API routes under `src/app/api`)
    - `src/app/api/auth` — login/logout/destroySession/me endpoints
    - `src/app/api/admin` — admin APIs (roles, etc.)
  - `src/components/` — UI components (AuthProvider, GoogleAnalyticsProvider, UI kit)
  - `src/lib/` — core libraries
    - `src/lib/session.ts` — session cookie utilities (centralized builder)
    - `src/lib/firebase/firebase-admin.ts` — guarded Admin SDK singleton
    - `src/lib/firebase/firestore.ts` — DAL: all Firestore functions
    - `src/lib/firebase/firebase-client.ts` — client Firebase initialization
    - `src/lib/firebase/rbac.ts` — permission aggregation & checks
- `scripts/` — seed scripts, test harness, migration helpers
- `e2e/`, `__tests__/` — Playwright tests and test utilities
- `testsprite_tests/` — Testsprite inputs and outputs
- `apphosting.yaml`, `firebase.json` — hosting and Firebase config

Important server flows:
- Session creation: `AuthProvider` (client) calls `/api/auth/login` with ID token -> `login/route.ts` calls `createSessionCookie()` -> `setSessionCookie()` + response `Set-Cookie` header via `buildSessionSetCookieHeader()` -> browser stores `__session` cookie.
- Session verification: server-side `getSessionClaims()` reads cookie via `cookies()` and `verifySessionCookie()` and then loads user doc from Firestore.
- RBAC: user roles are read from Firestore and merged into an effective permission map used across server actions.

---

## 5. Data model & collections (current)

The DAL uses these collections (representative):
- `organizations` (multi-tenant scope planned)
- `users` (per user: orgId, roleIds, customPermissions, storeId, region, reportsTo)
- `roles` (roleId -> permissions map)
- `permissions` (reference definitions)
- `vendors` (vendor master data)
- `products`, `inventory`, `materials` (catalog & stock)
- `leads`, `customers`, `opportunities`, `quotations`, `orders` (sales lifecycle)
- `purchase_orders`, `grns` (procurement)
- `announcements`, `policies` (HR/communication)
- `audit_logs` (recommended; used for enterprise auditing — plan exists)

All application-level documents include `orgId` and owner references (ownerId, storeId) to enforce org-scoped data access via Firestore Rules and server-side checks.

---

## 6. Security & identity

- Authentication: Firebase Auth for identity; session cookie for server authorization.
- Session cookie: server-side cookie name `__session`, httpOnly, SameSite=Lax, Max-Age 7 days (centralized in `src/lib/session.ts`). Login / logout endpoints create/delete cookie using centralized builder to ensure matching attributes.
- RBAC: Roles + permissions stored in Firestore. Server-side permission resolution merges `role` permission maps and `customPermissions` on a per-user basis.
- Firestore Security Rules: present in `firestore.rules` and designed to enforce `orgId` scoping and to read `request.auth.token` claims.
- Service account: repo expects `service-account.json` or `FIREBASE_SERVICE_ACCOUNT_BASE64` for CI/seed scripts; `scripts/seed*` use the admin SDK.

Recommendations (security):
- Add Sentry (or similar) for server & client error capture.
- Enforce HTTPS in production and monitor cookies for `Secure` flag.
- Rotate service account keys and use least-privilege for production service accounts.

---

## 7. CI/CD, testing & quality

- Playwright tests (E2E) exist in `e2e/` and are executed in CI via GitHub Actions (`.github/workflows/testsprite-and-playwright.yml`).
- Unit tests / integration: the project includes a Node-based integration harness `scripts/test-api.mjs` and many manual scripts to seed test data.
- Testsprite integration: `testsprite_tests/` contains PRD and code-summary artifacts used by an automated test generation/execution platform.

Recommendations:
- Set up scheduled runs for Playwright tests against a staging environment and gating merges on passing tests.
- Add unit tests for critical DAL functions in `src/lib/firebase/firestore.ts`.

---

## 8. Observability & monitoring (current / recommended)

Current:
- Google Analytics frontend instrumentation via `GoogleAnalyticsProvider`.
- Logging via console.log / console.error in server code.

Recommended additions (high priority):
- Error capture: Sentry (server + client) to aggregate exceptions and stack traces.
- Performance & logs: Google Cloud Monitoring / Logging, or Datadog for correlated traces and synthetic tests.
- Audit & security logs: create `audit_logs` collection and ensure all mutations write a structured audit record (who, when, what changed) for compliance.
- Usage & billing metrics: track Firestore read/write rates, storage, and GenAI API usage (cost per request) in a central dashboard.

---

## 9. Costs & scaling: what to expect

- Firestore costs scale with reads/writes and storage. The app's RBAC/permissions model can create additional read costs at login/permission resolution if naive — consider caching resolved permissions in the session custom claims or a short-lived server cache.
- GenAI (Gemini via Genkit) costs are per-request. AI-heavy features should be gated behind paid tiers or rate-limited for free users.
- Hosting (Firebase Hosting + Cloud Functions/Cloud Run) will add network/instance costs when scaling; size serverless instances to match expected concurrent usage.

Cost controls:
- Cache permission map in session claims (or in-memory LRU cache) to reduce Firestore reads.
- Use batched reads and efficient queries (select needed fields only).
- Monitor emulator vs production usage to avoid billing surprises.

---

## 10. Feature inventory (what's implemented today)

High-level features implemented (based on code scanning):
- User authentication (Firebase Email/Password + server session cookie)
- Dynamic RBAC (roles + permissions) and navigation filtering
- User Management module (create users, assign roles)
- Vendors & procurement (vendors, purchase orders, GRNs)
- Sales flows (leads → opportunities → quotations → orders)
- Inventory / products / materials modules
- HRMS sections (announcements, policies)
- Dashboard & Reports module (KPI aggregation)
- Genkit AI flows integration (AI-assisted features)
- QR scanning support (html5-qrcode)
- E2E tests with Playwright; API test harness scripts; seed scripts for test data

Gaps (not yet implemented or partially implemented):
- Stripe billing & payments (documented as TODO)
- Email notifications via SendGrid (documented as TODO)
- Organization onboarding / provisioning flow (multi-tenant signup)
- Full audit logging for critical data operations

---

## 11. Monetization & productization roadmap

Objective: transition to a multi-tenant SaaS offering that balances adoption (freemium) and revenue (paid tiers). Prioritize core product-market fit features, then add monetized premium features.

Tier ideas & feature gates
1. Free tier (onboarding/trial)
   - Single organization, up to N users (e.g., 5), limited API calls and AI requests per month.
   - Basic modules: Sales, Customers, Vendors, Basic Inventory.
2. Team tier (monthly subscription)
   - More users (e.g., up to 50), role management, advanced reporting, automated backups.
   - Basic priority support.
3. Business tier (higher monthly subscription)
   - Unlimited users, multi-store support, advanced RBAC workflows, schedule & audit logs, integrations (email, Slack), richer analytics, webhooks.
4. Enterprise tier (custom pricing)
   - SSO (SAML / OIDC), dedicated support, SLA, custom integrations, data residency, on-premise or VPC peering, custom onboarding & training.

Premium add-ons (metered/usage-based)
- AI Suite: charge per API call or monthly quota for GenAI-powered features (summaries, KPI suggestions, automated report generation). Recommended to track tokens/requests and show usage UI.
- Integrations: paid connectors (e.g., QuickBooks, Xero, Stripe billing connectors). Charge setup + monthly fee.
- Advanced reporting & exports (scheduled PDF or CSV exports, custom dashboards).

Billing implementation plan (technical)
1. Integrate Stripe (recommended):
   - Create products & pricing plans in Stripe.
   - Use Stripe Checkout or custom billing UI.
   - Store billing metadata in Firestore (`billing` collections) and sync via webhooks.
   - Implement metered billing for AI usage: report usage to Stripe or generate invoices monthly.
2. Add email notifications (SendGrid) for invoices, trial expirations, security alerts.
3. Add a Trials/Promo engine: store trial expiry in org doc and restrict features when the trial ends.

Legal & compliance
- Add Terms of Service and Privacy Policy pages (documented as TODO).
- Prepare data processing addendum for enterprise customers.
- For payments: ensure PCI compliance is handled via Stripe (no card data stored in our DB).

---

## 12. Operational runbook (short)

- Local dev: `npm run dev`; use `firebase emulators:start` for local Firestore/Auth when needed.
- Seed data: `npm run seed` (runs `scripts/seedTestData.js`) — supports local emulators or real project via `FIREBASE_SERVICE_ACCOUNT_BASE64`.
- Run E2E locally: `npm run test:e2e` (Playwright)
- CI: GitHub Actions runs Playwright & Testsprite; configure secrets for Firebase service account and project IDs.
- Backup: export Firestore (scheduled) with `gcloud` export jobs or use managed backup tools for Firestore.

---

## 13. Recommended next technical milestones (90d roadmap)

1. Stabilize multi-tenant onboarding (implement `/organizations` provisioning) — high priority for SaaS.
2. Integrate Stripe for billing + trials + paid tiers; implement `billing` collection and webhook handlers.
3. Add email provider (SendGrid) for transactional emails (invitations, invoices).
4. Add Sentry for error monitoring (client + server) and configure alerts.
5. Implement audit logging (create `audit_logs` and write structured logs on all critical mutations).
6. Optimize permission resolution (cache effective permissions in session or server-side cache to reduce Firestore reads).
7. Implement usage tracking for GenAI requests and show consumption per org in dashboard.
8. Harden session/cookie behavior: ensure `DOMAIN` config and `Secure` flags are correctly applied in production (already centralized in `src/lib/session.ts`).

---

## 14. Security & compliance checklist (must-haves before public SaaS)

- Enforce HTTPS and set `Secure` cookie in production.
- Rotate service account keys and use restricted roles for production service accounts.
- Add CSP and security headers (X-Frame-Options, X-Content-Type-Options) at hosting layer.
- Ensure Firestore rules enforce `orgId` on all reads/writes.
- Add rate-limiting on sensitive endpoints (e.g., login, create user) to mitigate abuse.
- Data retention policy and ability to export customer data on request.

---

## 15. Appendix: Key files & scripts (quick reference)

- `src/lib/session.ts` — session cookie management and centralized header builder
- `src/lib/firebase/firebase-admin.ts` — Admin SDK singleton
- `src/lib/firebase/firestore.ts` — Data Access Layer (primary Firestore usage)
- `src/lib/firebase/rbac.ts` — permission aggregation and checks
- `src/app/api/auth/login/route.ts` — login exchange: idToken -> session cookie
- `src/app/api/auth/destroySession/route.ts` — server route to destroy session cookie
- `scripts/seedTestData.js`, `scripts/seedAdminUser.cjs`, `scripts/seed-admin-role.mjs` — seed helper scripts
- `scripts/test-api.mjs` — Node-based API integration test harness
- `e2e/` — Playwright tests
- `testsprite_tests/` — Testsprite inputs for automated test generation
- `apphosting.yaml`, `firebase.json` — hosting & firebase config

---

## 16. Closing notes

This repository already contains the major building blocks for a SaaS-ready platform: a single-source DAL, guarded Admin initialization, dynamic RBAC, test harnesses, and AI flows. To convert this into a monetized SaaS product, prioritize multi-tenant provisioning, billing (Stripe), email/notification flows, error monitoring, usage metering (for AI), and audit logging.

If you'd like, I can now:
- generate a visual architecture diagram (PlantUML or Mermaid) from this document,
- create specific GitHub Issues/PR outlines for the 90-day milestones above,
- implement Stripe integration skeleton and webhook handlers,
- add Sentry to the project and a small dashboard for monitoring.

Tell me which next step you want me to take and I will start implementing it immediately.