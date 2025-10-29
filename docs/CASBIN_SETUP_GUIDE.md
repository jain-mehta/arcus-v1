# Casbin RBAC Integration Guide

## Overview

This platform now uses **Casbin** for Role-Based Access Control (RBAC) instead of Permify. Casbin provides:

- ✅ **Multi-tenant isolation** via domains (`org:{organizationId}`)
- ✅ **Flexible permission model** (wildcard support, regex matching)
- ✅ **Role hierarchy** with inheritance
- ✅ **Customizable permissions** via Admin UI
- ✅ **Audit logging** for all permission checks
- ✅ **PostgreSQL storage** via TypeORM adapter

---

## Architecture

### Permission Format

Permissions follow this structure:

```
subject, domain, object, action, effect
```

**Example:**
```
role:sales_manager, org:org123, sales:leads, view, allow
user:user456, org:org123, store:pos, *, allow
```

### Components

- **Subject**: `role:{roleId}` or `user:{userId}`
- **Domain**: `org:{organizationId}` (for multi-tenancy)
- **Object**: `module:submodule` (e.g., `sales:leads`, `store:pos:access`)
- **Action**: `view`, `create`, `edit`, `delete`, `*` (wildcard)
- **Effect**: `allow` or `deny`

### Wildcard Support

The matcher supports wildcards and regex:

```typescript
// Allow all actions on sales module
"sales:*", "*", "allow"

// Allow specific pattern
"store:pos:*", "view", "allow"
```

---

## File Structure

```
src/lib/
├── casbinClient.ts              # Core Casbin client (500+ lines)
├── policyAdapterCasbin.ts       # High-level policy management
├── rbac.ts                      # Updated to use Casbin
└── ...

casbin_model.conf                # Casbin model definition

scripts/
└── seed-casbin-policies.ts      # Initialize default roles/permissions

src/app/api/admin/
├── policies/route.ts            # API: Manage policies
└── user-roles/route.ts          # API: Assign/revoke roles
```

---

## Setup Instructions

### 1. Database Setup

Casbin stores policies in PostgreSQL. Ensure the database is running:

```bash
npm run start-control
```

The Casbin tables will be auto-created on first initialization.

### 2. Seed Default Policies

Initialize an organization with default roles:

```bash
npm run seed:casbin org123
```

This creates:
- **17 default roles** (admin, sales_manager, sales_executive, etc.)
- **400+ permissions** covering all 14 modules
- **Hierarchical structure** with role inheritance

### 3. Verify Installation

Check that Casbin is initialized:

```typescript
import { initCasbin, checkCasbin } from '@/lib/casbinClient';

await initCasbin();
const allowed = await checkCasbin({
  userId: 'user123',
  organizationId: 'org123',
  resource: 'sales:leads',
  action: 'view'
});
console.log('Permission:', allowed); // true or false
```

---

## Usage Examples

### Check Permission in API Route

```typescript
import { getSessionClaims } from '@/lib/session';
import { assertPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const userClaims = await getSessionClaims();
  
  // Throws 403 error if no permission
  await assertPermission(userClaims, 'sales', 'leads', 'view');
  
  // Continue with authorized logic
  return NextResponse.json({ data: 'sensitive data' });
}
```

### Assign Role to User

```typescript
import { assignUserRole } from '@/lib/policyAdapterCasbin';

await assignUserRole('user123', 'sales_manager', 'org123');
```

### Add Custom Permission

```typescript
import { addPolicy } from '@/lib/casbinClient';

await addPolicy({
  subject: 'role:custom_role',
  organizationId: 'org123',
  resource: 'custom:module',
  action: '*',
  effect: 'allow'
});
```

### Get User Permissions

```typescript
import { getUserPermissions } from '@/lib/policyAdapterCasbin';

const permissions = await getUserPermissions('user123', 'org123');
console.log(`User has ${permissions.length} permissions`);
```

---

## API Endpoints

### Policy Management

**Add Policy**
```http
POST /api/admin/policies
Content-Type: application/json

{
  "subject": "role:sales_manager",
  "organizationId": "org123",
  "resource": "sales:leads",
  "action": "create",
  "effect": "allow"
}
```

**Remove Policy**
```http
DELETE /api/admin/policies
Content-Type: application/json

{
  "subject": "role:sales_manager",
  "organizationId": "org123",
  "resource": "sales:leads",
  "action": "create"
}
```

**List Policies**
```http
GET /api/admin/policies?organizationId=org123
```

### User-Role Management

**Assign Role**
```http
POST /api/admin/user-roles
Content-Type: application/json

{
  "userId": "user123",
  "roleId": "sales_manager",
  "organizationId": "org123"
}
```

**Revoke Role**
```http
DELETE /api/admin/user-roles
Content-Type: application/json

{
  "userId": "user123",
  "roleId": "sales_manager",
  "organizationId": "org123"
}
```

**Get User Roles & Permissions**
```http
GET /api/admin/user-roles?userId=user123&organizationId=org123
```

---

## Default Roles

The seed script creates these roles:

| Role | Description | Permission Count |
|------|-------------|------------------|
| `admin` | Full system access | 1 (wildcard: *:*) |
| `sales_manager` | Full sales module access | 10 |
| `sales_executive` | Limited sales access | 11 |
| `store_manager` | Full store/POS access | 13 |
| `store_supervisor` | Limited store access | 7 |
| `inventory_manager` | Full inventory access | 9 |
| `inventory_clerk` | Limited inventory access | 5 |
| `vendor_manager` | Vendor management | 8 |
| `accountant` | Finance/accounting | 11 |
| `finance_manager` | Full finance access | 6 |
| `hr_manager` | Full HRMS access | 7 |
| `hr_executive` | Limited HR access | 10 |
| `project_manager` | Project management | 8 |
| `team_member` | Basic project access | 4 |
| `analyst` | Reports & analytics | 9 |
| `viewer` | Dashboard only | 1 |
| `employee` | Self-service HR | 5 |

---

## Migration from Permify

### Old Code (Permify)
```typescript
import { checkPermify } from '@/lib/permifyClient';

const allowed = await checkPermify({
  userId: 'user123',
  permission: 'sales:leads:view',
  organizationId: 'org123'
});
```

### New Code (Casbin)
```typescript
import { checkCasbin } from '@/lib/casbinClient';

const allowed = await checkCasbin({
  userId: 'user123',
  organizationId: 'org123',
  resource: 'sales:leads',
  action: 'view'
});
```

### Migration Script

A migration script is planned to:
1. Export existing Permify policies
2. Transform to Casbin format
3. Import into Casbin
4. Validate equivalence

---

## Admin UI (Planned)

The admin interface will provide:

- **Role Management**: Create, edit, delete custom roles
- **Permission Editor**: Visual permission assignment
- **User Management**: Assign roles to users
- **Permission Testing**: Preview user permissions
- **Audit Logs**: View permission check history

---

## Performance Considerations

### Caching

Casbin enforcer is cached in memory. Policies are auto-saved to PostgreSQL.

### Batch Checks

Use `batchCheck()` for multiple permissions:

```typescript
import { batchCheck } from '@/lib/casbinClient';

const requests = [
  { userId, organizationId, resource: 'sales:leads', action: 'view' },
  { userId, organizationId, resource: 'sales:quotations', action: 'create' },
];

const results = await batchCheck(requests);
// Returns: [true, false, ...]
```

### Audit Logging

All permission checks are logged to `PolicySyncLog` entity:

```typescript
{
  userId: 'user123',
  action: 'check_permission',
  resource: 'sales:leads:view',
  organizationId: 'org123',
  timestamp: '2024-01-15T10:30:00Z',
  status: 'success',
  metadata: { allowed: true }
}
```

---

## Troubleshooting

### Casbin Not Initializing

Check PostgreSQL connection:
```bash
npm run start-control
```

### Permission Denied Unexpectedly

1. Check user's roles:
   ```http
   GET /api/admin/user-roles?userId=xxx&organizationId=yyy
   ```

2. Check role permissions:
   ```http
   GET /api/admin/policies?organizationId=yyy
   ```

3. Check audit logs in database:
   ```sql
   SELECT * FROM policy_sync_log 
   WHERE user_id = 'user123' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

### Admin Bypass for Testing

Admin users (by email or role) always pass permission checks:

```typescript
// In rbac.ts
const adminEmails = ['admin@arcus.local'];
if (userClaims.email && adminEmails.includes(userClaims.email)) {
  return true; // Bypass all checks
}
```

---

## Security Best Practices

1. **Principle of Least Privilege**: Assign minimal necessary permissions
2. **Regular Audits**: Review `PolicySyncLog` for unusual patterns
3. **Role Separation**: Use specific roles instead of admin for daily tasks
4. **Testing**: Always test permission changes in staging first
5. **Backup Policies**: Use `exportPolicies()` for backup before major changes

---

## Next Steps

1. ✅ Casbin installed and configured
2. ✅ Default roles seeded
3. ✅ API endpoints created
4. ⏳ Build admin UI for permission management
5. ⏳ Write integration tests
6. ⏳ Create migration script from Permify
7. ⏳ Update all API routes to use Casbin
8. ⏳ Performance testing and optimization

---

## Support

For questions or issues:
- Check console logs for detailed permission check traces
- Review `casbin_model.conf` for matcher logic
- Test permissions using `/api/admin/user-roles` endpoint
- Consult Casbin docs: https://casbin.org/docs/overview
