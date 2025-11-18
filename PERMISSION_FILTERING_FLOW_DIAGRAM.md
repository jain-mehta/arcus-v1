# Permission Filtering System - Visual Flow

## 1. Complete Permission Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN PROCESS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  User Login Page     │
│  email + password    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supabase Auth                                                   │
│  ├─ Validates credentials                                       │
│  ├─ Creates JWT token                                           │
│  └─ Sets session in localStorage                               │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Session Claims (src/lib/session.ts)                            │
│  ├─ Decode JWT                                                 │
│  ├─ Get user.id from JWT                                       │
│  ├─ Query user_roles table by user.id                          │
│  ├─ Get roleId from user_roles                                 │
│  ├─ Query roles table by roleId                                │
│  └─ Get roleName from roles.name                               │
│     Returns:                                                    │
│     {                                                           │
│       uid: "user-uuid",                                         │
│       email: "admin@yourbusiness.local",                        │
│       roleId: "role-uuid",                                      │
│       roleName: "Administrator"  ← KEY!                        │
│     }                                                           │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼ (on /dashboard page load)
┌──────────────────────────────────────────────────────────────────┐
│  Get Layout Data (src/app/dashboard/actions.ts)                 │
│  getLayoutData() server action                                  │
│                                                                  │
│  Input: sessionClaims {                                         │
│    uid, email, roleId, roleName: "Administrator"                │
│  }                                                              │
│                                                                  │
│  ├─ Call getRolePermissions(roleId, roleName)                  │
│  │  └─ Check: if roleName === "Administrator"                  │
│  │     └─ Return FULL ADMIN PERMISSIONS (all 14 modules)       │
│  │                                                              │
│  │  └─ else: Query database for non-admin permissions          │
│  │     └─ SELECT permissions FROM roles WHERE id = roleId      │
│  │                                                              │
│  └─ Return to client:                                          │
│     {                                                           │
│       navConfig: { main: [...], subNavigation: {...} },        │
│       userPermissions: { ... },  ← Permission map              │
│       currentUser: { id, name, email },                        │
│       loading: false                                           │
│     }                                                           │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼ (Client receives server data)
┌──────────────────────────────────────────────────────────────────┐
│  DashboardClientLayout (src/app/dashboard/client-layout.tsx)    │
│                                                                  │
│  Input Props:                                                   │
│  ├─ navConfig: All navigation items                             │
│  ├─ userPermissions: Role-based permissions                     │
│  └─ currentUser: User info                                      │
│                                                                  │
│  Process:                                                        │
│  ├─ filterNavItems(navConfig.main, userPermissions)            │
│  │  └─ Return only accessible main nav items                    │
│  │                                                              │
│  ├─ Find current module subnavigation                           │
│  │  └─ Check pathname: /dashboard/sales                         │
│  │  └─ Find matching key: "/dashboard/sales"                    │
│  │                                                              │
│  ├─ filterNavItems(subNavItems, userPermissions)               │
│  │  └─ Return only accessible submodule items                   │
│  │                                                              │
│  └─ Render:                                                     │
│     ├─ Top navigation with accessible main modules             │
│     └─ Sidebar with accessible submodules                      │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Filter Navigation Items (src/lib/navigation-mapper.ts)         │
│  filterNavItems(navItems, permissions)                          │
│                                                                  │
│  For each item in navItems:                                     │
│  ├─ If no permission requirement → Include                      │
│  └─ Else check hasOldPermission(permissions, item.permission)  │
│                                                                  │
│  Permission Check (7-strategy fallback):                        │
│  1️⃣  Check exact permission string key                          │
│  2️⃣  Check module:submodule format                              │
│  3️⃣  Check direct submodule key                                 │
│  4️⃣  Check nested action key                                    │
│  5️⃣  Check full dotted permission                               │
│  6️⃣  Check boolean submodule value                              │
│  7️⃣  Check object with nested actions                           │
│                                                                  │
│  Return:                                                         │
│  ├─ array of accessible items (filtered)                        │
│  └─ console logs for debugging                                  │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Render Sidebar/Navigation                                      │
│                                                                  │
│  For Admin:                                                      │
│  ├─ 9/9 main modules visible                                    │
│  ├─ All submodules visible for accessed module                  │
│  └─ Full system access                                          │
│                                                                  │
│  For Sales Executive:                                            │
│  ├─ 4/9 main modules visible (Sales, Vendor, Reports, ...)     │
│  ├─ 7/11 Sales submodules visible (Leads, Opportunities, ...)  │
│  └─ Limited access to other modules                             │
│                                                                  │
│  For Intern:                                                     │
│  ├─ 2/9 main modules visible (Sales, Reports)                  │
│  ├─ 3/11 Sales submodules visible (Leads, Quotations, Reports) │
│  └─ Read-only access                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Permission Map Structure

```
ADMIN PERMISSION MAP (14 modules):
┌─────────────────────────────────────────────────────────────┐
│ {                                                           │
│   dashboard: { view: true, manage: true, ... },           │
│   users: { viewAll: true, view: true, create: true, ... },│
│   roles: { ... },                                         │
│   permissions: { ... },                                   │
│   store: { ... },                                         │
│   sales: {                                                │
│     'sales:leads:view': true,                            │
│     'sales:opportunities:view': true,                     │
│     'sales:quotations:view': true,                        │
│     'sales:orders:view': true,                            │
│     'sales:customers:view': true,                         │
│     'sales:activities:view': true,                        │
│     'sales:reports:view': true,                           │
│     'sales:leaderboard:view': true,                       │
│     'sales:visits:view': true,                            │
│     'sales:dashboard:view': true,                         │
│     'sales:settings:edit': true,                          │
│     ... (200+ permissions total)                          │
│   },                                                      │
│   vendor: { ... },                                        │
│   inventory: { ... },                                     │
│   hrms: { ... },                                          │
│   settings: { ... },                                      │
│   audit: { ... },                                         │
│   admin: { ... },                                         │
│   reports: { ... },                                       │
│   'supply-chain': { ... }                                 │
│ }                                                         │
└─────────────────────────────────────────────────────────────┘

SALES EXECUTIVE PERMISSION MAP (4 modules):
┌─────────────────────────────────────────────────────────────┐
│ {                                                           │
│   sales: {                                                │
│     'sales:leads:view': true,                            │
│     'sales:opportunities:view': true,                     │
│     'sales:quotations:view': true,                        │
│     'sales:orders:view': true,                            │
│     'sales:customers:view': true,                         │
│     'sales:activities:view': true,                        │
│     'sales:reports:view': true,                           │
│     view: true                                            │
│   },                                                      │
│   vendor: {                                               │
│     'vendor:view': true,                                 │
│     view: true                                            │
│   },                                                      │
│   reports: {                                              │
│     'reports:view': true,                                │
│     view: true                                            │
│   },                                                      │
│   settings: {                                             │
│     'settings:profile:view': true,                        │
│     view: true                                            │
│   }                                                       │
│   // Missing: dashboard, users, roles, hrms, inventory... │
│ }                                                         │
└─────────────────────────────────────────────────────────────┘

INTERN PERMISSION MAP (2 modules):
┌─────────────────────────────────────────────────────────────┐
│ {                                                           │
│   sales: {                                                │
│     'sales:leads:view': true,                            │
│     'sales:leads:viewOwn': true,                         │
│     'sales:quotations:view': true,                        │
│     'sales:quotations:viewOwn': true,                     │
│     'sales:reports:view': true,                           │
│     view: true                                            │
│   },                                                      │
│   reports: {                                              │
│     'reports:view': true,                                │
│     view: true                                            │
│   }                                                       │
│   // Missing: all others                                 │
│ }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Navigation Filtering Flow

```
MAIN NAVIGATION FILTERING
┌──────────────────────────────────────────┐
│ All 9 Main Modules (from config):        │
│ ├─ Dashboard                             │
│ ├─ Vendor                                │
│ ├─ Inventory                             │
│ ├─ Sales                                 │
│ ├─ Stores                                │
│ ├─ HRMS                                  │
│ ├─ User Management                       │
│ ├─ Settings                              │
│ └─ Supply Chain                          │
└────────────┬──────────────────────────────┘
             │
             ▼ filterNavItems()
    ┌─────────────────────┐
    │ Admin User?         │
    │ (has all major      │
    │  modules)           │
    └────┬────────┬───────┘
         │        │
    YES  │        │  NO
         ▼        ▼
    ┌────────┐  ┌──────────────────────┐
    │ Show   │  │ Check each item      │
    │ All 9  │  │ permission:          │
    │ Items  │  │ - "sales:leads:view" │
    └────────┘  │ - "vendor:viewAll"   │
               │ - "inventory:viewAll" │
               │ ... (check against    │
               │ user's permission map)│
               └──────────┬────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ Permission Map:      │
               │ {                    │
               │   sales: {...},      │
               │   vendor: {...}      │
               │   // No inventory    │
               │   // No hrms         │
               │ }                    │
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ Filtered Results:     │
               │ ├─ ✅ Sales          │
               │ ├─ ✅ Vendor         │
               │ ├─ ❌ Inventory      │
               │ ├─ ❌ Stores         │
               │ ├─ ❌ HRMS           │
               │ └─ ... (4/9 items)   │
               └──────────────────────┘
```

---

## 4. Submodule Filtering Flow

```
SUBMODULE FILTERING (When in /dashboard/sales)
┌──────────────────────────────────────────────┐
│ All 11 Sales Submodules (from config):       │
│ ├─ Sales Dashboard                           │
│ ├─ Lead Management                           │
│ ├─ Sales Pipeline                            │
│ ├─ Quotations                                │
│ ├─ Sales Orders                              │
│ ├─ Customer Accounts                         │
│ ├─ Sales Activities Log                      │
│ ├─ Log a Dealer Visit                        │
│ ├─ Sales Leaderboard                         │
│ ├─ Sales Reports & KPIs                      │
│ └─ Sales Settings                            │
└────────────┬───────────────────────────────────┘
             │
             ▼ filterNavItems()
       ┌──────────────────────┐
       │ For each submodule,  │
       │ check permission:    │
       │                      │
       │ "Sales Dashboard" →  │
       │ "sales:dashboard:view"
       │                      │
       │ Check in:            │
       │ permissions.sales[   │
       │   'sales:dashboard:view'
       │ ]                    │
       └──────────┬───────────┘
                  │
                  ▼ 7-Strategy Check
        ┌─────────────────────────┐
        │ 1. Exact key match      │
        │ 2. module:submodule     │
        │ 3. Direct submodule     │
        │ 4. nested:action        │
        │ 5. Full dotted key      │
        │ 6. Boolean true         │
        │ 7. Object with actions  │
        └──────────┬──────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ User Permissions:             │
        │ {                             │
        │   sales: {                    │
        │     'sales:leads:view': ✅    │
        │     'sales:opportunities:..': ✅
        │     'sales:quotations:..': ✅ │
        │     'sales:orders:view': ✅   │
        │     'sales:customers:..': ✅  │
        │     'sales:activities:..': ✅ │
        │     'sales:reports:view': ✅  │
        │     'sales:dashboard:view': ❌ (missing!)
        │     'sales:visits:view': ❌   │
        │     'sales:leaderboard:..': ❌ │
        │     'sales:settings:edit': ❌  │
        │   }                           │
        │ }                             │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────────┐
        │ Filtered Results (7/11):      │
        │ ├─ ❌ Sales Dashboard        │
        │ ├─ ✅ Lead Management       │
        │ ├─ ✅ Sales Pipeline        │
        │ ├─ ✅ Quotations            │
        │ ├─ ✅ Sales Orders          │
        │ ├─ ✅ Customer Accounts     │
        │ ├─ ✅ Sales Activities Log  │
        │ ├─ ❌ Log a Dealer Visit    │
        │ ├─ ❌ Sales Leaderboard     │
        │ ├─ ✅ Sales Reports & KPIs  │
        │ └─ ❌ Sales Settings        │
        └──────────────────────────────┘
```

---

## 5. Permission Check Strategy

```
Checking permission: "sales:leads:view"

Permissions object:
{
  sales: {
    'sales:leads:view': true,     ← This is what we're looking for!
    'sales:leads': true,
    'leads:view': true,
    'leads': { view: true },
    'sales': { leads: { view: true } }
  }
}

Strategy Execution:
┌────────────────────────────────────────┐
│ STRATEGY 1: Exact permission string    │
│ permissions['sales']['sales:leads:view']
│ Result: ✅ TRUE (found!)               │
│ Return: true (STOP)                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ STRATEGY 2: module:submodule           │
│ (If strategy 1 failed)                 │
│ permissions['sales']['sales:leads']    │
│ Result: ✅ TRUE                        │
│ Return: true (STOP)                    │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ STRATEGY 3: Direct submodule           │
│ (If strategies 1-2 failed)             │
│ permissions['sales']['leads']          │
│ Result: Can be:                        │
│   ✅ TRUE (boolean)                    │
│   ✅ TRUE (inside object { view: true })
│ Return: true (STOP)                    │
└────────────────────────────────────────┘

... Strategies 4-7 continue if needed
```

---

## 6. Key Files & Their Roles

```
LOGIN FLOW:
┌─────────────────────┐
│ src/app/login/      │
│ page.tsx            │
│ client.tsx          │
└──────────┬──────────┘
           │ (calls auth function)
           ▼
┌─────────────────────┐
│ src/lib/session.ts  │ ⭐ CRITICAL
│ ├─ getSessionClaims()
│ ├─ Fetch roleId     │
│ ├─ Fetch roleName   │
│ └─ Return claims    │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ src/lib/rbac.ts          │ ⭐ CRITICAL
│ ├─ getRolePermissions()   │
│ ├─ if "Administrator"     │
│ │  └─ Return full perms   │
│ └─ else                   │
│    └─ Query database      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────┐
│ src/app/dashboard/           │
│ actions.ts                   │ ⭐ CRITICAL
│ ├─ getLayoutData()           │
│ ├─ getNavConfig()            │
│ └─ Pass to client            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ src/app/dashboard/           │
│ client-layout.tsx            │ ⭐ CRITICAL
│ ├─ Receive permissions       │
│ ├─ Filter main nav           │
│ ├─ Filter submodules         │
│ └─ Render sidebar            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ src/lib/                     │
│ navigation-mapper.ts         │ ⭐ CRITICAL
│ ├─ filterNavItems()          │
│ ├─ hasOldPermission()        │
│ └─ 7-strategy fallback       │
└──────────────────────────────┘
```

---

## 7. Debugging Flow

```
User says: "Module X not showing"

STEP 1: Check Browser Console
┌──────────────────────────────────────┐
│ Look for:                            │
│ [ClientLayout] Filtered main nav items:
│   originalCount: 9                   │
│   filteredCount: ?                   │ ← Should be 9 for admin
│   items: [...]                       │
└──────────────────────────────────────┘

STEP 2: Check Permissions Log
┌──────────────────────────────────────┐
│ [ClientLayout] Permissions received: │
│   permissionsExist: true/false        │
│   permissionKeys: 14 (admin) or less  │
│   permissionModules: [...]           │
└──────────────────────────────────────┘

STEP 3: Check Permission Check
┌──────────────────────────────────────┐
│ [Navigation] Permission check:       │
│   itemLabel: "Sales"                 │
│   permission: "sales:leads:view"     │
│   hasPermission: true/false ← KEY!   │
└──────────────────────────────────────┘

STEP 4: Check Database
┌──────────────────────────────────────┐
│ SELECT permissions FROM roles        │
│ WHERE name = 'Administrator';        │
│ ├─ Should return full JSONB          │
│ ├─ With 14 modules                   │
│ └─ With 200+ permissions             │
└──────────────────────────────────────┘

STEP 5: Check Session
┌──────────────────────────────────────┐
│ localStorage.getItem('auth.session') │
│ ├─ Should have user.id               │
│ └─ Should have user.role (if any)    │
└──────────────────────────────────────┘
```

---

## Summary

**Permission filtering works in this order:**

1. ✅ **User logs in** → Supabase Auth creates JWT
2. ✅ **Session fetches roleName** → Database lookup
3. ✅ **getRolePermissions() checks roleName** → Returns hardcoded admin perms or DB perms
4. ✅ **Client receives userPermissions** → PermissionMap object
5. ✅ **filterNavItems() filters items** → Uses 7-strategy check
6. ✅ **Sidebar renders only accessible items** → Admin sees all, others see filtered

**If any step fails, modules won't show up!**
