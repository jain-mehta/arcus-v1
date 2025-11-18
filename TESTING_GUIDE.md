# 🧪 Testing Guide: Verify All 44 Submodules Visible

## Before You Start

### 1. **CRITICAL: Clear Your Browser Cache**

**Option A: Full Cache Clear (Recommended)**
```
Windows:
- Ctrl + Shift + Delete
- Select "All time"
- Check "Cookies and other site data"
- Click "Clear data"
```

**Option B: Use Incognito Mode**
```
Ctrl + Shift + N → Opens new incognito window
(No cache, guaranteed fresh login)
```

### 2. **Restart Your Dev Server**
```powershell
# If running, stop it (Ctrl+C)
npm run dev
# Should show: ▲ Next.js 15.3.3 local: http://localhost:3000
```

## Login Test

### Credentials
```
Email: admin@yourbusiness.local
Password: Admin@123456
```

### Steps
1. Navigate to: `http://localhost:3000/dashboard/auth/login`
2. Enter email: `admin@yourbusiness.local`
3. Enter password: `Admin@123456`
4. Click "Sign In"
5. Should redirect to: `/dashboard` (main dashboard)

### What to Check
```
🔍 Check Browser Console (F12 → Console)

Expected to see your session info:
✅ uid: [some UUID] ← User ID
✅ email: admin@yourbusiness.local
✅ roleName: "Administrator" ← CRITICAL!

⚠️ If you DON'T see "Administrator" role:
   - Logout
   - Clear cache again (Ctrl+Shift+Delete)
   - Try again
```

---

## Module Visibility Test

### 📋 Expected Sidebar Modules (Click each to expand)

Navigate to `http://localhost:3000/dashboard` and check the sidebar:

#### **Module 1: SALES (11 submodules)**
- ✅ Sales Dashboard → `/dashboard/sales`
- ✅ Lead Management → `/dashboard/sales/leads`
- ✅ Sales Pipeline → `/dashboard/sales/opportunities`
- ✅ Quotations → `/dashboard/sales/quotations`
- ✅ Sales Orders → `/dashboard/sales/orders`
- ✅ Customer Accounts → `/dashboard/sales/customers`
- ✅ Sales Activities Log → `/dashboard/sales/activities`
- ✅ Log a Dealer Visit → `/dashboard/sales/visits`
- ✅ Sales Leaderboard → `/dashboard/sales/leaderboard`
- ✅ Sales Reports & KPIs → `/dashboard/sales/reports`
- ✅ Sales Settings → `/dashboard/sales/settings`

**Count: 11/11 ✅**

#### **Module 2: INVENTORY (11 submodules)**
- ✅ Inventory Overview → `/dashboard/inventory`
- ✅ Products → `/dashboard/inventory/products`
- ✅ Stock Movements → `/dashboard/inventory/movements`
- ✅ Warehouse Management → `/dashboard/inventory/warehouses`
- ✅ Suppliers → `/dashboard/inventory/suppliers`
- ✅ Categories → `/dashboard/inventory/categories`
- ✅ Units of Measure → `/dashboard/inventory/units`
- ✅ Batch/Lot Management → `/dashboard/inventory/batches`
- ✅ Inventory Audit → `/dashboard/inventory/audits`
- ✅ Reorder Points → `/dashboard/inventory/reorder`
- ✅ Inventory Reports → `/dashboard/inventory/reports`

**Count: 11/11 ✅**

#### **Module 3: STORE (12 submodules)**
- ✅ Store Dashboard → `/dashboard/store`
- ✅ Bills → `/dashboard/store/bills`
- ✅ POS Transactions → `/dashboard/store/pos`
- ✅ Stock → `/dashboard/store/stock`
- ✅ Returns → `/dashboard/store/returns`
- ✅ Reconciliation → `/dashboard/store/reconciliation`
- ✅ Payment Methods → `/dashboard/store/payments`
- ✅ Customers → `/dashboard/store/customers`
- ✅ Employees → `/dashboard/store/employees`
- ✅ Store Settings → `/dashboard/store/settings`
- ✅ Reports → `/dashboard/store/reports`
- ✅ Sync Status → `/dashboard/store/sync`

**Count: 12/12 ✅**

#### **Module 4: HRMS (10 submodules)**
- ✅ HRMS Overview → `/dashboard/hrms`
- ✅ Employees → `/dashboard/hrms/employees`
- ✅ Attendance → `/dashboard/hrms/attendance`
- ✅ Leave Management → `/dashboard/hrms/leave`
- ✅ Payroll → `/dashboard/hrms/payroll`
- ✅ Performance Reviews → `/dashboard/hrms/performance`
- ✅ Organizational Structure → `/dashboard/hrms/structure`
- ✅ Compliance → `/dashboard/hrms/compliance`
- ✅ Reports → `/dashboard/hrms/reports`
- ✅ Settings → `/dashboard/hrms/settings`

**Count: 10/10 ✅**

#### **Module 5: VENDOR (1 submodule)**
- ✅ Vendor Dashboard → `/dashboard/vendor`

**Count: 1/1 ✅**

#### **Module 6: REPORTS (1 submodule)**
- ✅ Reports & Analytics → `/dashboard/reports`

**Count: 1/1 ✅**

#### **Module 7: SETTINGS (1 submodule)**
- ✅ Settings → `/dashboard/settings`

**Count: 1/1 ✅**

#### **Module 8: ADMIN (1 submodule)**
- ✅ Admin Panel → `/dashboard/admin`

**Count: 1/1 ✅**

#### **Module 9: SUPPLY CHAIN (2 submodules)**
- ✅ Supply Chain Overview → `/dashboard/supply-chain`
- ✅ Procurement → `/dashboard/supply-chain/procurement`

**Count: 2/2 ✅**

---

### 📊 Total Count

```
Sales:        11
Inventory:    11
Store:        12
HRMS:         10
Vendor:        1
Reports:       1
Settings:      1
Admin:         1
Supply Chain:  2
─────────────────
TOTAL:        44 ✅
```

**Expected Result: 44/44 submodules visible**

---

## Role-Based Access Testing

### Test User 1: Admin (Should see ALL 44)
```
Email: admin@yourbusiness.local
Password: Admin@123456
Expected: 44/44 submodules visible ✅
```

### Test User 2: Sales Executive (Should see limited modules)
```
Email: sales-exec@yourbusiness.local
Password: SalesExec@123456
Expected: 
  - Sales (all 11 submodules)
  - Vendor (overview)
  - Reports (limited to sales reports)
  - Settings (limited to sales settings)
Total: ~15-18 submodules
```

### Test User 3: Intern Sales (Should see very limited)
```
Email: intern@yourbusiness.local
Password: Intern@123456
Expected:
  - Sales (dashboard, own leads, own quotations)
  - Reports (own reports only)
Total: 3-4 submodules
```

### Test User 4: Manager (Should see overview + reports)
```
Email: manager@yourbusiness.local
Password: Manager@123456
Expected:
  - Dashboard (main)
  - Reports
  - Settings
Total: ~3-5 submodules
```

---

## Troubleshooting

### ❌ Problem: Still showing only 32 submodules

**Solution 1: Clear Cache Completely**
```
Ctrl + Shift + Delete
Select "All time"
Clear cache
Refresh page (F5)
```

**Solution 2: Use Incognito Window**
```
Ctrl + Shift + N (new incognito)
Navigate to http://localhost:3000
Login again
```

**Solution 3: Check Console for Error**
```
F12 → Console
Look for errors about permissions or roles
If you see "roleName" missing → cache issue
```

### ❌ Problem: Can't log in at all

**Solution:**
```powershell
# Check if admin user exists
node diagnose-submodules.mjs

# If admin user missing, recreate:
node seed-users-with-roles.mjs

# Restart dev server
npm run dev
```

### ❌ Problem: See "Casbin" errors in console

**Solution:**
- This should be fixed now in `src/lib/casbinClient.ts`
- If still occurring:
  1. Check browser console
  2. Stop dev server (Ctrl+C)
  3. Delete `.next` folder
  4. Run `npm run build`
  5. Run `npm run dev`

### ❌ Problem: Some modules showing but others hidden

**Solution:**
```
This indicates role assignment worked partially.
1. Verify roleName in console is "Administrator"
2. If not, re-run seed script:
   node seed-users-with-roles.mjs
3. Logout and login again
```

---

## Success Checklist

- [ ] Build completed successfully (0 errors)
- [ ] Browser cache cleared
- [ ] Logged in as admin@yourbusiness.local
- [ ] Console shows `roleName: "Administrator"`
- [ ] Sidebar shows all 9 main modules expandable
- [ ] Sales module expands to 11 submodules
- [ ] Inventory module expands to 11 submodules
- [ ] Store module expands to 12 submodules
- [ ] HRMS module expands to 10 submodules
- [ ] Total count: **44/44 submodules** ✅
- [ ] Can navigate to each module without 403 error
- [ ] No Casbin errors in console
- [ ] Test user (intern@yourbusiness.local) shows limited modules
- [ ] Test user logout/login works

---

## Quick Reference: Key URLs

| Module | URL | Permission Key |
|--------|-----|---|
| Sales Dashboard | `/dashboard/sales` | `sales:dashboard:view` |
| Sales Leads | `/dashboard/sales/leads` | `sales:leads:view` |
| Inventory Products | `/dashboard/inventory/products` | `inventory:products:view` |
| Store Bills | `/dashboard/store/bills` | `store:bills:view` |
| HRMS Employees | `/dashboard/hrms/employees` | `hrms:employees:view` |
| Vendor Dashboard | `/dashboard/vendor` | `vendor:overview:view` |
| Admin Panel | `/dashboard/admin` | `admin:panel:view` |

---

## Next Steps

1. **Wait for build to complete** ⏳
2. **Start dev server** → `npm run dev`
3. **Clear browser cache** → Ctrl+Shift+Delete
4. **Login** → admin@yourbusiness.local
5. **Count submodules** → Should be 44/44
6. **Test other roles** → Verify filtering works
7. **Check console** → No errors expected

---

## Questions?

If you need help:
1. Check the error message exactly
2. Run `node diagnose-submodules.mjs` to verify setup
3. Look at browser console (F12)
4. Check server logs for any Casbin errors

**You're all set for testing! 🚀**
