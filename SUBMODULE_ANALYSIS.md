# Submodule Coverage Analysis

## Navigation Config Submodules vs Admin Permissions

### 1. SALES Module
**Navigation Submodules (11 total):**
- ✅ Sales Dashboard (`sales:dashboard:view`)
- ✅ Lead Management (`sales:leads:view`)
- ✅ Sales Pipeline (`sales:opportunities:view`)
- ✅ Quotations (`sales:quotations:view`)
- ❓ Sales Orders (`sales:orders:view`) - Permission not explicitly in admin config
- ✅ Customer Accounts (`sales:customers:view`)
- ✅ Sales Activities Log (`sales:activities:view`)
- ✅ Log a Dealer Visit (`sales:visits:view`)
- ✅ Sales Leaderboard (`sales:leaderboard:view`)
- ✅ Sales Reports & KPIs (`sales:reports:view`)
- ✅ Sales Settings (`sales:settings:edit`)

**Issue:** `sales:orders:view` not found in admin permissions

---

### 2. VENDOR Module
**Navigation Submodules (12 total):**
- ✅ Vendor Dashboard (`vendor:view`)
- ✅ Vendor Profiles (`vendor:viewAll`)
- ✅ Vendor Onboarding (`vendor:onboarding`)
- ✅ Purchase Orders & Bills (`vendor:purchaseOrders`)
- ✅ Invoice Management (`vendor:invoices`)
- ✅ Raw Material Catalog (`vendor:materialMapping`)
- ✅ Vendor Price Comparison (`vendor:priceComparison`)
- ✅ Contract Documents (`vendor:documents`)
- ✅ Vendor Rating (`vendor:rating`)
- ✅ Communication Log (`vendor:communicationLog`)
- ✅ Purchase History (`vendor:history`)
- ✅ Reorder Management (`vendor:reorderManagement`)

**Status:** ✅ All covered

---

### 3. INVENTORY Module
**Navigation Submodules (11 total):**
- ✅ Inventory Dashboard (`inventory:overview:view`)
- ✅ Product Master (`inventory:products:view`)
- ✅ Goods Inward (GRN) (`inventory:goodsInward:view`)
- ✅ Goods Outward (`inventory:goodsOutward:view`)
- ✅ Stock Transfers (`inventory:transfers:view`)
- ✅ Cycle Counting & Auditing (`inventory:counting:view`)
- ✅ Inventory Valuation Reports (`inventory:valuationReports:view`)
- ✅ QR Code Generator (`inventory:qr:generate`)
- ✅ Factory Inventory (`inventory:factory:view`)
- ✅ Store Inventory (`inventory:store:view`)
- ✅ AI Catalog Assistant (`inventory:aiCatalog:view`)

**Status:** ✅ All covered

---

### 4. STORE Module
**Navigation Submodules (12 total):**
- ✅ Store Dashboard (`store:overview:view`)
- ✅ POS Billing (`store:bills:view`)
- ✅ Billing History (`store:billingHistory:view`)
- ✅ Store Manager Dashboard (`store:dashboard:view`)
- ✅ Create Debit Note (`store:debitNote:view`)
- ✅ Invoice Format Editor (`store:invoiceFormat:view`)
- ✅ Store Inventory (`store:inventory:view`)
- ✅ Manage Stores (`store:manage`)
- ✅ Product Receiving (`store:receiving:view`)
- ✅ Store Reports & Comparison (`store:reports:view`)
- ✅ Returns & Damaged Goods (`store:returns:view`)
- ✅ Staff & Shift Logs (`store:staff:view`)

**Status:** ✅ All covered

---

### 5. HRMS Module
**Navigation Submodules (10 total):**
- ✅ HRMS Dashboard (`hrms:overview:view`)
- ✅ Announcements (`hrms:announcements:view`)
- ✅ Attendance & Shifts (`hrms:attendance:view`)
- ✅ Compliance (`hrms:compliance:view`)
- ✅ Employee Directory (`hrms:employees:view`)
- ✅ Leave Management (`hrms:leaves:view`)
- ✅ Payroll (`hrms:payroll:view`)
- ✅ Performance (`hrms:performance:view`)
- ✅ Recruitment (`hrms:recruitment:view`)
- ✅ Reports & Analytics (`hrms:reports:view`)

**Status:** ✅ All covered

---

### 6. USER MANAGEMENT Module
**Navigation Submodules (3 total):**
- ✅ User Management (`users:viewAll`)
- ✅ Roles & Hierarchy (`users:roles:viewAll`)
- ✅ Active Sessions (`users:sessions:view`)

**Status:** ✅ All covered

---

### 7. SETTINGS Module
**Navigation Submodules (3 total):**
- ✅ Settings (`settings:view`)
- ✅ Profile (`settings:profile:view`)
- ✅ Audit Log (`settings:auditLog:view`)

**Status:** ✅ All covered

---

### 8. SUPPLY CHAIN Module
**Navigation Submodules (1 total):**
- ❓ Overview (`supplyChain:view`) - Permission string may be wrong

**Issue:** Nav uses `supplyChain:view` but admin config doesn't have a `supplyChain` module key, it uses `'supply-chain'` with different permission format

---

## Summary of Issues

### 🔴 Critical Issues (Missing Permissions):
1. **`sales:orders:view`** - Referenced in nav but not in admin permissions
2. **`supplyChain:view`** - Nav uses `supplyChain` but admin config uses `supply-chain` (inconsistent naming)

### ✅ Permissions Without Nav Items:
- Additional detailed submodules exist in admin config but no nav entries:
  - `sales:invoices:*` (10+ permissions)
  - `hrms:performance:*` (5+ permissions)
  - `hrms:settlement:*` (7+ permissions)
  - And many more specialized permissions

---

## Recommendations

### Fix 1: Add Missing `sales:orders:view` Permission
```typescript
// In admin-permissions-config.ts, sales module
'sales:orders:view': true,
'sales:orders:create': true,
'sales:orders:edit': true,
'sales:orders:delete': true,
```

### Fix 2: Standardize Supply Chain Naming
**Option A:** Change nav to use `supply-chain:view`
```typescript
{ href: "/dashboard/supply-chain", label: "Supply Chain", permission: "supply-chain:view" },
```

**Option B:** Add `supplyChain` alias in admin permissions
```typescript
supplyChain: {
  view: true,
  // ... other permissions
}
```

### Fix 3: Consider Adding More Submodules to Navigation
Current navigation has **59 submodules total** across all modules. Admin permissions define many more specialized actions that could be exposed as additional submodules if needed.

---

## Submodule Count by Module
- Dashboard: 1 submodule
- Vendor: 12 submodules
- Inventory: 11 submodules
- Sales: 11 submodules
- Stores: 12 submodules
- HRMS: 10 submodules
- User Management: 3 submodules
- Settings: 3 submodules
- Supply Chain: 1 submodule

**Total: 64 submodules** (if all fully defined)
**Current in Nav: 59 submodules**

