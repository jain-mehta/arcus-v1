# Quick Testing Guide - Permission Fix

## What Was Fixed
All 44 submodule permission keys have been added to the admin role in `src/lib/rbac.ts`.

## How to Verify

### 1. Run the Permission Check (Automated)
```bash
node check-permissions.js
```
Expected: ✅ All 44 required permissions present (100.0% coverage)

### 2. Build the Project
```bash
npm run build
```
Expected: ✅ 0 TypeScript errors

### 3. Visit the Frontend
1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Login with admin credentials: `adminharsh@arcus.local` / (your password)
4. Navigate to Dashboard → View sidebar

### 4. Expected Results

#### Before Fix:
- 32 submodules visible
- 27 submodules hidden (27/59 = 45% hidden)

#### After Fix:
- **44 submodules visible** (100% of required modules)
- Should see complete lists in:
  - Sales (11 items)
  - Inventory (11 items)
  - Store (12 items)
  - HRMS (10 items)

## Checking Individual Modules in Frontend

### Sales Module
Navigate to `/dashboard/sales` - Should see all 11 items:
- [ ] Sales Dashboard
- [ ] Lead Management
- [ ] Sales Pipeline
- [ ] Quotations
- [ ] Sales Orders
- [ ] Customer Accounts
- [ ] Sales Activities Log
- [ ] Log a Dealer Visit
- [ ] Sales Leaderboard
- [ ] Sales Reports & KPIs
- [ ] Sales Settings

### Inventory Module
Navigate to `/dashboard/inventory` - Should see all 11 items:
- [ ] Inventory Dashboard
- [ ] Product Master
- [ ] Goods Inward (GRN)
- [ ] Goods Outward
- [ ] Stock Transfers
- [ ] Cycle Counting & Auditing
- [ ] Inventory Valuation Reports
- [ ] QR Code Generator
- [ ] Factory Inventory
- [ ] Store Inventory
- [ ] AI Catalog Assistant

### Store Module
Navigate to `/dashboard/store` - Should see all 12 items:
- [ ] Store Dashboard
- [ ] POS Billing
- [ ] Billing History
- [ ] Store Manager Dashboard
- [ ] Create Debit Note
- [ ] Invoice Format Editor
- [ ] Store Inventory
- [ ] Manage Stores
- [ ] Product Receiving
- [ ] Store Reports & Comparison
- [ ] Returns & Damaged Goods
- [ ] Staff & Shift Logs

### HRMS Module
Navigate to `/dashboard/hrms` - Should see all 10 items:
- [ ] HRMS Dashboard
- [ ] Announcements
- [ ] Attendance & Shifts
- [ ] Compliance
- [ ] Employee Directory
- [ ] Leave Management
- [ ] Payroll
- [ ] Performance
- [ ] Recruitment
- [ ] Reports & Analytics

## Troubleshooting

### If submodules are still not visible:
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. Restart dev server: `npm run dev`
4. Check browser console for errors (F12)

### If you see 403 errors:
1. Check that you're logged in as admin
2. Verify admin role exists: Settings → User Management → Roles
3. Check that admin role has permissions assigned in database

## Files Changed
- `src/lib/rbac.ts` - Added 44 permission keys to admin role
  - Lines 434-500: Sales module
  - Lines 575-650: Inventory module
  - Lines 361-450: Store module
  - Lines 689-850: HRMS module

## Permission Key Format
All permissions follow: `module:submodule:view` (or :edit, :create, :manage, etc.)

Examples:
- `sales:dashboard:view`
- `inventory:products:view`
- `store:receiving:view`
- `hrms:employees:view`

## Success Metrics
✅ **Goal**: All 44 navigation submodules visible to admin user
✅ **Status**: Permission keys added (100% coverage)
⏳ **Verification**: Pending frontend login test
