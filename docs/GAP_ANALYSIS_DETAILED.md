# Detailed Gap Analysis: SOW → Codebase Mapping

**Date:** October 26, 2025  
**Status:** Sprint 1 Planning  
**Scope:** Firebase-based system with mocks → Supabase (per-tenant DB) + TypeORM + Permify  

---

## Executive Summary

### Current State
- **Frontend:** Next.js (App Router) + React + TypeScript — largely functional UI.
- **Backend:** Firebase Admin SDK + large in-memory mock data layer (`src/lib/firebase/firestore.ts`) powering all domain operations.
- **Auth:** Firebase Authentication with server-side session helpers; no revocation mechanism.
- **Authorization:** RBAC helpers present but read from Firestore; no live policy engine.
- **Data:** ~95% mock arrays; ~5% real Firebase writes for session/user records (when credentials available).
- **Infrastructure:** Docker-compose and dev environment missing; CI/CD not yet present.

### Target State (End of Sprint 3)
- **Backend:** Supabase Auth (JWT) + per-tenant Postgres databases via TypeORM ORM.
- **Authorization:** Permify policy engine with schema translated from 230-permission permission system.
- **Data:** TypeORM entities for all domain objects; mocks gradually replaced with persistent storage.
- **Infrastructure:** Docker dev environment with Postgres, Redis, MinIO; GitHub Actions CI; Terraform skeleton.

### Key Decisions
- **Tenancy model:** Per-tenant database (create-on-demand via Supabase Admin API).
- **Auth model:** Supabase Auth + JWT; control-plane `sessions` table for revocation.
- **Policy engine:** Permify with live schema sync and runtime policy checks.
- **ORM:** TypeORM with Postgres; local dev uses Docker Postgres or hosted Supabase.

---

## Module-by-Module Gap Analysis

### 1. USER MANAGEMENT & AUTHENTICATION (Priority: **CRITICAL**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **Auth UI** | ✅ Implemented | `src/app/login/`, `/page.tsx` | Login form present; uses Firebase SDK | OAuth providers (Google/GitHub) |
| **Firebase Auth** | ✅ Implemented | `src/lib/firebaseClient.ts` | Client SDK configured | — |
| **Session Creation (Server)** | ⚠️ Partial | `src/lib/session.ts`, `src/app/api/auth/...` | Creates `__session` cookie; uses Firebase admin | Supabase Auth integration; `jti` claim; control-plane storage |
| **Session Validation** | ⚠️ Partial | `src/lib/session.ts` | Reads Firebase admin; returns user claims | JWKS verification; session revocation check |
| **Middleware** | ⚠️ Partial | `src/middleware.ts` | Checks `__session` cookie | RS256 JWT verification; control-plane session lookup; policy engine call |
| **Role & Permission Fetch** | ⚠️ Partial | `src/lib/rbac.ts` | Reads Firestore roles doc or embedded claims | Permify runtime checks; audit trail for permission changes |
| **User Management (CRUD)** | ⚠️ Partial | `src/app/api/admin/users/...`, `src/app/dashboard/admin/users/...` | UI pages + mock helpers | TypeORM User entity; control-plane user_mappings; tenant-scoped user views |
| **Permission Assignment** | ⚠️ Partial | `src/lib/rbac.ts` | Fetches permissions; no granular control | Permify schema integration; audit log for role changes |

**Blockers for next steps:**
- Must implement control-plane `sessions` and `user_mappings` entities first (Sprint 1, Task 2).
- Supabase Auth credentials + JWKS URL must be configured in `.env`.
- Permify schema must be created and synced before runtime policy checks can work.

**Missing deliverables:**
- [ ] Control-plane TypeORM entities: `Session`, `UserMapping`, `TenantMetadata`
- [ ] Supabase Auth client setup + JWT validation middleware
- [ ] `src/lib/auth/supabase-client.ts` (Supabase JS client)
- [ ] `src/lib/auth/jwks-cache.ts` (JWKS caching + RS256 verification)
- [ ] Control-plane database provisioning script
- [ ] Permify schema for RBAC (mapping from permission system doc)
- [ ] Database migration: Firebase users → Supabase Auth + control-plane users table
- [ ] Tests: middleware unit tests (happy path, revoked session, invalid JWT)

**Estimated effort:** 28–40 hours (spread across Sprint 1 & 2)

---

### 2. VENDOR MANAGEMENT (Priority: **HIGH**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Vendor List** | ✅ Implemented | `src/app/dashboard/vendor/page.tsx` (likely) | Displays vendor data | — |
| **UI: Vendor Create/Edit Forms** | ⚠️ Partial | `src/app/dashboard/vendor/...` | Forms likely present | Detailed form validation; error handling |
| **Server Actions: Fetch Vendors** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `getVendors()` | Returns `MOCK_VENDORS` array | No tenant scoping; no DB query |
| **Server Actions: Create/Update** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `createVendor()` | Mocked; may attempt Firebase write | Tenant-scoped DB write; transaction support |
| **Vendor Entity** | ❌ Missing | — | — | TypeORM entity with fields: id, tenant_id, name, contact, banking, tax_id, status, created_at, updated_at |
| **Vendor Permissions** | ⚠️ Partial | `src/lib/rbac.ts` | Hardcoded mock permissions | Permify integration for vendor:view, vendor:create, vendor:edit, vendor:delete |
| **Performance Metrics** | ❌ Missing | — | — | Aggregate queries: on_time_delivery %, quality_score |
| **Purchase Orders (PO) Link** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `getPurchaseOrders()` | Mock function exists | Proper DB relation to vendor_id |
| **Invoice Management** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (partial) | Minimal mock | Full invoice entity, approval workflow, discrepancy logging |
| **Price & Material Mapping** | ❌ Missing | — | — | Entity linking vendor → material → sku → pricing |

**Dependencies:**
- Requires control-plane setup (Task 2) + tenant DB provisioning (Task 6).
- Requires Permify for vendor permission checks.

**Missing deliverables:**
- [ ] TypeORM `Vendor` entity (id, tenant_id, name, contact_person, email, phone, banking_details, tax_id, status, performance_rating, created_at, updated_at)
- [ ] TypeORM `VendorPerformance` entity (on_time_%, quality_score, total_orders)
- [ ] TypeORM `VendorMaterial` entity (vendor_id, material_id, sku_id, price, reorder_level, last_order_date)
- [ ] Migration files for vendor tables
- [ ] Seed data: sample vendors (5–10) per tenant
- [ ] Server action replacements: `getVendors()`, `createVendor()`, `updateVendor()`, `deleteVendor()` (tenant-scoped)
- [ ] API routes: `GET/POST /api/vendors`, `GET/PUT/DELETE /api/vendors/:id`
- [ ] Repository pattern: `VendorRepository` with query helpers
- [ ] Tests: vendor CRUD with tenant isolation

**Estimated effort:** 18–24 hours (Sprint 2)

---

### 3. INVENTORY MANAGEMENT (Priority: **HIGH**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Product List** | ✅ Implemented | `src/app/dashboard/inventory/products/` | Displays products | — |
| **UI: Inventory Dashboard** | ⚠️ Partial | `src/app/dashboard/inventory/` | Mock data shown | Low stock alerts, valuation views |
| **Product/SKU Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `MOCK_PRODUCTS` | In-memory array (10–20 products) | TypeORM entity with full schema |
| **Stock Levels (Master)** | ⚠️ Mock | `src/lib/firebase/firestore.ts` | Mock snapshots | Real-time inventory snapshots per warehouse/store |
| **Stock Movements** | ❌ Missing | — | — | Inbound (GRN), outbound (dispatch), transfer, adjustment records |
| **Goods Receipt Notes (GRN)** | ❌ Missing | — | — | Entity: receipt_date, vendor_id, po_id, items, quality_checks, acceptance_status |
| **Stock Transfers** | ❌ Missing | — | — | Workflow: initiate, approve, receive; audit trail |
| **Cycle Counting** | ❌ Missing | — | — | Physical count records, variance tracking, valuation |
| **Barcode/SKU Management** | ⚠️ Stub | `src/lib/firebase/firestore.ts` (minimal) | Not implemented | Generation, scanning, label printing helpers |
| **Inventory Permissions** | ⚠️ Partial | `src/lib/rbac.ts` | Mock RBAC checks | Permify: inventory:view, inventory:addStock, inventory:transferStock, inventory:viewStockValue |
| **AI Catalog Assistant** | ⚠️ Partial | `src/ai/flows/extract-product-image-from-catalog.ts` | Genkit flow exists (likely stub) | Full implementation, image upload, OCR, product master update |

**Dependencies:**
- Requires tenant DB + TypeORM setup.
- Requires Permify for inventory permission checks.
- Optional: requires AI/Genkit flow completion.

**Missing deliverables:**
- [ ] TypeORM entities: `Product` (id, tenant_id, name, sku, category_id, unit, cost_price, selling_price, ...), `SKU` (sku_code, barcode, product_id), `InventoryLevel` (product_id, warehouse_id/store_id, quantity, last_updated)
- [ ] TypeORM `StockMovement` entity (product_id, warehouse_id, movement_type: "IN"/"OUT"/"TRANSFER"/"ADJUSTMENT", quantity, reference_id, created_at)
- [ ] TypeORM `GoodsReceiptNote` entity (receipt_date, vendor_id, po_id, status: "pending"/"approved"/"rejected", items_json, created_by)
- [ ] Migration files for all inventory tables
- [ ] Seed data: 50–100 sample products + initial stock levels
- [ ] Server actions: `getProducts()`, `getInventory()`, `addStock()`, `transferStock()`, `createGRN()` (tenant-scoped)
- [ ] API routes for inventory CRUD
- [ ] Warehouse/store selection for stock queries
- [ ] Low stock alerts query
- [ ] Stock valuation report (aggregation)
- [ ] Barcode generation + scanning helpers (optional: integrate with barcode library like `jsbarcode`)
- [ ] Tests: inventory CRUD, stock movement audit, GRN workflow

**Estimated effort:** 32–48 hours (Sprint 2–3)

---

### 4. SALES MANAGEMENT (Priority: **HIGH**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Leads List** | ✅ Implemented | `src/app/dashboard/sales/leads/` | Displays leads | — |
| **UI: Opportunities Kanban** | ✅ Implemented | `src/app/dashboard/sales/opportunities/` (likely) | Kanban board UI | Drag-and-drop state updates |
| **UI: Quotations** | ⚠️ Partial | `src/app/dashboard/sales/quotations/` | UI likely scaffolded | Full quote generation + approval workflow |
| **UI: Orders** | ⚠️ Partial | `src/app/dashboard/sales/orders/` | Basic list | Order lifecycle tracking, shipment integration |
| **Leads Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `MOCK_LEADS` | In-memory array | TypeORM entity: id, tenant_id, title, source, status, assigned_to, created_by, created_at |
| **Opportunities Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `MOCK_OPPORTUNITIES` | Mock array | TypeORM entity with pipeline stages, probability, expected_close_date, amount |
| **Quotation Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (minimal) | Not implemented | Full schema: quotation_number, customer_id, line_items, total, tax, approval_status, sent_at |
| **Sales Order Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (partial) | Mock function | Full schema: order_number, customer_id, quotation_id, shipment_status, payment_status |
| **Invoice Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (partial) | Minimal mock | Tax invoice generation, payment tracking |
| **AI Opportunity Summary** | ⚠️ Partial | `src/ai/flows/summarize-opportunity.ts` | Genkit flow exists | Integration with sales actions; test coverage |
| **AI Quotation Generation** | ⚠️ Partial | `src/ai/flows/generate-quotation-flow.ts` | Genkit flow exists | Line item auto-population; pricing logic |
| **Sales Permissions** | ⚠️ Partial | `src/lib/rbac.ts` | Mock RBAC | Permify: sales:viewOwn, sales:viewTeam, sales:viewAll, sales:create, sales:edit, sales:approve (quotations/invoices) |

**Dependencies:**
- Requires tenant DB + TypeORM setup.
- Requires Permify for sales permission checks (view own, team, all).
- Requires customer entity (see User Management).

**Missing deliverables:**
- [ ] TypeORM `Lead` entity (id, tenant_id, title, source, status: "new"/"contacted"/"qualified", assigned_to, created_by, created_at, updated_at, notes)
- [ ] TypeORM `Opportunity` entity (id, tenant_id, title, lead_id, customer_id, stage, probability, expected_close_date, amount, assigned_to)
- [ ] TypeORM `Quotation` entity (quotation_number, tenant_id, customer_id, opportunity_id, line_items_json, subtotal, tax, total, approval_status, sent_at, created_by)
- [ ] TypeORM `SalesOrder` entity (order_number, tenant_id, customer_id, quotation_id, order_date, shipment_status, payment_status, total)
- [ ] TypeORM `SalesInvoice` entity (invoice_number, tenant_id, customer_id, sales_order_id, tax_invoice_date, total, payment_received, payment_date)
- [ ] TypeORM `SalesLineItem` entity (quotation_id OR order_id, product_id, quantity, unit_price, discount, tax, line_total)
- [ ] Migration files
- [ ] Seed data: 20–30 leads, 10–15 opportunities, 5–10 quotations
- [ ] Server actions: lead/opportunity CRUD, quote generation, order creation, invoice generation
- [ ] API routes for sales module
- [ ] Permify schema for sales role hierarchy (sales exec → regional head → sales president)
- [ ] AI flow testing + integration
- [ ] Tests: lead assignment, opportunity stage movement, quote to order conversion

**Estimated effort:** 40–56 hours (Sprint 2–3)

---

### 5. HUMAN RESOURCE MANAGEMENT (HRMS) (Priority: **MEDIUM**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Employee Directory** | ⚠️ Stub | `src/app/dashboard/hrms/employees/` (likely) | UI scaffolding only | Full employee profiles, document uploads |
| **UI: Attendance** | ⚠️ Stub | `src/app/dashboard/hrms/attendance/` | Minimal/missing | Clock-in/out, attendance reports |
| **UI: Payroll** | ⚠️ Stub | `src/app/dashboard/hrms/payroll/` | Not implemented | Salary structure, payroll processing, payslips |
| **UI: Leave Management** | ⚠️ Stub | `src/app/dashboard/hrms/leave/` | Likely missing | Leave requests, approvals, balance tracking |
| **UI: Recruitment** | ⚠️ Stub | `src/app/dashboard/hrms/recruitment/` | Not implemented | Job postings, candidate tracking |
| **Employee Entity** | ⚠️ Partial | `src/lib/rbac.ts` (mock user) | Mock data | Full TypeORM entity: id, tenant_id, user_id, name, email, phone, designation, department, manager_id, hire_date, employment_status, documents |
| **Attendance Entity** | ❌ Missing | — | — | TypeORM: attendance_date, employee_id, check_in, check_out, shift_id, status: "present"/"absent"/"leave"/"half-day" |
| **Leave Entity** | ❌ Missing | — | — | TypeORM: leave_date_from, leave_date_to, leave_type, status: "applied"/"approved"/"rejected", approved_by |
| **Payroll Entity** | ❌ Missing | — | — | TypeORM: month, year, employee_id, salary_structure, gross, deductions, net, processed_by, processing_date |
| **Payslip Entity** | ❌ Missing | — | — | Generated from payroll; PDF export |
| **Job Posting Entity** | ❌ Missing | — | — | TypeORM: job_title, description, department, status: "open"/"closed", created_at, closed_at |
| **Candidate Entity** | ❌ Missing | — | — | TypeORM: name, email, applied_job_id, stage: "applied"/"screened"/"interviewed"/"offered"/"rejected", resume_url |
| **HRMS Permissions** | ❌ Missing | `src/lib/rbac.ts` | No HRMS-specific checks | Permify: hrms:viewEmployees, hrms:viewSalary (own), hrms:editSalary (admin), hrms:approve-leave (manager) |

**Dependencies:**
- Requires tenant DB + TypeORM setup.
- Requires Permify for HRMS permission checks (view own, team, all; salary visibility rules).
- Requires user_mappings in control-plane to link system users to employees.

**Missing deliverables:**
- [ ] TypeORM `Employee` entity (id, tenant_id, user_id, name, email, phone, designation, department, manager_id, hire_date, employment_status: "active"/"inactive", ...)
- [ ] TypeORM `Attendance` entity (id, employee_id, attendance_date, check_in_time, check_out_time, shift_id, status, notes)
- [ ] TypeORM `Leave` entity (id, employee_id, leave_type: "annual"/"sick"/"maternity", from_date, to_date, status: "applied"/"approved"/"rejected", approved_by, approved_at)
- [ ] TypeORM `SalaryStructure` entity (employee_id, basic, hra, dearness_allowance, ..., deductions, net)
- [ ] TypeORM `Payroll` entity (id, employee_id, month, year, salary_structure_id, gross, deductions, net, processed_by, processing_date)
- [ ] TypeORM `Payslip` entity (id, payroll_id, generated_at, pdf_url)
- [ ] TypeORM `JobPosting` entity (id, tenant_id, job_title, description, department, requirements, status, created_at, closed_at, closed_reason)
- [ ] TypeORM `Candidate` entity (id, job_posting_id, name, email, phone, applied_date, current_stage: "applied"/"screened"/"interviewed"/"offered"/"rejected", resume_url, notes)
- [ ] Migration files
- [ ] Seed data: 5–10 employees, 2–3 job postings, 2–3 candidates
- [ ] Server actions for employee/attendance/leave/payroll CRUD
- [ ] API routes for HRMS
- [ ] Leave balance calculation logic
- [ ] Payroll processing workflow + approval
- [ ] PDF generation for payslips
- [ ] Tests: leave balance calculation, payroll processing, candidate workflow

**Estimated effort:** 48–64 hours (Sprint 3)

---

### 6. STORE & POINT OF SALE (Priority: **MEDIUM**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Store Dashboard** | ⚠️ Partial | `src/app/dashboard/store/` (likely) | Basic scaffolding | Real-time sales, top products, cash register |
| **UI: POS Terminal** | ⚠️ Stub | `src/app/dashboard/store/pos/` (likely) | UI minimal/missing | Full POS workflow, payment processing |
| **UI: Store Bills** | ⚠️ Partial | `src/app/dashboard/store/bills/` (likely) | Limited functionality | Bill history, reprinting, discounts |
| **Store Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (minimal) | Mock data | Full TypeORM entity: id, tenant_id, store_name, location, manager_id, opening_date, settings |
| **Bill Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` (partial) | Limited mock | Full schema: bill_number, store_id, bill_date, items, total, payments, created_by |
| **POS Transaction Entity** | ❌ Missing | — | — | TypeORM: bill_id, items, customer_info, total, payment_method, change, timestamp |
| **Store Inventory Link** | ❌ Missing | — | — | Link to warehouse inventory; real-time stock deduction |
| **Daily Settlement** | ❌ Missing | — | — | Cash reconciliation, reports |
| **Returns & Credit Notes** | ⚠️ Stub | `src/lib/firebase/firestore.ts` (minimal) | Not fully implemented | Entity + workflow for store returns |
| **Store Permissions** | ⚠️ Partial | `src/lib/rbac.ts` | Limited checks | Permify: store:processSale, store:viewSales, store:viewDailySummary, store:processRefund |

**Dependencies:**
- Requires tenant DB + TypeORM setup.
- Requires Permify for store permissions.
- Requires inventory integration (stock deduction on sale).
- Requires payment gateway integration (cash/card).

**Missing deliverables:**
- [ ] TypeORM `Store` entity (id, tenant_id, store_name, location, manager_id, opening_date, store_settings_json, created_at)
- [ ] TypeORM `StoreBill` entity (bill_number, store_id, bill_date, customer_info_json, items_json, subtotal, tax, total, payment_method, change, created_by)
- [ ] TypeORM `BillLineItem` entity (bill_id, product_id, quantity, unit_price, discount, tax, line_total)
- [ ] TypeORM `StoreReturn` entity (original_bill_id, return_date, items_json, return_reason, credit_note_amount, processed_by)
- [ ] Migration files
- [ ] Seed data: 2–3 stores, 5–10 sample bills
- [ ] Server actions: create bill, process payment, process return
- [ ] API routes for store operations
- [ ] Real-time inventory sync: deduct stock on bill creation
- [ ] Daily settlement report query
- [ ] Payment gateway abstraction (cash, card, online)
- [ ] Tests: bill creation with stock deduction, refund workflow

**Estimated effort:** 32–48 hours (Sprint 3)

---

### 7. SUPPLY CHAIN & PROCUREMENT (Priority: **HIGH**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Purchase Orders** | ⚠️ Partial | `src/app/dashboard/vendor/purchase-orders/` (likely) | Basic UI present | Full PO creation, approval workflow |
| **UI: Vendor Bills** | ⚠️ Stub | `src/app/dashboard/vendor/bills/` | Minimal | Bill matching against PO, payment tracking |
| **UI: Goods Receipt (GRN)** | ⚠️ Stub | `src/app/dashboard/vendor/grn/` | Not fully implemented | Receipt workflow, quality checks |
| **Purchase Order Entity** | ⚠️ Mock | `src/lib/firebase/firestore.ts` → `getPurchaseOrders()` | Mock function | Full TypeORM entity: po_number, vendor_id, po_date, items, total, approval_status, receipt_status |
| **Vendor Bill Entity** | ⚠️ Partial | `src/lib/firebase/firestore.ts` (minimal) | Limited mock | Full schema: bill_number, vendor_id, bill_date, po_reference, items, total, payment_status |
| **GRN Entity** | ⚠️ Partial | `src/lib/firebase/firestore.ts` (minimal) | Not fully implemented | receipt_date, po_id, vendor_id, items_received, quality_checks, acceptance_status |
| **Purchase Line Items** | ⚠️ Partial | `src/lib/firebase/firestore.ts` (partial) | Limited mock | Full entity linking PO ↔ items ↔ pricing |
| **Supply Chain Permissions** | ⚠️ Partial | `src/lib/rbac.ts` | Limited checks | Permify: procurement:createPO, procurement:approvePO, procurement:receiveGoods, procurement:viewPayments |

**Dependencies:**
- Requires tenant DB + TypeORM setup.
- Requires Permify for procurement permission checks.
- Requires vendor entity (Section 2).
- Requires inventory integration (stock in on GRN receipt).

**Missing deliverables:**
- [ ] TypeORM `PurchaseOrder` entity (po_number, vendor_id, po_date, delivery_date, total, approval_status: "draft"/"approved"/"sent"/"received", created_by)
- [ ] TypeORM `PurchaseLineItem` entity (po_id, product_id, quantity, unit_price, tax, line_total)
- [ ] TypeORM `VendorBill` entity (bill_number, vendor_id, bill_date, po_id_reference, subtotal, tax, total, payment_status: "pending"/"paid", payment_date)
- [ ] TypeORM `GoodsReceiptNote` entity (grn_number, vendor_id, po_id, receipt_date, items_json, quality_checks_json, acceptance_status: "pending"/"accepted"/"rejected", received_by)
- [ ] TypeORM `ProcurementAudit` entity (action, entity_type, entity_id, changed_by, timestamp) — for audit trail
- [ ] Migration files
- [ ] Seed data: 5–10 POs, 3–5 vendor bills, 3–5 GRNs
- [ ] Server actions: create PO, approve PO, send PO, receive GRN, record bill, process payment
- [ ] API routes for procurement
- [ ] PO-to-invoice matching logic
- [ ] Stock in on GRN creation
- [ ] PO expiry alerts
- [ ] Vendor payment due date tracking
- [ ] Tests: PO workflow, bill matching, GRN with quality checks

**Estimated effort:** 36–48 hours (Sprint 2–3)

---

### 8. KPI DASHBOARD & ANALYTICS (Priority: **MEDIUM**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **UI: Dashboard Page** | ✅ Implemented | `src/app/dashboard/page.tsx` | Shows widgets | Real-time data updates, custom widget selection |
| **Server Actions: Dashboard Data** | ⚠️ Mock | `src/app/dashboard/actions.ts` | Reads from mock arrays | Queries real DB; aggregation queries |
| **Widgets: Sales Trends** | ⚠️ Mock | `src/app/dashboard/actions.ts` → `getDashboardData()` | Returns mock metrics | Real sales data aggregation |
| **Widgets: Inventory Alerts** | ⚠️ Mock | `src/app/dashboard/actions.ts` | Mock data | Real low-stock queries |
| **Widgets: Vendor Metrics** | ⚠️ Mock | `src/app/dashboard/actions.ts` | Mock data | Real performance aggregation |
| **Widgets: HR KPIs** | ⚠️ Mock | `src/app/dashboard/actions.ts` | Not implemented | Attendance rate, payroll status |
| **AI KPI Suggestion** | ⚠️ Partial | `src/ai/flows/suggest-kpis-based-on-performance.ts` | Genkit flow exists | Integration with dashboard data; test coverage |
| **PostHog Analytics** | ⚠️ Partial | `src/components/GoogleAnalyticsProvider.tsx` | Provider present; PostHog key in env | Event tracking integration; custom event helpers |
| **Reporting** | ❌ Missing | — | — | Standard reports (sales, inventory, vendor, HR) |
| **Data Export** | ⚠️ Stub | — | Not fully implemented | Export dashboard/report data as Excel/PDF |

**Dependencies:**
- Requires all domain entities (vendor, inventory, sales, HRMS) in place.
- Requires PostHog + Sentry SDK integration.
- Optional: Permify permission checks for report visibility.

**Missing deliverables:**
- [ ] Dashboard aggregation queries (SQL/TypeORM query builder): YTD sales, current inventory value, vendor on-time %, HR headcount
- [ ] Materialized views or cached aggregates (e.g., daily sales summary table) for performance
- [ ] Server actions that fetch real data: `getDashboardData()`, `getSalesMetrics()`, `getInventoryAlerts()`
- [ ] PostHog event tracking helpers: `trackSale()`, `trackInventoryAdjustment()`, `trackUserLogin()`
- [ ] Report generation helpers: `generateSalesReport()`, `generateInventoryReport()`
- [ ] PDF/Excel export integration (library like `exceljs`, `pdfkit`)
- [ ] Cron job for materialized view refresh (optional: Redis caching)
- [ ] AI KPI suggestion flow completion + integration
- [ ] Tests: aggregation query correctness, event tracking, export format validation

**Estimated effort:** 24–36 hours (Sprint 3)

---

### 9. COMMUNICATION & NOTIFICATIONS (Priority: **MEDIUM**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **Email Integration** | ⚠️ Stub | `MAILGUN_API_KEY` in `.env.local` | Key present; no adapter | Email adapter, transactional email templates |
| **SMS Integration** | ⚠️ Stub | Not in `.env.local` | — | SMS provider config (Twilio, AWS SNS), adapter |
| **Notification Service** | ❌ Missing | — | — | Unified notification dispatcher (email, SMS, in-app) |
| **Email Templates** | ❌ Missing | — | — | User signup, password reset, order confirmation, etc. |
| **Transactional Emails** | ❌ Missing | — | — | Triggered on order, invoice, payroll, leave approval events |
| **Notification Queue** | ❌ Missing | — | — | Redis-backed queue for reliable delivery + retries |

**Dependencies:**
- Requires Mailgun + optional SMS provider integration.
- Requires Redis for queuing (optional: local dev uses in-memory queue).
- Requires event emission from domain service operations.

**Missing deliverables:**
- [ ] `src/lib/integrations/mailgun.ts` — email client adapter
- [ ] `src/lib/integrations/notifications.ts` — dispatcher interface
- [ ] `src/lib/notifications/templates/` — email template files (signup, password-reset, order-confirmation, invoice, payroll, etc.)
- [ ] Notification queue schema (optional: TypeORM entity or Redis hashes)
- [ ] Transactional email helpers: `sendWelcomeEmail()`, `sendOrderConfirmation()`, `sendPayslip()`
- [ ] Event listeners/hooks to trigger emails (order created → send confirmation)
- [ ] Tests: email sending with mock Mailgun, queue reliability

**Estimated effort:** 12–18 hours (Sprint 2–3)

---

### 10. VENDOR PORTAL ACCESS (Priority: **LOW/MEDIUM**)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **Vendor Login** | ❌ Missing | — | — | Separate auth flow for external vendors |
| **Vendor Dashboard** | ❌ Missing | — | — | Portal page with assigned POs, invoices, payments |
| **Vendor Self-Service** | ❌ Missing | — | — | Update profile, upload documents, view KPIs |
| **Vendor Portal Permissions** | ❌ Missing | — | — | Permify: vendor:viewAssigned, vendor:communicate, etc. |

**Dependencies:**
- Requires Permify for vendor role & permissions.
- Requires separate tenant/user scoping for vendor users.
- Deferred to Sprint 4 (post-MVP).

---

### 11. INFRASTRUCTURE & DEVOPS (Priority: **CRITICAL** for dev velocity)

| Component | Status | Files | Notes | Missing |
|-----------|--------|-------|-------|---------|
| **Docker Support** | ❌ Missing | — | No Dockerfile or compose file | Dockerfile for Next.js app, docker-compose.dev.yml |
| **Local Dev Environment** | ⚠️ Partial | `scripts/`, `fix-imports.ps1` | Some helpers present | Postgres + Redis + MinIO containers, health checks |
| **Environment Configuration** | ⚠️ Partial | `.env.local` | Many keys configured | `.env.template` for team reference; secrets management docs |
| **Database Provisioning** | ❌ Missing | — | — | Script to create per-tenant DB on Supabase Admin API |
| **Migrations Management** | ⚠️ Stub | `migrations/control/` | SQL file present; no tooling | TypeORM migration CLI integration, per-tenant migration runner |
| **CI/CD Pipelines** | ❌ Missing | `.github/workflows/` (likely empty) | — | `ci.yml` (lint, test, build), optional deploy workflow |
| **Terraform Skeleton** | ❌ Missing | `terraform/` (likely empty) | — | Placeholder modules for Supabase, S3, DNS |
| **Secrets Management** | ⚠️ Partial | `.env.local` | Secrets present locally | GitHub secrets for CI, Docker secrets docs, secret rotation policy |
| **Pre-commit Hooks** | ❌ Missing | — | — | Lint, format, no-secrets checks before commit |
| **Audit Logging** | ⚠️ Stub | `src/lib/firebase/firestore.ts` (minimal) | Not fully implemented | Centralized audit log table, immutable record structure |

**Dependencies:**
- Required for Sprint 1 to enable local dev.
- Requires control-plane DB setup first (for migrations).

**Missing deliverables:**
- [ ] `Dockerfile` for Next.js app (multi-stage build)
- [ ] `docker-compose.dev.yml` with Postgres (+ init SQL), Redis, MinIO, app service
- [ ] `.env.template` with all required keys + descriptions
- [ ] `scripts/provision-tenant-db.sh` / `.ps1` — Supabase Admin API script
- [ ] `scripts/run-migrations.sh` / `.ps1` — run TypeORM migrations per tenant
- [ ] `scripts/seed-tenant.sh` / `.ps1` — seed control + tenant DB with test data
- [ ] `.github/workflows/ci.yml` — lint, test, build, push to registry (optional)
- [ ] `.github/workflows/deploy-dev.yml` — optional dev deployment
- [ ] `terraform/main.tf`, `terraform/variables.tf`, `terraform/outputs.tf` — placeholders for Supabase, S3, DNS
- [ ] `docs/DOCKER_SETUP.md` — how to use docker-compose locally
- [ ] `docs/SECRETS_MANAGEMENT.md` — best practices for secrets in CI/dev
- [ ] `.husky/pre-commit` — pre-commit hooks (lint, format)
- [ ] TypeORM `src/lib/orm/migration.runner.ts` — CLI to run migrations per-tenant
- [ ] Audit log TypeORM entity: `AuditLog` (id, tenant_id, entity_type, entity_id, action, old_values, new_values, user_id, timestamp)
- [ ] Tests: ensure Docker builds + compose starts successfully

**Estimated effort:** 28–40 hours (Sprint 1–2)

---

### 12. CROSS-CUTTING CONCERNS

#### Data Migration (Firebase → Postgres)

| Task | Status | Notes |
|------|--------|-------|
| **Seed Control-Plane Data** | ❌ Missing | Admin user, default roles, tenant_metadata entries |
| **Migrate Vendor Data** | ❌ Missing | Export `MOCK_VENDORS` → CSV/JSON → TypeORM seed |
| **Migrate Product Data** | ❌ Missing | Export `MOCK_PRODUCTS` → seed script |
| **Migrate User Roles** | ❌ Missing | Firebase roles doc → control-plane roles + user_mappings |
| **Incremental Migration Strategy** | ❌ Missing | Plan per-feature migration with rollback plan |

**Deliverables:**
- [ ] `scripts/seed/control-plane.sql` or TypeORM seeder
- [ ] `scripts/migrate/seed-vendors.ts` — export mock → Postgres
- [ ] `scripts/migrate/seed-products.ts` — export mock → Postgres
- [ ] `scripts/migrate/seed-users-and-roles.ts` — export Firebase roles → control-plane
- [ ] Migration documentation with rollback procedures

**Estimated effort:** 16–24 hours (Sprint 2–3)

#### Policy Engine Integration (Permify)

| Task | Status | Notes |
|------|--------|-------|
| **Permission System Mapping** | ❌ Missing | 230 permissions → Permify schema (relations, attributes) |
| **Permify Schema Creation** | ❌ Missing | Schema definition file (YAML or JSON) |
| **Policy Push CLI** | ❌ Missing | `sync-policies` command to push schema + roles to Permify |
| **Runtime Policy Checks** | ⚠️ Stub | `permifyClient.ts` exists; needs completion |
| **Audit Log for Policy Changes** | ❌ Missing | Log all schema/policy updates + who changed them |

**Deliverables:**
- [ ] `docs/PERMIFY_SCHEMA.md` — mapping doc of 230 permissions to Permify entities/relations/attributes
- [ ] `src/policy/schema.yaml` or `.json` — Permify schema definition
- [ ] `scripts/sync-policies.ts` — CLI to push schema + roles to Permify
- [ ] `src/lib/permifyClient.ts` — complete implementation (schema push, runtime check, retry logic)
- [ ] `src/policy/mapper.ts` — translate SOW permissions to Permify schema
- [ ] TypeORM `PolicySyncLog` entity for audit trail
- [ ] Tests: schema validation, policy check correctness

**Estimated effort:** 24–36 hours (Sprint 2–3)

#### Observability & Monitoring

| Task | Status | Notes |
|------|--------|-------|
| **PostHog Integration** | ⚠️ Partial | Key in env; no event tracking |
| **Sentry Integration** | ⚠️ Stub | DSN placeholder; not configured |
| **Application Logging** | ⚠️ Partial | Console logs; no centralized logging |
| **Metrics Export** | ❌ Missing | No app performance metrics collection |

**Deliverables:**
- [ ] `src/lib/analytics.ts` — PostHog event helpers
- [ ] `src/lib/error-reporting.ts` — Sentry error handler
- [ ] `src/lib/logging.ts` — centralized logger (Winston or Pino + transport to CloudWatch/Datadog)
- [ ] Sentry project setup + error boundary React components
- [ ] Event tracking for: user login, API errors, database query duration, policy check failures
- [ ] Basic observability dashboard (PostHog insights or Grafana)
- [ ] Alerting rules (PagerDuty or similar) for critical errors

**Estimated effort:** 12–18 hours (Sprint 3)

---

## Sprint-by-Sprint Breakdown

### Sprint 1 (Weeks 1–2): Foundation & Dev Environment
**Goal:** Control-plane scaffolding, local dev setup, JWT middleware PoC

| Task # | Title | Effort | Owner | Dependencies |
|--------|-------|--------|-------|--------------|
| 1.1 | **Gap Analysis (this document) + Sprint Planning** | 8h | Architect | — |
| 1.2 | **Control-plane TypeORM entities** (`sessions`, `user_mappings`, `tenant_metadata`, `policy_sync_log`) | 12h | Backend Lead | — |
| 1.3 | **Control-plane migrations** | 6h | Backend Lead | 1.2 |
| 1.4 | **Middleware PoC: JWT + session revocation** | 10h | Backend Lead | 1.2, 1.3 |
| 1.5 | **Tenant DB provisioning script (Supabase Admin API)** | 10h | DevOps / Backend | — |
| 1.6 | **Dockerize app + docker-compose.dev.yml** | 12h | DevOps | — |
| 1.7 | **`.env.template` + secrets management docs** | 4h | DevOps | — |
| 1.8 | **Seed control-plane with admin user + default roles** | 6h | Backend Lead | 1.2, 1.3 |
| 1.9 | **Tests: middleware unit + integration (happy path, revoked, invalid JWT)** | 8h | QA / Backend | 1.4 |
| **Sprint 1 Total** | — | **76h** | — | — |

### Sprint 2 (Weeks 3–4): Core Domain Entities & Permify
**Goal:** TypeORM entities for core domain; Permify schema mapping & CLI

| Task # | Title | Effort | Owner | Dependencies |
|--------|-------|--------|-------|--------------|
| 2.1 | **Core entities: Vendor, Product/SKU, PurchaseOrder, SalesOrder, Employee** | 24h | Backend Lead | 1.2–1.3 |
| 2.2 | **Vendor module: CRUD server actions + API routes** | 12h | Backend Lead | 2.1 |
| 2.3 | **Permify schema mapping doc (230 permissions → Permify)** | 12h | Architect / Security | — |
| 2.4 | **Permify schema file (YAML/JSON) + CLI sync tool** | 16h | Backend Lead | 2.3 |
| 2.5 | **Permify runtime check implementation** | 12h | Backend Lead | 2.4 |
| 2.6 | **Integrations wiring: Mailgun, PostHog, Sentry adapters** | 10h | Backend Lead | — |
| 2.7 | **Migration scripts: mocks → Postgres (vendor, product seed)** | 12h | Backend Lead | 2.1 |
| 2.8 | **Tests: vendor CRUD, Permify policy checks, integration tests** | 12h | QA / Backend | 2.2, 2.5 |
| **Sprint 2 Total** | — | **110h** | — | — |

### Sprint 3 (Weeks 5–6): Sales, HRMS, & Polish
**Goal:** Sales + HRMS entities; full test coverage; CI setup

| Task # | Title | Effort | Owner | Dependencies |
|--------|-------|--------|-------|--------------|
| 3.1 | **Sales entities: Lead, Opportunity, Quotation, SalesOrder, Invoice** | 24h | Backend Lead | 2.1 |
| 3.2 | **Sales server actions + API routes** | 16h | Backend Lead | 3.1 |
| 3.3 | **HRMS entities: Employee, Attendance, Leave, Payroll, Candidate** | 20h | Backend Lead | 2.1 |
| 3.4 | **HRMS server actions + API routes** | 12h | Backend Lead | 3.3 |
| 3.5 | **Dashboard aggregation queries + KPI calculation** | 10h | Backend Lead | 2.1, 3.1, 3.3 |
| 3.6 | **GitHub Actions CI workflow (lint, test, build)** | 8h | DevOps | — |
| 3.7 | **Terraform skeleton (Supabase, S3, DNS)** | 10h | DevOps | — |
| 3.8 | **Documentation: RUN_LOCALLY, DEVELOPERS_GUIDE, MIGRATION_RUNBOOK** | 16h | Tech Writer | 1.2–1.6 |
| 3.9 | **Playwright E2E tests (auth, vendor create, sales order)** | 14h | QA | All backend work |
| **Sprint 3 Total** | — | **130h** | — | — |

**Grand Total (3 sprints): ~316 hours**

Assuming a team of 3 engineers (backend lead, 1–2 backend engineers, DevOps) + QA, this is roughly:
- **Backend Lead:** 140h (lead architecture, complex codegen, migrations)
- **Backend Engineer(s):** 120h (entity scaffolding, CRUD, testing)
- **DevOps:** 40h (Docker, Terraform, provisioning)
- **QA / Tech Writer:** 16h (tests, docs)

**Parallelization opportunity:** Tasks 1.1–1.2 and 1.5–1.6 can run in parallel in Sprint 1.

---

## LLM Model Recommendations

### Sonnet 4.5 (Complex, Multi-file Code Generation)
Use for:
- TypeORM entity generation (relationships, constraints, migrations)
- Migration script generation from mock data
- Policy engine schema translation (230 permissions → Permify)
- Multi-file refactors (auth flow migration)
- Middleware PoC implementation
- Server action + API route generation
- Docker Compose + Dockerfile scaffolding

Rationale: Handles complex interdependencies, generates correct TypeORM/SQL syntax, produces idiomatic code patterns.

### Haiku (Lightweight, Summaries, Helpers)
Use for:
- Commit messages and PR descriptions
- Changelogs and release notes
- Documentation summaries
- Small shell scripts (`provision-tenant.sh` wrapper logic)
- Issue triage and prioritization
- Code review comments

Rationale: Fast, cost-efficient for simple tasks; adequate for structured text generation.

---

## Risk Mitigation & Notes

### High-Risk Items
1. **Per-tenant DB provisioning:** Create-on-demand via Supabase Admin API requires careful credential/secret management. Test thoroughly with non-prod tenant first.
2. **Permify schema translation:** 230 permissions is complex; recommend starting with top 50 permissions for v1, add rest incrementally.
3. **Data migration from Firebase → Postgres:** Plan rollback procedures; consider running Firebase + Postgres in parallel during transition.

### Testing Strategy
- **Unit tests:** Entity validation, utility functions, data transformations.
- **Integration tests:** DAO/repository layer against test Postgres container.
- **Middleware tests:** JWT validation, session revocation, policy checks (mock Permify).
- **E2E tests:** Playwright for auth flow, vendor CRUD, sales workflow (seeded tenant DB).
- **Smoke tests:** Post-deployment to staging (auth, policy check, DB connection).

### Documentation Priorities
1. `DOCKER_SETUP.md` — how to spin up local dev environment (first week).
2. `DEVELOPERS_GUIDE.md` — TypeORM entity patterns, server action structure, adding new API routes.
3. `MIGRATION_RUNBOOK.md` — step-by-step guide to run migrations, seed data, sync policies for new environments.
4. `PERMIFY_SCHEMA.md` — mapping doc for reference during permission checks.

---

## Success Criteria

**End of Sprint 3:**
- [ ] All core TypeORM entities created + migrations run successfully on per-tenant DBs.
- [ ] Control-plane DB provisioned and populated with admin user, default roles, sample tenant.
- [ ] Middleware validates JWTs, checks session revocation, calls Permify policy engine (happy path + edge cases tested).
- [ ] Permify schema synced with top 50–100 permissions; runtime policy checks working.
- [ ] Docker Compose local dev environment fully functional (app + Postgres + Redis + MinIO start + pass health checks).
- [ ] GitHub Actions CI runs lint, tests, builds Docker image successfully.
- [ ] All modules (Vendor, Sales, Inventory, HRMS, Store, Supply Chain) have entities + seed data + basic CRUD.
- [ ] E2E tests for critical flows (auth, vendor, sales) pass consistently.
- [ ] Documentation complete (DOCKER_SETUP, DEVELOPERS_GUIDE, MIGRATION_RUNBOOK).

---

## Next Immediate Actions (Start of Sprint 1)

1. **Confirm tech stack choices with team:**
   - Supabase connection string for control-plane DB (staging/prod vs. local Docker Postgres).
   - Permify endpoint URL + API key.
   - Mailgun, PostHog, Sentry project setup.

2. **Set up team access:**
   - Supabase project (staging) for per-tenant DB creation + testing.
   - Permify sandbox environment.
   - GitHub repo branch protection + PR review requirements.
   - CI secrets (Supabase keys, Permify API key).

3. **Begin task 1.1 (this gap analysis) + 1.2 (control-plane entities) in parallel.**

4. **Kick off daily standups to track Sprint 1 progress.**

---

**Document Version:** 1.0  
**Last Updated:** October 26, 2025  
**Next Review:** End of Sprint 1 (November 9, 2025)
