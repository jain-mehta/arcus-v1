# Permission Filtering Troubleshooting Guide

## Quick Diagnosis

### **Issue: Module/Submodule Not Showing**

#### **Step 1: Check Browser Console**

Open DevTools (F12) → Console tab and look for these logs:

```
[ClientLayout] Filtered main nav items: {
  originalCount: 9,
  filteredCount: X,  // Should be 9 for admin
  items: [...]
}

[Navigation] Permission check: {
  itemLabel: "Sales",
  permission: "sales:leads:view",
  hasPermission: true/false  // Check this!
}
```

#### **Step 2: Identify the Issue**

| Log Shows | Problem |
|-----------|---------|
| `permissionsExist: false` | User not authenticated or session missing |
| `filteredCount: 0` | No permissions assigned to this role |
| `hasPermission: false` for item | Permission key mismatch |
| `permissionModules: ['dashboard']` only | Role missing modules |

---

## Common Issues & Fixes

### **1. Admin User Not Seeing All Modules**

**Symptom:** Admin sees only 1-2 modules instead of 9

**Cause:** Role name not being detected correctly

**Check:**
```javascript
// In session.ts, verify roleName is returned:
const { data: role } = await supabase
  .from('roles')
  .select('name')
  .eq('id', roleId)
  .single();

// Should return: { name: 'Administrator' }
```

**Fix:**
```bash
# 1. Check database directly
SELECT id, name FROM roles WHERE name = 'Administrator';

# 2. Verify user is assigned to this role
SELECT user_id, role_id FROM user_roles WHERE user_id = 'admin-uuid';

# 3. If admin role missing, create it:
INSERT INTO roles (name, description, permissions)
VALUES ('Administrator', 'Full system access', {...full permissions...});

# 4. Assign to user:
INSERT INTO user_roles (user_id, role_id)
VALUES ('admin-uuid', 'admin-role-uuid');
```

---

### **2. Submodule Not Showing in Sales**

**Symptom:** Sales module shows 8/11 submodules

**Cause:** Permission key mismatch between navigation config and permissions

**Check Navigation Config:**
```javascript
// In actions.ts, verify permission string:
{
  href: "/dashboard/sales/orders",
  label: "Sales Orders",
  permission: "sales:orders:view"  // This exact string must exist in permissions
}
```

**Check Database:**
```sql
-- Verify permission exists for role
SELECT permissions FROM roles WHERE name = 'Sales Executive';

-- Should contain (in JSONB):
{
  "sales": {
    "sales:orders:view": true,
    "sales:leads:view": true,
    ...
  }
}
```

**Fix:**
```javascript
// Add missing permission to seed script

const salesExecutivePermissions = {
  sales: {
    'sales:dashboard:view': true,        // ← Add if missing
    'sales:leads:view': true,
    'sales:opportunities:view': true,
    'sales:quotations:view': true,
    'sales:orders:view': true,           // ← Make sure this exists!
    'sales:customers:view': true,
    'sales:activities:view': true,
    'sales:reports:view': true,
    // Add any missing ones here
  }
};

// Update database:
UPDATE roles 
SET permissions = $1
WHERE name = 'Sales Executive';
```

---

### **3. Permission Check Always Returns False**

**Symptom:** `hasPermission: false` for all items, even for admin

**Cause:** Permission format mismatch in database

**Check:**
```javascript
// In rbac.ts, permissions come as:
{
  "sales": {
    "sales:leads:view": true,     // ✅ Correct: dotted notation
    "sales": { "leads": { "view": true } }  // ❌ Wrong: nested objects
  }
}
```

**Fix:**
```javascript
// Ensure permissions are in flat dotted notation:
{
  "dashboard": { "view": true, "dashboard:view": true },
  "sales": {
    "sales:leads:view": true,
    "sales:opportunities:view": true,
    // NOT: "sales": { "leads": { "view": true } }
  }
}
```

---

### **4. Admin Role Hardcoding Not Working**

**Symptom:** getRolePermissions returns null for admin

**Cause:** roleName parameter not passed or wrong value

**Check:**
```javascript
// In actions.ts:getLayoutData()
const userPermissions = await getRolePermissions(
  sessionClaims.roleId,    // UUID
  sessionClaims.roleName   // Must be exactly "Administrator"!
);

// Log to verify:
console.log('[Dashboard] roleName:', sessionClaims.roleName);
// Should print: [Dashboard] roleName: Administrator
```

**Fix:**
```javascript
// If roleName is null, check session.ts:

// Line ~210-225 in session.ts should have:
if (roleId) {
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', roleId)
    .single();
  
  const roleName = role?.name || null;
  claims.roleName = roleName;
}
```

---

### **5. Non-Admin Role Getting All Permissions**

**Symptom:** Sales Executive sees all 14 modules like admin

**Cause:** Admin detection is too loose

**Check:**
```javascript
// In navigation-mapper.ts:filterNavItems()
const majorModules = ['dashboard', 'users', 'roles', 'permissions', 'store', 'sales', 'vendor', 'inventory', 'hrms', 'settings'];
const hasAllMajorModules = majorModules.every(module => permissions[module]);

if (hasAllMajorModules) {
  console.log('[Navigation] User appears to be admin');
  return navItems;  // Shows all items!
}
```

**Fix:** This should only be true for admin. Verify permissions object:
```javascript
// Admin should have ALL 14 modules:
{
  dashboard: {...},
  users: {...},
  roles: {...},
  permissions: {...},
  store: {...},
  sales: {...},
  vendor: {...},
  inventory: {...},
  hrms: {...},
  settings: {...},
  audit: {...},
  admin: {...},
  reports: {...},
  'supply-chain': {...}
}

// Sales Exec should have only a few:
{
  sales: {...},
  vendor: {...},
  reports: {...}
  // Missing: dashboard, users, roles, etc.
}
```

---

## Debug Mode

### **Enable Extra Logging**

Add to `src/lib/navigation-mapper.ts`:

```javascript
export function filterNavItems<T extends { permission?: string }>(
  navItems: T[],
  permissions: PermissionMap | null
): T[] {
  // ADD THESE LOGS:
  console.log('=== FILTERING DEBUG ===');
  console.log('Input items:', navItems.map((it: any) => ({ 
    label: it.label, 
    permission: it.permission 
  })));
  console.log('User permissions:', permissions);
  console.log('Major modules check:', permissions ? Object.keys(permissions).filter(m => 
    ['dashboard', 'users', 'roles', 'permissions', 'store', 'sales', 'vendor', 'inventory', 'hrms', 'settings'].includes(m)
  ) : 'null');
  
  // ... rest of function
}
```

### **Test Permission Check Directly**

In browser console:
```javascript
// Get permissions from Redux/state/context
const permissions = store.getState().permissions; // Depends on your state management

// Test a single permission
const hasLeads = permissions?.sales?.['sales:leads:view'];
console.log('Has sales:leads:view?', hasLeads);

// List all available permissions
console.log('All permissions:', permissions);
```

---

## Database Queries for Diagnosis

### **1. Check User's Role**
```sql
SELECT u.id, u.email, ur.role_id, r.name, r.permissions
FROM auth.users u
JOIN users u2 ON u.id = u2.id
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@yourbusiness.local';
```

### **2. Check Role's Permissions**
```sql
SELECT name, permissions
FROM roles
WHERE name = 'Administrator';
```

### **3. Count Modules in Permission**
```sql
SELECT COUNT(DISTINCT (permissions -> key)::text) as module_count
FROM roles
WHERE name = 'Administrator';
```

### **4. Check Specific Permission**
```sql
SELECT permissions -> 'sales' -> 'sales:leads:view' as has_permission
FROM roles
WHERE name = 'Sales Executive';
```

---

## Testing Flow

### **1. Test Admin First**
```bash
# Login as admin
Email: admin@yourbusiness.local
Password: Admin@123456

# Should see:
- All 9 main modules
- All submodules in each module
```

### **2. Test Sales Executive**
```bash
# Login as sales executive
Email: sales-exec@yourbusiness.local
Password: SalesExec@123456

# Should see:
- Sales module (7-9 submodules)
- Vendor module (limited)
- Reports module
- Settings (profile only)
```

### **3. Test Intern**
```bash
# Login as intern
Email: intern@yourbusiness.local
Password: Intern@123456

# Should see:
- Sales module (3-5 submodules)
- Reports module (read-only)
```

---

## Performance Notes

- Permission checking happens on **server-side** (getLayoutData)
- Filtered permissions passed to client
- Client-side filtering is fast (just array.filter())
- No API calls needed after initial layout load
- Console logs auto-clear on page navigation

---

## Common Permission Format Errors

### ❌ Wrong Format (Won't Work)
```javascript
{
  "sales": [
    { "resource": "leads", "action": "view" }  // Array format
  ]
}

{
  "sales": {
    "leads": {
      "view": true  // Deeply nested
    }
  }
}
```

### ✅ Correct Format (Works)
```javascript
{
  "sales": {
    "sales:leads:view": true,           // Dotted notation
    "sales:opportunities:view": true,
    "sales:quotations:view": true,
    "leads": true,                      // Also support shorthand
    "opportunities": true
  }
}
```

---

## Escalation Checklist

If permissions still not working:

- [ ] Verify user exists in `auth.users`
- [ ] Verify user profile exists in `public.users`
- [ ] Verify role exists in `public.roles`
- [ ] Verify user_roles mapping exists
- [ ] Verify role has permissions JSON
- [ ] Verify roleName matches database exactly ("Administrator" not "admin")
- [ ] Check session.ts is fetching roleName correctly
- [ ] Check rbac.ts hardcoding works for admin
- [ ] Verify filterNavItems logic
- [ ] Check navigation-mapper.ts hasOldPermission()
- [ ] Look for TypeScript errors in build
- [ ] Check network tab for API errors

---

## Need Help?

**Check these files in order:**
1. `src/lib/session.ts` - Session claims and roleName
2. `src/lib/rbac.ts` - Permission retrieval
3. `src/app/dashboard/actions.ts` - Layout data and nav config
4. `src/lib/navigation-mapper.ts` - Permission checking logic
5. `src/app/dashboard/client-layout.tsx` - Client-side filtering

**Run these diagnostics:**
```bash
# 1. Check seed script
node seed-users-with-roles.mjs

# 2. Check database
psql -d arcus_db -c "SELECT name, permissions FROM roles LIMIT 5;"

# 3. Check build
npm run build

# 4. Check dev server
npm run dev

# 5. Check session in browser
localStorage.getItem('auth.session')
```
