# Permission System Quick Start

Get up and running with permissions in **5 minutes**.

## 1. Start Permify (Local Dev)

```bash
# Using Docker
docker run -d -p 3001:3001 permifyco/permify

# Verify running
curl http://localhost:3001/health
```

## 2. Set Environment Variables

```bash
cp .env.template .env.local

# Edit .env.local
POLICY_ENGINE=permify
PERMIFY_URL=http://localhost:3001
PERMIFY_API_KEY=your-dev-key  # Get from Permify docs
```

## 3. Initialize Control-Plane Database

```bash
# Seed demo data
pnpm run seed:control-plane

# Verify
psql -d control_db -c "SELECT COUNT(*) FROM user_mappings;"
```

## 4. Sync Policies to Permify

```bash
pnpm run sync:policies

# Output should show:
# 📋 Syncing policies for tenant default...
# 📤 Uploading schema to Permify...
# ✅ Schema synced
# 📌 Creating 9 role relations...
```

## 5. Use in Components

### Check Permission (Hook)

```typescript
'use client';
import { usePermission } from '@/hooks/usePermission';

export function EditButton({ leadId }) {
  const { allowed, loading } = usePermission('edit', 'lead', leadId);

  if (loading) return <Spinner />;
  if (!allowed) return <span>No permission</span>;

  return <button onClick={handleEdit}>Edit</button>;
}
```

### Check Permission (API)

```typescript
import { checkAuth, checkPermission } from '@/lib/auth-middleware';

export async function PATCH(req, { params }) {
  const user = await checkAuth(req);
  if (!user) return unauthorized();

  const canEdit = await checkPermission(user.uid, 'edit', 'lead', params.id);
  if (!canEdit) return forbidden();

  // Process request...
}
```

### Guard Component

```tsx
import { PermissionGuard } from '@/components/feature/PermissionGuard';

<PermissionGuard action="edit" resource="lead" resourceId={leadId}>
  <EditForm />
</PermissionGuard>
```

## 6. Test It

Check permission in browser console:

```typescript
const res = await fetch('/api/auth/check-permission', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'edit',
    resource: 'lead',
    resource_id: 'lead-123'
  })
});

const data = await res.json();
console.log('Allowed?', data.allowed);
```

## 7. Add New Permission

1. Edit `src/policy/schema.perm`:
   ```perm
   permission new_action = organization#owner
   ```

2. Edit `src/policy/roles.json` (add to roles):
   ```json
   "Admin": { "permissions": ["...", "new_action"] }
   ```

3. Sync:
   ```bash
   pnpm run sync:policies
   ```

## Mode: Mock (No Permify)

For local development **without Permify**:

```bash
POLICY_ENGINE=mock
```

Mock mode:
- ✅ Allows all GET requests
- ✅ Allows all `test-*` principals
- ✅ Allows `admin` principal
- ❌ Denies everything else

## Cheat Sheet

| Task | Command |
|------|---------|
| Start Permify | `docker run -p 3001:3001 permifyco/permify` |
| Seed demo data | `pnpm run seed:control-plane` |
| Sync policies | `pnpm run sync:policies` |
| Test in console | `await fetch('/api/auth/check-permission', ...)` |
| View policy logs | `psql -d control_db -c "SELECT * FROM policy_sync_logs LIMIT 10;"` |
| Revoke session | `DELETE FROM sessions WHERE jti = 'xxx'` |

## Troubleshooting

**"Permify connection error"**
- Verify Permify running: `docker ps | grep permify`
- Test: `curl http://localhost:3001/health`

**"Permission always denied"**
- Check user role: `SELECT role FROM user_mappings WHERE supabase_user_id = 'user-id'`
- Check role has permission: `cat src/policy/roles.json | grep -A 5 'Sales Manager'`
- Resync: `pnpm run sync:policies`

**"usePermission returns null forever"**
- Check `/api/auth/check-permission` route responds
- Check user is authenticated (JWT in cookie/header)
- Check browser console for errors

## Next Steps

- Read full guide: `docs/PERMISSION_SYSTEM_GUIDE.md`
- See examples: `src/components/feature/PermissionGuard.tsx`
- View tests: `src/tests/permission-integration.test.ts`
- Check schema: `src/policy/schema.perm`
