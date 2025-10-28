# Admin Dashboard Module Visibility Fix

## Root Cause Analysis

The admin dashboard loads but shows NO modules because:

### Issue 1: Incomplete Admin Permissions in getRolePermissions()
**File:** `src/lib/rbac.ts` (lines 200-217)

Current fallback permissions for admin only include 8 modules:
- dashboard
- store  
- sales
- inventory
- hrms
- settings
- users
- vendor

**Missing 5 modules:**
- roles
- permissions
- reports
- audit
- admin

**Why this breaks navigation:**
```
filterNavItems() → if (!permissions) return []
                   Admin gets partial permissions
                   Modules not in permissions object = filtered out
                   Navigation shows incomplete items or empty
```

### Issue 2: Admin Email Not in Session Claims Check
**File:** `src/lib/rbac.ts` (lines 60-95)

The `checkPermission()` function has multiple admin emails, but:
- Current emails: `['admin@arcus.local', 'admin@bobssale.com', 'admin@bobs.local']`
- Only `admin@bobssale.com` is the real admin
- Other emails are legacy/unused and cause confusion

### Issue 3: Role Permissions Fallback is Minimal
The fallback permissions in `getRolePermissions()` are incomplete.
Real admin needs FULL permissions for all 13 modules:
- dashboard
- users
- roles
- permissions
- store
- sales
- vendor
- inventory
- hrms
- reports
- settings
- audit
- admin

---

## Fix 1: Expand Admin Permissions in getRolePermissions()

**File:** `src/lib/rbac.ts`  
**Location:** Lines 200-217 (getRolePermissions function)

### Current Code:
```typescript
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  // TODO: Implement Supabase query for role permissions
  // For now, provide minimal admin permissions for 'admin' role
  if (roleId === 'admin') {
    console.warn('[RBAC] Using fallback admin permissions');
    return {
      dashboard: { view: true },
      store: { bills: true, invoices: true, viewPastBills: true },
      sales: { quotations: true, leads: true, viewAll: true },
      inventory: { viewStock: true, editStock: true },
      hrms: { payroll: true, attendance: true, settlement: true },
      settings: { manageRoles: true, manageUsers: true },
      users: { viewAll: true, create: true, edit: true, delete: true },
      vendor: { viewAll: true, create: true, edit: true, delete: true },
    };
  }
  return null;
}
```

### New Code:
Replace the entire function with full module permissions:

```typescript
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  // TODO: Implement Supabase query for role permissions
  // For now, provide complete admin permissions for 'admin' role
  if (roleId === 'admin') {
    console.warn('[RBAC] Using fallback admin permissions');
    return {
      // All 13 modules with full CRUD permissions
      dashboard: { view: true, manage: true },
      users: { viewAll: true, create: true, edit: true, delete: true, manage: true },
      roles: { viewAll: true, create: true, edit: true, delete: true, manage: true },
      permissions: { viewAll: true, create: true, edit: true, delete: true, manage: true },
      store: { 
        bills: true, 
        invoices: true, 
        viewPastBills: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },
      sales: { 
        quotations: true, 
        leads: true, 
        viewAll: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },
      vendor: { 
        viewAll: true, 
        create: true, 
        edit: true, 
        delete: true, 
        manage: true 
      },
      inventory: { 
        viewStock: true, 
        editStock: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },
      hrms: { 
        payroll: true, 
        attendance: true, 
        settlement: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },
      reports: { 
        viewAll: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },
      settings: { 
        manageRoles: true, 
        manageUsers: true,
        manage: true,
        view: true
      },
      audit: { 
        viewAll: true,
        view: true,
        manage: true
      },
      admin: { 
        manage: true,
        view: true,
        create: true,
        edit: true,
        delete: true
      },
    };
  }
  return null;
}
```

---

## Fix 2: Simplify Admin Email Check

**File:** `src/lib/rbac.ts`  
**Location:** Lines 60-95 (checkPermission function)

### Current Code (Problematic):
```typescript
if (userClaims.email && adminEmails.includes(userClaims.email)) {
  return true;
}
if (userClaims.roleId === 'admin') {
  return true;
}
const claimsPerms = (userClaims as any).permissions;
if (claimsPerms) {
  return checkPermissionInMap(claimsPerms, moduleName, submoduleName);
}
return false; // ← Returns false if no permissions in claims
```

### Issues with Current Code:
1. Email check only works for certain scenarios
2. Returns false if no `permissions` property in claims
3. Silently fails if none of the checks pass

### New Code:
```typescript
// FIRST: Check if user is admin by email (primary check)
if (userClaims.email === 'admin@bobssale.com') {
  return true; // Admin always has access to everything
}

// SECOND: Check if user has admin role
if (userClaims.roleId === 'admin') {
  return true; // Admin role always has access to everything
}

// THIRD: Check permissions map if present
const claimsPerms = (userClaims as any).permissions;
if (claimsPerms) {
  return checkPermissionInMap(claimsPerms, moduleName, submoduleName);
}

// If all checks fail, deny access
return false;
```

### Why This Works Better:
- Admin email check returns `true` immediately for ANY module
- No need for permissions object to be present
- Clear fallback chain: email → role → permissions → deny
- Single source of truth: `admin@bobssale.com`

---

## Fix 3: Remove Legacy Admin Emails

**File:** `src/lib/rbac.ts`  
**Location:** Lines 1-10 (adminEmails constant)

### Current Code:
```typescript
const adminEmails = ['admin@arcus.local', 'admin@bobssale.com', 'admin@bobs.local'];
```

### New Code:
```typescript
const adminEmails = ['admin@bobssale.com']; // Single source of truth
```

### Why:
- `admin@arcus.local` - legacy, not used
- `admin@bobs.local` - legacy, not used
- `admin@bobssale.com` - current admin email
- Simplifies maintenance and reduces confusion

---

## Verification Tests (No Execution Required)

### Test 1: Login Flow
```bash
# Run login test
node scripts/test-full-flow.cjs

# Verify response:
# 1. POST /api/auth/login → 200 OK
# 2. Response contains access_token and refresh_token
# 3. Cookies set in response headers
# 4. No errors in console
```

### Test 2: Dashboard Access
```bash
# After login succeeds, verify dashboard:
# 1. GET /dashboard → 200 OK
# 2. Dashboard page loads (no 403/401 errors)
# 3. navConfig and userPermissions provided to client
# 4. userPermissions includes all 13 modules
```

### Test 3: Module Visibility
After login, browser should show:
- Header with "Bobs Bath Fittings Pvt Ltd"
- Sidebar with icons for ALL modules:
  - ✓ Dashboard
  - ✓ Users
  - ✓ Roles
  - ✓ Permissions
  - ✓ Store
  - ✓ Sales
  - ✓ Vendor
  - ✓ Inventory
  - ✓ HRMS
  - ✓ Reports
  - ✓ Settings
  - ✓ Audit
  - ✓ Admin
- No empty/blank sidebar
- All module links clickable

### Test 4: Session Persistence
```bash
# After logging in:
1. Refresh page (F5)
2. Verify still logged in
3. Verify all modules still visible
4. Verify session claims still valid
```

### Test 5: Permission Check Function
When `checkPermission()` is called:
```typescript
// Should PASS (admin email):
checkPermission({ email: 'admin@bobssale.com' }, 'users', 'view') → true
checkPermission({ email: 'admin@bobssale.com' }, 'store', 'delete') → true
checkPermission({ email: 'admin@bobssale.com' }, 'anything', 'anything') → true

// Should PASS (admin role):
checkPermission({ roleId: 'admin' }, 'users', 'view') → true

// Should PASS (permissions object):
checkPermission({ permissions: { users: { view: true } } }, 'users', 'view') → true

// Should FAIL (no permissions):
checkPermission({ email: 'user@example.com' }, 'users', 'view') → false
```

---

## Implementation Steps

### Step 1: Update getRolePermissions()
- Open `src/lib/rbac.ts`
- Find getRolePermissions function (line 200)
- Replace with complete admin permissions (all 13 modules)
- Save file

### Step 2: Simplify checkPermission()
- Open `src/lib/rbac.ts`
- Find checkPermission function (line 60)
- Update admin email check to return true immediately
- Simplify logic flow
- Save file

### Step 3: Update adminEmails List
- Open `src/lib/rbac.ts`
- Find adminEmails constant (line ~1-10)
- Change to only include `'admin@bobsspale.com'`
- Save file

### Step 4: Verify No Errors
```bash
# Check for TypeScript errors
npm run build

# Should complete with 0 errors
```

### Step 5: Test Login
```bash
# Start dev server if not running
npm run dev

# In browser, go to http://localhost:3000/login
# Login with: admin@bobssale.com / Admin@123456
# Verify dashboard shows all modules
```

### Step 6: Test Module Access
- Click each module in sidebar
- Verify module pages load without permission errors
- Verify going back to dashboard still shows all modules

---

## Expected Outcome

After implementing all 3 fixes:

✅ Admin can login with credentials
✅ Dashboard loads without errors
✅ ALL 13 modules visible in sidebar
✅ Admin can click and access each module
✅ Session persists across page refreshes
✅ Permission checks work correctly
✅ No console errors related to permissions

---

## Key Files Modified

1. `src/lib/rbac.ts` - 3 changes needed
   - getRolePermissions() - expand to all 13 modules
   - checkPermission() - simplify admin check
   - adminEmails - reduce to single email

---

## Rollback Instructions

If something breaks, revert changes:

```bash
# Revert specific file
git checkout src/lib/rbac.ts

# Or restore from backup if no git
```

---

## Notes

- No database changes needed
- No migration scripts required
- Changes only affect permission logic
- Admin email hardcoded for fallback (will change when DB is updated)
- Other user roles still work normally
- No impact on existing permissions structure
