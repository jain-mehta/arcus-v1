# 📋 ACTUAL PAGE TITLES vs MVP vs NAV CONFIG

Based on scanning the actual page.tsx files, here's what each page ACTUALLY displays:

---

## VENDOR Module

| Folder | Page Title in Code | MVP Label | Current Nav Label | Match? |
|--------|---|---|---|---|
| dashboard | (No h1, shows KPIs) | Vendor Dashboard | Dashboard | ⚠️ |
| list | "Vendor Profiles" | Vendor Profiles | Vendor List | ❌ |
| onboarding | (Need to check) | Vendor Onboarding | Onboarding | ⚠️ |
| purchase-orders | "Create Purchase Order" (for /create) | Purchase Orders & Bills | Purchase Orders | ⚠️ |
| invoices | "Invoice Management" | Invoice Management | Invoices | ❌ |
| material-mapping | "Raw Material Catalog Mapping" | Raw Material Catalog | Material Mapping | ❌ |
| price-comparison | "Vendor Price Comparison" | Vendor Price Comparison | Price Comparison | ⚠️ |
| documents | "Contract Documents" (need to check) | Contract Documents | Documents | ❌ |
| rating | "Vendor Rating & Performance" | Vendor Rating | Rating | ⚠️ |
| communication-log | "Vendor Communication Log" | Communication Log | Communication Log | ✅ |
| history | (Need to check) | Purchase History | History | ⚠️ |
| profile | "Edit Vendor Profile" / Vendor Name | Vendor Profiles | Profiles | ⚠️ |
| reorder-management | "Reorder Management" | Reorder Management | Reorder Management | ✅ |

---

## KEY FINDINGS

Looking at the actual page code titles vs MVP vs nav config:

### ❌ Major Label Mismatches (Need to Fix in Nav Config):

1. **Material Mapping**
   - Page shows: "Raw Material Catalog Mapping"
   - MVP showed: "Raw Material Catalog"
   - Nav config has: "Material Mapping"
   - **Should be**: "Raw Material Catalog"

2. **Invoices**
   - Page shows: "Invoice Management"
   - MVP showed: "Invoice Management"
   - Nav config has: "Invoices"
   - **Should be**: "Invoice Management"

3. **Documents**
   - Page shows: (need to verify)
   - MVP showed: "Contract Documents"
   - Nav config has: "Documents"
   - **Should be**: "Contract Documents"

4. **Vendor List (list folder)**
   - Page shows: "Vendor Profiles"
   - MVP showed: "Vendor Profiles"
   - Nav config has: "Vendor List"
   - **Should be**: "Vendor Profiles"

---

## 🎯 ACTION PLAN

I need to update `src/app/dashboard/actions.ts` to change these labels:

**For Vendor module:**
```
"Material Mapping" → "Raw Material Catalog"
"Invoices" → "Invoice Management"
"Documents" → "Contract Documents"  
"Vendor List" → "Vendor Profiles"
```

**Should I do this?** YES / NO

If YES, I'll also check and fix labels for:
- Inventory (Dashboard vs Overview)
- Sales (Visits vs Visit Logs, etc.)
- Store (Manage vs Manage Stores, etc.)
- HRMS (Attendance vs Attendance & Shifts, etc.)

Let me know and I'll update them all to match the actual page titles! 🚀
