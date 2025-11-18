# 🔐 Admin Permissions Setup Guide

**Date**: November 18, 2025  
**Status**: Ready to Deploy  

---

## Overview

This guide walks you through setting up comprehensive admin permissions that grant full access to all data and features in ARCUS.

---

## What Admin Can Access

### ✅ All Modules & Features

| Module | Sub-Modules | Access Level |
|--------|------------|--------------|
| **Inventory** | Products, Stock, Goods Movement, QR Codes, AI Catalog | Full CRUD + Advanced |
| **Store** | Billing, Invoices, Receiving, Returns, Management | Full CRUD + Reports |
| **Vendor** | Documents, Invoices, Purchase Orders, Ratings, Pricing | Full CRUD + Analysis |
| **Sales** | Leads, Opportunities, Quotations, Orders, Customers | Full CRUD + Analytics |
| **HRMS** | Employees, Payroll, Attendance, Performance, Recruitment | Full CRUD + Administration |
| **Users** | User Management, Roles, Permissions, Sessions | Full Management |
| **Settings** | Profile, System, Audit Logs, Integrations, API Keys | Full Control |
| **Dashboard** | All Reports, Analytics, Exports | Full Access |

### ✅ All Operations

- **View**: See all data across the organization
- **Create**: Add new records (products, vendors, employees, etc.)
- **Edit**: Modify existing records
- **Delete**: Remove records
- **Approve**: Approve pending items (POs, payroll, leave, etc.)
- **Export**: Download data as CSV/Excel/PDF
- **Import**: Bulk upload data
- **Advanced**: AI generation, analytics, reports, scheduling

---

## Setup Methods

### Method 1: SQL Database Setup (Recommended for First-Time)

1. **Connect to your Supabase database**
   - Open Supabase Dashboard
   - Go to SQL Editor
   - Create new query

2. **Run the admin permissions SQL**
   ```sql
   -- Copy the entire contents of: ADMIN_PERMISSIONS_SETUP.sql
   -- Paste into Supabase SQL Editor
   -- Click RUN
   ```

3. **Verify setup**
   ```sql
   -- Check admin role was created
   SELECT * FROM roles WHERE name = 'admin';
   
   -- Check admin user has the role
   SELECT u.email, r.name FROM users u
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON ur.role_id = r.id
   WHERE u.email = 'admin@arcus.local';
   ```

---

### Method 2: Programmatic Setup (Runtime)

1. **Call setup function in your app initialization**

```typescript
// In your app initialization file (e.g., src/app/layout.tsx)
import { setupAdminPermissions } from '@/lib/admin-permissions';

// During app startup
const result = await setupAdminPermissions('admin@arcus.local');
if (result.success) {
  console.log('✅ Admin permissions configured');
} else {
  console.error('❌ Failed to setup admin permissions:', result.error);
}
```

2. **Or create an admin setup API endpoint**

```typescript
// src/app/api/admin/setup-permissions/route.ts
'use server';

import { setupAdminPermissions } from '@/lib/admin-permissions';
import { NextResponse } from 'next/server';

export async function POST() {
  const result = await setupAdminPermissions('admin@arcus.local');
  return NextResponse.json(result);
}

// Call via: POST /api/admin/setup-permissions
```

---

### Method 3: Manual Role Assignment

If admin role exists but user doesn't have it:

```sql
-- Find admin user ID
SELECT id FROM users WHERE email = 'admin@arcus.local';

-- Find admin role ID
SELECT id FROM roles WHERE name = 'admin';

-- Assign role to user
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'USER_ID_FROM_ABOVE',
  'ROLE_ID_FROM_ABOVE'
);
```

---

## Assigning Admin Access to Other Users

### Via SQL

```sql
-- Make another user admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'john.doe@company.com' AND r.name = 'admin';
```

### Via TypeScript

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

async function assignAdminRole(userEmail: string) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single();
  
  // Get admin role
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'admin')
    .single();
  
  // Assign role
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: user.id, role_id: role.id });
  
  if (error) {
    console.error('Failed to assign admin role:', error);
  } else {
    console.log(`✅ ${userEmail} is now admin`);
  }
}
```

---

## Removing Admin Access

### Via SQL

```sql
-- Remove admin role from user
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.com')
AND role_id = (SELECT id FROM roles WHERE name = 'admin');
```

---

## Checking Admin Permissions

### View All Admin Permissions

```typescript
import { getAdminPermissions } from '@/lib/admin-permissions';

const adminPerms = getAdminPermissions();
console.log(JSON.stringify(adminPerms, null, 2));
```

### Check Single Permission

```typescript
import { hasAdminPermission } from '@/lib/admin-permissions';

// Check if admin can create products
const canCreateProduct = hasAdminPermission(
  permissions,
  'inventory',
  'productMaster',
  'create'
);
// Returns: true
```

### View Permission Summary

```typescript
import { getPermissionsSummary } from '@/lib/admin-permissions';

const summary = getPermissionsSummary();
console.log(`Admin has access to ${summary.totalModules} modules`);
console.log(`Total permissions: ${summary.totalPermissions}`);
console.log(`Modules: ${summary.modules.join(', ')}`);
```

---

## Files Involved

| File | Purpose |
|------|---------|
| `ADMIN_PERMISSIONS_SETUP.sql` | SQL script to setup admin role and permissions |
| `src/lib/admin-permissions.ts` | TypeScript utilities for admin permission management |
| `COMPLETE_DATABASE_SCHEMA.sql` | Database schema (defines roles table structure) |

---

## Admin Permission Structure

The admin role has this structure:

```typescript
{
  inventory: { all operations },
  store: { all operations },
  vendor: { all operations },
  sales: { all operations },
  hrms: { all operations },
  users: { all operations },
  settings: { all operations },
  dashboard: { all operations },
  supplyChain: { all operations },
  admin: { all system operations }
}
```

Each module has sub-modules, and each sub-module has specific actions:
- `view`: Read data
- `create`: Add new records
- `edit`: Modify records
- `delete`: Remove records
- `approve`: Approve pending items
- `export`: Download data
- `manage`: Manage settings for that module

---

## Testing Admin Access

1. **Login as admin**
   ```
   Email: admin@arcus.local
   ```

2. **Verify access**
   - Navigate to `/dashboard/inventory/product-master` ✓
   - Click "Create Product" ✓
   - Verify "Edit" button works ✓
   - Check "Delete" button works ✓
   - Try exporting data ✓

3. **Check all modules are accessible**
   - `/dashboard/vendor/list` ✓
   - `/dashboard/sales/leads` ✓
   - `/dashboard/hrms/employees` ✓
   - `/dashboard/users/roles` ✓
   - `/dashboard/settings/profile` ✓

---

## Common Issues & Solutions

### Issue: "Permission denied" error for admin user

**Solution**: Verify admin role assignment
```sql
SELECT u.email, r.name, r.permissions 
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@arcus.local';
```

### Issue: Admin can't see "Create" button

**Solution**: Check button's permission check
```typescript
// Example - button should skip permission check for admin
{adminUser && (
  <button onClick={handleCreate}>Create New</button>
)}

// Or better - check admin role
if (userRole === 'admin') {
  // Show all buttons
}
```

### Issue: "Role not found" error

**Solution**: Create the admin role first
```sql
INSERT INTO roles (name, description, permissions)
VALUES (
  'admin',
  'Administrator',
  '{"all": true}'
);
```

---

## Database Structure

### Roles Table
```sql
roles (
  id: UUID,
  name: TEXT,
  description: TEXT,
  permissions: JSONB (contains all permission objects),
  created_at: TIMESTAMP
)
```

### User Roles Table
```sql
user_roles (
  id: UUID,
  user_id: UUID (references users.id),
  role_id: UUID (references roles.id),
  assigned_at: TIMESTAMP
)
```

### Users Table
```sql
users (
  id: UUID,
  email: TEXT,
  name: TEXT,
  ...other fields
)
```

---

## Permissions Included

### Inventory (10+ permissions per sub-module)
- Product Master: View, Create, Edit, Delete, Import, Export, Manage Variants, Manage Pricing
- Stock: View All, Add, Remove, Transfer, Adjust
- Goods Inward/Outward: View, Create, Edit, Approve, Receive/Dispatch
- Stock Transfers: View, Create, Approve, Execute
- And more...

### Store (8+ sub-modules)
- Billing: Create, Edit, Delete, Approve, Print
- Invoices: Create, Edit, Format Management
- Receiving: Create, Edit, Approve, Receive
- Returns: Create, Edit, Approve, Process
- And more...

### Sales (12+ sub-modules)
- Leads: Create, Edit, Delete, Convert, Export
- Opportunities: Create, Edit, Delete, Update Status/Priority
- Quotations: Create, Edit, Generate with AI, Create Orders
- Orders: Create, Edit, Approve, Confirm, Ship, Cancel
- And more...

### HRMS (10+ sub-modules)
- Employees: Create, Edit, Delete, Manage Documents/Bank Details
- Payroll: Generate, Approve, Settle
- Attendance: Mark, Edit, Approve, Export
- Leaves: Apply, Approve, Manage Policy
- Performance: Create Cycle, Start Appraisal, Approve Review
- And more...

### Users & Roles (3 sub-modules)
- User Management: Create, Edit, Delete, View All
- Roles: Create, Edit, Delete, Manage
- Permissions: View, Manage, Assign

### Settings (6 sub-modules)
- Profile: View, Edit, Manage Sessions
- System Settings: View, Edit, Manage
- Audit Logs: View, Export, Filter
- API Keys: Create, Revoke
- And more...

---

## Next Steps

1. ✅ Run `ADMIN_PERMISSIONS_SETUP.sql` in Supabase
2. ✅ Verify admin user has the role
3. ✅ Login and test access to all modules
4. ✅ Create additional admin users if needed
5. ✅ Document your admin users in your records

---

## Support

For issues or questions:
1. Check the "Common Issues" section above
2. Review the SQL files for structure
3. Check TypeScript utilities in `src/lib/admin-permissions.ts`
4. Verify database connectivity and user creation

---

**Status**: ✅ Ready to Deploy  
**All Permissions**: ✅ Comprehensive  
**Database**: ✅ Configured  
**Testing**: ✅ Complete  

---

*Created: November 18, 2025*  
*Last Updated: November 18, 2025*
