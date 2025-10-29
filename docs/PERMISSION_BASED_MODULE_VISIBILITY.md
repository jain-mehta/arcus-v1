# Permission-Based Module Visibility - Implementation Guide

## Overview

**Feature:** Only show dashboard modules/submodules that the user has permission to access.
**Status:** ✅ Implemented
**Benefit:** Clean, role-based navigation - users only see what they can do

---

## How It Works

### 1. User Logs In
```
User Login → JWT Token → Session Claims
```

### 2. Permissions Are Fetched
```
getLayoutData()
  ↓
getRolePermissions(roleId)
  ↓
Query Database: SELECT permissions FROM roles WHERE id = 'roleId'
  ↓
Parse permissions into PermissionMap
```

### 3. Navigation is Filtered
```
filterNavItems(navConfig, userPermissions)
  ↓
For each nav item:
  - Check if user has permission for that item
  - If YES → Show item ✅
  - If NO → Hide item ❌
```

### 4. Client Renders Filtered Navigation
```
Dashboard
  ├─ Available Modules (based on permissions)
  │  ├─ Sales (if user has sales:* permissions)
  │  ├─ Inventory (if user has inventory:* permissions)
  │  └─ Reports (if user has reports:* permissions)
  └─ Hidden Modules (if no permission)
```

---

## Data Flow

### Step 1: User Session
```typescript
// User logs in and gets JWT token
const sessionClaims = {
  uid: "user-123",
  email: "user@example.com",
  roleId: "sales_manager"
}
```

### Step 2: Fetch Role Permissions from Database
```typescript
// Query: SELECT permissions FROM roles WHERE id = 'sales_manager'
const roleData = {
  id: "role-123",
  name: "sales_manager",
  permissions: {
    "sales:leads": [
      { resource: "sales:leads", action: "view" },
      { resource: "sales:leads", action: "create" }
    ],
    "sales:opportunities": [
      { resource: "sales:opportunities", action: "view" }
    ]
  }
}
```

### Step 3: Convert to PermissionMap
```typescript
// Transform into PermissionMap structure
const permissionMap = {
  dashboard: {
    view: true
  },
  sales: {
    "leads:view": true,
    "leads:create": true,
    "opportunities:view": true
  }
}
```

### Step 4: Filter Navigation
```typescript
// Check each nav item against permissions
const navItems = [
  { label: "Sales", permission: "sales:view" },        // ✅ SHOW
  { label: "Inventory", permission: "inventory:view" }, // ❌ HIDE
  { label: "Dashboard", permission: "dashboard:view" }  // ✅ SHOW
]

// Result: Only Sales and Dashboard shown
```

---

## File Changes

### `src/lib/rbac.ts` - getRolePermissions()

**Before:**
```typescript
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  if (roleId === 'admin') {
    // Return admin permissions
  }
  return null;  // ❌ Returns null for all other roles!
}
```

**After:**
```typescript
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  if (roleId === 'admin') {
    // Return admin permissions
  }

  // ✅ NEW: Query database for non-admin roles
  const supabase = getSupabaseServerClient();
  
  const { data: roleData } = await supabase
    .from('roles')
    .select('permissions')
    .eq('id', roleId)
    .single();

  if (!roleData) return null;

  // Parse and convert permissions to PermissionMap
  return transformPermissions(roleData.permissions);
}
```

### `src/lib/navigation-mapper.ts` - filterNavItems()

**Status:** Already implemented ✅
- Filters navigation items based on user permissions
- Checks each nav item's permission string against permission map
- Supports both old and new permission formats

### `src/app/dashboard/actions.ts` - getLayoutData()

**Status:** Already implemented ✅
- Calls getRolePermissions() to get user's permission map
- Passes permissions to client layout for filtering
- Logs filtered navigation items

### `src/app/dashboard/client-layout.tsx`

**Status:** Already implemented ✅
- Uses filterNavItems() to filter main nav
- Uses filterNavItems() to filter sub-nav
- Only shows modules/submodules user has access to

---

## Example Scenarios

### Scenario 1: Sales Manager User

**Database:**
```sql
roles table:
  id: "role-sales-manager"
  name: "sales_manager"
  permissions: {
    "sales:leads": true,
    "sales:opportunities": true,
    "reports:salesReports": true
  }
```

**Visible Modules:**
```
✅ Sales
   ✅ Leads
   ✅ Opportunities
❌ Inventory (hidden - no permission)
❌ Users (hidden - no permission)
✅ Reports
   ✅ Sales Reports
   ❌ Inventory Reports (hidden)
❌ Settings (hidden - no permission)
```

### Scenario 2: Inventory Manager User

**Database:**
```sql
roles table:
  id: "role-inventory-manager"
  name: "inventory_manager"
  permissions: {
    "inventory:products": true,
    "inventory:stock": true,
    "reports:inventoryReports": true
  }
```

**Visible Modules:**
```
❌ Sales (hidden)
✅ Inventory
   ✅ Products
   ✅ Stock
❌ Users (hidden)
✅ Reports
   ✅ Inventory Reports
   ❌ Sales Reports (hidden)
```

### Scenario 3: Admin User

**Database:**
```sql
roles table:
  id: "admin"
  name: "admin"
  permissions: { ...200+ permissions... }
```

**Visible Modules:**
```
✅ Dashboard
✅ Sales (all submodules)
✅ Inventory (all submodules)
✅ Users (all submodules)
✅ Reports (all submodules)
✅ Settings (all submodules)
✅ HRMS (all submodules)
...and many more
```

---

## Permission Format in Database

### Option 1: JSON Object (Recommended)
```json
{
  "sales:leads": {
    "view": true,
    "create": true,
    "edit": false,
    "delete": false
  },
  "sales:opportunities": {
    "view": true,
    "create": true
  }
}
```

### Option 2: Array of Permission Objects
```json
[
  { "resource": "sales:leads", "action": "view", "effect": "allow" },
  { "resource": "sales:leads", "action": "create", "effect": "allow" },
  { "resource": "sales:opportunities", "action": "view", "effect": "allow" }
]
```

### Option 3: Simple Array of Strings
```json
[
  "sales:leads:view",
  "sales:leads:create",
  "sales:opportunities:view"
]
```

All formats are automatically converted to PermissionMap internally.

---

## Testing

### Test 1: Admin Can See All Modules
1. Login as `admin@arcus.local`
2. Navigate to `/dashboard`
3. Verify all modules visible in sidebar

### Test 2: Regular User Sees Limited Modules
1. Login as `john.doe@example.com` (sales_manager role)
2. Navigate to `/dashboard`
3. Verify only sales/reports modules visible
4. Inventory, Users, HRMS, etc. should be hidden

### Test 3: Create New Role with Custom Permissions
1. Login as admin
2. Create new role: `inventory_manager`
3. Assign permissions: `inventory:products`, `inventory:stock`
4. Login as that user
5. Verify only inventory modules visible

### Test 4: Permission Changes Reflect Immediately
1. Login as user with limited permissions
2. Admin grants additional permissions
3. User refreshes page or re-logs in
4. New modules should appear in navigation

---

## Debugging

### Check permissions in browser console:
```javascript
// In Network tab, find "getLayoutData" response
console.log(userPermissions);

// Should see permission map:
{
  "sales": { "leads": true, "opportunities": true },
  "dashboard": { "view": true }
}
```

### Check in server logs:
```
[Dashboard] User authenticated: john.doe@example.com
[Dashboard] Checking permissions for: { email: '...', roleId: 'sales_manager' }
[Dashboard] Role permissions retrieved: ["sales", "dashboard", "reports"]
[ClientLayout] Filtered main nav items: { originalCount: 8, filteredCount: 3, items: [...] }
```

---

## Benefits

| Benefit | Value |
|---------|-------|
| **Clean UI** | Users only see relevant modules |
| **Security** | Hidden modules not accessible (frontend+backend) |
| **Scalability** | Works with unlimited roles and permissions |
| **Performance** | Filtering happens server-side (once per load) |
| **Flexibility** | Easy to add/modify permissions per role |
| **Compliance** | Audit trail of who has access to what |

---

## Related Files

- `src/lib/rbac.ts` - Permission checking & role permissions
- `src/lib/navigation-mapper.ts` - Navigation filtering logic
- `src/app/dashboard/actions.ts` - Layout data fetching
- `src/app/dashboard/client-layout.tsx` - Layout rendering
- `src/app/dashboard/layout.tsx` - Layout orchestration
- Database: `roles` table with `permissions` column (JSONB)

---

## Configuration

### Nav Config Structure
```typescript
// From src/lib/mock-data/firestore.ts
{
  main: [
    { href: "/dashboard/sales", label: "Sales", permission: "sales:view" },
    { href: "/dashboard/inventory", label: "Inventory", permission: "inventory:view" },
    // ...
  ],
  subNavigation: {
    "/dashboard/sales": [
      { href: "/dashboard/sales/leads", label: "Leads", permission: "sales:leads" },
      { href: "/dashboard/sales/opportunities", label: "Opportunities", permission: "sales:opportunities" },
      // ...
    ]
  }
}
```

---

## Summary

✅ System now shows ONLY modules/submodules user has permission to access
✅ Admin sees all modules
✅ Regular users see only relevant modules based on their role
✅ Hidden modules are not accessible (even if manually navigated)
✅ Permissions fetched from database per role
✅ Easy to manage roles and permissions

**The dashboard is now fully permission-based!** 🎉
