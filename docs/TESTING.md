# 🚀 Login Flow Test Guide

## Current Status

✅ **Fixes Applied:**
1. Cookie name corrected: `__supabase_access_token` ✓
2. JWT decoding fixed on server-side ✓
3. Admin email check added (now includes multiple emails) ✓

❌ **Current Issue:**
- Admin email appears to be `admin@bobssale.com` (from logs)
- But being checked as `admin@arcus.local`
- Permission denied error

---

## Testing Steps

### Step 1: Verify Server is Running
```bash
npm run dev
```

Wait for output:
```
✓ Ready in 2.8s
```

### Step 2: Run Full Flow Test
```bash
node scripts/test-full-flow.cjs
```

**Expected Output:**
```
🧪 Testing Full Login Flow

📝 Test: Admin Login
   Email: admin@bobssale.com
   Password: Admin@123456

   Step 1: POST /api/auth/login
   ✓ Status: 200
   ✓ User: admin@bobssale.com
   ✓ User ID: [uuid]
   ✓ Cookies set: 2
   ✓ Access token cookie: __supabase_access_token

   Step 2: GET /dashboard
   ✓ Status: 200
   ✓ Dashboard accessible!
   ✅ FULL LOGIN FLOW SUCCESSFUL
```

### Step 3: Manual Browser Test
1. Open: `http://localhost:3000/login`
2. Enter:
   - Email: `admin@bobssale.com`
   - Password: `Admin@123456`
3. Click "Sign In"
4. Should redirect to dashboard

---

## If Tests Fail

### Issue: "Permission denied: dashboard:view"
**Check:**
1. Server logs show admin email
2. Update RBAC admin email list to match
3. Restart dev server

### Issue: "Failed to verify session: null"
**Check:**
1. Cookie `__supabase_access_token` exists in browser
2. Token can be decoded (valid JWT)
3. Check server logs for decoding errors

### Issue: Session lost on dashboard
**Check:**
1. Browser DevTools → Application → Cookies
2. Verify `__supabase_access_token` cookie present
3. Verify cookie has correct domain/path

---

## Admin Credentials

**Default (if seeded):**
```
Email: admin@bobssale.com
Password: Admin@123456
```

**To check actual seeded email:**
```bash
# View seed script
cat scripts/seed-admin.mjs | grep ADMIN_EMAIL
```

---

## Logs to Watch

### Successful Login
```
[Auth] Request body: { email: 'admin@bobssale.com', passwordLength: 12 }
[Supabase Auth] User signed in: admin@bobssale.com
[Auth] User profile synced: { authUserId: '...', email: 'admin@bobssale.com', ... }
POST /api/auth/login 200 in Xms
```

### Successful Dashboard Access
```
[RBAC] Checking permission: { userId: '...', email: 'admin@bobssale.com', moduleName: 'dashboard', ... }
[RBAC] Admin user detected by email, granting all permissions
GET /dashboard 200 in Xms
```

### Failure Cases
```
[Session] Failed to verify session: null
→ JWT decoding failed

[RBAC] No permissions found, denying access
→ Email not in admin list OR roleId not 'admin'
```

---

## Quick Commands

```bash
# Test login endpoint only
node scripts/test-login.cjs

# Test full flow
node scripts/test-full-flow.cjs

# Check build
npm run build

# Type check
npm run typecheck

# Check environment
npm run env:check
```

---

## Expected User Journey

```
1. User lands on http://localhost:3000/login
   ↓
2. Enters email: admin@bobssale.com
           password: Admin@123456
   ↓
3. Clicks "Sign In"
   ↓
4. POST /api/auth/login
   - Validate credentials ✓
   - Authenticate with Supabase ✓
   - Sync user profile ✓
   - Set cookies ✓
   - Return 200 ✓
   ↓
5. Browser redirects to /dashboard
   ↓
6. Server renders dashboard
   - Read access token cookie ✓
   - Decode JWT ✓
   - Check permission ✓
   - Fetch data ✓
   - Render page ✓
   ↓
7. User sees dashboard
```

---

## Checklist for Success

- [ ] npm run dev starts without errors
- [ ] Login endpoint returns 200 with user data
- [ ] Cookies are set in response (Set-Cookie header)
- [ ] RBAC logs show "Admin user detected by email"
- [ ] Dashboard loads without permission error
- [ ] Page refresh maintains session
- [ ] Logout clears cookies

---

## Files Modified (Session Fix)

1. ✅ `src/lib/supabase/session.ts`
   - Fixed cookie name: `__supabase_access_token.env.local` → `__supabase_access_token`

2. ✅ `src/lib/session.ts`
   - Fixed JWT decoding: now decodes JWT manually on server-side

3. ✅ `src/lib/rbac.ts`
   - Added admin email check: includes multiple admin emails

---

## Next: Verify These Work

**Test 1: Quick Login**
```bash
node scripts/test-login.cjs
```

**Test 2: Full Flow**
```bash
node scripts/test-full-flow.cjs
```

**Test 3: Browser**
- Go to http://localhost:3000/login
- Login with seeded credentials
- Verify dashboard loads

**Test 4: Session Persistence**
- Login to dashboard
- Refresh page (F5)
- Verify still logged in

---

**Status:** Ready to test  
**Next Action:** Run test scripts and verify login → dashboard flow  

