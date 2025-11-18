# 🔄 Migrating Local Data to MVP Structure

## Overview

Your local environment has test users with `.local` domains, but the MVP production version uses proper email addresses. Follow this guide to align your local setup.

---

## Step 1: Backup Current Database

```bash
# Export current users (if needed)
# Keep backup of current roles and permissions
```

---

## Step 2: Create Production-Ready Data

### Option A: Reset and Use New Admin Email

Create a new admin user with proper email format:

```sql
-- 1. Create or update admin user
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  'admin-uuid-here',
  'admin@yourbusiness.com',
  NOW(),
  '{"role": "admin"}',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET email = 'admin@yourbusiness.com';

-- 2. Create Administrator role
INSERT INTO public.roles (id, name, description, permissions, created_at)
VALUES (
  'role-uuid-here',
  'Administrator',
  'Full system access with all modules and permissions',
  '{"dashboard": {"view": true}, ...}',
  NOW()
)
ON CONFLICT (name) DO NOTHING;

-- 3. Assign role to user
INSERT INTO public.user_roles (user_id, role_id, assigned_at)
VALUES ('admin-uuid-here', 'role-uuid-here', NOW())
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 4. Create user profile
INSERT INTO public.users (id, email, full_name, org_id, role_ids, is_active)
VALUES (
  'admin-uuid-here',
  'admin@yourbusiness.com',
  'Admin User',
  'your-org-id',
  ARRAY['role-uuid-here'],
  true
)
ON CONFLICT (id) DO UPDATE SET email = 'admin@yourbusiness.com';
```

---

### Option B: Use Seed Script (Recommended)

Update and run the seed script:

```javascript
// Update seed-adminharsh.mjs

const ADMIN_EMAIL = 'admin@yourbusiness.com';  // Change from .local
const ADMIN_PASSWORD = 'Your_Secure_Password_123';

// Rest of seed script remains the same
```

Then run:
```bash
node seed-adminharsh.mjs
```

---

## Step 3: Create Additional Users with Roles

### Create "Intern Sales" User

```sql
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
VALUES ('intern-uuid', 'intern@yourbusiness.com', NOW(), '{"role": "intern"}');

INSERT INTO public.users (id, email, full_name, is_active)
VALUES ('intern-uuid', 'intern@yourbusiness.com', 'Intern User', true);

-- Create Intern Sales role if it doesn't exist
INSERT INTO public.roles (name, description, permissions)
VALUES (
  'Intern Sales',
  'Limited sales access for interns',
  '{"sales": {"leads": {"view": true, "create": false}, ...}, ...}'
);

-- Assign role
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'intern-uuid', id FROM public.roles WHERE name = 'Intern Sales';
```

### Create "Sales Executive" User

```sql
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data)
VALUES ('sales-exec-uuid', 'sales-exec@yourbusiness.com', NOW(), '{"role": "sales"}');

INSERT INTO public.users (id, email, full_name, is_active)
VALUES ('sales-exec-uuid', 'sales-exec@yourbusiness.com', 'Sales Executive', true);

-- Create Sales Executive role
INSERT INTO public.roles (name, description, permissions)
VALUES (
  'Sales Executive',
  'Full sales module access',
  '{"sales": {"leads": {"view": true, "create": true, "edit": true}, ...}, ...}'
);

-- Assign role
INSERT INTO public.user_roles (user_id, role_id)
SELECT 'sales-exec-uuid', id FROM public.roles WHERE name = 'Sales Executive';
```

---

## Step 4: Define Role Permissions

Create roles with specific permissions:

```typescript
// Permissions configuration for each role

const INTERN_SALES_PERMISSIONS = {
  sales: {
    'sales:leads:view': true,
    'sales:leads:viewOwn': true,
    'sales:quotations:view': true,
    'sales:quotations:viewOwn': true,
    // Limited permissions - no create/edit/delete
  },
  dashboard: {
    'dashboard:view': true,
  },
  // All other modules: false or omitted
};

const SALES_EXECUTIVE_PERMISSIONS = {
  sales: {
    'sales:leads:view': true,
    'sales:leads:create': true,
    'sales:leads:edit': true,
    'sales:leads:editOwn': true,
    'sales:opportunities:view': true,
    'sales:opportunities:create': true,
    'sales:quotations:view': true,
    'sales:quotations:create': true,
    'sales:orders:view': true,
    'sales:orders:create': true,
    'sales:customers:view': true,
    'sales:activities:view': true,
    'sales:reports:view': true,
  },
  dashboard: { 'dashboard:view': true },
  vendor: { 'vendor:view': true },  // Read-only vendor access
  // Inventory and Store: limited access
};

const SUPER_ADMIN_PERMISSIONS = {
  // Has all permissions like Administrator
  // Can access everything + manage system settings
};
```

---

## Step 5: Update Seed Scripts

Create separate seed files for each role:

```bash
# Create roles first
node scripts/seed-roles.mjs

# Then create users with proper roles
node seed-adminharsh.mjs          # admin@yourbusiness.com
node seed-sales-executive.mjs     # sales-exec@yourbusiness.com
node seed-intern.mjs              # intern@yourbusiness.com
```

---

## Step 6: Verify Setup

After creating users and roles:

```bash
# Check users table
SELECT id, email, full_name FROM public.users;

# Check roles
SELECT id, name, description FROM public.roles;

# Check user_roles mapping
SELECT u.email, r.name 
FROM public.user_roles ur
JOIN public.users u ON ur.user_id = u.id
JOIN public.roles r ON ur.role_id = r.id;
```

Expected output:
```
email                  | roles
-----------------------+------------------
admin@yourbusiness.com | Administrator
intern@yourbusiness.com | Intern Sales
sales-exec@yourbusiness.com | Sales Executive
```

---

## Step 7: Login & Test

1. **Admin Login:**
   ```
   Email: admin@yourbusiness.com
   Password: Your_Secure_Password_123
   ```
   Expected: See all 9 modules + 59 submodules

2. **Sales Executive Login:**
   ```
   Email: sales-exec@yourbusiness.com
   ```
   Expected: See Dashboard, Sales, Vendor (read-only), limited others

3. **Intern Login:**
   ```
   Email: intern@yourbusiness.com
   ```
   Expected: See Dashboard, Sales (limited to view leads only)

---

## Database Schema Verification

Ensure these tables exist with proper columns:

```sql
-- Users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  org_id uuid,
  role_ids uuid[],
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT NOW()
);

-- Roles table
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb,
  created_at timestamp DEFAULT NOW()
);

-- User roles mapping
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL REFERENCES public.users(id),
  role_id uuid NOT NULL REFERENCES public.roles(id),
  assigned_at timestamp DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

---

## Troubleshooting

### Issue: "User not found in database"
- Verify user exists in `public.users` table
- Check `users.id` matches auth user ID

### Issue: "Role not found"
- Verify role exists in `public.roles` table
- Check role name exactly matches (case-sensitive)

### Issue: "No permissions found"
- Verify `roles.permissions` JSONB has proper structure
- Check permission keys match those in navigation config

### Issue: "Modules not visible"
- Verify user has role assigned in `user_roles` table
- Check role has permissions defined in `roles.permissions`
- Check permission format matches helpers in `navigation-mapper.ts`

---

## Recommended Email Domains

For different environments:

| Environment | Email Format |
|------------|--------------|
| Local Dev | `admin@yourbusiness.local` |
| Staging | `admin@staging.yourbusiness.com` |
| Production | `admin@yourbusiness.com` |

Use consistent format for all users in each environment.

---

## Next Steps

1. Choose your email domain and admin email
2. Update seed scripts with new email
3. Clear database and reseed with new data
4. Test login with new credentials
5. Verify all modules and submodules accessible
6. Create additional test users with different roles

---

## Sample User Setup

Recommended test users for development:

```
1. admin@yourbusiness.local         → Administrator (all access)
2. manager@yourbusiness.local       → Manager (can manage team)
3. sales-exec@yourbusiness.local    → Sales Executive (sales + reports)
4. intern@yourbusiness.local        → Intern Sales (limited sales view)
5. inventory@yourbusiness.local     → Inventory Manager (inventory only)
```

Each with appropriate role and permissions defined in database.
