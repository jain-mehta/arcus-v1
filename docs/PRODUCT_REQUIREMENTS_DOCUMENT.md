# Product Requirements Document: Firebase Command Center

**Version:** 1.0
**Status:** Final
**Author:** App Prototyper, Firebase Studio

---

## 1. Introduction

### 1.1. Vision
To create a unified, secure, and scalable internal platform that centralizes and streamlines all core business operations for "Bobs Bath Fittings Pvt Ltd," empowering employees with the right tools and data to drive efficiency and growth.

### 1.2. Problem Statement
Currently, critical business functions such as sales, vendor management, inventory control, and human resources are managed through disparate systems or manual processes. This leads to data silos, inefficient workflows, a lack of real-time visibility, and security challenges. There is no single source of truth, making data-driven decision-making difficult and scaling operations problematic.

### 1.3. Proposed Solution
The "Firebase Command Center" is an enterprise-grade, web-based application that serves as the central nervous system for all business operations. Built on a modern, secure, and scalable tech stack, it provides a role-based interface ensuring that employees have access only to the information and tools relevant to their responsibilities.

---

## 2. Target Audience & User Personas

The application is designed for internal employees of Bobs Bath Fittings. Key user personas include:

*   **Admin:** (System Administrator) - Responsible for the overall health and configuration of the system. Manages users, roles, permissions, and system-level settings.
*   **Sales President:** (Executive) - Needs a high-level view of all sales activities, regional performance, and key business metrics across the entire organization.
*   **Regional Sales Head:** (Mid-level Manager) - Responsible for sales performance within a specific geographical region. Needs to view data for their region and for the Sales Executives who report to them.
*   **Sales Executive:** (Individual Contributor) - Focused on their own leads, opportunities, and customers. Needs tools to manage their sales pipeline efficiently.
*   **Store Supervisor:** (Location Manager) - Manages a specific retail store. Responsible for store-level inventory, POS billing, and managing store staff.
*   **Factory Inventory Manager:** (Operations) - Manages the central factory inventory, including raw materials and finished goods before they are dispatched to stores.
*   **HR Manager:** (Administrator) - Manages the entire employee lifecycle, from recruitment and onboarding to payroll and performance reviews.

---

## 3. Core Features & Modules

The application is composed of several interconnected modules, each governed by a dynamic Role-Based Access Control (RBAC) system.

### 3.1. Core System
*   **Authentication:** Secure login via Firebase Authentication.
*   **Dynamic RBAC:** Administrators can create and define roles, assign granular permissions, and structure a reporting hierarchy. Access to all modules and data is strictly controlled by these permissions.
*   **Multi-Tenancy Foundation:** The architecture is built with an `organizationId` scoping all data, preparing it for a future multi-tenant SaaS model.
*   **Audit Logging:** All significant user actions (e.g., creating a PO, deactivating a user, changing permissions) are recorded in an immutable audit log for security and compliance.

### 3.1.1 Authentication — Test Requirements (for Testsprite)

Purpose
- Provide a concise, execution-ready set of requirements to enable automated test generation and execution (Testsprite). The tests will validate functional, security and session behaviors of the Authentication module and its integration with session cookies and RBAC.

Scope
- Covered: login flows (email/password and idToken exchange), server-side session creation, cookie attributes (__session), logout and session-destroy endpoints, server-side session verification, permissions endpoint protection, role CRUD protection, and middleware/server actions protection.
- Out of scope: third-party provider UIs (full OAuth redirects), client-side SDK internal events (beyond asserting server session behavior), and long-term load/perf tests (unless requested separately).

Test Objectives & Success Criteria
- Login must create a server session and return a Set-Cookie header for `__session` that is HttpOnly and SameSite=Lax (Secure in production). Success: cookie present and Max-Age ≈ 7 days.
- Logout/destroy session must return Set-Cookie that clears `__session` (Max-Age=0 or expired) and server-side store must no longer validate the session.
- Protected endpoints (e.g., `/api/auth/permissions`, `/api/admin/roles`, server actions under `/dashboard`) must reject unauthenticated requests with 401/403 or redirect (302) as appropriate, and allow access with a valid `__session` cookie.
- Role CRUD must enforce authorization: create/read/update/delete should work for authorized admin users and return appropriate status codes (200/201/204) and forbidden (403 or 4xx) for unauthorized.
- Session verification must return null for invalid/expired/malformed cookies.

Explicit Test Cases (structured)
1) Login - email/password
	- Input: valid admin email/password
	- Action: POST /api/auth/login { email, password }
	- Expect: 200 OK, response header `Set-Cookie` contains `__session=<token>`, HttpOnly present, SameSite=Lax, Max-Age ~604800

2) Login - idToken exchange (server expects idToken)
	- Input: valid Firebase ID token
	- Action: POST /api/auth/login { idToken }
	- Expect: same as (1)

3) Login - invalid credentials
	- Input: wrong password
	- Action: POST /api/auth/login
	- Expect: 4xx (400/401) and no Set-Cookie

4) Logout clears cookie
	- Preconditions: logged-in session
	- Action: POST /api/auth/logout
	- Expect: 200 OK and `Set-Cookie: __session=; Max-Age=0...` (domain handling consistent)

5) Destroy session endpoint
	- Action: POST /api/auth/destroysession
	- Expect: same as (4)

6) Permissions endpoint protection
	- Unauthenticated: GET /api/auth/permissions → 401/403
	- Authenticated with `__session` cookie: → 200 and JSON permission map (contains `dashboard` key)

7) Role CRUD (admin)
	- Authenticated admin: POST /api/admin/roles → 201/200; GET list → 200; GET /:id → 200; PUT /:id → 200/204; DELETE /:id → 200/204
	- Authenticated non-admin / unauthenticated: DELETE /api/admin/roles/admin → 4xx (forbidden)

8) Server actions protection (dashboard)
	- Unauthenticated: GET /dashboard → 401/302/403
	- Authenticated: GET /dashboard → 200

9) Session validation
	- Tampered cookie / expired cookie → server returns null when verifying session (middleware blocks access)

Security & Cookie Rules
- Cookie name: `__session`
- Path: `/`, HttpOnly: true, SameSite: Lax, Max-Age: 604800 (7 days) by default
- Domain: only set when COOKIE_DOMAIN is provided and not `localhost` (avoid Domain=localhost)
- Secure: only set in production (NODE_ENV=production)
- Logout must delete cookie with a Set-Cookie whose Domain/Path/Secure attributes match creation parameters so browsers remove it reliably.

Test Data & Environment
- Testsprite will need a test admin account (email/password) or a short-lived Firebase ID token; provide via environment variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`, or `ADMIN_ID_TOKEN`.
- Provide `BASE_URL` (test target), and `NEXT_PUBLIC_FIREBASE_API_KEY` (if the test harness must exchange email/password for idToken).
- Provide `COOKIE_DOMAIN` only when testing production-like domains; omit or set to `localhost` for local testing.

Non-functional checks
- Authentication latency: measure login call latency and assert it is < 1s in dev and < 500ms in staging (optional configurable thresholds).
- Rate limiting: repeated failed login attempts should be protected (observed 429 or account lock behavior) — optional.

Deliverables for Testsprite
- Generate automated test scripts (Playwright or Node fetch-based E2E) that implement the structured test cases above.
- Execute tests against the provided `BASE_URL` and environment credentials.
- Produce a detailed test report containing:
  - Per-test pass/fail and assertion details
  - HTTP request/response logs for failed cases (including response body and Set-Cookie headers)
  - Environment used (BASE_URL, NODE_ENV, COOKIE_DOMAIN)
  - Summary metrics: total, passed, failed, pass rate, average login latency

How to hand-off to Testsprite
1. Provide Testsprite with this repo and the updated PRD (this section).
2. Provide environment variables: `BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` OR `ADMIN_ID_TOKEN`, and `NEXT_PUBLIC_FIREBASE_API_KEY` (only if exchange is required).
3. Ask Testsprite to generate tests, run them in the target environment, and return the detailed test report.

Notes & Caveats
- If the target server sets `Domain=localhost` the browser will reject the cookie; tests should assert the server does not use Domain=localhost when running locally.
- Tests that require sign-in via Firebase REST (`signInWithPassword`) must have the Firebase API key available.
- For security reasons, do not commit secrets to the repo; use CI secrets or environment variables when running Testsprite in CI.

Next steps (recommended)
1. Provide the environment values (admin credentials, BASE_URL) and run Testsprite with this PRD.
2. If you want, I can: (a) format the exact Testsprite input (JSON), (b) generate Playwright test files from the test cases, or (c) run a local test pass using the `scripts/test-api.mjs` harness already in the repo.


### 3.2. Dashboard
*   Provides a high-level, real-time overview of key business metrics across all modules.
*   Features customizable widgets for sales trends, key vendor metrics, inventory alerts, and HR KPIs.
*   Includes an AI-powered KPI suggestion tool to help managers identify areas for improvement.

### 3.3. User Management
*   **User Administration:** Admins can create, view, edit, and deactivate user accounts.
*   **Role & Hierarchy Management:** A visual interface for creating roles (e.g., "Sales Executive," "Store Supervisor"), assigning permissions to them, and defining the organizational reporting structure.
*   **Permission Templates:** Admins can create reusable permission templates to quickly configure new roles.

### 3.4. Vendor Management
*   **Vendor Onboarding:** A comprehensive form to register new vendors, including contact, banking, and tax details.
*   **Vendor Profiles:** A centralized view of each vendor, including performance metrics (on-time delivery, quality score), communication logs, and associated documents.
*   **Purchase Orders (POs):** Create, approve, and track POs from creation to delivery.
*   **Invoice Management:** Upload and track vendor invoices against POs, with capabilities to log discrepancies.
*   **Price & Material Mapping:** Map raw materials to specific vendors, defining pricing, SKUs, and reorder levels.

### 3.5. Inventory Management
*   **Product Master:** A central catalog for all products (SKUs), including factory goods and store-level items.
*   **Segregated Inventories:** Separate views and management capabilities for Factory Inventory and individual Store Inventories, controlled by user roles.
*   **Goods Inward/Outward:** Log incoming stock (GRN) from vendors and outgoing stock for production or dispatch.
*   **Stock Transfers:** A workflow for administrators to transfer stock between the factory and stores.
*   **AI Catalog Assistant:** An AI-powered tool to automatically extract product details from an uploaded catalog page image.
*   **Cycle Counting & Valuation:** Tools to perform physical inventory counts, log discrepancies, and generate valuation reports.

### 3.6. Sales Management
*   **Lead Management:** Capture, assign, and track leads through the sales funnel (New, Contacted, Qualified).
*   **Opportunity Pipeline:** A Kanban-style board to visualize and manage sales opportunities from qualification to close (Won/Lost).
*   **AI Opportunity Summary:** On-demand AI-generated summaries of deal status and potential.
*   **Customer Management:** A database of all customer accounts with their complete history (orders, quotations, communications).
*   **Quotation Generation:** Create and manage customer quotations, with an AI assistant to auto-populate line items from natural language prompts. Convert approved quotes to orders.
*   **Order Management:** Track all sales orders from creation to fulfillment.

### 3.7. Store Management
*   **POS / Billing System:** A point-of-sale interface for Store Supervisors to create bills and process sales for walk-in customers.
*   **Store Dashboard:** A dedicated dashboard for store-level performance, including daily sales, top products, and cash-in-hand.
*   **Store Profile Management:** Admins can create and manage individual store locations, assign managers, and set store-specific settings (e.g., invoice template).
*   **Product Receiving:** A workflow for store staff to receive and acknowledge stock transfers from the factory.
*   **Returns & Credit Notes:** A system for processing customer returns and generating credit notes.

### 3.8. Human Resource Management System (HRMS)
*   **Employee Directory:** A central database of all employees with profiles and shift history.
*   **Attendance & Shifts:** Manage employee shifts and track live attendance.
*   **Leave Management:** A complete workflow for employees to request leave and for managers to approve/reject it.
*   **Recruitment (ATS):** An Applicant Tracking System to manage job openings and track candidates.
*   **Payroll & Settlement:** Tools to define salary structures, process monthly payroll, and generate final settlements.
*   **Performance Management:** Define KPIs and manage performance appraisal cycles.

---

## 4. Technical Stack
*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI/Styling:** ShadCN UI Components, Tailwind CSS, Lucide Icons
*   **Backend Logic:** Next.js Server Actions
*   **Database:** Google Firestore (via Firebase Admin SDK)
*   **Authentication:** Firebase Authentication
*   **Generative AI:** Genkit with Google AI (Gemini)
*   **Hosting:** Firebase App Hosting

---

## 5. Success Metrics
*   **Efficiency Gain:** Reduction in time spent on manual data entry and report generation (e.g., creating POs, generating quotations).
*   **Adoption Rate:** Percentage of employees across different departments actively using the platform for their daily tasks.
*   **Data Accuracy:** Reduction in errors related to inventory mismatches, incorrect order entries, and payment discrepancies.
*   **User Satisfaction:** Positive feedback from user personas regarding ease of use and ability to perform their jobs more effectively.

---

## 6. Future Considerations
*   **Mobile Application:** Develop a native or progressive web app for field sales and on-the-go access.
*   **Advanced Analytics:** Integrate with a dedicated analytics platform (like BigQuery) for more advanced business intelligence and predictive analytics.
*   **SaaS Transition:** Evolve the platform into a multi-tenant SaaS product for other businesses in the same industry.
*   **Enhanced AI Features:** Expand AI capabilities to include demand forecasting, automated PO generation, and advanced sales analytics.