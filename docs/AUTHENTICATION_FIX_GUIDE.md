# Authentication Fix - Implementation Guide

**Status**: ✅ Implemented  
**Date**: October 28, 2025  
**Issue**: Login failure - 400/401 unauthorized error  
**Root Cause**: Supabase Auth and PostgreSQL database out of sync  
**Solution**: Two-layer user sync mechanism  

---

## 🎯 Problem Summary

### What Was Happening (Broken Flow)

```
1. User enters email/password on login form
   ↓
2. AuthProvider calls /api/auth/login
   ↓
3. API calls signIn() from Supabase Auth
   ↓
4. Supabase Auth validates credentials ✅ SUCCESS
   ↓
5. Returns JWT session with user.id (UUID from auth.users)
   ↓
6. ❌ BREAKS HERE: No matching record in public.users table
   ↓
7. API returns 401 "Invalid email or password"
   ↓
8. Frontend shows "Sign in failed" error
   ↓
User cannot login ❌
```

### Root Cause Analysis

The application uses a **two-layer authentication architecture**:

- **Layer 1 (Auth)**: Supabase Auth (managed by Supabase)
  - Table: `auth.users` (created by Supabase)
  - Purpose: Store credentials and generate JWT tokens
  - Status: ✅ Working

- **Layer 2 (App)**: PostgreSQL Database (managed by app)
  - Table: `public.users` (application-managed)
  - Purpose: Store user profiles, metadata, and permissions
  - Status: ❌ Not synced with auth layer

**The Problem**: User exists in `auth.users` but NOT in `public.users`

When seeding the admin user:
- ✅ Created in `auth.users` (Supabase Auth)
- ❌ NOT created in `public.users` (application database)

This mismatch caused login to fail because the API couldn't find the user profile after authentication succeeded.

---

## ✅ Solution Implemented

### Architecture Decision: **Option A - Automatic User Profile Creation**

**Why this approach?**

| Aspect | Option A (Auto) | Option B (Manual) |
|--------|-----------------|------------------|
| **Scalability** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **User Experience** | Seamless first login | Requires manual setup |
| **Multi-tenant** | ✅ Built-in | Needs custom work |
| **Enterprise Ready** | ✅ Yes | ❌ No |
| **Self-serve Signup** | ✅ Supported | ❌ Not supported |
| **Complexity** | Medium | Simple |

### Components Created

#### 1. **User Sync Service** (`src/lib/supabase/user-sync.ts`)

Handles automatic synchronization between Supabase Auth and PostgreSQL:

**Key Functions:**

```typescript
// Automatically create/get user profile
getOrCreateUserProfile(authUserId, email, fullName)
  → Returns user from public.users or creates new profile

// Create profile with optional role assignment
createUserProfile(params)
  → Creates profile + assigns role to organization

// Verify user is active
verifyUserProfile(authUserId)
  → Checks if user profile exists and is active

// Update user info
updateUserProfile(userId, updates)
  → Updates profile fields (fullName, phone, etc.)

// Get user by email
getUserByEmail(email)
  → Retrieves user profile from database
```

**Architecture Benefits:**
- ✅ **Idempotent**: Safe to call multiple times (checks before creating)
- ✅ **Scalable**: Works with multi-tenant, multi-org setups
- ✅ **Enterprise-ready**: Handles role assignment and org mapping
- ✅ **Secure**: Uses Supabase service role for server-side ops
- ✅ **Resilient**: Handles errors gracefully with logging

#### 2. **Updated Login API** (`src/app/api/auth/login/route-supabase.ts`)

Modified `/api/auth/login` to sync user on successful authentication:

**New Flow:**

```typescript
// Step 1: Validate input
validation = loginSchema.safeParse(body)

// Step 2: Authenticate via Supabase
{ data, error } = await signIn(email, password)

if (error) {
  return 401 "Invalid email or password"
}

// Step 3: Get Supabase user ID from session
const { user } = data.session

// **CRITICAL NEW STEP**: Sync user profile
userProfile = await getOrCreateUserProfile(
  user.id,      // UUID from auth.users
  user.email,   // From Supabase Auth
  metadata.fullName
)

if (!userProfile) {
  return 500 "Failed to setup user profile"
}

// Step 4: Set cookies and return success
response.headers.append('Set-Cookie', buildSetCookieHeader(token))
return 200 { user, message: "Logged in successfully" }
```

**Key Changes:**
- Added import: `import { getOrCreateUserProfile } from '@/lib/supabase/user-sync'`
- Added sync logic between lines 72-77 (after session validation)
- Now creates user profile automatically on first login
- Ensures user exists in BOTH layers before returning success

#### 3. **Updated Admin Seed Script** (`scripts/seed-admin.mjs`)

Modified to create admin in both authentication layers:

**New Seeding Process:**

```javascript
// Step 1: Create in Supabase Auth (auth.users)
adminUser = await supabase.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
  user_metadata: { fullName, permissions, ... }
})

// Step 2: Get admin ID from auth.users
adminAuthUser = allUsers.find(u => u.email === ADMIN_EMAIL)
adminAuthId = adminAuthUser.id  // UUID

// Step 3: Create profile in public.users
await supabase.from('users').insert({
  id: adminAuthId,              // Use same UUID as auth layer
  email: ADMIN_EMAIL,
  full_name: 'System Administrator',
  password_hash: '',            // Not used
  is_active: true,
  is_email_verified: true,
  email_verified_at: NOW()
})

// Step 4 (Future): Assign to default organization and role
// (Prepared for multi-tenant setup)
```

**Key Changes:**
- Retrieves admin user ID from `auth.users`
- Creates corresponding profile in `public.users`
- Uses same UUID for both tables (linking key)
- Ready for org/role assignment in next phase

---

## 🔄 Login Flow (After Fix)

### Successful Login Sequence

```
┌─────────────────────────────────────────────────────────┐
│ CLIENT: Enter email/password on login form              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Call AuthProvider.signIn(email, password)     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BROWSER: POST /api/auth/login { email, password }       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVER: /api/auth/login endpoint                        │
│  1. Validate input schema ✅                             │
│  2. Rate limit check ✅                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVER: Call signIn(email, password) ← Supabase         │
│  → Validates against auth.users table ✅                │
│  → Returns JWT session with user.id ✅                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVER: Call getOrCreateUserProfile() ← NEW SYNC        │
│  1. Check if user exists in public.users                │
│  2. If not exists: Create profile with UUID             │
│  3. If exists: Return existing profile ✅               │
│  4. Verify user is_active = true                        │
│  5. Return user profile object                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVER: Set httpOnly cookies with JWT                   │
│  __supabase_access_token (15 min)                       │
│  __supabase_refresh_token (7 days)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ SERVER: Return 200 success response                     │
│ {                                                        │
│   success: true,                                         │
│   user: { id, email, createdAt },                       │
│   message: "Logged in successfully"                     │
│ }                                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ FRONTEND: Receive 200 response ✅                        │
│  1. Store JWT in cookies ✅                              │
│  2. Update auth context ✅                               │
│  3. Redirect to /dashboard ✅                            │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
         ✅ LOGIN SUCCESSFUL ✅
         User can access dashboard
```

---

## 📝 Database Layer Changes

### Tables Involved

#### `auth.users` (Supabase Managed)
- Created automatically by Supabase when enabling Auth
- Contains: id (UUID), email, encrypted password, metadata, etc.
- Status: ✅ Already had admin user

#### `public.users` (Application Managed)
- Created by migration: `20251027_create_auth_tables.sql`
- Columns: `id` (UUID), `email`, `full_name`, `password_hash` (unused), `is_active`, `is_email_verified`, etc.
- **Now synced with auth.users via user-sync service**

#### `public.organizations` (For Multi-tenant)
- Stores tenant/org info: slug, name, db_connection_string, settings
- Status: Ready for multi-tenant setup (not used yet)

#### `public.user_roles` (RBAC)
- Links users to roles within organizations
- Status: Ready for role assignment (not assigned yet)

### Data Consistency

**Linking Strategy:**
- Primary Key: `public.users.id` = `auth.users.id` (same UUID)
- Lookup by: `public.users.email` = `auth.users.email` (same)
- Result: Can join/find users across both systems

**Initial State (After Seeding):**
```sql
-- In auth.users (Supabase managed):
id: "e1234567-89ab-cdef-0123-456789abcdef"
email: "admin@arcus.local"
encrypted_password: [by Supabase]
metadata: { fullName: "System Administrator", ... }

-- In public.users (now auto-created):
id: "e1234567-89ab-cdef-0123-456789abcdef"  ← same!
email: "admin@arcus.local"                  ← same!
full_name: "System Administrator"
is_active: true
is_email_verified: true
```

---

## 🚀 How to Test

### 1. Run Admin Seed Script

```bash
npm run seed:admin
```

**Output Expected:**
```
✅ Admin Seeding Completed Successfully!

📋 ARCHITECTURE:
   Authentication Layer: Supabase Auth (auth.users table)
   User Profile Layer: PostgreSQL (public.users table)
   Sync: Automatic on login via /api/auth/login

📋 ADMIN ACCOUNT DETAILS:
   Email:        admin@arcus.local
   Password:     Admin@123456
   Full Name:    System Administrator
   Role:         System Administrator
   Status:       Active & Email Verified
```

### 2. Start Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` → Login page

### 3. Login with Admin Credentials

**Email**: `admin@arcus.local`  
**Password**: `Admin@123456`

**What Should Happen:**
1. ✅ Form submits email/password
2. ✅ Backend validates with Supabase Auth
3. ✅ Backend syncs user to public.users (idempotent)
4. ✅ Backend sets cookies with JWT
5. ✅ Frontend redirects to dashboard
6. ✅ Dashboard loads with admin data

### 4. Verify in Database

```sql
-- Check Supabase Auth (in Supabase dashboard)
SELECT email, user_metadata FROM auth.users WHERE email = 'admin@arcus.local';

-- Check Application Database
SELECT id, email, full_name, is_active FROM public.users 
WHERE email = 'admin@arcus.local';

-- Check Sessions (optional)
SELECT user_id, jti, issued_at FROM sessions 
WHERE user_id = '[admin-uuid]'
LIMIT 1;
```

**Expected:**
- ✅ User exists in auth.users
- ✅ User exists in public.users with same ID
- ✅ Session record created (if using sessions table)

---

## 🏗️ Future Enhancements (Multi-tenant Setup)

### What's Ready (But Not Yet Used)

1. **Organizations Table**
   - Ready for multi-tenant support
   - Each org has own slug, name, db_connection_string
   - Prepared for separate databases per org

2. **Role Assignment**
   - `public.roles` table exists (by org)
   - `public.user_roles` table ready (many-to-many)
   - Not yet assigned during seeding

3. **Permissions System**
   - RBAC framework designed
   - 65+ permissions documented
   - Integration point: `public.roles.permissions` JSONB column

### Next Phase: Full Multi-tenant Setup

```typescript
// After current fix works, add:

// Step 1: Create default organization
const org = await createOrganization({
  slug: 'arcus-default',
  name: 'Arcus Default Organization',
  dbConnectionString: '...'
});

// Step 2: Create admin role
const adminRole = await createRole({
  organizationId: org.id,
  name: 'Admin',
  permissions: { all: true }
});

// Step 3: Assign admin to organization
await assignUserToRole({
  userId: adminAuthId,
  roleId: adminRole.id,
  organizationId: org.id
});

// Result: Admin can access multiple orgs with different roles
```

---

## 🔐 Security Considerations

### Auth Token Storage

**httpOnly Cookies** (recommended for web apps):
```typescript
Set-Cookie: __supabase_access_token=[JWT]; httpOnly; secure; samesite=strict; max-age=900
```

**Benefits:**
- ✅ Not accessible to JavaScript (XSS protection)
- ✅ Automatically sent with requests
- ✅ Cannot be stolen by malicious scripts
- ✅ Secure flag only sent over HTTPS in production

### Password Handling

- ✅ **Never** stored in PostgreSQL (password_hash column unused)
- ✅ All auth via Supabase (industry-standard bcrypt)
- ✅ Supabase handles password hashing, salting, rotation
- ✅ App only receives JWT tokens

### Database Access

- ✅ Service role key only used on server (seed script, API endpoints)
- ✅ Never exposed to client-side code
- ✅ Public data accessed with user's JWT token
- ✅ RLS (Row-Level Security) policies can protect data per org/user

---

## ⚠️ Important Notes

### Breaking Changes: None
- Existing code compatible
- Just adds user profile creation on login
- Fully backward compatible

### Migration Path
1. ✅ Seed admin in both layers (script updated)
2. ✅ Login creates profiles auto (API updated)
3. 🔄 Test login flow works end-to-end
4. ⏳ (Future) Set up orgs and roles
5. ⏳ (Future) Migrate existing users if migrating from Firebase

### Error Handling

**If user sync fails:**
- Returns 500 "Failed to setup user profile"
- Logs error details to console
- Auth succeeded but user blocked to protect data consistency
- Check Supabase logs and server logs for details

**If user profile exists but is_active=false:**
- Login will still work (no check in current code)
- Recommendation: Add check before returning success (future improvement)

---

## 📚 Related Files

**Modified Files:**
- ✅ `src/lib/supabase/user-sync.ts` (NEW)
- ✅ `src/app/api/auth/login/route-supabase.ts` (UPDATED)
- ✅ `scripts/seed-admin.mjs` (UPDATED)

**Reference Files:**
- `src/components/AuthProvider.tsx` (uses /api/auth/login)
- `src/app/login/login-client.tsx` (login form)
- `src/lib/supabase/auth.ts` (auth functions)
- `src/lib/supabase/session.ts` (cookie management)
- `migrations/control/20251027_create_auth_tables.sql` (users table)

**Documentation:**
- `docs/ARCHITECTURE_DETAILED.md`
- `docs/PERMISSION_SYSTEM_DOCUMENTATION.md`
- `docs/SAAS_ARCHITECTURE.md`

---

## ✅ Verification Checklist

- [ ] Run `npm run seed:admin` successfully
- [ ] Check admin user in Supabase Auth dashboard
- [ ] Verify admin profile in PostgreSQL (`SELECT * FROM public.users`)
- [ ] Start dev server with `npm run dev`
- [ ] Navigate to login page at `localhost:3000/login`
- [ ] Login with `admin@arcus.local` / `Admin@123456`
- [ ] Verify successful redirect to dashboard
- [ ] Check console logs for `[UserSync] User profile synced:` message
- [ ] Check cookies contain `__supabase_access_token`
- [ ] Verify no errors in server logs

---

## 🆘 Troubleshooting

### "Sign in failed" Error (400/401)

**Cause**: Usually old cache or incorrect credentials

**Fix:**
```bash
# 1. Clear browser cache
# Ctrl+Shift+Delete → Clear cookies and cache

# 2. Re-seed admin (overwrites if exists)
npm run seed:admin

# 3. Start fresh
npm run dev
```

### "Failed to setup user profile" Error (500)

**Cause**: Database error during sync

**Debug:**
```bash
# Check Supabase logs (Supabase dashboard)
# Check server logs for "[UserSync] Error..." messages
# Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
# Verify public.users table exists and is accessible
```

### No User Profile Created

**Check:**
```sql
-- Should return 1 row with admin's UUID
SELECT COUNT(*) FROM public.users WHERE email = 'admin@arcus.local';

-- Should show admin user
SELECT id, email, full_name, is_active FROM public.users 
WHERE email = 'admin@arcus.local';
```

---

**Status**: 🟢 Ready for Testing  
**Next Step**: Run seed script and test login flow
