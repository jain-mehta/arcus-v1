# Admin Login Testing Checklist

## Credentials
- **Email:** `admin@arcus.local`
- **Password:** `Admin@123456`
- **Expected Role:** admin
- **Expected Access:** ALL 13 modules

---

## Pre-Test Setup

- [ ] Ensure dev server is running: `npm run dev`
- [ ] Dev server is at http://localhost:3000
- [ ] Open browser DevTools (F12) and go to Console tab
- [ ] Clear any previous sessions (open Incognito/Private window)

---

## Test 1: Login Success

1. **Navigate to login page**
   - Go to: http://localhost:3000/login
   - [ ] Login form appears with email and password fields

2. **Enter credentials**
   - Email: `admin@arcus.local`
   - Password: `Admin@123456`
   - [ ] Fields accept input without errors

3. **Submit login**
   - Click "Login" button
   - [ ] No validation errors appear
   - [ ] Loading state shows briefly

4. **Verify response**
   - Check Network tab (DevTools → Network)
   - [ ] POST /api/auth/login returns 200 OK
   - [ ] Response includes user data and tokens
   - [ ] Response headers include Set-Cookie

5. **Verify console logs** (DevTools → Console)
   - Filter for `[Auth]` and `[RBAC]` messages
   - [ ] `[Auth] Request body: { email: 'admin@arcus.local', ... }`
   - [ ] `[Supabase Auth] User signed in: admin@arcus.local`
   - [ ] `[Auth] Setting admin role for admin@arcus.local`
   - [ ] `[Auth] Admin role assigned to admin@arcus.local`
   - [ ] `[Auth] User profile synced: { email: 'admin@arcus.local', roleId: 'admin' }`

**Result:** ✅ PASS / ❌ FAIL

---

## Test 2: Dashboard Load

1. **After login redirects to dashboard**
   - [ ] URL changes to http://localhost:3000/dashboard
   - [ ] No 403/401 errors in response
   - [ ] Dashboard page renders without errors

2. **Check main content loads**
   - [ ] Header shows "Bobs Bath Fittings Pvt Ltd"
   - [ ] User avatar appears in top-right
   - [ ] "Admin Dashboard" heading visible
   - [ ] Key Metrics section displays (Active Vendors, Outstanding Balance, etc.)

3. **Verify RBAC permission check** (Console logs)
   - Filter for `[RBAC] Checking permission`
   - [ ] Log shows: `email: 'admin@arcus.local'`
   - [ ] Log shows: `roleId: 'admin'`
   - [ ] Log shows: `moduleName: 'dashboard'`
   - [ ] Next log shows: `[RBAC] Admin user detected by email, granting all permissions`

4. **Check API response**
   - In Network tab, find GET /dashboard request
   - [ ] Status: 200 OK
   - [ ] Response includes navConfig and userPermissions
   - [ ] userPermissions has 13 modules

**Result:** ✅ PASS / ❌ FAIL

---

## Test 3: Sidebar Module Visibility

1. **Check sidebar renders**
   - [ ] Sidebar appears on the left side of dashboard
   - [ ] Sidebar contains icons and labels

2. **Verify ALL 13 modules are visible**
   - Count modules in sidebar (or check with DevTools)
   - [ ] 1. Dashboard icon visible
   - [ ] 2. Users icon visible
   - [ ] 3. Roles icon visible
   - [ ] 4. Permissions icon visible
   - [ ] 5. Store icon visible
   - [ ] 6. Sales icon visible
   - [ ] 7. Vendor icon visible
   - [ ] 8. Inventory icon visible
   - [ ] 9. HRMS icon visible
   - [ ] 10. Reports icon visible
   - [ ] 11. Settings icon visible
   - [ ] 12. Audit icon visible
   - [ ] 13. Admin icon visible

3. **Verify module names are correct**
   - [ ] No blank/empty sidebar items
   - [ ] Each module has correct name label
   - [ ] No duplicate modules

4. **No errors in console**
   - [ ] No red errors about modules
   - [ ] No permission denied messages
   - [ ] No undefined/null value errors

**Result:** ✅ PASS / ❌ FAIL

---

## Test 4: Module Navigation

For each module below, perform these steps:
1. Click the module icon in sidebar
2. Wait for page to load
3. Check status code is 200 OK
4. Verify no errors in console
5. Check for any permission errors

**Test 4.1: Users Module**
- [ ] Clicking "Users" navigates to /dashboard/users
- [ ] Page loads with HTTP 200
- [ ] No permission errors
- [ ] User management interface appears

**Test 4.2: Roles Module**
- [ ] Clicking "Roles" navigates to /dashboard/roles
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.3: Permissions Module**
- [ ] Clicking "Permissions" navigates to /dashboard/permissions
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.4: Store Module**
- [ ] Clicking "Store" navigates to /dashboard/store
- [ ] Page loads with HTTP 200
- [ ] No permission errors
- [ ] Store interface loads

**Test 4.5: Sales Module**
- [ ] Clicking "Sales" navigates to /dashboard/sales
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.6: Vendor Module**
- [ ] Clicking "Vendor" navigates to /dashboard/vendor
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.7: Inventory Module**
- [ ] Clicking "Inventory" navigates to /dashboard/inventory
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.8: HRMS Module**
- [ ] Clicking "HRMS" navigates to /dashboard/hrms
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.9: Reports Module**
- [ ] Clicking "Reports" navigates to /dashboard/reports
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.10: Settings Module**
- [ ] Clicking "Settings" navigates to /dashboard/settings
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.11: Audit Module**
- [ ] Clicking "Audit" navigates to /dashboard/audit
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.12: Admin Module**
- [ ] Clicking "Admin" navigates to /dashboard/admin
- [ ] Page loads with HTTP 200
- [ ] No permission errors

**Test 4.13: Back to Dashboard**
- [ ] Clicking "Dashboard" navigates to /dashboard
- [ ] Page loads with HTTP 200
- [ ] All modules still visible in sidebar

**Result:** ✅ ALL PASS / ❌ SOME FAIL (specify which)

---

## Test 5: Session Persistence

1. **Navigate back to dashboard**
   - [ ] Currently on any dashboard page

2. **Refresh page (F5 or Ctrl+R)**
   - [ ] Page reloads
   - [ ] No redirect to /login
   - [ ] Session is preserved

3. **Verify still logged in**
   - [ ] User avatar still visible
   - [ ] Dashboard content loads
   - [ ] No 401/403 errors

4. **Verify modules still visible**
   - [ ] All 13 modules still in sidebar
   - [ ] Sidebar not empty or broken
   - [ ] No new permission errors

5. **Multiple refresh cycles**
   - [ ] Refresh 3 more times (total 5 refreshes)
   - [ ] Each time, session persists
   - [ ] No errors accumulate

**Result:** ✅ PASS / ❌ FAIL

---

## Test 6: Permission Check Logs

1. **Open browser Console**
   - DevTools → Console tab
   - Clear any previous logs

2. **Navigate between modules**
   - Click Users module
   - Wait for page to load
   - Click Roles module
   - Wait for page to load

3. **Filter logs for RBAC**
   - In console, filter: `[RBAC]`
   - Should see logs like:

   ```
   [RBAC] Checking permission: {
     userId: '48e695cf-45e5-49e4-8c4d-e05b2fea0da4',
     email: 'admin@arcus.local',
     moduleName: 'users',
     roleId: 'admin'
   }
   [RBAC] Admin user detected by email, granting all permissions
   ```

4. **Verify log pattern**
   - [ ] Email is: `admin@arcus.local`
   - [ ] RoleId is: `admin`
   - [ ] Message shows: "Admin user detected by email, granting all permissions"
   - [ ] No fallback checks (should return on email check)

5. **Check for error logs**
   - Filter console for errors (red messages)
   - [ ] No "Permission denied" errors
   - [ ] No "Unauthorized" messages
   - [ ] No "undefined" errors related to permissions

**Result:** ✅ PASS / ❌ FAIL

---

## Test 7: Logout and Re-login

1. **Click user avatar**
   - [ ] Dropdown menu appears

2. **Click Logout**
   - [ ] Redirects to /login
   - [ ] Session cookies cleared
   - [ ] Dashboard inaccessible

3. **Re-login with same credentials**
   - Email: `admin@arcus.local`
   - Password: `Admin@123456`
   - [ ] Login succeeds again
   - [ ] Dashboard loads with all modules

**Result:** ✅ PASS / ❌ FAIL

---

## Final Results Summary

### Overall Result
- [ ] ✅ ALL TESTS PASSED
- [ ] ❌ SOME TESTS FAILED (see below)
- [ ] ❌ CRITICAL FAILURES (see below)

### Tests Passed: ___ / 7

### If any test failed:

**Failed Tests:**
- Test #: ____
- Details: ________________________
- Console errors: ________________________

**Failed Tests:**
- Test #: ____
- Details: ________________________
- Console errors: ________________________

### Debugging Tips

If Test 3 (sidebar modules) fails:
1. Check console for errors about filterNavItems
2. Verify userPermissions object has all 13 modules
3. Check navConfig has 13 modules in firestore.ts

If Test 4 (module navigation) fails for specific module:
1. Check Network tab for the module page request
2. Look for 403/401 status codes
3. Check console for RBAC permission errors
4. Verify module exists in navConfig

If Test 5 (session persistence) fails:
1. Check cookies in DevTools → Application → Cookies
2. Verify `__supabase_access_token` cookie exists
3. Check if cookie is HttpOnly (should be)
4. Verify cookie value is not empty

If Test 6 (permission logs) shows wrong values:
1. Re-login with exact credentials
2. Check if different email is being used
3. Check if roleId is null/undefined
4. Verify session claims include roleId

---

## Validation Command (if needed)

Run this in terminal to check environment:

```bash
# Check if admin user exists in database
npm run dev
# (In separate terminal)
node scripts/verify-admin.mjs
```

Should output:
```
Admin user found: admin@arcus.local
Admin role assigned: true
Ready for dashboard testing
```

---

## Sign-Off

**Tester Name:** __________________
**Test Date:** __________________
**Overall Status:** ✅ PASS / ❌ FAIL

**Notes:**
________________________
________________________
________________________

