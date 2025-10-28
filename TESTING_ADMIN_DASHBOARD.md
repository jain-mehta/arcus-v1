# Admin Dashboard Testing Guide

## Overview

This guide provides step-by-step testing procedures to verify that the admin dashboard is fully functional with all modules visible and accessible.

## What Was Fixed

### Changes Made to `src/lib/rbac.ts`:

1. **Expanded Admin Permissions** (getRolePermissions function)
   - Added all 13 modules to admin role permissions
   - Each module now has full CRUD permissions (create, read, update, delete, manage)
   - Includes: dashboard, users, roles, permissions, store, sales, vendor, inventory, hrms, reports, settings, audit, admin

2. **Simplified Admin Email Check** (checkPermission function)
   - Changed from array check to direct email equality
   - Only `admin@bobssale.com` is the authorized admin
   - Returns true immediately for admin email (faster, no fallback needed)
   - Removed legacy emails: `admin@arcus.local` and `admin@bobs.local`

3. **Cleaner Permission Flow**
   - FIRST: Check if email is `admin@bobssale.com` → return true
   - SECOND: Check if roleId is 'admin' → return true
   - THIRD: Check permissions object if present
   - FINAL: Return false (access denied)

---

## Test Scenarios

### Scenario 1: Fresh Login Test

**Objective:** Verify admin can login and dashboard loads with all modules visible

**Steps:**

1. **Start the Dev Server**
   ```bash
   npm run dev
   ```
   - Wait for "Ready in X.XXs" message
   - Dev server should be running on http://localhost:3000

2. **Navigate to Login Page**
   - Open browser
   - Go to: http://localhost:3000/login
   - Expected: Login form with email and password fields

3. **Enter Admin Credentials**
   - Email: `admin@bobssale.com`
   - Password: `Admin@123456`
   - Click "Login" button

4. **Verify Login Success**
   - Expected response: HTTP 200
   - Browser redirects to http://localhost:3000/dashboard
   - Should NOT see any 401/403 errors

5. **Check Browser Console**
   ```
   Open: DevTools → Console → Filter for '[RBAC]'
   
   Should see logs like:
   [RBAC] Checking permission: { 
     userId: '48e695cf...', 
     email: 'admin@bobssale.com', 
     moduleName: 'dashboard',
     roleId: 'admin' 
   }
   [RBAC] Admin user detected by email, granting all permissions
   ```

6. **Verify Dashboard Layout**
   - Page should display: "Admin Dashboard" heading
   - Header should show: "Bobs Bath Fittings Pvt Ltd"
   - User avatar should be visible in top right
   - Key Metrics section should be visible

7. **Verify Sidebar/Navigation**
   - **CRITICAL CHECK:** Sidebar should display ALL 13 module icons
   - ✅ Dashboard (home icon)
   - ✅ Users (people icon)
   - ✅ Roles (shield icon)
   - ✅ Permissions (lock icon)
   - ✅ Store (building icon)
   - ✅ Sales (chart icon)
   - ✅ Vendor (truck icon)
   - ✅ Inventory (boxes icon)
   - ✅ HRMS (users icon)
   - ✅ Reports (document icon)
   - ✅ Settings (gear icon)
   - ✅ Audit (activity icon)
   - ✅ Admin (sliders icon)

8. **Expected Result: ✅ PASS**
   - All modules visible in sidebar
   - No console errors related to permissions
   - Dashboard fully loaded and responsive

---

### Scenario 2: Module Navigation Test

**Objective:** Verify admin can click and navigate to each module

**Prerequisites:** Admin must be logged in (from Scenario 1)

**Steps:**

1. **Navigate to Each Module** (one by one)

   **Module 1: Users**
   - Click "Users" icon in sidebar
   - Expected: Page loads with user management interface
   - HTTP status: 200
   - No permission errors in console

   **Module 2: Roles**
   - Click "Roles" icon in sidebar
   - Expected: Page loads with role management interface
   - HTTP status: 200
   - No permission errors

   **Module 3: Permissions**
   - Click "Permissions" icon in sidebar
   - Expected: Page loads with permission management interface
   - HTTP status: 200

   **Module 4: Store**
   - Click "Store" icon in sidebar
   - Expected: Page loads with store management interface
   - HTTP status: 200

   **Module 5: Sales**
   - Click "Sales" icon in sidebar
   - Expected: Page loads with sales management interface
   - HTTP status: 200

   **Module 6: Vendor**
   - Click "Vendor" icon in sidebar
   - Expected: Page loads with vendor management interface
   - HTTP status: 200

   **Module 7: Inventory**
   - Click "Inventory" icon in sidebar
   - Expected: Page loads with inventory management interface
   - HTTP status: 200

   **Module 8: HRMS**
   - Click "HRMS" icon in sidebar
   - Expected: Page loads with HRMS interface
   - HTTP status: 200

   **Module 9: Reports**
   - Click "Reports" icon in sidebar
   - Expected: Page loads with reports interface
   - HTTP status: 200

   **Module 10: Settings**
   - Click "Settings" icon in sidebar
   - Expected: Page loads with settings interface
   - HTTP status: 200

   **Module 11: Audit**
   - Click "Audit" icon in sidebar
   - Expected: Page loads with audit interface
   - HTTP status: 200

   **Module 12: Admin**
   - Click "Admin" icon in sidebar
   - Expected: Page loads with admin interface
   - HTTP status: 200

   **Module 13: Dashboard** (return)
   - Click "Dashboard" icon in sidebar
   - Expected: Returns to main dashboard
   - HTTP status: 200

2. **Check for Error Patterns**
   - Should NOT see: "Permission denied: [module]:view"
   - Should NOT see: 403 Forbidden errors
   - Should NOT see: "Not Authorized" messages

3. **Expected Result: ✅ PASS**
   - All 13 modules are clickable
   - All modules load without permission errors
   - Navigation is smooth and responsive

---

### Scenario 3: Session Persistence Test

**Objective:** Verify admin session persists across page refreshes

**Prerequisites:** Admin must be logged in

**Steps:**

1. **From Dashboard, Refresh Page**
   - Press F5 or Ctrl+R (Windows) / Cmd+R (Mac)
   - Expected: Page reloads
   - User should still be logged in (no redirect to /login)

2. **Verify Dashboard Still Loads**
   - Expected: All modules still visible in sidebar
   - Expected: No console errors
   - Expected: User profile still shows in top right

3. **Navigate to a Module and Refresh**
   - Click "Users" module
   - Wait for page to load
   - Press F5 to refresh
   - Expected: Still on Users page, still logged in
   - Expected: Sidebar still shows all modules

4. **Multiple Refresh Cycles**
   - Refresh 3-5 times while navigating between modules
   - Expected: Each time, session persists
   - Expected: No errors accumulate in console

5. **Check Network Tab** (Advanced)
   - Open DevTools → Network tab
   - Look for cookie headers in requests
   - Should see: `__supabase_access_token` cookie in all requests
   - Should see: `__supabase_refresh_token` cookie

6. **Expected Result: ✅ PASS**
   - Session persists across page refreshes
   - Admin never logged out automatically
   - All modules remain visible after refresh

---

### Scenario 4: Permission Check Function Test

**Objective:** Verify checkPermission() function works correctly

**Prerequisites:** Access to browser console while logged in

**Steps:**

1. **Open Browser DevTools**
   - Press F12
   - Go to Console tab
   - Make sure you're logged in as admin

2. **Check Console Logs** (from recent navigation)
   - Look for `[RBAC]` prefixed messages
   - Should see logs like:
     ```
     [RBAC] Checking permission: {
       userId: '48e695cf...',
       email: 'admin@bobssale.com',
       moduleName: 'dashboard',
       submoduleName: 'view'
     }
     [RBAC] Admin user detected by email, granting all permissions
     ```

3. **Verify Permission Check Order**
   - First log should show email check passing
   - Should see: "Admin user detected by email, granting all permissions"
   - Should NOT see multiple fallback checks (email check should return first)

4. **Navigate to Different Modules and Check Logs**
   - Each module navigation should show:
     - Permission check for that module
     - Admin email detected
     - Access granted
   - Pattern should be consistent across all modules

5. **Expected Result: ✅ PASS**
   - Permission checks are fast (email check returns immediately)
   - Admin email (`admin@bobsspale.com`) is recognized
   - No permission errors in logs

---

### Scenario 5: Admin Permissions Verification

**Objective:** Verify admin has full permissions for all modules

**Prerequisites:** Admin logged in, access to backend code

**Steps:**

1. **Check getRolePermissions Output**
   - Open `src/lib/rbac.ts`
   - Find `getRolePermissions` function (around line 196)
   - Verify it returns permissions object with 13 modules:
     - ✅ dashboard
     - ✅ users
     - ✅ roles
     - ✅ permissions
     - ✅ store
     - ✅ sales
     - ✅ vendor
     - ✅ inventory
     - ✅ hrms
     - ✅ reports
     - ✅ settings
     - ✅ audit
     - ✅ admin

2. **Check Each Module Has Full Permissions**
   - For each module, verify these properties exist:
     - ✅ create: true
     - ✅ read: true (or viewAll: true)
     - ✅ update: true (or edit: true)
     - ✅ delete: true
     - ✅ manage: true

3. **Verify Admin Email Check**
   - Open `src/lib/rbac.ts`
   - Find `checkPermission` function (around line 64)
   - Verify: `if (userClaims.email === 'admin@bobssale.com')`
   - Should return `true` immediately
   - Should NOT use array includes() anymore

4. **Verify Legacy Emails Removed**
   - `admin@arcus.local` should NOT exist in code
   - `admin@bobs.local` should NOT exist in code
   - Only `admin@bobsspale.com` should be referenced

5. **Expected Result: ✅ PASS**
   - All 13 modules in permissions
   - Each module has full CRUD permissions
   - Admin email check is simple and fast
   - No legacy emails remain

---

## Automated Testing Commands

These commands can be run from terminal to verify functionality:

### Test 1: Login Test
```bash
# Use the provided test script (if available)
node scripts/test-full-flow.cjs

# Expected output:
# POST /api/auth/login → 200 OK
# Response includes: access_token, refresh_token, user
# Cookies set in response
```

### Test 2: Build Verification
```bash
# Build the project (ignoring pre-existing route issues)
npm run build

# Expected:
# ✅ Compiled successfully
# ⚠ Error about /api/admin/roles/[roleId] (pre-existing, ignore)
```

### Test 3: Type Checking
```bash
# Check TypeScript types
npm run type-check

# Expected:
# ✅ 0 errors found in src/lib/rbac.ts
```

### Test 4: Lint Check
```bash
# Check code style
npm run lint -- src/lib/rbac.ts

# Expected:
# ✅ 0 errors, 0 warnings
```

---

## Debugging Checklist

If modules are still not showing, check these:

### Check 1: Session Claims
- [ ] Admin email is correctly stored in session
- [ ] `roleId` is set to 'admin' for admin user
- [ ] JWT token is being decoded correctly

**How to verify:**
```bash
# In browser console while logged in:
# Add logging to getSessionClaims() in src/lib/session.ts
console.log('Session claims:', sessionClaims);
```

### Check 2: Permission Object
- [ ] `getRolePermissions()` is being called with roleId='admin'
- [ ] Returns object with all 13 modules
- [ ] All modules have permissions properties

**How to verify:**
```bash
# In browser console:
# Check network requests for dashboard
# Look for API calls that fetch permissions
```

### Check 3: Filter Navigation
- [ ] `filterNavItems()` is receiving permission object
- [ ] Permission object is not null
- [ ] Navigation items have `permission` property set

**How to verify:**
```bash
# In src/app/dashboard/client-layout.tsx
# Add console.log before filterNavItems call:
console.log('Filtering with permissions:', userPermissions);
console.log('Nav items before filter:', navConfig.main);
```

### Check 4: Nav Config
- [ ] `getNavConfig()` returns object with 13 modules
- [ ] Each module has `permission` property
- [ ] `permission` property matches module name

**How to verify:**
- Open `src/lib/mock-data/firestore.ts`
- Find `getNavConfig()` function
- Verify all 13 modules are returned

---

## Test Report Template

Use this template to document test results:

```markdown
## Test Session: [DATE & TIME]

### Scenario 1: Fresh Login Test
- [ ] Dev server started successfully
- [ ] Login page loads
- [ ] Admin credentials accepted
- [ ] Dashboard loads (HTTP 200)
- [ ] All 13 modules visible in sidebar
- [ ] No console errors
- **Result:** ✅ PASS / ❌ FAIL

### Scenario 2: Module Navigation Test
- [ ] Users module loads (HTTP 200)
- [ ] Roles module loads (HTTP 200)
- [ ] Permissions module loads (HTTP 200)
- [ ] Store module loads (HTTP 200)
- [ ] Sales module loads (HTTP 200)
- [ ] Vendor module loads (HTTP 200)
- [ ] Inventory module loads (HTTP 200)
- [ ] HRMS module loads (HTTP 200)
- [ ] Reports module loads (HTTP 200)
- [ ] Settings module loads (HTTP 200)
- [ ] Audit module loads (HTTP 200)
- [ ] Admin module loads (HTTP 200)
- [ ] No permission errors
- **Result:** ✅ PASS / ❌ FAIL

### Scenario 3: Session Persistence Test
- [ ] Dashboard refreshes without logout
- [ ] Modules still visible after refresh
- [ ] Multiple refresh cycles successful
- [ ] Session cookies present
- **Result:** ✅ PASS / ❌ FAIL

### Scenario 4: Permission Checks Test
- [ ] Console logs show permission checks
- [ ] Admin email detected in logs
- [ ] Permission granted messages present
- **Result:** ✅ PASS / ❌ FAIL

### Scenario 5: Permissions Verification
- [ ] All 13 modules in getRolePermissions()
- [ ] Each module has full permissions
- [ ] Admin email check is simplified
- [ ] Legacy emails removed
- **Result:** ✅ PASS / ❌ FAIL

### Overall Result: ✅ ALL PASS / ❌ SOME FAILURES

### Issues Found:
(List any issues encountered)

### Console Errors:
(List any error messages from browser console)

### Recommendations:
(Any changes or improvements needed)
```

---

## Success Criteria

All of the following must be true for a **COMPLETE SUCCESS**:

✅ **Authentication**
- Admin can login with credentials
- Session persists across page refreshes
- No 401/403 errors

✅ **Module Visibility**
- All 13 modules visible in sidebar on dashboard
- Module icons render correctly
- No blank or empty sidebar

✅ **Module Access**
- Can navigate to each of the 13 modules
- Each module page loads (HTTP 200)
- No permission errors on any module

✅ **Permission Checks**
- Permission logs show email check passing first
- Admin gets immediate access (no fallback checks)
- No legacy email references in logs

✅ **Code Quality**
- `src/lib/rbac.ts` has no TypeScript errors
- No console errors related to permissions
- All tests complete without warnings

---

## Next Steps if Tests Pass

Once all tests pass:

1. Commit changes to git
   ```bash
   git add src/lib/rbac.ts
   git commit -m "Fix: Expand admin permissions and simplify admin email check"
   ```

2. Deploy to production (if applicable)
   ```bash
   # Follow your deployment process
   ```

3. Monitor admin usage and logs

---

## Contact & Support

If tests fail or issues arise:

1. Check the "Debugging Checklist" section
2. Review console logs for error messages
3. Verify admin credentials are correct
4. Ensure dev server is running
5. Check network requests in DevTools
