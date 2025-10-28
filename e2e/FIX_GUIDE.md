# Authentication Test Failures - Fix Guide

**Document:** Actionable fixes for test failures  
**Status:** 14 of 32 tests failing  
**Priority:** CRITICAL - Security & Functionality Issues

---

## Overview of Issues

| Issue | Severity | Type | Tests Affected | Fix Time |
|-------|----------|------|-----------------|----------|
| Access control not enforced | 🔴 CRITICAL | Security | 2 | 30 min |
| Login redirect failing | 🔴 CRITICAL | Functionality | 10+ | 20 min |
| JWT expiration wrong | 🟠 HIGH | Configuration | 1 | 5 min |
| Page title outdated | 🟠 MEDIUM | Branding | 1 | 2 min |
| No form element | 🟠 MEDIUM | Test/UI | 1 | 10 min |

---

## FIX #1: Add Access Control Middleware (CRITICAL)

**Affected Tests:** TC-3.3, TC-3.4 (+ others)  
**Security Impact:** HIGH - Users can access dashboard without login  
**Estimated Time:** 30 minutes

### Current Problem
Dashboard is accessible without authentication:
```
Navigate to http://localhost:3000/dashboard (no login)
→ Dashboard loads successfully (WRONG - should redirect to login)
```

### Root Cause
No authentication middleware checking session before rendering dashboard.

### Solution

**File:** `src/middleware.ts`

Add authentication check:
```typescript
import { getSessionClaims } from './lib/session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const session = await getSessionClaims();
    
    if (!session) {
      // No valid session - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### Testing After Fix
```bash
# Clear cookies in browser
# Navigate to http://localhost:3000/dashboard
# Expected: Redirect to /login
```

---

## FIX #2: Debug Login Redirect Issue (CRITICAL)

**Affected Tests:** TC-1.2, TC-2.6, TC-3.2, TC-3.5, TC-5.3, TC-6.3, TC-6.4, TC-7.1  
**Impact:** Blocks 8+ tests  
**Estimated Time:** 20 minutes

### Current Problem
```
User enters: admin@arcus.local / Admin@123456
Click submit
→ Stays on login page (WRONG - should redirect to /dashboard)
```

### Root Cause
Need to debug - check browser network tab

### Solution Steps

1. **Manual Test in Browser:**
   ```
   1. Open http://localhost:3000/login
   2. Open DevTools (F12)
   3. Go to Network tab
   4. Filter for "Fetch/XHR"
   5. Enter email: admin@arcus.local
   6. Enter password: Admin@123456
   7. Click Submit
   8. Look for POST /api/auth/login request
   9. Check response status (should be 200)
   10. Check response body (should contain user data)
   ```

2. **Check Server Logs:**
   - Look at `npm run dev` terminal output
   - Should see `POST /api/auth/login 200`

3. **Possible Issues:**
   - Form not submitting (check form element)
   - API returning error (check response body)
   - Redirect not working in component (check login component logic)

4. **Debug Login Component:**
   ```typescript
   // In src/app/login/page.tsx, add logging:
   
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     console.log('Login attempt:', { email, password: '***' });
     
     try {
       const response = await fetch('/api/auth/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password }),
       });
       
       console.log('Login response:', response.status);
       const data = await response.json();
       console.log('Response data:', data);
       
       if (response.ok) {
         console.log('Login successful, redirecting...');
         router.push('/dashboard');
       } else {
         console.log('Login failed:', data);
         setError(data.message || 'Login failed');
       }
     } catch (error) {
       console.error('Login error:', error);
       setError('Network error');
     }
   };
   ```

5. **After Debugging:**
   - Fix any identified issues
   - Re-run manual test
   - Run automated tests

---

## FIX #3: Update JWT Expiration (HIGH)

**Affected Tests:** TC-4.4  
**Current:** 3599 seconds (~1 hour)  
**Should Be:** 900 seconds (15 minutes)  
**Estimated Time:** 5 minutes

### Solution

**Option A: Supabase Console**
1. Go to Supabase Dashboard
2. Settings → API & Auth
3. JWT Expiration: Set to 900 seconds

**Option B: Environment Variable**
```bash
# .env.local
SUPABASE_JWT_EXPIRY=900
```

**Verification:**
```bash
# Login and check JWT
# Decode token at https://jwt.io
# Check 'exp' field: exp - now should be ≤ 920 seconds
```

---

## FIX #4: Update Page Title (MEDIUM)

**Affected Tests:** TC-1.1  
**Current Title:** "Firebase Command Center"  
**Should Be:** "Login - Arcus" or similar  
**Estimated Time:** 2 minutes

### Solution

**File:** `src/app/login/page.tsx`

Add metadata at top of file:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Arcus',
  description: 'Sign in to your account',
};
```

Or in layout:
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Arcus Admin',
  description: 'Arcus Admin Dashboard',
};
```

---

## FIX #5: Add Form Element or Update Test (MEDIUM)

**Affected Tests:** TC-6.6  
**Current Issue:** No `<form>` element found  
**Estimated Time:** 10 minutes

### Option A: Add Form Element (Recommended)

**File:** `src/app/login/page.tsx`

```typescript
export default function LoginPage() {
  return (
    <form onSubmit={handleLogin}>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### Option B: Update Test

**File:** `e2e/authentication-complete.spec.ts`

Change test TC-6.6:
```typescript
test('TC-6.6: Should prevent CSRF attacks', async ({ page }) => {
  await page.goto(LOGIN_URL);

  // Instead of looking for <form>, look for login elements
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  
  expect(emailInput).toBeVisible();
  expect(passwordInput).toBeVisible();
  // OR just check for submit button existence
  const submitButton = page.locator('button[type="submit"]');
  expect(submitButton).toBeVisible();
});
```

---

## Fix Execution Order

1. **FIRST:** Fix Access Control (FIX #1)
   - 30 minutes
   - Fixes: TC-3.3, TC-3.4
   - Unblocks other tests

2. **SECOND:** Debug & Fix Login Redirect (FIX #2)
   - 20 minutes
   - Fixes: 10+ tests
   - Critical blocker

3. **THIRD:** Update JWT Expiration (FIX #3)
   - 5 minutes
   - Fixes: TC-4.4

4. **FOURTH:** Update Page Title (FIX #4)
   - 2 minutes
   - Fixes: TC-1.1

5. **FIFTH:** Fix Form Element (FIX #5)
   - 10 minutes
   - Fixes: TC-6.6

**Total Time:** ~60 minutes

---

## Verification Checklist

After applying fixes:

- [ ] Access control middleware added
- [ ] Login redirect working (manual browser test)
- [ ] JWT expiration set to 900 seconds
- [ ] Page title updated
- [ ] Form element present or test updated

Re-run tests:
```bash
npx playwright test e2e/authentication-complete.spec.ts
```

Expected result:
```
✓ 32 passed (1.5m)
0 failed
Exit code: 0
```

---

## Testing During Fixes

### Test Login Manually
```
1. npm run dev (in one terminal)
2. Open http://localhost:3000/login
3. Enter: admin@arcus.local
4. Enter: Admin@123456
5. Click Submit
6. Should redirect to /dashboard
7. Should see dashboard content
```

### Test Access Control Manually
```
1. Clear browser cookies
2. Open http://localhost:3000/dashboard
3. Should redirect to /login
4. Should NOT show dashboard
```

### Check Server Logs
```
Should see:
[Auth] Request body: { email: 'admin@arcus.local', passwordLength: 12 }
[Supabase Auth] User signed in: admin@arcus.local
POST /api/auth/login 200 in XXXms
```

---

## Support

If stuck:

1. **Check browser console** (F12 → Console)
   - Look for JavaScript errors
   - Check network requests

2. **Check server logs**
   - npm run dev output
   - Look for errors or warnings

3. **Check network tab** (F12 → Network)
   - See if requests are being made
   - Check response status and body

4. **Restart server**
   - Stop npm run dev (Ctrl+C)
   - Run npm run dev again
   - Re-test

---

**Last Updated:** October 28, 2025  
**Next Step:** Apply Fix #1 (Access Control Middleware)
