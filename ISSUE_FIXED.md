# ✅ Issue Fixed: Login 400 Error

## Problem Summary

After successfully seeding the admin account and implementing Supabase authentication, login attempts were returning **HTTP 400 errors** with the message:
```json
{"success":false,"message":"Missing ID token"}
```

## Root Cause

**File Conflict in Route Handler**

The `/api/auth/login` endpoint had **three conflicting route files** in the same directory:
- `route.ts` (Old Firebase-based implementation - expecting `idToken` parameter)
- `route-supabase.ts` (New Supabase implementation - expecting `email` and `password`)
- `route-new.ts` (Unused alternate implementation)

Next.js only recognizes `route.ts` as the active route handler, so the **old Firebase implementation was being used instead of the new Supabase one**.

The old Firebase route was checking for `idToken` in the request body:
```typescript
const { idToken } = body;
if (!idToken) {
  return NextResponse.json(
    { success: false, message: 'Missing ID token' },
    { status: 400 }
  );
}
```

But the client was sending `email` and `password` (Supabase format), causing the validation to fail.

## Solution

1. **Deleted** old Firebase login route: `route.ts`
2. **Deleted** unused alternate route: `route-new.ts`
3. **Renamed** Supabase route: `route-supabase.ts` → `route.ts`

## Files Changed

```
src/app/api/auth/login/
  ❌ route.ts (DELETED - old Firebase implementation)
  ❌ route-new.ts (DELETED - unused)
  ✅ route-supabase.ts → route.ts (RENAMED - now active)
```

## Verification

### Before Fix
```
POST /api/auth/login
Request: { "email": "admin@arcus.local", "password": "Admin@123456" }
Response: 400 { "success": false, "message": "Missing ID token" }
```

### After Fix
```
POST /api/auth/login
Request: { "email": "admin@arcus.local", "password": "Admin@123456" }
Response: 200 {
  "success": true,
  "user": {
    "id": "48e695cf-45e5-49e4-8c4d-e05b2fea0da4",
    "email": "admin@arcus.local",
    "createdAt": "2025-10-27T19:40:26.892198Z"
  },
  "message": "Logged in successfully"
}
```

## Test Results

✅ Admin credentials work: `admin@arcus.local` / `Admin@123456`
✅ Login returns 200 status code
✅ Session tokens are set in response
✅ User profile synced between Supabase Auth and PostgreSQL

## Next Steps

1. Test login flow in the browser UI
2. Verify dashboard access after authentication
3. Test logout functionality
4. Verify refresh token handling

## Implementation Details

The new active route (`src/app/api/auth/login/route.ts`) now:
1. Validates email and password using zod schema
2. Calls `signIn()` to authenticate with Supabase
3. Syncs user profile between auth and database layers
4. Sets httpOnly cookies with JWT tokens
5. Returns user info and success message

This matches the complete Supabase Auth migration completed in the previous session.
