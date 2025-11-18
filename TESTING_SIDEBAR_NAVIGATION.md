# 🧪 Testing Guide - Sidebar Navigation

**Quick Test to Verify All Sub-Modules Are Showing**

---

## 🚀 Step 1: Start Dev Server

```powershell
cd "c:\Users\harsh\Desktop\Arcus_web_Folder\arcus-v1"
npm run dev
```

Expected output:
```
  ▲ Next.js 15.3.3
  - Local:        http://localhost:3000
  - Environments: .env.local
```

---

## 🔓 Step 2: Login

1. Open browser to `http://localhost:3000`
2. Click "Login" or go to `http://localhost:3000/login`
3. Enter credentials:
   - **Email**: `admin@arcus.local`
   - **Password**: `Admin@123456` (or whatever you set)

Expected result:
- ✅ Redirect to `/dashboard`
- ✅ See dashboard with KPIs
- ✅ Left sidebar shows "Dashboard" sub-modules

---

## ✅ Step 3: Test Each Module

### Test 1: Inventory (11 sub-modules)
1. Click "Inventory" in top navbar
2. **Expected sidebar items**:
   - Overview
   - Product Master
   - Goods Inward
   - Goods Outward
   - Stock Transfers
   - Cycle Counting
   - Valuation Reports
   - QR Code Generator
   - Factory Stock
   - Store Stock
   - AI Catalog Assistant

3. Click each item and verify page loads

### Test 2: Vendor (13 sub-modules)
1. Click "Vendor" in top navbar
2. **Expected sidebar items**:
   - Dashboard
   - Vendor List
   - Onboarding
   - Purchase Orders
   - Invoices
   - Material Mapping
   - Price Comparison
   - Documents
   - Rating
   - Communication Log ← NEW
   - History ← NEW
   - Profiles ← NEW
   - Reorder Management ← NEW

3. Click each item and verify page loads

### Test 3: Store (14 sub-modules)
1. Click "Store" in top navbar
2. **Expected sidebar items**:
   - Overview
   - Dashboard
   - Billing/POS
   - Billing History
   - Invoice Format
   - Receiving
   - Returns
   - Debit Notes
   - Inventory
   - Reports
   - Store Management
   - Staff/Shifts
   - Scanner/QR
   - Store Profiles

3. Click each item and verify page loads

### Test 4: Sales (11 sub-modules)
1. Click "Sales" in top navbar
2. **Expected sidebar items**:
   - Overview
   - Leads
   - Opportunities
   - Quotations
   - Orders
   - Customers
   - Activities ← NEW
   - Visits ← NEW
   - Leaderboard ← NEW
   - Reports
   - Settings

3. Click each item and verify page loads

### Test 5: HRMS (10 sub-modules)
1. Click "HRMS" in top navbar
2. **Expected sidebar items**:
   - Overview
   - Announcements ← NEW
   - Employees
   - Attendance
   - Leaves
   - Payroll
   - Performance
   - Recruitment
   - Compliance
   - Reports

3. Click each item and verify page loads

### Test 6: Users (3 sub-modules)
1. Click "Users" in top navbar
2. **Expected sidebar items**:
   - Users
   - Roles
   - Sessions ← NEW

3. Click each item and verify page loads

### Test 7: Settings (3 sub-modules) - NEW
1. Click "Settings" in top navbar
2. **Expected sidebar items**:
   - Settings
   - Profile
   - Audit Log

3. Click each item and verify page loads

### Test 8: Supply-Chain (1 sub-module) - NEW
1. Click "Supply-Chain" in top navbar
2. **Expected sidebar items**:
   - Overview

3. Click to verify page loads

---

## 📝 Test Checklist

### Sidebar Display
- [ ] Inventory shows 11 items
- [ ] Vendor shows 13 items
- [ ] Store shows 14 items
- [ ] Sales shows 11 items
- [ ] HRMS shows 10 items
- [ ] Users shows 3 items
- [ ] Settings shows 3 items
- [ ] Supply-Chain shows 1 item

### Navigation
- [ ] All top 9 modules appear in navbar
- [ ] Clicking module switches sidebar content
- [ ] Sidebar items are clickable
- [ ] Clicking item navigates to page
- [ ] URL updates correctly
- [ ] Page content loads
- [ ] Active item highlights in sidebar

### New Items (Verify These Especially)
- [ ] Vendor → Communication Log works
- [ ] Vendor → History works
- [ ] Vendor → Profiles works
- [ ] Vendor → Reorder Management works
- [ ] Sales → Activities works
- [ ] Sales → Visits works
- [ ] Sales → Leaderboard works
- [ ] HRMS → Announcements works
- [ ] Users → Sessions works
- [ ] Settings module appears (NEW)
- [ ] Supply-Chain module appears (NEW)

---

## 🐛 Troubleshooting

### Issue: Sidebar doesn't show any items
**Solution**:
1. Check browser console for errors (F12)
2. Check server terminal for errors
3. Make sure you're logged in as admin@arcus.local
4. Refresh page (Ctrl+Shift+R for hard refresh)

### Issue: Some items missing from sidebar
**Solution**:
1. Rebuild the app: `npm run build`
2. Stop server (Ctrl+C) and restart: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R

### Issue: Page doesn't load when clicking item
**Solution**:
1. Check if page file exists in folder
2. Check for TypeScript errors in IDE
3. Check server terminal for 404 errors
4. Rebuild: `npm run build`

### Issue: Icons don't display
**Solution**:
1. Check icon name in `src/app/dashboard/actions.ts`
2. Verify icon exists in Lucide Icons
3. Common icons: `package`, `users`, `store`, `barChart`, `settings`

---

## 📊 Expected Build Output

When you run `npm run build`, you should see all pages:

```
✓ Build completed
Γö£ ╞Æ /dashboard                             ...
Γö£ ╞Æ /dashboard/inventory                    ...
Γö£ ╞Æ /dashboard/inventory/product-master     ...
Γö£ ╞Æ /dashboard/vendor                       ...
Γö£ ╞Æ /dashboard/vendor/communication-log     ...
Γö£ ╞Æ /dashboard/store                        ...
Γö£ ╞Æ /dashboard/store/scanner                ...
Γö£ ╞Æ /dashboard/sales                        ...
Γö£ ╞Æ /dashboard/sales/activities             ...
Γö£ ╞Æ /dashboard/hrms                         ...
Γö£ ╞Æ /dashboard/hrms/announcements           ...
Γö£ ╞Æ /dashboard/users/sessions               ...
Γö£ ╞Æ /dashboard/settings                     ...
Γö£ ╞Æ /dashboard/supply-chain                 ...

+ First Load JS shared by all                101 kB
```

All pages should compile without errors.

---

## 🎯 What You're Looking For

### Main Goal
✅ **All 9 modules show in top navbar**
✅ **When you click a module, sidebar shows all its sub-modules**
✅ **When you click a sub-module, page loads**
✅ **Admin user sees everything**

### Build Quality
✅ **0 TypeScript errors**
✅ **0 build errors**
✅ **All pages generate**
✅ **All links work**

---

## 📞 If Something's Wrong

1. **Check `src/app/dashboard/actions.ts`** for syntax errors
2. **Check `/dashboard/*/page.tsx` files** exist for each module
3. **Check permission names** are consistent
4. **Run `npm run build`** to verify all pages compile
5. **Check browser console** for client-side errors

---

**Status**: 🚀 Ready to test!

Go ahead and run `npm run dev` to see all sub-modules in the sidebar! 🎉
