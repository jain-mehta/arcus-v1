# Visual Guide - Permission-Based Module Visibility

## User Journey Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                               │
│                                                                   │
│  Email: john.doe@example.com                                     │
│  Password: UserPassword123!                                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                                │
│                                                                   │
│  Supabase Auth verifies credentials                              │
│  Returns JWT token with user claims                              │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   GET SESSION CLAIMS                             │
│                                                                   │
│  Extract from JWT:                                               │
│  - uid: "abc-123-def"                                            │
│  - email: "john.doe@example.com"                                 │
│  - roleId: "sales_manager"                                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              QUERY ROLE PERMISSIONS                              │
│                                                                   │
│  SELECT permissions FROM roles                                   │
│  WHERE id = "sales_manager"                                      │
│                                                                   │
│  Result:                                                         │
│  {                                                               │
│    "sales:leads": true,                                          │
│    "sales:opportunities": true,                                  │
│    "reports:salesReports": true,                                 │
│    "dashboard:view": true                                        │
│  }                                                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│            CONVERT TO PERMISSION MAP                             │
│                                                                   │
│  {                                                               │
│    "dashboard": { "view": true },                                │
│    "sales": {                                                    │
│      "leads": true,                                              │
│      "opportunities": true                                       │
│    },                                                            │
│    "reports": {                                                  │
│      "salesReports": true                                        │
│    }                                                             │
│  }                                                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│           PASS TO CLIENT LAYOUT                                  │
│                                                                   │
│  DashboardClientLayout receives:                                 │
│  - navConfig (all available modules)                             │
│  - userPermissions (what THIS user can access)                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│             FILTER NAVIGATION ITEMS                              │
│                                                                   │
│  For each nav item:                                              │
│    IF userPermissions[module:submodule] === true                 │
│      → SHOW item                                                 │
│    ELSE                                                          │
│      → HIDE item                                                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                RENDER DASHBOARD                                  │
│                                                                   │
│  ┌─ Sidebar ────────────────────────────────┐                   │
│  │                                          │                   │
│  │ ✅ Dashboard                             │                   │
│  │ ✅ Sales                                 │                   │
│  │    ├─ Leads                              │                   │
│  │    ├─ Opportunities                      │                   │
│  │    └─ Quotations                         │                   │
│  │ ❌ Inventory (HIDDEN)                    │                   │
│  │ ❌ Users (HIDDEN)                        │                   │
│  │ ✅ Reports                               │                   │
│  │    └─ Sales Reports                      │                   │
│  │ ❌ Settings (HIDDEN)                     │                   │
│  │                                          │                   │
│  └──────────────────────────────────────────┘                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Permission Check Flow

```
User Access Request
       │
       ▼
hasPermission('sales:leads')?
       │
       ├─ Check permission map ─────► Found: true  ► GRANT ✅
       │
       └─ Not found ─────────────────► DENY ❌

User tries to access hidden module URL
       │
       ▼
navigateTo('/dashboard/inventory')?
       │
       ├─ Sidebar filtering ───────► Item hidden (frontend)
       │
       └─ Backend protection ──────► Permission check fails (backend)
                                      ↓
                                   403 Forbidden ❌
```

---

## Module Visibility Comparison

### Admin User Dashboard
```
┌─────────────────────────────────────┐
│         ADMIN DASHBOARD             │
├─────────────────────────────────────┤
│ ✅ Dashboard                         │
│ ✅ Sales                             │
│    ├─ Leads                         │
│    ├─ Opportunities                 │
│    └─ Quotations                    │
│ ✅ Inventory                         │
│    ├─ Products                      │
│    ├─ Stock                         │
│    └─ Warehouses                    │
│ ✅ Users                             │
│    ├─ All Users                     │
│    ├─ Roles                         │
│    └─ Permissions                   │
│ ✅ HRMS                              │
│    ├─ Employees                     │
│    ├─ Attendance                    │
│    └─ Payroll                       │
│ ✅ Reports                           │
│    ├─ Sales Reports                 │
│    ├─ Inventory Reports             │
│    └─ HR Reports                    │
│ ✅ Settings                          │
│    ├─ Organization                  │
│    ├─ Security                      │
│    └─ Integrations                  │
│                                     │
│ Total: ALL MODULES VISIBLE ✅       │
└─────────────────────────────────────┘
```

### Sales Manager Dashboard
```
┌─────────────────────────────────────┐
│     SALES MANAGER DASHBOARD         │
├─────────────────────────────────────┤
│ ✅ Dashboard                         │
│ ✅ Sales                             │
│    ├─ Leads         ✅              │
│    ├─ Opportunities ✅              │
│    └─ Quotations    ✅              │
│ ❌ Inventory        (HIDDEN)        │
│ ❌ Users            (HIDDEN)        │
│ ❌ HRMS             (HIDDEN)        │
│ ✅ Reports                           │
│    ├─ Sales Reports ✅              │
│    ├─ Inventory     (HIDDEN)        │
│    └─ HR Reports    (HIDDEN)        │
│ ❌ Settings         (HIDDEN)        │
│                                     │
│ Total: 4 MODULES, 3 SUBMODULES ✅  │
└─────────────────────────────────────┘
```

### Inventory Manager Dashboard
```
┌─────────────────────────────────────┐
│  INVENTORY MANAGER DASHBOARD        │
├─────────────────────────────────────┤
│ ✅ Dashboard                         │
│ ❌ Sales              (HIDDEN)      │
│ ✅ Inventory                         │
│    ├─ Products       ✅              │
│    ├─ Stock          ✅              │
│    └─ Warehouses     ✅              │
│ ❌ Users             (HIDDEN)       │
│ ❌ HRMS              (HIDDEN)       │
│ ✅ Reports                           │
│    ├─ Inventory      ✅              │
│    ├─ Sales          (HIDDEN)       │
│    └─ HR Reports     (HIDDEN)       │
│ ❌ Settings          (HIDDEN)       │
│                                     │
│ Total: 3 MODULES, 3 SUBMODULES ✅  │
└─────────────────────────────────────┘
```

---

## Permission Map Structure

```
Permission Map Format:
{
  "module": {
    "submodule": true/false,
    "submodule:action": true/false
  }
}

Example for Sales Manager:
{
  "dashboard": {
    "view": true
  },
  "sales": {
    "leads": true,
    "leads:view": true,
    "leads:create": true,
    "opportunities": true,
    "opportunities:view": true,
    "quotations": true,
    "quotations:view": true,
    "quotations:create": true
  },
  "reports": {
    "salesReports": true,
    "salesReports:view": true,
    "salesReports:generate": true
  }
}
```

---

## Navigation Filtering Logic

```
┌─ All Available Nav Items
│  ├─ Dashboard        (permission: "dashboard:view")
│  ├─ Sales            (permission: "sales:view")
│  ├─ Inventory        (permission: "inventory:view")
│  ├─ Users            (permission: "users:view")
│  ├─ HRMS             (permission: "hrms:view")
│  ├─ Reports          (permission: "reports:view")
│  └─ Settings         (permission: "settings:view")
│
├─ Sales Manager Permissions
│  ├─ dashboard: view ✅
│  ├─ sales: leads, opportunities ✅
│  ├─ inventory: (none) ❌
│  ├─ users: (none) ❌
│  ├─ hrms: (none) ❌
│  ├─ reports: salesReports ✅
│  └─ settings: (none) ❌
│
└─ Filtered Result (Shown to User)
   ├─ ✅ Dashboard
   ├─ ✅ Sales
   │  ├─ Leads
   │  ├─ Opportunities
   │  └─ Quotations
   ├─ ✅ Reports
   │  └─ Sales Reports
   └─ ❌ Everything else hidden
```

---

## Database Query Flow

```
1. User logs in
   └─ Extract roleId from token: "sales_manager"

2. Query database
   SELECT permissions FROM roles 
   WHERE id = 'sales_manager'
   
   Result:
   {
     "sales:leads": true,
     "sales:opportunities": true,
     "reports:salesReports": true,
     "dashboard:view": true
   }

3. Transform to PermissionMap
   {
     "dashboard": { "view": true },
     "sales": { "leads": true, "opportunities": true },
     "reports": { "salesReports": true }
   }

4. Pass to frontend
   → filterNavItems(navConfig, permissionMap)
   → Only show items with matching permissions

5. Render dashboard with filtered modules
   ✅ Only allowed modules visible
   ❌ Restricted modules hidden
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│            FRONTEND FILTERING                       │
│  (Hide modules from UI)                             │
│  - Navigation items filtered                        │
│  - Routes hidden from sidebar                       │
│  - Improves UX                                      │
│  - NOT security (can be bypassed)                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            MIDDLEWARE PROTECTION                    │
│  (Check permission before loading page)             │
│  - Permission checked on page load                  │
│  - Redirect if not authorized                       │
│  - Prevents direct URL access                       │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│            API PROTECTION                           │
│  (Reject requests for restricted resources)         │
│  - Server-side permission check                     │
│  - 403 Forbidden response                           │
│  - Primary security layer                           │
└─────────────────────────────────────────────────────┘
```

---

## Summary

```
┌──────────────────────────────────────────────────────────────┐
│                  WHAT HAPPENS                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User Login ────► Get roleId ────► Query Permissions   │
│                                              │              │
│  2. Build PermissionMap                      │              │
│                                              │              │
│  3. Pass to Dashboard Client                 │              │
│                                              │              │
│  4. Filter Navigation Items                  │              │
│     - Sidebar updated                        │              │
│     - Sub-nav updated                        │              │
│                                              │              │
│  5. Render Dashboard                         ▼              │
│     - Only allowed modules shown             USER SEES      │
│     - Others hidden                          ↓              │
│                                         RELEVANT ONLY!      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

**Ready to use!** Users will now only see modules they have permission to access. 🎉
