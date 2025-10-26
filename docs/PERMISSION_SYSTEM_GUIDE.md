# Permission System Implementation Guide

## Overview

This document describes the **permission system** for the Arcus SaaS platform. The system uses **Permify** for policy evaluation, with a control-plane database tracking sessions, user mappings, and policy sync logs.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js App)                                          │
│  • usePermission() hook                                         │
│  • PermissionGuard component                                   │
│  • Permission checks before UI render                          │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ API Routes (Next.js Backend)                                    │
│  • /api/auth/check-permission (POST)                           │
│  • /api/auth/validate (GET)                                    │
│  • /api/*/[resource] routes (with middleware)                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────┐
             ▼                                          ▼
    ┌────────────────┐                        ┌─────────────────┐
    │ Control-Plane  │                        │  Permify        │
    │ PostgreSQL     │                        │  Policy Engine  │
    │                │                        │                 │
    │ • sessions     │                        │ • 230 perms     │
    │ • user_mapping │◄───────────────────────►│ • 9 roles       │
    │ • policy logs  │ read/write/sync         │ • PSL schema    │
    └────────────────┘                        └─────────────────┘
```

## Components

### 1. Permify Schema (`src/policy/schema.perm`)

**Permify Schema Language (PSL)** defines the policy model:

```perm
entity organization {
  relation owner: user
  relation member: user
}

entity lead {
  relation owner: user
  relation assigned_to: user
}

permission view_lead = owner | assigned_to
permission edit_lead = owner
permission delete_lead = owner
```

**Key modules (230 permissions total):**
- Dashboard (24 permissions)
- Sales (24 permissions)
- Inventory (24 permissions)
- ... 6 more modules

See `src/policy/roles.json` for full role-to-permission mapping.

### 2. Control-Plane Database

Located in **PostgreSQL** (shared across all tenants):

#### `sessions` Table
Tracks JWT validity for revocation:
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  jti VARCHAR UNIQUE,           -- JWT ID claim (for revocation)
  user_id VARCHAR,              -- Supabase user ID
  tenant_id VARCHAR,            -- Tenant ID
  expires_at TIMESTAMP,         -- JWT expiration
  revoked BOOLEAN DEFAULT FALSE -- Revocation flag
);
```

**Usage:** When a JWT is issued, store `jti` in `sessions`. To revoke: delete or set `revoked=true`.

#### `tenant_metadata` Table
Per-tenant configuration:
```sql
CREATE TABLE tenant_metadata (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR UNIQUE,
  database_url VARCHAR,         -- Per-tenant PostgreSQL URL
  provisioning_status VARCHAR,  -- pending/provisioning/ready/failed
  database_region VARCHAR,
  migrations_applied BOOLEAN
);
```

#### `user_mappings` Table
Link Supabase Auth to tenants:
```sql
CREATE TABLE user_mappings (
  id UUID PRIMARY KEY,
  supabase_user_id VARCHAR,
  tenant_id VARCHAR,
  role VARCHAR,                 -- Admin, Sales Manager, etc.
  email VARCHAR,
  department VARCHAR,
  permissions_snapshot JSONB,   -- Cached permissions
  is_active BOOLEAN
);
```

#### `policy_sync_logs` Table
Audit trail for Permify syncs:
```sql
CREATE TABLE policy_sync_logs (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR,
  sync_status VARCHAR,          -- success/error/denied
  payload TEXT,                 -- Request sent to Permify
  response JSONB,               -- Response from Permify
  error_message TEXT,
  duration_ms INT,
  triggered_by VARCHAR,
  sync_type VARCHAR             -- check/schema_sync
);
```

### 3. Core Libraries

#### `permifyClient.ts`
Low-level Permify API client:

```typescript
import { checkPermify, schemaSync } from '@/lib/permifyClient';

// Check permission
const allowed = await checkPermify({
  principal: 'user-123',
  action: 'edit',
  resource: 'lead:lead-456',
  tenant_id: 'tenant-abc'
});

// Sync schema
const synced = await schemaSync('tenant-abc', pslSchema);
```

#### `policyAdapter.ts`
High-level policy management:

```typescript
import { evaluatePolicy, syncPolicies, getRolePermissions } from '@/lib/policyAdapter';

// Evaluate with caching
const allowed = await evaluatePolicy({
  principal: 'user-123',
  action: 'view',
  resource: 'lead',
  tenant_id: 'tenant-abc'
});

// Sync all roles to Permify
await syncPolicies('tenant-abc');

// Get role permissions
const perms = await getRolePermissions('Sales Manager');
```

#### `auth-middleware.ts`
API route helpers:

```typescript
import { checkAuth, checkPermission, forbidden } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  // Authenticate
  const user = await checkAuth(req);
  if (!user) return unauthorized();

  // Check permission
  const allowed = await checkPermission(
    user.uid,
    'edit',
    'lead',
    'lead-123',
    user.tenant_id
  );
  if (!allowed) return forbidden();

  // Process request...
}
```

### 4. Frontend Hooks

#### `usePermission(action, resource, resourceId?)`

```typescript
'use client';
import { usePermission } from '@/hooks/usePermission';

export function EditLeadButton({ leadId }) {
  const { allowed, loading, error } = usePermission('edit', 'lead', leadId);

  if (loading) return <Spinner />;
  if (!allowed) return null;
  return <button onClick={() => editLead(leadId)}>Edit</button>;
}
```

Returns:
```typescript
{
  allowed: boolean | null,  // null while loading
  loading: boolean,
  error: string | null
}
```

### 5. Components

#### `<PermissionGuard>`
Conditionally render based on permission:

```tsx
<PermissionGuard action="edit" resource="lead" resourceId={leadId}>
  <EditForm />
</PermissionGuard>
```

#### `<PermissionButton>`
Disable button if no permission:

```tsx
<PermissionButton action="delete" resource="lead" resourceId={leadId}>
  Delete Lead
</PermissionButton>
```

#### `<PermissionHint>`
Show tooltip on hover:

```tsx
<PermissionHint action="approve" resource="lead" resourceId={leadId}>
  <button>Approve</button>
</PermissionHint>
```

## Usage Examples

### 1. Check Permission in API Route

```typescript
// src/app/api/leads/[id]/route.ts
import { checkAuth, checkPermission, forbidden } from '@/lib/auth-middleware';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await checkAuth(req);
  if (!user) return unauthorized();

  // Check edit permission
  const canEdit = await checkPermission(
    user.uid,
    'edit',
    'lead',
    params.id,
    user.tenant_id
  );
  if (!canEdit) return forbidden();

  // Update lead...
}
```

### 2. Check Permission in React Component

```typescript
// src/components/LeadDetail.tsx
'use client';
import { PermissionGuard, PermissionButton } from '@/components/feature/PermissionGuard';

export function LeadDetail({ lead }) {
  return (
    <div>
      <h1>{lead.name}</h1>

      <PermissionGuard action="view" resource="lead_details" resourceId={lead.id}>
        <div>{lead.details}</div>
      </PermissionGuard>

      <PermissionButton action="edit" resource="lead" resourceId={lead.id}>
        Edit Lead
      </PermissionButton>

      <PermissionButton action="delete" resource="lead" resourceId={lead.id}>
        Delete Lead
      </PermissionButton>
    </div>
  );
}
```

### 3. API Request from Frontend

```typescript
// Call permission check before action
const response = await fetch('/api/auth/check-permission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'delete',
    resource: 'lead',
    resource_id: 'lead-123'
  })
});

const { allowed } = await response.json();
if (!allowed) {
  toast.error('You do not have permission to delete this lead');
  return;
}

// Proceed with deletion...
```

## Workflows

### Sync Policies to Permify

When role definitions change, sync to Permify:

```bash
# Load roles from src/policy/roles.json and schema from src/policy/schema.perm
pnpm run sync:policies

# Or with custom Permify URL
pnpm run sync:policies --permify-url http://permify:3001 --api-key xyz123
```

Script: `scripts/sync-policies.mjs`

### Seed Control Plane

Initialize demo tenant and users:

```bash
pnpm run seed:control-plane

# Clear and reseed
pnpm run seed:control-plane --clear --demo
```

Script: `scripts/seed-control-plane.mjs`

### Add New Permission

1. **Update schema** (`src/policy/schema.perm`):
   ```perm
   permission new_action = organization#owner
   ```

2. **Update roles** (`src/policy/roles.json`):
   ```json
   {
     "Admin": {
       "permissions": ["dashboard_view", "...", "new_action"]
     }
   }
   ```

3. **Sync** (`pnpm run sync:policies`)

### Revoke User Session

Delete from control-plane to revoke JWT:

```typescript
import { getControlRepo } from '@/lib/controlDataSource';
import { Session } from '@/entities/control/session.entity';

const sessionRepo = await getControlRepo(Session);
await sessionRepo.delete({ jti: 'jwt-id-from-claim' });
```

## Configuration

### Environment Variables

```bash
# Policy Engine (mock | permify)
POLICY_ENGINE=permify

# Permify API (Required for permify mode)
PERMIFY_URL=http://localhost:3001
PERMIFY_API_KEY=your-api-key

# Control-Plane Database
DATABASE_URL=postgresql://user:pass@host:5432/control_db
```

### Permify Setup (Local Dev)

```bash
# Start Permify locally
docker run -d -p 3001:3001 \
  -e PERMIFY_LOG_LEVEL=info \
  permifyco/permify

# Test health
curl http://localhost:3001/health
```

## Testing

### Unit Tests

```bash
pnpm test src/lib/policyAdapter.test.ts
```

### Integration Tests

```bash
# Test permission checks end-to-end
pnpm test src/tests/permission-integration.test.ts
```

### Manual Testing

```typescript
// Interactive check
const allowed = await evaluatePolicy({
  principal: 'user-123',
  action: 'edit',
  resource: 'lead:lead-456'
});
console.log('Allowed?', allowed);
```

## Troubleshooting

### Permission denied even though should allow

1. Check user role: `SELECT * FROM user_mappings WHERE supabase_user_id = 'user-id'`
2. Check policy log: `SELECT * FROM policy_sync_logs ORDER BY created_at DESC LIMIT 10`
3. Verify Permify schema: `curl http://permify:3001/schemas`
4. Resync policies: `pnpm run sync:policies`

### Permify connection error

1. Check Permify is running: `docker ps | grep permify`
2. Test connectivity: `curl http://PERMIFY_URL/health`
3. Verify API key: `echo $PERMIFY_API_KEY`
4. Check logs: `docker logs permify-container`

### Session not revoked after deletion

1. Verify session deleted: `SELECT COUNT(*) FROM sessions WHERE jti = 'xxx'`
2. Check middleware checks jti: `grep -r "revoked" src/lib/`
3. Clear frontend cache: Check browser dev tools

## Performance

- **Permission checks cached** for 1 minute (LRU cache)
- **Policy sync logs** archived after 30 days
- **Session table** indexes on (jti, tenant_id, expires_at)
- **Bulk permission checks** supported via `/api/auth/check-permission`

## Security

- ✅ All API routes require authentication
- ✅ Permission checks fail closed (deny if Permify unreachable)
- ✅ JWT revocation via session delete (jti not reused)
- ✅ Role-based access control (RBAC) + Permify policy engine
- ✅ Policy sync logged for audit trail
- ✅ TLS required in production (env: NODE_ENV=production)

## Roadmap

- [ ] Resource-level access control (coming in Sprint 2)
- [ ] Attribute-based access control (ABAC) (Sprint 2)
- [ ] Bulk permission sync (Sprint 2)
- [ ] Permission delegation (Sprint 3)
- [ ] Time-based access (Sprint 3)

## References

- **Permify Docs**: https://docs.permify.co
- **PSL Guide**: https://docs.permify.co/docs/schema
- **Playground**: https://playground.permify.co
- **Local Setup**: See `docs/PERMISSION_SYSTEM_DOCUMENTATION.md`
