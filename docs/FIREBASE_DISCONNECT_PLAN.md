# Firebase Disconnection & Supabase Auth Implementation

**Date:** October 27, 2025  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Full Firebase removal + Supabase Auth implementation

---

## 📋 Executive Summary

Firebase is currently integrated for:
1. **Database/Firestore** - User data, document storage
2. **Authentication** - Session management, user verification
3. **Admin SDK** - Server-side operations

Supabase authentication is NOW ENABLED on the Supabase platform and ready to use.

**Action:** Complete disconnection of Firebase from database/auth layers (keep only Genkit).

---

## 🔍 Firebase Usage Audit

### **Files Using Firebase for Authentication/Database**

| File | Usage | Action |
|------|-------|--------|
| `src/lib/firebaseClient.ts` | Firebase client initialization | ❌ DELETE |
| `src/lib/firebase/firebase-admin.ts` | Admin SDK initialization | ❌ DELETE |
| `src/lib/session.ts` | Session cookie with Firebase | 🔄 REPLACE |
| `src/app/api/auth/login/route.ts` | Firebase-based login | 🔄 REPLACE |
| `src/app/api/auth/logout/route.ts` | Firebase logout | 🔄 REPLACE |
| `src/app/api/auth/me/route.ts` | Firestore user fetch | 🔄 REPLACE |
| `src/app/api/auth/permissions/route.ts` | Firestore permissions | 🔄 REPLACE |
| `src/components/AuthProvider.tsx` | Firebase auth state | 🔄 REPLACE |
| `src/hooks/useAuth.tsx` | Firebase user hook | 🔄 REPLACE |
| `middleware.ts` | Middleware (can stay, needs JWT update) | ✅ KEEP/UPDATE |

### **Keep Only for Genkit**
- `src/ai/**` (all Genkit flows)
- Firebase dependencies in `node_modules/@firebase/**` (for Genkit only)

---

## 🗑️ Firebase Environment Variables to Remove

**From `.env` and `.env.local`:**

```bash
# ❌ REMOVE ALL THESE
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase (server / admin)
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID

# Firebase credentials
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
GOOGLE_APPLICATION_CREDENTIALS (if only for Firebase)
FIREBASE_SERVICE_ACCOUNT_BASE64
```

**Keep These for Supabase:**
```bash
# ✅ KEEP (already in .env.local)
CONTROL_DATABASE_URL=postgresql://postgres:...@db.asuxcwlbzspsifvigmov.supabase.co:5432/postgres
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_JWKS_URL=https://asuxcwlbzspsifvigmov.supabase.co
DATABASE_URL=postgresql://postgres:...@db.asuxcwlbzspsifvigmov.supabase.co:5432/postgres
```

---

## 📦 NPM Dependencies

**Remove:**
```bash
firebase ^12.3.0
firebase-admin ^12.3.0
```

**Already Available:**
```bash
@supabase/supabase-js (for client)
pg (PostgreSQL client - already included)
```

---

## 📝 Implementation Plan

### **Phase 1: Create Supabase Auth Module** ✅ READY

**File:** `src/lib/supabase/auth.ts`
- Supabase client initialization
- Sign up with email/password
- Sign in with email/password
- Password reset
- Token refresh
- Sign out

### **Phase 2: Replace Session Management** ✅ READY

**File:** `src/lib/supabase/session.ts`
- Supabase JWT token handling
- Cookie management
- Token verification via JWKS

### **Phase 3: Replace Auth Provider** ✅ READY

**File:** `src/components/AuthProvider.tsx`
- Use Supabase auth state
- Update onAuthStateChanged listener
- Update sign in/out methods

### **Phase 4: Replace API Endpoints** ✅ READY

**Files:**
- `src/app/api/auth/login/route.ts` → Use Supabase auth
- `src/app/api/auth/signup/route.ts` → Use Supabase auth
- `src/app/api/auth/logout/route.ts` → Clear session
- `src/app/api/auth/me/route.ts` → Fetch from Supabase users table
- `src/app/api/auth/permissions/route.ts` → Fetch from PostgreSQL permissions table

### **Phase 5: Update Middleware** ✅ READY

**File:** `middleware.ts`
- Already JWT-based (compatible!)
- Just verify against Supabase JWKS endpoint

### **Phase 6: Delete Firebase Code** ✅ READY

**Files to Delete:**
- `src/lib/firebaseClient.ts`
- `src/lib/firebase/firebase-admin.ts`
- `src/lib/firebase/firebase-client.ts`
- Update `src/lib/firebase/rbac.ts` (remove Firebase references)

### **Phase 7: Clean Up Dependencies** ✅ READY

```bash
npm uninstall firebase firebase-admin
```

---

## 🔐 Supabase Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN FLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Frontend: User submits email/password
   ↓
2. POST /api/auth/login
   ├─ Parse & validate input
   ├─ Call: supabase.auth.signInWithPassword(email, password)
   ├─ Response: { session: { access_token, refresh_token }, user }
   ├─ Store: access_token in httpOnly cookie
   └─ Return: { success: true, user }

3. Frontend: Set Authorization header with token
   ├─ All subsequent requests include: Authorization: Bearer {access_token}
   └─ Middleware validates JWT against Supabase JWKS

4. API Routes:
   ├─ Extract JWT from Authorization header
   ├─ Verify JWT signature with Supabase JWKS
   ├─ Extract claims: sub (user_id), tenant_id
   ├─ Query PostgreSQL tables: users, roles, permissions
   └─ Return user data with permissions

5. Token Refresh (automatic):
   ├─ When access_token expires (15 minutes)
   ├─ Use refresh_token to get new access_token
   ├─ POST /api/auth/refresh
   └─ Update cookie with new token
```

---

## 🎯 Implementation Steps

### Step 1: Create Supabase Auth Module
**File:** `src/lib/supabase/auth.ts` (NEW)
- Initialize Supabase client
- Export auth methods

### Step 2: Create Session Helpers
**File:** `src/lib/supabase/session.ts` (NEW)
- JWT token helpers
- Cookie management

### Step 3: Create API Endpoints
**Files:** `src/app/api/auth/*` (REPLACE)
- `/signup` - New user registration
- `/login` - Email/password login
- `/logout` - Clear session
- `/refresh` - Token refresh
- `/me` - Get current user

### Step 4: Update Components
**Files:** (REPLACE)
- `src/components/AuthProvider.tsx`
- `src/hooks/useAuth.tsx`

### Step 5: Delete Firebase Files
**Files:** (DELETE)
- `src/lib/firebaseClient.ts`
- `src/lib/firebase/firebase-admin.ts`
- All Firebase-only imports

### Step 6: Update Environment
**Files:** (UPDATE)
- `.env` - Remove all FIREBASE_* variables
- `docker-compose.dev.yml` - Remove FIREBASE_* env vars
- `.env.local` - Keep only Supabase vars

---

## 📊 Supabase Auth Table Structure

**Table: `public.users` (PostgreSQL)**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Table: `auth.users` (Supabase Auth)**
- Managed automatically by Supabase
- Contains: id (UUID), email, encrypted_password, email_confirmed_at
- Triggers: `public.users` insert when auth user created

---

## ✅ Verification Checklist

After implementation:

- [ ] `.env` has NO FIREBASE_* variables
- [ ] `.env.local` has ONLY Supabase credentials
- [ ] `npm install` doesn't complain about missing Firebase
- [ ] All imports of `firebase` packages removed
- [ ] Login flow works with Supabase auth
- [ ] JWT tokens verified in middleware
- [ ] Permissions fetched from PostgreSQL
- [ ] Admin user can login
- [ ] Token refresh works
- [ ] Logout clears session
- [ ] Genkit AI flows still work with Firebase client

---

## ⚠️ Critical Points

1. **Genkit Keep:** Keep `src/ai/**` untouched - it still needs Firebase
2. **JWT Compatibility:** Current middleware is JWT-ready! Just needs JWKS update
3. **Zero Downtime:** Can implement in one session (2-3 hours)
4. **Fallback:** Keep this doc accessible for rollback if needed

---

## 🎬 Ready to Start?

**Next Step:** Run implementation commands

```bash
# 1. Create new Supabase auth module
# 2. Update API endpoints
# 3. Replace components
# 4. Delete old Firebase files
# 5. Test login flow
# 6. Remove Firebase from package.json
# 7. Clean environment variables
```

**Estimated Time:** 2-3 hours  
**Complexity:** Medium  
**Risk:** Low (Supabase infrastructure already verified ✅)
