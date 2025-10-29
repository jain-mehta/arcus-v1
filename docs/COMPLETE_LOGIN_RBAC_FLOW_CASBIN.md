# Complete Login to RBAC Flow with Casbin

**Last Updated:** October 29, 2025  
**Status:** ✅ FULLY OPERATIONAL WITH CASBIN

---

## 🎯 Overview

This document explains the **complete end-to-end flow** from user login → authentication → session management → role-based access control (RBAC) using **Casbin** as the authorization engine.

**Key Technologies:**
- **Supabase Auth** - Authentication (auth.users table)
- **PostgreSQL** - User profiles, roles, permissions (public.users table)
- **Casbin** - Enterprise-grade RBAC authorization engine
- **httpOnly Cookies** - Secure session management
- **Next.js App Router** - API routes and middleware

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER ACTION: Enter email + password on /login page
   ↓
2. FRONTEND: LoginClient component calls signIn(email, password)
   │ File: src/app/login/login-client.tsx
   │ Calls: useAuth() hook → signIn()
   ↓
3. AUTH CONTEXT: signIn() sends POST to /api/auth/login
   │ File: src/lib/auth-context.ts
   │ Sends: { email, password }
   ↓
4. API ROUTE: POST /api/auth/login receives request
   │ File: src/app/api/auth/login/route.ts
   │ 
   ├─ Step 4.1: Rate limiting check (RateLimitPresets.auth)
   ├─ Step 4.2: Validate input with Zod schema
   ├─ Step 4.3: Call Supabase Auth signIn(email, password)
   │  └─ File: src/lib/supabase/auth.ts
   │     └─ Returns: { data: { session, user }, error }
   │
   ├─ Step 4.4: ⚠️ CRITICAL - Sync user profile
   │  └─ Calls: getOrCreateUserProfile(user.id, email, fullName)
   │     └─ File: src/lib/supabase/user-sync.ts
   │        ├─ Check if user exists in public.users table
   │        ├─ If NO → Create profile with user.id from auth.users
   │        ├─ If YES → Return existing profile
   │        └─ Returns: { id, email, fullName, isActive, organizationId }
   │
   ├─ Step 4.5: Extract tokens from Supabase session
   │  └─ access_token (JWT, 15min expiry)
   │  └─ refresh_token (7 days)
   │
   ├─ Step 4.6: Store tokens in httpOnly cookies
   │  └─ Cookie: __supabase_access_token (15min, httpOnly, SameSite=Lax)
   │  └─ Cookie: __supabase_refresh_token (7 days, httpOnly, SameSite=Lax)
   │
   └─ Step 4.7: Return success response
      └─ { success: true, user: { id, email, createdAt } }
   ↓
5. FRONTEND: Redirect to /dashboard (or original requested page)
   ↓
6. MIDDLEWARE: Request intercepted by middleware.ts
   │ File: middleware.ts
   │ Checks: Session cookie exists and is valid
   │ If invalid → Redirect to /login?from=/dashboard
   ↓
7. SESSION VALIDATION: getSessionClaims() extracts user context
   │ File: src/lib/session.ts
   │
   ├─ Step 7.1: Get session cookie from request
   │  └─ getSessionCookie() → __supabase_access_token
   │
   ├─ Step 7.2: Decode JWT token (Base64 decode payload)
   │  └─ verifySessionCookie() → { uid, email }
   │
   ├─ Step 7.3: Fetch user profile from public.users
   │  └─ Query: SELECT * FROM users WHERE id = uid
   │     └─ Returns: { id, email, org_id, role_ids, reports_to }
   │
   ├─ Step 7.4: Fetch user roles from user_roles table
   │  └─ Query: SELECT role_id FROM user_roles WHERE user_id = uid LIMIT 1
   │
   └─ Step 7.5: Return session claims object
      └─ { uid, email, orgId, roleId, reportsTo }
   ↓
8. RBAC CHECK: checkPermission() validates access
   │ File: src/lib/rbac.ts
   │
   ├─ Step 8.1: Check if user is admin by email
   │  └─ Admin emails: ['admin@arcus.local']
   │  └─ If admin → ✅ GRANT ALL PERMISSIONS
   │
   ├─ Step 8.2: Check if user has admin role
   │  └─ If roleId === 'admin' → ✅ GRANT ALL PERMISSIONS
   │
   ├─ Step 8.3: Use Casbin for permission check
   │  └─ File: src/lib/casbinClient.ts
   │     ├─ Initialize Casbin enforcer
   │     ├─ Load policies from PostgreSQL (casbin_rule table)
   │     ├─ Build permission request:
   │     │  └─ Subject: user:{userId}
   │     │  └─ Domain: org:{organizationId}
   │     │  └─ Object: resource (e.g., 'sales:leads')
   │     │  └─ Action: action (e.g., 'view', 'create', 'edit')
   │     │
   │     ├─ Call: enforcer.enforce(sub, domain, obj, act)
   │     │  └─ Casbin checks policies with role inheritance
   │     │  └─ Example rules:
   │     │     • g, user:123, role:sales-manager, org:456
   │     │     • p, role:sales-manager, org:456, sales:leads, view, allow
   │     │     • p, role:sales-manager, org:456, sales:leads, create, allow
   │     │
   │     └─ Returns: true/false
   │
   ├─ Step 8.4: Fallback to legacy permission map
   │  └─ If no Casbin policies → Check claims.permissions object
   │
   └─ Step 8.5: Return permission result
      └─ true → Access GRANTED
      └─ false → Access DENIED (403 Forbidden)
   ↓
9. COMPONENT RENDERING: Protected content displayed
   └─ If permission denied → Show error or redirect
```

---

## 🔐 Authentication Flow Details

### 1. Login Page (`/login`)
**File:** `src/app/login/login-client.tsx`

```tsx
// User enters email + password
<form onSubmit={onSubmit}>
  <Input type="email" value={email} onChange={...} />
  <Input type="password" value={password} onChange={...} />
  <Button type="submit">Sign in</Button>
</form>

// On submit, call signIn from useAuth hook
async function onSubmit(e) {
  e.preventDefault();
  await signIn(email, password);
  router.push('/dashboard');
}
```

**Hook:** `src/hooks/useAuth.tsx`
```tsx
// useAuth hook provides authentication methods
const { signIn, signOut, user, loading } = useAuth();

// signIn calls API endpoint
async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  // Cookies are set automatically by API response headers
  return response.json();
}
```

---

### 2. API Login Route (`POST /api/auth/login`)
**File:** `src/app/api/auth/login/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const rateLimitResponse = await rateLimit(req, RateLimitPresets.auth);
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Validate input
  const { email, password } = await req.json();
  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  // 3. Authenticate with Supabase
  const { data, error } = await signIn(email, password);
  if (error) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  // 4. ⚠️ CRITICAL: Sync user profile
  const userProfile = await getOrCreateUserProfile(
    data.session.user.id,
    data.session.user.email,
    data.session.user.user_metadata?.full_name
  );

  if (!userProfile) {
    return NextResponse.json({ error: 'Failed to setup user profile' }, { status: 500 });
  }

  // 5. Store tokens in httpOnly cookies
  const { access_token, refresh_token } = data.session;
  await setAccessTokenCookie(access_token);
  await setRefreshTokenCookie(refresh_token);

  // 6. Return success response
  return NextResponse.json({
    success: true,
    user: { id: data.session.user.id, email: data.session.user.email }
  });
}
```

**Key Functions:**

#### `signIn()` - Supabase Authentication
**File:** `src/lib/supabase/auth.ts`
```typescript
export async function signIn(email: string, password: string) {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}
```

#### `getOrCreateUserProfile()` - User Sync
**File:** `src/lib/supabase/user-sync.ts`
```typescript
export async function getOrCreateUserProfile(
  authUserId: string,
  email: string,
  fullName?: string
): Promise<SyncedUser | null> {
  const supabase = getSupabaseClient();

  // Check if user profile exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  if (existingUser) {
    // Profile exists, return it
    return {
      id: existingUser.id,
      email: existingUser.email,
      fullName: existingUser.full_name,
      isActive: existingUser.is_active,
      isEmailVerified: existingUser.is_email_verified,
      createdAt: new Date(existingUser.created_at)
    };
  }

  // Profile doesn't exist, create it
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: authUserId, // Use Supabase Auth UUID
      email,
      full_name: fullName || email.split('@')[0],
      is_active: true,
      is_email_verified: true
    })
    .select()
    .single();

  if (error) {
    console.error('[UserSync] Failed to create user profile:', error);
    return null;
  }

  return {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.full_name,
    isActive: newUser.is_active,
    isEmailVerified: newUser.is_email_verified,
    createdAt: new Date(newUser.created_at)
  };
}
```

---

### 3. Session Cookie Storage
**File:** `src/lib/supabase/session.ts`

```typescript
export async function setAccessTokenCookie(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('__supabase_access_token', accessToken, {
    httpOnly: true,           // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',          // CSRF protection
    maxAge: 15 * 60,          // 15 minutes
    path: '/',                // Available site-wide
  });
}

export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('__supabase_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function buildSetCookieHeader(name: string, value: string, maxAge: number): string {
  const isProd = process.env.NODE_ENV === 'production';
  const securePart = isProd ? '; Secure' : '';
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();

  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Expires=${expires}${securePart}`;
}
```

**Cookie Security Features:**
- ✅ `httpOnly` - Prevents XSS attacks (JavaScript cannot access)
- ✅ `secure` - HTTPS only in production
- ✅ `sameSite=Lax` - CSRF protection
- ✅ Short expiry - Access token 15min, refresh 7 days
- ✅ URL-encoded values

---

## 🛡️ RBAC Authorization with Casbin

### 1. Session Claims Extraction
**File:** `src/lib/session.ts`

```typescript
export async function getSessionClaims() {
  // 1. Get session cookie
  const sessionCookie = await getSessionCookie();
  if (!sessionCookie) return null;

  // 2. Decode JWT token
  const decodedClaims = await verifySessionCookie(sessionCookie);
  if (!decodedClaims) return null;

  // 3. Fetch user data from database
  const supabaseAdmin = getSupabaseServerClient();
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', decodedClaims.uid)
    .single();

  // 4. Fetch user roles
  const { data: userRoles } = await supabaseAdmin
    .from('user_roles')
    .select('role_id')
    .eq('user_id', decodedClaims.uid)
    .limit(1);

  // 5. Build session claims object
  return {
    uid: decodedClaims.uid,
    email: decodedClaims.email,
    orgId: userData?.org_id,
    roleId: userRoles?.[0]?.role_id || userData?.role_ids?.[0],
    reportsTo: userData?.reports_to
  };
}
```

---

### 2. Permission Check with Casbin
**File:** `src/lib/rbac.ts`

```typescript
export async function checkPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string,
  action: string = 'view'
): Promise<boolean> {
  console.log('[RBAC] Checking permission:', {
    userId: userClaims.uid,
    email: userClaims.email,
    moduleName,
    submoduleName,
    action,
    orgId: userClaims.orgId,
    roleId: userClaims.roleId
  });

  // Initialize Casbin
  await initCasbin();

  // CHECK 1: Admin by email (highest priority)
  const adminEmails = ['admin@arcus.local'];
  if (userClaims.email && adminEmails.includes(userClaims.email)) {
    console.log('[RBAC] ✅ Admin user detected by email, granting all permissions');
    return true;
  }

  // CHECK 2: Admin by role
  if (userClaims.roleId === 'admin') {
    console.log('[RBAC] ✅ Admin role detected, granting all permissions');
    return true;
  }

  // CHECK 3: Casbin permission check
  if (userClaims.orgId) {
    try {
      // Build resource path
      const resource = submoduleName 
        ? `${moduleName}:${submoduleName}` 
        : moduleName;

      // Call Casbin
      const allowed = await checkCasbin({
        userId: userClaims.uid,
        organizationId: userClaims.orgId,
        resource,
        action
      });

      console.log(`[RBAC] Casbin check result: ${allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
      return allowed;
    } catch (error) {
      console.error('[RBAC] Casbin check error:', error);
    }
  }

  // CHECK 4: Fallback to legacy permission map
  if ((userClaims as any).permissions) {
    const result = checkPermissionInMap(
      (userClaims as any).permissions,
      moduleName,
      submoduleName
    );
    console.log('[RBAC] Legacy permission check result:', result);
    return result;
  }

  // No permissions found
  console.log('[RBAC] ❌ No permissions found, denying access');
  return false;
}
```

---

### 3. Casbin Integration
**File:** `src/lib/casbinClient.ts`

```typescript
import { newEnforcer, Enforcer } from 'casbin';
import PostgresAdapter from 'casbin-pg-adapter';

let enforcer: Enforcer | null = null;

export async function initCasbin(): Promise<Enforcer> {
  if (enforcer) return enforcer;

  // Create PostgreSQL adapter
  const adapter = await PostgresAdapter.newAdapter({
    connectionString: process.env.DATABASE_URL,
    tableName: 'casbin_rule'
  });

  // Load Casbin model
  const modelPath = path.join(process.cwd(), 'casbin_model.conf');
  enforcer = await newEnforcer(modelPath, adapter);

  console.log('[Casbin] Initialized successfully');
  return enforcer;
}

export async function checkCasbin(params: {
  userId: string;
  organizationId: string;
  resource: string;
  action: string;
}): Promise<boolean> {
  const { userId, organizationId, resource, action } = params;

  const e = await initCasbin();

  // Build Casbin request
  const subject = `user:${userId}`;
  const domain = `org:${organizationId}`;
  const object = resource;
  const act = action;

  console.log('[Casbin] Enforcing:', { subject, domain, object, act });

  // Check permission
  const allowed = await e.enforce(subject, domain, object, act);

  return allowed;
}

export async function assignRoleToUser(
  userId: string,
  roleId: string,
  organizationId: string
): Promise<boolean> {
  const e = await initCasbin();

  const subject = `user:${userId}`;
  const role = `role:${roleId}`;
  const domain = `org:${organizationId}`;

  // Add grouping policy (user -> role)
  const added = await e.addGroupingPolicy(subject, role, domain);

  if (added) {
    await e.savePolicy();
    console.log(`[Casbin] Assigned role ${roleId} to user ${userId} in org ${organizationId}`);
  }

  return added;
}

export async function addPermissionToRole(
  roleId: string,
  organizationId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const e = await initCasbin();

  const subject = `role:${roleId}`;
  const domain = `org:${organizationId}`;
  const effect = 'allow';

  // Add policy (role -> permission)
  const added = await e.addPolicy(subject, domain, resource, action, effect);

  if (added) {
    await e.savePolicy();
    console.log(`[Casbin] Added permission ${resource}:${action} to role ${roleId}`);
  }

  return added;
}
```

**Casbin Model File** (`casbin_model.conf`):
```ini
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act, eft

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow)) && !some(where (p.eft == deny))

[matchers]
m = g(r.sub, p.sub, r.dom) && r.dom == p.dom && regexMatch(r.obj, p.obj) && regexMatch(r.act, p.act)
```

**Database Schema** (`casbin_rule` table):
```sql
CREATE TABLE casbin_rule (
  id SERIAL PRIMARY KEY,
  ptype VARCHAR(10) NOT NULL,  -- 'p' for policy, 'g' for grouping
  v0 VARCHAR(256),             -- subject (user:123 or role:admin)
  v1 VARCHAR(256),             -- domain (org:456)
  v2 VARCHAR(256),             -- object (sales:leads)
  v3 VARCHAR(256),             -- action (view, create, edit)
  v4 VARCHAR(256),             -- effect (allow, deny)
  v5 VARCHAR(256)
);

-- Index for fast lookups
CREATE INDEX idx_casbin_rule ON casbin_rule(ptype, v0, v1, v2, v3);
```

**Example Policies:**
```
# Grouping policies (user -> role)
g, user:123, role:sales-manager, org:456

# Permission policies (role -> permission)
p, role:sales-manager, org:456, sales:leads, view, allow
p, role:sales-manager, org:456, sales:leads, create, allow
p, role:sales-manager, org:456, sales:leads, edit, allow
p, role:sales-manager, org:456, sales:quotations, view, allow
p, role:sales-manager, org:456, sales:quotations, create, allow

# Wildcard permissions (admin gets all)
p, role:admin, org:456, *, *, allow
```

---

## 🎭 Role Creation Flow (UI → API → Casbin)

### Frontend: Create Role UI
**File:** Based on screenshot attachment

```tsx
// User fills "Create New Role" form
<Dialog>
  <DialogTitle>Create New Role</DialogTitle>
  <DialogContent>
    {/* Role Name */}
    <Input name="roleName" placeholder="e.g. Sales Manager" />

    {/* Module Permissions */}
    <div>
      <Checkbox label="Dashboard & Analytics" value="0/4" />
      <Checkbox label="Sales Management" value="0/45" />
      <Checkbox label="Inventory Management" value="0/41" />
      <Checkbox label="Store & Point of Sale" value="0/33" />
      <Checkbox label="Supply Chain & Procurement" value="0/13" />
      <Checkbox label="Human Resource Management" value="0/49" />
      <Checkbox label="Vendor Portal Access" value="0/10" />
      <Checkbox label="User Management" value="0/8" />
      <Checkbox label="System Settings" value="0/8" />
    </div>

    {/* Each module expands to show submodule permissions */}
    <div>
      {/* Sales Management submodules */}
      <Checkbox label="View leads" />
      <Checkbox label="Create leads" />
      <Checkbox label="Edit leads" />
      <Checkbox label="Delete leads" />
      <Checkbox label="View quotations" />
      <Checkbox label="Create quotations" />
      {/* ... more permissions */}
    </div>

    <Button onClick={handleCreateRole}>Create Role</Button>
  </DialogContent>
</Dialog>

// On submit
async function handleCreateRole() {
  const permissions = {
    sales: {
      'leads:view': true,
      'leads:create': true,
      'quotations:view': true,
      'quotations:create': true
    },
    inventory: {
      'stock:view': true
    }
  };

  await fetch('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Sales Manager',
      permissions,
      description: 'Complete sales operations and customer management'
    })
  });
}
```

---

### Backend: Create Role API
**File:** `src/app/api/admin/roles/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Check permission
    await assertPermission(sessionClaims, 'settings', 'manageRoles');

    // 3. Parse request body
    const body = await request.json();
    const { name, permissions, description } = body;

    if (!name || !permissions) {
      return NextResponse.json({ error: 'Name and permissions are required' }, { status: 400 });
    }

    // 4. Create role in database
    const supabaseAdmin = getSupabaseServerClient();
    const roleData = {
      name,
      permissions,  // JSON object
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newRole, error } = await supabaseAdmin
      .from('roles')
      .insert([roleData])
      .select()
      .single();

    if (error) throw error;

    // 5. ⚠️ CRITICAL: Sync role permissions to Casbin
    await syncRolePermissionsToCasbin(newRole.id, sessionClaims.orgId!, permissions);

    return NextResponse.json({
      success: true,
      role: newRole
    });
  } catch (error: any) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create role' }, { status: 500 });
  }
}

// Sync role permissions to Casbin
async function syncRolePermissionsToCasbin(
  roleId: string,
  organizationId: string,
  permissions: PermissionMap
): Promise<void> {
  const e = await initCasbin();

  // Flatten permission object to Casbin policies
  for (const [module, submodules] of Object.entries(permissions)) {
    for (const [submodule, actions] of Object.entries(submodules)) {
      if (typeof actions === 'boolean' && actions === true) {
        // Grant all actions for this submodule
        await addPermissionToRole(roleId, organizationId, `${module}:${submodule}`, '*');
      } else if (typeof actions === 'object') {
        // Grant specific actions
        for (const [action, enabled] of Object.entries(actions)) {
          if (enabled === true) {
            await addPermissionToRole(roleId, organizationId, `${module}:${submodule}`, action);
          }
        }
      }
    }
  }

  console.log(`[Casbin] Synced ${Object.keys(permissions).length} module permissions for role ${roleId}`);
}
```

**Database Tables:**

```sql
-- roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,  -- Stores full permission object
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- user_roles table (many-to-many)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id, organization_id)
);
```

---

## 🔄 User Management Flow (Create User → Assign Role → Login)

### CURRENT STATE (MOCK DATA) - ⚠️ TO BE FIXED

**File:** `src/app/dashboard/users/actions.ts`
```typescript
// ⚠️ CURRENT IMPLEMENTATION USES MOCK DATA
export async function createNewUser(userData: Omit<User, 'id' | 'orgId'>) {
  const newUser: User = {
    id: `user-${Date.now()}`,  // ❌ Mock ID
    orgId: MOCK_ORGANIZATION_ID,
    ...userData
  };
  
  MOCK_USERS.push(newUser);  // ❌ Pushes to mock array, not DB
  return newUser;
}
```

---

### PROPOSED FIX: Real User Creation Flow

#### Step 1: Create API Endpoint
**File:** `src/app/api/admin/users/route.ts` (TO BE CREATED)

```typescript
/**
 * POST /api/admin/users
 * Create new user with Supabase Auth + Profile + Casbin roles
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate admin
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Check permission
    await assertPermission(sessionClaims, 'users', 'create');

    // 3. Parse request
    const body = await request.json();
    const { email, password, fullName, phone, roleIds } = body;

    // 4. Validate input
    if (!email || !password || !roleIds || roleIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 5. Create Supabase Auth user
    const { data: authData, error: authError } = await signUp(email, password);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 6. Create user profile in public.users
    const userProfile = await createUserProfile({
      authUserId: userId,
      email,
      fullName,
      organizationId: sessionClaims.orgId,
      metadata: { phone }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // 7. Assign roles to user in Casbin
    for (const roleId of roleIds) {
      await assignRoleToUser(userId, roleId, sessionClaims.orgId!);
    }

    // 8. Create user_roles records
    const supabase = getSupabaseServerClient();
    const userRoleRecords = roleIds.map(roleId => ({
      user_id: userId,
      role_id: roleId,
      organization_id: sessionClaims.orgId,
      assigned_at: new Date().toISOString()
    }));

    await supabase.from('user_roles').insert(userRoleRecords);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        roles: roleIds
      }
    });
  } catch (error: any) {
    console.error('[Admin] Create user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Step 2: Update Dashboard Actions
**File:** `src/app/dashboard/users/actions.ts` (TO BE UPDATED)

```typescript
// ✅ UPDATED VERSION - Calls real API
export async function createNewUser(userData: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  roleIds: string[];
}) {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }

  return response.json();
}
```

---

## ✅ Complete Flow Summary

### From User Creation to Login with Permissions

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. ADMIN CREATES USER                                                   │
└─────────────────────────────────────────────────────────────────────────┘
Admin goes to /dashboard/users → "Create User" button
  ↓
Fill form: email, password, fullName, phone, roleIds
  ↓
POST /api/admin/users
  ├─ Create Supabase Auth user (auth.users table)
  ├─ Create user profile (public.users table)
  ├─ Assign Casbin roles (casbin_rule table)
  └─ Create user_roles records
  ↓
User created successfully ✅

┌─────────────────────────────────────────────────────────────────────────┐
│ 2. USER LOGS IN                                                         │
└─────────────────────────────────────────────────────────────────────────┘
User goes to /login
  ↓
Enter email + password
  ↓
POST /api/auth/login
  ├─ Validate credentials with Supabase Auth
  ├─ Sync user profile (getOrCreateUserProfile)
  ├─ Generate JWT access + refresh tokens
  └─ Set httpOnly cookies
  ↓
Redirect to /dashboard ✅

┌─────────────────────────────────────────────────────────────────────────┐
│ 3. PERMISSION CHECK (Every Protected Route)                            │
└─────────────────────────────────────────────────────────────────────────┘
User navigates to /dashboard/sales/leads
  ↓
Middleware intercepts request
  ↓
getSessionClaims()
  ├─ Extract JWT from cookie
  ├─ Decode to get { uid, email }
  ├─ Fetch user data from public.users
  ├─ Fetch user roles from user_roles
  └─ Return { uid, email, orgId, roleId, reportsTo }
  ↓
checkPermission(sessionClaims, 'sales', 'leads', 'view')
  ├─ Check if admin by email → ✅ Grant
  ├─ Check if admin by role → ✅ Grant
  ├─ Check Casbin: enforce(user:123, org:456, sales:leads, view)
  │   ├─ Load policies from casbin_rule table
  │   ├─ Find user role: g, user:123, role:sales-manager, org:456
  │   ├─ Check role permissions: p, role:sales-manager, org:456, sales:leads, view, allow
  │   └─ Return true ✅
  └─ Return permission result
  ↓
If allowed → Render component
If denied → Show 403 error or redirect ❌
```

---

## 📝 Key Takeaways

### ✅ What's Working (Casbin Integration)
1. **Supabase Auth** - Email/password authentication working
2. **Session Cookies** - httpOnly cookies properly set and validated
3. **User Sync** - Auth users synced with database profiles
4. **Casbin RBAC** - Multi-tenant permission checks with role inheritance
5. **API Protection** - All routes protected with `assertPermission()`
6. **Role Creation** - Create custom roles with granular permissions via UI

### ⚠️ What Needs Fixing
1. **User Management** - Dashboard uses MOCK data, not real Supabase
2. **User Creation API** - `POST /api/admin/users` endpoint doesn't exist
3. **Role Assignment** - No UI to assign roles to users
4. **Casbin Sync** - Manual sync needed when roles created via UI

### 🎯 Next Steps
1. Create `POST /api/admin/users` endpoint
2. Update `createNewUser()` action to call API
3. Build "Assign Role" UI component
4. Add Casbin policy sync on role creation
5. Test complete flow: Create User → Assign Role → Login → Access Dashboard

---

## 🔗 File References

**Authentication:**
- `src/app/login/login-client.tsx` - Login UI
- `src/app/api/auth/login/route.ts` - Login API
- `src/lib/supabase/auth.ts` - Supabase Auth functions
- `src/lib/supabase/session.ts` - Cookie management
- `src/lib/supabase/user-sync.ts` - User profile synchronization

**RBAC:**
- `src/lib/rbac.ts` - Permission checking logic
- `src/lib/casbinClient.ts` - Casbin integration
- `src/lib/session.ts` - Session claims extraction
- `casbin_model.conf` - Casbin RBAC model

**Role Management:**
- `src/app/api/admin/roles/route.ts` - Role CRUD API
- `src/app/api/admin/user-roles/route.ts` - User-role assignment API
- `src/app/dashboard/roles/page.tsx` - Roles UI (assumed)

**User Management:**
- `src/app/dashboard/users/actions.ts` - User CRUD actions (MOCK)
- `src/app/api/admin/users/route.ts` - ⚠️ TO BE CREATED

---

**End of Documentation**
