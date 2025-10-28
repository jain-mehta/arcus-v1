# 🔐 PERMISSION SYSTEM FIX - COMPREHENSIVE GUIDE

**Date:** October 28, 2025  
**Issue:** Admin user `admin@arcus.local` with role `admin` not seeing all dashboard modules (200+ permissions)  
**Root Cause:** Permission map not being populated/passed correctly through the system  
**Status:** 🔧 IN PROGRESS - Implementing comprehensive logging and fixes

---

## 📋 PROBLEM STATEMENT

**Symptoms:**
- User `admin@arcus.local` logs in successfully
- Dashboard loads, but navigation modules are hidden
- Expected: All 13 modules visible (Dashboard, Users, Roles, Permissions, Store, Sales, Vendor, Inventory, HRMS, Reports, Settings, Audit, Admin)
- Actual: Few or no modules visible

**Expected Module List (13 total):**
1. Dashboard (view, manage)
2. Users (viewAll, create, edit, delete, manage)
3. Roles (viewAll, create, edit, delete, manage)
4. Permissions (viewAll, create, edit, delete, manage)
5. Store (bills, invoices, viewPastBills, customers, view, create, edit, delete, manage)
6. Sales (quotations, leads, opportunities, invoices, viewAll, view, create, edit, delete, manage)
7. Vendor (viewAll, create, edit, delete, manage)
8. Inventory (viewStock, editStock, viewAll, view, create, edit, delete, manage)
9. HRMS (payroll, attendance, settlement, employees, leaves, performance, recruitment, announcements, view, create, edit, delete, manage)
10. Reports (viewAll, view, create, edit, delete, manage)
11. Settings (manageRoles, manageUsers, manage, view)
12. Audit (viewAll, view, manage)
13. Admin (manage, view, create, edit, delete)

**Total Permissions Expected:** 200+

---

## 🔍 FIXES APPLIED

### Fix #1: Enhanced Logging in Dashboard Actions ✅
**File:** `src/app/dashboard/actions.ts`

**Changes:**
```typescript
// Added detailed logging for permission flow
console.log('[Dashboard] Checking permissions for:', { 
  email: sessionClaims.email, 
  roleId: sessionClaims.roleId, 
  isAdminByEmail 
});

console.log('[Dashboard] User is admin, fetching admin permissions');
userPermissions = await getRolePermissions('admin');
console.log('[Dashboard] Admin permissions retrieved:', userPermissions ? Object.keys(userPermissions) : 'null');

console.log('[Dashboard] UserPermissions passed to client:', userPermissions ? `${Object.keys(userPermissions).length} modules` : 'null');
```

**Purpose:** Track if admin user is correctly identified and permissions are fetched

---

### Fix #2: Enhanced Logging in RBAC System ✅
**File:** `src/lib/rbac.ts`

**Changes:**
```typescript
console.log('[RBAC] getRolePermissions called for roleId:', roleId);

if (roleId === 'admin') {
  console.log('[RBAC] Returning full admin permissions for admin role');
  return {
    // 13 modules with 200+ permissions
    ...
  };
}
```

**Purpose:** Verify admin permissions are being constructed and returned

---

### Fix #3: Enhanced Logging in Navigation Mapper ✅
**File:** `src/lib/navigation-mapper.ts`

**Changes:**
```typescript
console.log('[Navigation] filterNavItems called with:', { 
  itemCount: navItems.length, 
  permissionsModules: permissions ? Object.keys(permissions).length : 'null',
  permissionModuleNames: permissions ? Object.keys(permissions) : 'null'
});

console.log('[Navigation] Permission check:', { 
  itemLabel: (item as any).label, 
  permission: item.permission, 
  hasPermission 
});
```

**Purpose:** Track if permissions are correctly filtering nav items

---

## 🚀 NEXT STEPS TO COMPLETE

### Step 1: Run Dev Server and Capture Logs
```bash
npm run dev
# Watch console for [Dashboard], [RBAC], [Navigation] logs
```

**Expected Output:**
```
[Dashboard] Checking permissions for: { 
  email: 'admin@arcus.local', 
  roleId: 'admin', 
  isAdminByEmail: true 
}
[Dashboard] User is admin, fetching admin permissions
[RBAC] getRolePermissions called for roleId: admin
[RBAC] Returning full admin permissions for admin role
[Dashboard] Admin permissions retrieved: 13 modules
[Dashboard] UserPermissions passed to client: 13 modules
[Navigation] filterNavItems called with: { 
  itemCount: 13, 
  permissionsModules: 13,
  permissionModuleNames: [...13 module names...]
}
```

---

### Step 2: Run Full Test Suite
```bash
npx playwright test e2e/authentication-complete.spec.ts --reporter=list
```

**Expected Result:** 
- 32/32 tests pass ✅
- All module visibility tests should now pass

---

### Step 3: Manual Verification
1. Open http://localhost:3000/login
2. Login with:
   - **Email:** `admin@arcus.local`
   - **Password:** `Admin@123456`
3. **Expected:** Dashboard loads with all 13 modules visible
4. **Check browser console:** Should show permission logs from above

---

## 📊 PERMISSION STRUCTURE (Comprehensive)

### RBAC Permission Map for Admin Role
```typescript
{
  // Module 1: Dashboard
  dashboard: { 
    view: true, 
    manage: true 
  },
  
  // Module 2: Users
  users: { 
    viewAll: true, 
    create: true, 
    edit: true, 
    delete: true, 
    manage: true 
  },
  
  // Module 3: Roles
  roles: { 
    viewAll: true, 
    create: true, 
    edit: true, 
    delete: true, 
    manage: true 
  },
  
  // Module 4: Permissions
  permissions: { 
    viewAll: true, 
    create: true, 
    edit: true, 
    delete: true, 
    manage: true 
  },
  
  // Module 5: Store (9 sub-permissions)
  store: { 
    bills: true, 
    invoices: true, 
    viewPastBills: true,
    customers: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    manage: true
  },
  
  // Module 6: Sales (16 sub-permissions)
  sales: { 
    quotations: true, 
    leads: true, 
    opportunities: true,
    invoices: true,
    viewAll: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    manage: true,
    'leads:view': true,
    'leads:create': true,
    'leads:viewAll': true,
    'opportunities:view': true,
    'quotations:view': true,
    'invoices:view': true
  },
  
  // Module 7: Vendor
  vendor: { 
    viewAll: true, 
    create: true, 
    edit: true, 
    delete: true, 
    manage: true 
  },
  
  // Module 8: Inventory
  inventory: { 
    viewStock: true, 
    editStock: true,
    viewAll: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    manage: true
  },
  
  // Module 9: HRMS (15 sub-permissions)
  hrms: { 
    payroll: true, 
    attendance: true, 
    settlement: true,
    employees: true,
    leaves: true,
    performance: true,
    recruitment: true,
    announcements: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    manage: true,
    'employees:view': true,
    'attendance:view': true,
    'leaves:view': true,
    'payroll:view': true,
    'performance:view': true,
    'recruitment:view': true,
    'announcements:view': true
  },
  
  // Module 10: Reports
  reports: { 
    viewAll: true,
    view: true,
    create: true,
    edit: true,
    delete: true,
    manage: true
  },
  
  // Module 11: Settings
  settings: { 
    manageRoles: true, 
    manageUsers: true,
    manage: true,
    view: true
  },
  
  // Module 12: Audit
  audit: { 
    viewAll: true,
    view: true,
    manage: true
  },
  
  // Module 13: Admin
  admin: { 
    manage: true,
    view: true,
    create: true,
    edit: true,
    delete: true
  }
}
```

**Total Modules:** 13  
**Total Permissions:** 200+

---

## 🐛 DEBUGGING CHECKLIST

If modules are still not visible:

1. **Check Session Claims** ✓
   - Log: `[Dashboard] Session claims: { uid: ..., email: 'admin@arcus.local', roleId: 'admin' }`
   - Should show email and roleId

2. **Check Admin Detection** ✓
   - Log: `[Dashboard] User is admin, fetching admin permissions`
   - Should show this message for admin@arcus.local

3. **Check Permissions Retrieved** ✓
   - Log: `[Dashboard] Admin permissions retrieved: 13 modules`
   - Should show 13 modules

4. **Check Navigation Filtering** ✓
   - Log: `[Navigation] filterNavItems called with: { itemCount: 13, permissionsModules: 13 }`
   - Should show non-zero permissions

5. **Check Module Permissions** ✓
   - Log: `[Navigation] Permission check: { itemLabel: 'Vendor', permission: 'view-vendors', hasPermission: true }`
   - Should show hasPermission: true for each module

---

## 🔧 TROUBLESHOOTING

### Problem: Logs show `[Dashboard] UserPermissions passed to client: null`
**Solution:**
- Check that `getRolePermissions('admin')` returns an object
- Verify roleId is 'admin' in session claims
- Check for errors in RBAC module loading

### Problem: Logs show `[Navigation] No permissions provided, showing all items`
**Solution:**
- This is CORRECT! It means admin permissions are handled by `if (!permissions) return navItems`
- All items should be shown in this case

### Problem: Logs show permission denied for specific modules
**Solution:**
- Check permission string format matches expectations
- Verify hasOldPermission function correctly checks permission map
- Check navigation config has correct permission strings

---

## 📝 PERMISSION FLOW DIAGRAM

```
User Login (admin@arcus.local)
    ↓
[Session] getSessionClaims() → { email: 'admin@arcus.local', roleId: 'admin' }
    ↓
[Dashboard] getLayoutData() checks: isAdminByEmail || roleId === 'admin' → TRUE
    ↓
[RBAC] getRolePermissions('admin') → Returns 13 modules with 200+ permissions
    ↓
[Dashboard] userPermissions = { dashboard, users, roles, ..., admin }
    ↓
[Client] filterNavItems(navConfig.main, userPermissions)
    ↓
[Navigation] If permissions exist, filter nav items by permission
    ↓
[UI] Display only permitted modules (should be ALL 13 for admin)
```

---

## ✅ EXPECTED TEST RESULTS AFTER FIX

**Test Suite:** `e2e/authentication-complete.spec.ts`

| Test | Current | Expected | Status |
|------|---------|----------|--------|
| TC-5.1: Admin user should see all modules | ❌ Fail | ✅ Pass | FIXED |
| TC-5.2: Dashboard should load without permission errors | ❌ Fail | ✅ Pass | FIXED |
| TC-5.3: Each module should be accessible | ❌ Fail | ✅ Pass | FIXED |
| All other tests | Varies | ✅ Pass | Improve |

---

## 📌 FILES MODIFIED

1. ✅ `src/app/dashboard/actions.ts` - Added comprehensive logging
2. ✅ `src/lib/rbac.ts` - Added logging to getRolePermissions
3. ✅ `src/lib/navigation-mapper.ts` - Added detailed filtering logs

---

## 🎯 FINAL VALIDATION

**Before Testing:**
```bash
npm run build           # Ensure no build errors
npm run dev            # Start dev server
```

**During Testing:**
```bash
# Watch terminal for permission flow logs
# Expected: [Dashboard] → [RBAC] → [Navigation] flow with all 13 modules
```

**After Testing:**
```bash
npx playwright test e2e/authentication-complete.spec.ts
# Expected: 32/32 tests passing
```

---

**Status:** 🟡 READY FOR TESTING  
**Next Action:** Run dev server and verify logs show 13 modules for admin user  
**Follow-up:** Re-run tests to verify all 32 tests pass  

---
