# Permission System Quick Reference

## 🎯 At a Glance

**Total System Permissions**: ~450 unique keys  
**Admin Role Status**: ✅ All permissions assigned  
**Navigation Coverage**: 44/44 submodules (100%)  
**Modules Configured**: 14

---

## 📊 Permission Distribution

```
HRMS Module ............ 120+ permissions (Largest - covers 11 submodules)
Sales Module ........... 100+ permissions (11 submodules)
Store Module ............ 90+ permissions (12 submodules)
Inventory Module ........ 85+ permissions (11 submodules)
Other 10 Modules ........ 55+ permissions combined

Total ................... ~450+ unique permission keys
```

---

## 🔐 Permission Types by Frequency

### Most Common Patterns:
1. **View Permissions** (50+ keys)
   - `module:submodule:view` - Read/view access
   - Example: `sales:leads:view`, `inventory:products:view`

2. **Scope Permissions** (35+ keys)
   - `viewOwn`, `viewTeam`, `viewAll` - Control who sees what data
   - Example: `sales:leads:viewOwn`, `hrms:employees:viewAll`

3. **CRUD Operations** (80+ keys)
   - `create`, `edit`, `delete` - Modification permissions
   - Example: `sales:leads:create`, `store:bills:edit`

4. **Workflow Actions** (50+ keys)
   - `approve`, `process`, `assign`, `manage` - Business processes
   - Example: `sales:quotations:approve`, `hrms:payroll:process`

5. **Legacy Flat Keys** (100+ keys)
   - Simple names for backward compatibility
   - Example: `leads`, `inventory`, `manage`, `view`, `create`

6. **Module-Level Permissions** (20+ keys)
   - `viewAll`, `view`, `manage` at module level
   - Example: `users:viewAll`, `roles:manage`

---

## 🚀 Primary Use Cases by Module

### Sales (100+ permissions)
- Lead Management: view own/team/all, create, edit, delete, assign, export
- Opportunities: similar view scope + stage updates
- Quotations: full CRUD + approval + pricing
- Orders: create, edit, approve
- Customer Management: full CRUD
- Leaderboard & Reports: view + export
- Activities & Visits: log and track

### Inventory (85+ permissions)
- Product Master: full CRUD
- Stock Operations: goods inward/outward, transfers, counting
- Valuation Reports: view + export
- Specialized: QR code generation, AI catalog, factory/store specific
- Stock Metrics: dashboard widgets and alerts

### Store (90+ permissions)
- POS Operations: billing, transactions, payments
- Store Management: profiles, staff, shifts
- Receiving: goods receiving and approval
- Financial: debit notes, invoice formats
- Reporting: store-specific reports and comparisons
- Returns & Inventory: damage management, store-level stock

### HRMS (120+ permissions - Most Complex)
- Employees: directory, salary info, documents, export
- Payroll: processing, approval, payslip generation, formats
- Attendance: marking, shifts, leave management, reports
- Leaves: application, approval, policy management, balance tracking
- Performance: reviews, management, tracking
- Recruitment: job creation, candidate tracking, interviews, offers
- Settlement: employee separation, final settlement
- Compliance: regulatory requirements
- Announcements: company-wide communications

### Other Modules (55+ permissions)
- **Users**: Manage roles, deactivate, password reset
- **Roles & Permissions**: Full CRUD for role management
- **Dashboard**: View and manage dashboard
- **Reports**: Generate, schedule, export
- **Audit**: View logs, export audit trails
- **Admin**: System configuration and settings
- **Supply Chain**: Full management
- **Settings**: System and role settings

---

## 🔍 Permission Categories

### 1. **Navigation Permissions** (44 keys)
Required permissions for sidebar/menu visibility:
- 11 Sales submodules
- 11 Inventory submodules  
- 12 Store submodules
- 10 HRMS submodules

### 2. **Data Access Permissions** (100+ keys)
Control what data users can see:
- `viewOwn` - Only own records
- `viewTeam` - Own + team records
- `viewAll` - All organization records

### 3. **Operation Permissions** (150+ keys)
Control what users can do:
- `create` - Create new records
- `edit` - Modify existing records
- `delete` - Remove records
- `approve` - Approve workflows
- `export` - Export data
- `manage` - Full management

### 4. **Workflow Permissions** (60+ keys)
Control business process steps:
- `approve` - Approval authorities
- `process` - Process operations
- `assign` - Assign to others
- `schedule` - Schedule tasks
- `markDone` - Complete operations

### 5. **Legacy Permissions** (100+ keys)
Backward compatibility:
- Simple flat names: `manage`, `view`, `create`, `edit`, `delete`
- Module names: `leads`, `inventory`, `store`, `sales`, `hrms`

---

## ✅ Permission Assignment Status

### Admin Role
- **Status**: ✅ ALL permissions granted
- **Coverage**: 100% of 450+ keys
- **Navigation**: 44/44 submodules visible
- **Capability**: Full system access

### Custom Roles (Template)
Can be assigned selective permissions:
- Minimum viable: 1-5 permissions (limited access)
- Standard: 10-30 permissions (department access)
- Advanced: 50+ permissions (manager access)
- Full: All permissions (admin-like access)

---

## 🧪 How to Verify Permissions

### 1. Check Total Count
```bash
node check-permissions.js
# Output: All 44 required navigation permissions present (100%)
```

### 2. Verify Admin Role
```bash
# In Database → Roles → Administrator
# Should show: 450+ permissions assigned
```

### 3. Test Navigation
```
Frontend → Login as Admin → Dashboard
Should see all 44 submodules:
  - Sales: 11 items ✅
  - Inventory: 11 items ✅
  - Store: 12 items ✅
  - HRMS: 10 items ✅
```

### 4. Check Role Permissions
```
Settings → User Management → Roles → Administrator
View section shows all 450+ permission keys assigned
```

---

## 📋 Permission Assignment Rules

### For Admin Role
✅ **GRANT ALL** - Complete unrestricted access

### For Sales Manager Role
✅ **GRANT:**
- All sales:* permissions
- Sales dashboard visibility
- Sales reports
- Limited user management
❌ **DENY:**
- Inventory management
- HRMS operations
- System settings
- Role management

### For Store Manager Role
✅ **GRANT:**
- All store:* permissions
- Store inventory access
- POS operations
- Store reporting
❌ **DENY:**
- Sales operations
- HRMS access
- Supply chain
- User management

### For HR Manager Role
✅ **GRANT:**
- All hrms:* permissions
- HRMS reporting
- Attendance management
- Payroll access
❌ **DENY:**
- Sales management
- Inventory operations
- Store operations
- System settings

---

## 🎓 Key Learning Points

1. **Hierarchical Structure**
   - Module → Submodule → Action
   - Example: `sales` → `leads` → `view`

2. **Scope Control**
   - Own, Team, All
   - Prevents unauthorized data access

3. **Backward Compatibility**
   - New detailed format: `module:submodule:action`
   - Old flat format: `simple_name`
   - Both supported simultaneously

4. **Workflow Support**
   - Approval chains (approve permission)
   - Process steps (process permission)
   - Status tracking

5. **Complete Coverage**
   - Every UI element has permission
   - Every API endpoint protected
   - Every database operation controlled

---

## 📝 Common Permission Patterns

### View-Only Role
```
permissions: {
  'sales:dashboard:view': true,
  'inventory:overview:view': true,
  'reports:view': true,
  // Only view permissions, no create/edit/delete
}
```

### Department Manager
```
permissions: {
  'sales:*:view': true,
  'sales:leads:create': true,
  'sales:leads:edit': true,
  'sales:reports:view': true,
  'sales:leaderboard:view': true,
  // Can view everything and edit specific things
}
```

### System Administrator
```
permissions: {
  // All permissions
  admin: true,
  // Can do anything
}
```

---

## 🔄 Permission Flow

1. **User Login** → Session created with user's roles
2. **Role Lookup** → Administrator role fetched
3. **Permission Map** → All 450+ permissions loaded into memory
4. **Navigation Filter** → Sidebar items filtered based on permission keys
5. **API Protection** → Each endpoint checks for required permission
6. **UI Display** → Only permitted features shown/enabled

---

## 📞 Support & Troubleshooting

### Permission Not Visible?
1. Verify permission key exists in rbac.ts
2. Check role has permission assigned
3. Clear browser cache
4. Restart dev server

### Can't Access Feature?
1. Check if permission key matches exactly
2. Verify role is assigned to user
3. Check for permission key typos
4. Test with admin account first

### Adding New Permission?
1. Add key to appropriate module in rbac.ts
2. Add to admin role
3. Add to navigation config if it's a nav item
4. Rebuild and test

---

## Summary

The Arcus permission system is **enterprise-grade** with:
- ✅ 450+ unique permission keys
- ✅ 14 modules fully configured
- ✅ Granular control at every level
- ✅ Complete admin access
- ✅ Flexible custom role support
- ✅ Backward compatibility
- ✅ 100% navigation coverage (44/44)
