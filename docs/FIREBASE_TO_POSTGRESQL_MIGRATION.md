# 🚀 Firebase to PostgreSQL Migration Guide

**Date:** October 27, 2025  
**Status:** IN PROGRESS  
**Completion:** 25%

---

## 📋 Overview

This document tracks the migration from Firebase Authentication/Firestore to PostgreSQL-based authentication and authorization system. The goal is to:

1. **Remove Firebase dependencies** from auth, database, and RBAC
2. **Keep Firebase ONLY for Genkit** (AI flows)
3. **Use PostgreSQL** for all user management, sessions, and permissions
4. **Use JWT tokens** instead of Firebase session cookies
5. **Maintain Permify** for advanced authorization (when API key is provided)

---

## ✅ Completed Steps

### 1. Database Schema Created ✅
**File:** `migrations/control/20251027_create_auth_tables.sql`

**Tables Created:**
- `users` - User accounts with bcrypt password hashing
- `organizations` - Tenant organizations
- `roles` - RBAC roles with JSON permissions
- `user_roles` - Many-to-many mapping
- `refresh_tokens` - JWT refresh token management
- `audit_logs` - Security audit trail

**Features:**
- UUID primary keys
- Timestamp triggers for `updated_at`
- Foreign key constraints with cascading deletes
- Indexes on frequently queried columns
- Account lockout support (failed login attempts)

### 2. TypeORM Entities Created ✅
**File:** `src/lib/entities/auth.entity.ts`

**Entities:**
- `User` - With password hash, email verification, lockout fields
- `Organization` - Tenant organizations with connection strings
- `Role` - Roles with JSONB permissions
- `UserRole` - User-role-organization assignments
- `RefreshToken` - Refresh token storage
- `AuditLog` - Audit trail

### 3. Authentication Service Created ✅
**File:** `src/lib/auth.ts`

**Functions:**
- `hashPassword()` - Bcrypt password hashing (12 rounds)
- `verifyPassword()` - Password verification
- `generateAccessToken()` - JWT access token (15min expiry)
- `generateRefreshToken()` - Crypto-random refresh token
- `verifyAccessToken()` - JWT verification
- `registerUser()` - New user registration
- `loginUser()` - Login with email/password
- `refreshAccessToken()` - Token refresh
- `logoutUser()` - Token revocation
- `getUserById()` - Fetch user by ID
- `getUserPermissions()` - Get user's permissions
- `createAuditLog()` - Audit logging

**Security Features:**
- Account lockout after 5 failed attempts (30 min lockout)
- Refresh token rotation
- Token revocation on logout
- Audit logging for all auth actions
- IP address and device tracking

### 4. Migration Runner Created ✅
**File:** `scripts/migrate-control.js`

**Features:**
- Reads all `.sql` files from `migrations/control/`
- Tracks executed migrations in `migrations` table
- Runs migrations in alphabetical order
- Transaction support (rollback on error)
- Prevents duplicate execution

**Usage:**
```bash
pnpm migrate-control
```

### 5. Admin Seed Script Created ✅
**File:** `scripts/seed-admin.mjs`

**Creates:**
- Default organization (`demo-org`)
- System roles: `admin`, `manager`, `employee`
- Admin user with credentials
- Role assignment

**Default Credentials:**
- Email: `admin@arcus.local`
- Password: `Admin@123456`
- ⚠️ **CHANGE IN PRODUCTION!**

**Usage:**
```bash
pnpm seed:admin
```

### 6. Package Dependencies Installed ✅
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types (stub)
- Existing: `jsonwebtoken`, `@types/jsonwebtoken`

---

## 🔄 In Progress

### 7. New Auth APIs (IN PROGRESS)
Need to create new API routes to replace Firebase Auth:

**Required Routes:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Revoke tokens
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Password reset (TODO)

**Status:** Not started

---

## 📝 Pending Tasks

### 8. Update Existing Auth APIs
**Files to Update:**
- `src/app/api/auth/login/route.ts` - Switch to PostgreSQL login
- `src/app/api/auth/logout/route.ts` - Revoke JWT refresh token
- `src/app/api/auth/me/route.ts` - Fetch from PostgreSQL
- `src/app/api/auth/check-permission/route.ts` - Use PostgreSQL permissions

### 9. Update Session Management
**File:** `src/lib/session.ts` (currently uses Firebase)

**Required Changes:**
- Remove all `getFirebaseAdmin()` calls
- Replace Firebase session cookies with JWT in `Authorization` header
- Update `getCurrentUserFromSession()` to verify JWT
- Update `getSessionClaims()` to read from PostgreSQL

### 10. Update RBAC System
**File:** `src/lib/rbac.ts` (currently uses Firestore)

**Required Changes:**
- Remove all Firestore calls
- Fetch roles/permissions from PostgreSQL
- Update `checkPermission()` to query `user_roles` + `roles` tables
- Integrate with Permify for complex policies (optional)

### 11. Update API Endpoints (19 total)
**All endpoints using Firebase:**
- `src/app/api/vendors/**` - Update auth checks
- `src/app/api/products/**` - Update auth checks
- `src/app/api/inventory/**` - Update auth checks
- `src/app/api/purchase-orders/**` - Update auth checks
- `src/app/api/sales-orders/**` - Update auth checks
- `src/app/api/employees/**` - Update auth checks
- `src/app/api/admin/**` - Update admin auth
- `src/app/api/hrms/**` - Update auth checks

**Required Changes:**
- Replace Firebase session verification with JWT
- Fetch user from PostgreSQL instead of Firestore
- Use PostgreSQL permissions instead of Firestore

### 12. Remove Firebase Dependencies
**Keep ONLY for Genkit:**
- `src/ai/genkit.ts` - Keep Firebase for AI flows
- `src/ai/dev.ts` - Keep Firebase for AI flows
- `src/ai/flows/**` - Keep Firebase for AI flows

**Remove from:**
- `src/lib/firebase/firebase-admin.ts` - Replace with PostgreSQL
- `src/lib/firebase/firestore.ts` - Delete (not used)
- `src/lib/firebase/rbac.ts` - Replace with `src/lib/rbac.ts`
- `src/lib/firebaseClient.ts` - Remove client-side auth
- All test files using Firebase

### 13. Fix Validation Tests
**File:** `src/tests/validation.test.ts`

**5 Failing Tests:**
1. `emailSchema > should lowercase and trim email`
2. `phoneSchema > should reject invalid phone`
3. `slugSchema > should lowercase slug`
4. `validateBody > should return success`
5. `Role Loading > should have permissions array`

**Required Fixes:**
- Add `.toLowerCase().trim()` transforms to schemas
- Fix phone regex validation
- Fix async validateBody function

### 14. Apply Validation Middleware
**Files to Update:**
All 19 API route files need:
```typescript
import { validateBody, vendorSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const result = await validateBody(await req.json(), vendorSchema);
  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  // ... rest of handler
}
```

### 15. Apply Rate Limiting
**File:** `middleware.ts` or individual routes

**Add to all public APIs:**
```typescript
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const limitResponse = await rateLimit(req, RateLimitPresets.generous);
  if (limitResponse) return limitResponse;
  
  // ... rest of handler
}
```

### 16. Environment Variables
**Update `.env.local`:**
```bash
# Remove/comment out Firebase (except for Genkit)
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

# Add PostgreSQL auth
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m

# Keep Firebase for Genkit only
GOOGLE_APPLICATION_CREDENTIALS=./secrets/bobs-firebase-sa.json
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### 17. Docker Build & Test
- Run migrations in Docker
- Seed admin user
- Test login flow
- Verify all APIs work
- Check error handling

### 18. Permify Setup Documentation
Create guide for user to:
1. Sign up for Permify account
2. Get API key
3. Configure `PERMIFY_URL` and `PERMIFY_API_KEY`
4. Define authorization schema
5. Sync policies from PostgreSQL

---

## 📊 Migration Checklist

| Task | Status | Priority | Est. Time |
|------|--------|----------|-----------|
| ✅ Database schema | DONE | P0 | - |
| ✅ TypeORM entities | DONE | P0 | - |
| ✅ Auth service | DONE | P0 | - |
| ✅ Migration runner | DONE | P0 | - |
| ✅ Seed script | DONE | P0 | - |
| ⏳ New auth APIs | TODO | P0 | 2 hrs |
| ⏳ Update session mgmt | TODO | P0 | 1 hr |
| ⏳ Update RBAC | TODO | P0 | 1 hr |
| ⏳ Update 19 endpoints | TODO | P0 | 3 hrs |
| ⏳ Remove Firebase | TODO | P1 | 1 hr |
| ⏳ Fix validation tests | TODO | P1 | 30 min |
| ⏳ Apply validation | TODO | P1 | 2 hrs |
| ⏳ Apply rate limiting | TODO | P1 | 1 hr |
| ⏳ Docker build/test | TODO | P0 | 1 hr |
| ⏳ Permify docs | TODO | P2 | 30 min |

**Total Est. Time:** 13-15 hours

---

## 🎯 Next Steps (Priority Order)

1. **Create new auth API routes** (2 hrs)
   - `/api/auth/register`
   - `/api/auth/login`
   - `/api/auth/refresh`
   - `/api/auth/logout`
   - `/api/auth/me`

2. **Update session management** (1 hr)
   - Switch from Firebase sessions to JWT
   - Update middleware to extract JWT from `Authorization` header

3. **Update RBAC system** (1 hr)
   - Switch from Firestore to PostgreSQL
   - Query `roles` and `user_roles` tables

4. **Update all 19 API endpoints** (3 hrs)
   - Replace Firebase auth with JWT verification
   - Fetch users from PostgreSQL

5. **Test end-to-end** (1 hr)
   - Run migrations
   - Seed admin user
   - Test login → API calls → logout

---

## 🔐 Admin Credentials (After Seeding)

```
Email: admin@arcus.local
Password: Admin@123456
Organization: demo-org

⚠️ IMPORTANT: Change these credentials after first login!
```

---

## 🐳 Docker Deployment Steps

```bash
# 1. Run migrations
pnpm migrate-control

# 2. Seed admin user
pnpm seed:admin

# 3. Build Docker image
docker build -t nextapp .

# 4. Run container
docker run -p 3000:3000 --env-file .env.local nextapp

# 5. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arcus.local","password":"Admin@123456"}'
```

---

## 📚 Documentation Needed

1. **API Documentation** - Updated auth endpoints
2. **Permify Setup Guide** - Step-by-step for user
3. **Migration Guide** - For existing Firebase users
4. **Security Best Practices** - JWT handling, secret rotation
5. **Deployment Guide** - Production environment setup

---

**Last Updated:** October 27, 2025  
**Next Review:** After auth APIs are created
