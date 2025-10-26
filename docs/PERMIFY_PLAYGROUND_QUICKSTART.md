# Permify Playground - Quick Copy-Paste Guide

## 📋 Quick Start (5 minutes)

### Step 1: Open Permify Playground
👉 Go to: **https://playground.permify.co**

---

### Step 2: Paste Schema
Copy the entire code below and paste into **"Enter Schema"** section:

```perm
// ============================================================
// PERMIFY SCHEMA - ALL 230 PERMISSIONS
// ============================================================

entity user {}
entity tenant {}
entity role {}
entity organization {}
entity lead {}
entity opportunity {}
entity quotation {}
entity invoice {}
entity product {}
entity stock {}
entity store_bill {}
entity vendor {}
entity purchase_order {}
entity vendor_bill {}
entity grn {}
entity employee {}
entity payroll {}
entity attendance {}
entity settlement {}
entity leave_request {}
entity job_posting {}
entity candidate {}

// Dashboard & Analytics (4)
action view_dashboard = user
action view_analytics = user
action view_reports = user
action export_data = user

// Sales: Leads (12)
action sales_leads_view = user
action sales_leads_viewOwn = user
action sales_leads_viewTeam = user
action sales_leads_viewAll = user
action sales_leads_create = user
action sales_leads_edit = user
action sales_leads_editOwn = user
action sales_leads_delete = user
action sales_leads_deleteOwn = user
action sales_leads_assign = user
action sales_leads_export = user
action sales_leads_import = user

// Sales: Opportunities (11)
action sales_opportunities_view = user
action sales_opportunities_viewOwn = user
action sales_opportunities_viewTeam = user
action sales_opportunities_viewAll = user
action sales_opportunities_create = user
action sales_opportunities_edit = user
action sales_opportunities_editOwn = user
action sales_opportunities_delete = user
action sales_opportunities_updateStage = user
action sales_opportunities_assign = user
action sales_opportunities_export = user

// Sales: Quotations (12)
action sales_quotations_view = user
action sales_quotations_viewOwn = user
action sales_quotations_viewTeam = user
action sales_quotations_viewAll = user
action sales_quotations_create = user
action sales_quotations_edit = user
action sales_quotations_editOwn = user
action sales_quotations_delete = user
action sales_quotations_approve = user
action sales_quotations_send = user
action sales_quotations_export = user
action sales_quotations_viewPricing = user

// Sales: Invoices (10)
action sales_invoices_view = user
action sales_invoices_viewOwn = user
action sales_invoices_viewAll = user
action sales_invoices_create = user
action sales_invoices_edit = user
action sales_invoices_delete = user
action sales_invoices_approve = user
action sales_invoices_send = user
action sales_invoices_export = user
action sales_invoices_viewPaymentStatus = user

// Inventory: Products (12)
action inventory_products_view = user
action inventory_products_viewAll = user
action inventory_products_create = user
action inventory_products_edit = user
action inventory_products_delete = user
action inventory_products_viewCost = user
action inventory_products_editCost = user
action inventory_products_viewStock = user
action inventory_products_manageVariants = user
action inventory_products_managePricing = user
action inventory_products_export = user
action inventory_products_import = user

// Inventory: Stock (11)
action inventory_stock_view = user
action inventory_stock_viewAll = user
action inventory_stock_addStock = user
action inventory_stock_removeStock = user
action inventory_stock_transferStock = user
action inventory_stock_adjustStock = user
action inventory_stock_viewStockValue = user
action inventory_stock_viewLowStock = user
action inventory_stock_manageWarehouses = user
action inventory_stock_viewStockHistory = user
action inventory_stock_export = user

// Inventory: Categories (5)
action inventory_categories_view = user
action inventory_categories_create = user
action inventory_categories_edit = user
action inventory_categories_delete = user
action inventory_categories_manageHierarchy = user

// Inventory: Alerts (4)
action inventory_alerts_view = user
action inventory_alerts_configure = user
action inventory_alerts_receiveNotifications = user
action inventory_alerts_manageReorderPoints = user

// Inventory: Pricing (5)
action inventory_pricing_view = user
action inventory_pricing_edit = user
action inventory_pricing_viewMargins = user
action inventory_pricing_createDiscounts = user
action inventory_pricing_approveDiscounts = user

// Inventory: Barcodes (4)
action inventory_barcodes_view = user
action inventory_barcodes_generate = user
action inventory_barcodes_print = user
action inventory_barcodes_scan = user

// Store: Bills (11)
action store_bills_view = user
action store_bills_viewOwn = user
action store_bills_viewAll = user
action store_bills_create = user
action store_bills_edit = user
action store_bills_editOwn = user
action store_bills_delete = user
action store_bills_viewPayments = user
action store_bills_processPayment = user
action store_bills_processRefund = user
action store_bills_export = user

// Store: Invoices (8)
action store_invoices_view = user
action store_invoices_viewPastBills = user
action store_invoices_viewAll = user
action store_invoices_create = user
action store_invoices_edit = user
action store_invoices_delete = user
action store_invoices_sendEmail = user
action store_invoices_export = user

// Store: POS (8)
action store_pos_access = user
action store_pos_viewSales = user
action store_pos_processSale = user
action store_pos_processReturn = user
action store_pos_applyDiscount = user
action store_pos_viewDailySummary = user
action store_pos_openCashDrawer = user
action store_pos_voidTransaction = user

// Store: Customers (6)
action store_customers_view = user
action store_customers_create = user
action store_customers_edit = user
action store_customers_delete = user
action store_customers_viewPurchaseHistory = user
action store_customers_manageLoyalty = user

// Procurement: Vendors (9)
action procurement_vendors_view = user
action procurement_vendors_viewAll = user
action procurement_vendors_create = user
action procurement_vendors_edit = user
action procurement_vendors_delete = user
action procurement_vendors_viewPayments = user
action procurement_vendors_viewPerformance = user
action procurement_vendors_manageContracts = user
action procurement_vendors_export = user

// Procurement: PO (10)
action procurement_po_view = user
action procurement_po_viewAll = user
action procurement_po_create = user
action procurement_po_edit = user
action procurement_po_delete = user
action procurement_po_approve = user
action procurement_po_send = user
action procurement_po_receiveGoods = user
action procurement_po_viewPricing = user
action procurement_po_export = user

// Procurement: Vendor Bills (9)
action procurement_bills_view = user
action procurement_bills_viewAll = user
action procurement_bills_create = user
action procurement_bills_edit = user
action procurement_bills_delete = user
action procurement_bills_approve = user
action procurement_bills_processPayment = user
action procurement_bills_viewPaymentStatus = user
action procurement_bills_export = user

// Procurement: GRN (5)
action procurement_grn_view = user
action procurement_grn_create = user
action procurement_grn_edit = user
action procurement_grn_approve = user
action procurement_grn_reject = user

// HRMS: Employees (11)
action hrms_employees_view = user
action hrms_employees_viewAll = user
action hrms_employees_viewOwn = user
action hrms_employees_create = user
action hrms_employees_edit = user
action hrms_employees_delete = user
action hrms_employees_viewSalary = user
action hrms_employees_editSalary = user
action hrms_employees_viewDocuments = user
action hrms_employees_manageDocuments = user
action hrms_employees_export = user

// HRMS: Payroll (7)
action hrms_payroll_view = user
action hrms_payroll_viewAll = user
action hrms_payroll_process = user
action hrms_payroll_approve = user
action hrms_payroll_viewReports = user
action hrms_payroll_generatePayslips = user
action hrms_payroll_export = user

// HRMS: Attendance (9)
action hrms_attendance_view = user
action hrms_attendance_viewAll = user
action hrms_attendance_viewOwn = user
action hrms_attendance_mark = user
action hrms_attendance_edit = user
action hrms_attendance_approve = user
action hrms_attendance_viewReports = user
action hrms_attendance_manageShifts = user
action hrms_attendance_export = user

// HRMS: Settlement (7)
action hrms_settlement_view = user
action hrms_settlement_viewAll = user
action hrms_settlement_create = user
action hrms_settlement_process = user
action hrms_settlement_approve = user
action hrms_settlement_viewDocuments = user
action hrms_settlement_export = user

// HRMS: Leave (9)
action hrms_leave_view = user
action hrms_leave_viewAll = user
action hrms_leave_viewOwn = user
action hrms_leave_apply = user
action hrms_leave_approve = user
action hrms_leave_reject = user
action hrms_leave_viewBalance = user
action hrms_leave_managePolicy = user
action hrms_leave_cancelLeave = user

// HRMS: Recruitment (6)
action hrms_recruitment_viewJobs = user
action hrms_recruitment_createJob = user
action hrms_recruitment_viewCandidates = user
action hrms_recruitment_scheduleInterview = user
action hrms_recruitment_updateStatus = user
action hrms_recruitment_makeOffer = user

// Vendor Portal (10)
action vendor_portal_viewAll = user
action vendor_portal_viewAssigned = user
action vendor_portal_create = user
action vendor_portal_edit = user
action vendor_portal_delete = user
action vendor_portal_communicate = user
action vendor_portal_viewPayments = user
action vendor_portal_viewPerformance = user
action vendor_portal_grantPortalAccess = user
action vendor_portal_export = user

// User Management (8)
action admin_users_viewAll = user
action admin_users_create = user
action admin_users_edit = user
action admin_users_delete = user
action admin_users_resetPassword = user
action admin_users_assignRoles = user
action admin_users_deactivate = user
action admin_users_viewAuditLog = user

// System Settings (8)
action admin_settings_view = user
action admin_settings_manageRoles = user
action admin_settings_manageUsers = user
action admin_settings_manageOrganization = user
action admin_settings_viewAuditLog = user
action admin_settings_manageIntegrations = user
action admin_settings_manageBilling = user
action admin_settings_manageNotifications = user
```

Click **"Save Schema"** ✓

---

### Step 3: Add Sample Data & Test Queries

#### Query 1: Can Sales Manager view dashboard?
```
user:sales_manager#view_dashboard
```
**Expected Result:** ✅ **PERMITTED**

---

#### Query 2: Can Sales Executive approve quotations?
```
user:sales_executive#sales_quotations_approve
```
**Expected Result:** ❌ **DENIED**

---

#### Query 3: Can Admin manage roles?
```
user:admin#admin_settings_manageRoles
```
**Expected Result:** ✅ **PERMITTED**

---

#### Query 4: Can Inventory Manager view all products?
```
user:inventory_manager#inventory_products_viewAll
```
**Expected Result:** ✅ **PERMITTED**

---

#### Query 5: Can Store Supervisor process sales?
```
user:store_supervisor#store_pos_processSale
```
**Expected Result:** ✅ **PERMITTED**

---

## 📊 Permission Summary

| Module | Count | Examples |
|--------|-------|----------|
| Dashboard & Analytics | 4 | view, analytics, reports, export |
| Sales - Leads | 12 | view, create, edit, delete, assign, export |
| Sales - Opportunities | 11 | view, create, edit, stage, assign |
| Sales - Quotations | 12 | view, create, approve, send, pricing |
| Sales - Invoices | 10 | view, create, approve, send, payments |
| Inventory - Products | 12 | view, create, edit, cost, variants |
| Inventory - Stock | 11 | view, add, transfer, adjust, value |
| Inventory - Categories | 5 | view, create, edit, hierarchy |
| Inventory - Alerts | 4 | view, configure, notifications |
| Inventory - Pricing | 5 | view, edit, margins, discounts |
| Inventory - Barcodes | 4 | view, generate, print, scan |
| Store - Bills | 11 | view, create, process, refund |
| Store - Invoices | 8 | view, create, send, past bills |
| Store - POS | 8 | access, process, return, discount |
| Store - Customers | 6 | view, create, edit, loyalty |
| Procurement - Vendors | 9 | view, create, edit, contracts |
| Procurement - PO | 10 | view, create, approve, receive |
| Procurement - Bills | 9 | view, create, approve, payment |
| Procurement - GRN | 5 | view, create, approve, reject |
| HRMS - Employees | 11 | view, create, edit, documents |
| HRMS - Payroll | 7 | view, process, approve, slips |
| HRMS - Attendance | 9 | view, mark, edit, reports |
| HRMS - Settlement | 7 | view, create, process, approve |
| HRMS - Leave | 9 | view, apply, approve, balance |
| HRMS - Recruitment | 6 | jobs, candidates, interviews |
| Vendor Portal | 10 | view, create, communicate, grant |
| User Management | 8 | view, create, edit, reset, assign |
| System Settings | 8 | view, manage, audit log |

**Total: 230 Permissions** ✓

---

## 🎯 Predefined Roles Quick Stats

| Role | Permissions | Use Case |
|------|-------------|----------|
| Admin | 230 | Full system access |
| Sales President | 135 | Executive with viewAll |
| Sales Manager | 52 | Team leadership |
| Sales Executive | 17 | Personal account mgmt |
| Inventory Manager | 45 | Full inventory control |
| Store Supervisor | 39 | Store & POS ops |
| HR Manager | 59 | Complete HR access |
| Procurement Officer | 37 | Vendor & PO management |
| Finance Approver | 8 | Approval authority only |
| Reporting Officer | 14 | Read-only analytics |

---

## 🚀 Next Steps

1. ✅ Test queries in Permify Playground
2. ✅ Validate permission structure
3. ✅ Export schema & roles.json
4. ✅ Integrate into middleware (Sprint 1, Task 1.10)
5. ✅ Deploy to staging
6. ✅ Run E2E permission tests

---

**Files in repo:**
- `src/policy/schema.perm` — Full schema (copy-paste ready)
- `src/policy/roles.json` — All 9 predefined roles (JSON format)
- `docs/PERMIFY_SCHEMA_QUOTE.md` — Detailed documentation
- `docs/PERMIFY_PLAYGROUND_TEST.md` — Test cases & examples
