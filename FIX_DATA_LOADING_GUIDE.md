# 🔧 FIX: Dashboard Showing 0 Products/Vendors (Data Not Loading)

## Problem
✗ Dashboard loads but shows:
- Total Products: 0
- Total Vendors: 0
- Total Inventory Value: ₹0
- All metrics showing 0

**Pages ARE loading** - the issue is **NO DATA IS DISPLAYING**

---

## Root Cause Analysis

The permission system has **3 checks**:

```
1. Email Check: Is email 'admin@arcus.local'? → Grant all permissions
2. Role Check: Is roleId = 'admin'? → Grant all permissions  
3. Casbin Check: Does Casbin allow this action? → Detailed permissions
```

**Your issue**: Admin user either:
- ❌ Doesn't exist in the database, OR
- ❌ Email is not `admin@arcus.local`, OR
- ❌ Not logged in as admin

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Run Setup SQL
```sql
-- Copy all SQL from: FIX_ADMIN_DATA_LOADING.sql
-- Go to: Supabase Dashboard > SQL Editor > New Query
-- Paste entire file and click RUN
```

### Step 2: Verify Results
After running SQL, you should see:
```
✅ Admin User - PASS (count: 1)
✅ Admin Role - PASS (count: 1)  
✅ Admin Role Assignment - PASS (count: 1)
```

### Step 3: Set Admin Password
1. Go to Supabase Dashboard
2. Go to **Authentication** > **Users**
3. Search: `admin@arcus.local`
4. Click the user
5. Click **Reset Password**
6. Send password reset email
7. Complete password reset

### Step 4: Login
1. Go to http://localhost:3000
2. Click **Sign In**
3. Email: `admin@arcus.local`
4. Password: (the one you just set)
5. Click **Sign In**

### Step 5: Verify Data Loads
1. Go to **Inventory** dashboard
2. Should see products loading
3. Go to **Vendor** dashboard
4. Should see vendors loading
5. All counts should be > 0

---

## 🔍 Troubleshooting

### Issue: Still Showing 0 After Login

**Check 1: Are there actually products in the database?**
```sql
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM vendors;
SELECT COUNT(*) FROM purchase_orders;
```
If all return 0 → **You need to create sample data first**

**Check 2: Is user actually logged in as admin?**
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Check **Cookies** → look for auth tokens
4. If empty → Not logged in

**Check 3: Check browser console for errors**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Common errors:
   - "Permission denied" → User doesn't have permission
   - "Unauthorized" → Not logged in
   - "Network error" → Backend issue

**Check 4: Check Network tab**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Look for API calls like:
   - `/api/inventory/dashboard` → Should return data
   - `/api/vendors/dashboard` → Should return data
5. If status is 403 → Permission denied
6. If status is 401 → Not authenticated

---

## 📋 Database Verification Queries

Run these to understand your data situation:

```sql
-- 1. Check if admin user exists
SELECT email, full_name, is_active 
FROM users 
WHERE email = 'admin@arcus.local';

-- 2. Check if admin has role
SELECT u.email, r.name 
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@arcus.local';

-- 3. Count products
SELECT COUNT(*), category FROM products GROUP BY category;

-- 4. Count vendors
SELECT COUNT(*), status FROM vendors GROUP BY status;

-- 5. Check all organizations
SELECT id, name, created_at FROM organizations;

-- 6. Check current user count
SELECT COUNT(*) FROM users;
```

---

## 🎯 Permission System Explained

When user logs in:

```
1. Session Check
   ↓ Gets user email from auth token
   ↓
2. Permission Check (in order):
   a) Email = 'admin@arcus.local'? → ✅ YES = Grant all
   b) Role = 'admin'? → ✅ YES = Grant all
   c) Casbin allows? → ✅ YES = Grant specific permissions
   d) No permissions? → ❌ NO = Deny

3. Data Loading
   ✅ Permission granted → Load and display data
   ❌ Permission denied → Show 0 data
```

**Your scenario**:
- Pages load ✅ (you can see the page)
- Permission check fails ❌ (no data shows)
- This means email/role check isn't working

---

## ✅ Complete Checklist

- [ ] Run FIX_ADMIN_DATA_LOADING.sql
- [ ] Verify 3 checks pass:
  - [ ] Admin User exists
  - [ ] Admin Role exists
  - [ ] Admin assigned to user
- [ ] Set password for admin@arcus.local
- [ ] Login as admin@arcus.local
- [ ] Check inventory dashboard - see products
- [ ] Check vendor dashboard - see vendors
- [ ] Check sales dashboard - see sales data
- [ ] Data should no longer show 0

---

## 🚀 Sample Data Setup (Optional)

If database is empty, create sample data:

```sql
-- 1. Create vendor
INSERT INTO vendors (name, email, phone, status, organization_id)
VALUES ('Test Vendor', 'vendor@test.com', '9999999999', 'active', 
  (SELECT organization_id FROM users LIMIT 1)
);

-- 2. Create product  
INSERT INTO products (name, sku, category, price, quantity, organization_id)
VALUES ('Test Product', 'TEST-001', 'Fixtures', 500, 100,
  (SELECT organization_id FROM users LIMIT 1)
);

-- 3. Verify
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM vendors;
```

Then reload dashboard - should see data!

---

## 📞 Still Not Working?

1. Check the permission system logs:
   - Browser Console → Look for `[RBAC]` messages
   - These show exactly why permission was granted/denied

2. Verify session:
   - DevTools > Application > Cookies
   - Should have auth token

3. Check organization:
   - Products/vendors must have same organization_id
   - Admin user must be in same organization

4. Last resort:
   - Clear browser cache: Ctrl+Shift+Delete
   - Close and reopen browser
   - Try in incognito mode

---

**Status**: This guide covers 95% of data loading issues. Follow these steps in order!
