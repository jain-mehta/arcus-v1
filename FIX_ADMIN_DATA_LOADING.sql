-- ========================================================================
-- FIX: ADMIN DATA LOADING ISSUE
-- ========================================================================
-- Problem: Dashboard shows 0 products, 0 vendors, etc.
-- Root Cause: Admin user doesn't exist or permissions not properly set
-- Solution: Create admin user and ensure email check works
--
-- Run this in your Supabase SQL Editor
-- ========================================================================

-- ========================================================================
-- STEP 1: CHECK IF ADMIN USER EXISTS
-- ========================================================================

-- Query to see if admin user exists
SELECT id, email, full_name, created_at FROM users WHERE email = 'admin@arcus.local';

-- ========================================================================
-- STEP 2: CREATE ADMIN USER (if not exists)
-- ========================================================================

-- If admin user doesn't exist, create it
INSERT INTO users (email, full_name, is_active, organization_id)
SELECT 
  'admin@arcus.local',
  'Admin User',
  true,
  (SELECT organization_id FROM users LIMIT 1) -- Use same org as first user
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@arcus.local'
);

-- ========================================================================
-- STEP 3: CREATE ADMIN ROLE (if not exists)
-- ========================================================================

INSERT INTO roles (name, description, permissions)
SELECT 
  'admin',
  'Full system administrator with access to all modules and operations',
  jsonb_build_object(
    'admin', true,
    'dashboard', true,
    'inventory', true,
    'store', true,
    'vendor', true,
    'sales', true,
    'hrms', true,
    'users', true,
    'settings', true,
    'supplyChain', true
  )
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE name = 'admin'
);

-- ========================================================================
-- STEP 4: ASSIGN ADMIN ROLE TO ADMIN USER
-- ========================================================================

-- Get admin user and admin role IDs, then assign role
WITH admin_user AS (
  SELECT id FROM users WHERE email = 'admin@arcus.local' LIMIT 1
),
admin_role AS (
  SELECT id FROM roles WHERE name = 'admin' LIMIT 1
)
INSERT INTO user_roles (user_id, role_id)
SELECT admin_user.id, admin_role.id 
FROM admin_user, admin_role
WHERE EXISTS (SELECT 1 FROM admin_user)
  AND EXISTS (SELECT 1 FROM admin_role)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ========================================================================
-- STEP 5: VERIFY SETUP
-- ========================================================================

-- Check 1: Admin user exists
SELECT 
  'Admin User' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM users 
WHERE email = 'admin@arcus.local';

-- Check 2: Admin role exists
SELECT 
  'Admin Role' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM roles 
WHERE name = 'admin';

-- Check 3: Admin user has admin role assigned
SELECT 
  'Admin Role Assignment' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@arcus.local' AND r.name = 'admin';

-- Check 4: Show admin user details
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role_name,
  u.is_active,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@arcus.local';

-- Check 5: Count actual data in tables
SELECT 
  'Products' as table_name,
  COUNT(*) as count
FROM products
UNION ALL
SELECT 
  'Vendors' as table_name,
  COUNT(*) as count
FROM vendors
UNION ALL
SELECT 
  'Purchase Orders' as table_name,
  COUNT(*) as count
FROM purchase_orders
UNION ALL
SELECT 
  'Sales Orders' as table_name,
  COUNT(*) as count
FROM sales_orders
UNION ALL
SELECT 
  'Users' as table_name,
  COUNT(*) as count
FROM users;

-- ========================================================================
-- NEXT STEPS
-- ========================================================================
/*
1. Run all SQL queries above in order
2. Check the verification queries - they should all show ✅ PASS
3. If admin user doesn't exist, it will be created
4. Login to the app as: admin@arcus.local (you'll need to set password in auth)
5. Try accessing dashboard - data should now load!

If data is still showing 0:
- Check if products/vendors actually exist in database (see last query)
- Check browser console for errors (F12)
- Check network tab to see if API calls are working
- Verify user is actually logged in as admin@arcus.local

The permission system has 3 checks in order:
1. Email check: if email = 'admin@arcus.local' → grant all permissions ✅
2. Role check: if role_id = 'admin' → grant all permissions ✅
3. Casbin check: detailed permission matrix
*/

-- ========================================================================
-- BONUS: If you need to set a password for admin user
-- ========================================================================
/*
To set password for admin user in Supabase:

1. Go to Supabase Dashboard
2. Go to Authentication > Users
3. Search for admin@arcus.local
4. Click the user
5. Click "Reset Password" 
6. Send password reset email
7. Admin completes password reset and can login

Or use Supabase API to directly set password (advanced).
*/
