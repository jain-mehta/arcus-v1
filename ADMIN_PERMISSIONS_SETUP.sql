-- ========================================================================
-- ADMIN FULL PERMISSIONS SETUP
-- ========================================================================
-- This script creates comprehensive admin permissions with access to:
-- - All modules (Inventory, Sales, Store, Vendor, HRMS, Users, Settings)
-- - All sub-modules and features
-- - All operations (view, create, edit, delete, manage, export, etc.)
--
-- Run this in your TENANT_DATABASE_URL after creating the admin user
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE ADMIN ROLE WITH FULL PERMISSIONS
-- ========================================================================

-- First, get the ID of the admin role (or create it if it doesn't exist)
INSERT INTO roles (name, description, permissions) 
VALUES (
  'admin',
  'Full system administrator access - can view, create, edit, delete all data and manage user permissions',
  jsonb_build_object(
    -- INVENTORY MODULE - All permissions
    'inventory', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'view-all-inventory', true,
      'view-store-inventory', true,
      'productMaster', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'import', true,
        'export', true,
        'manageVariants', true,
        'managePricing', true
      ),
      'stock', jsonb_build_object(
        'view', true,
        'viewAll', true,
        'addStock', true,
        'removeStock', true,
        'transfer', true,
        'adjust', true
      ),
      'goodsInward', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'receive', true
      ),
      'goodsOutward', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'dispatch', true
      ),
      'transfers', jsonb_build_object(
        'view', true,
        'create', true,
        'approve', true,
        'execute', true
      ),
      'cycleCounting', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'finalize', true
      ),
      'valuationReports', jsonb_build_object(
        'view', true,
        'generate', true,
        'export', true
      ),
      'qr', jsonb_build_object(
        'generate', true,
        'view', true,
        'print', true
      ),
      'aiCatalog', jsonb_build_object(
        'use', true,
        'manage', true
      )
    ),
    
    -- STORE MODULE - All permissions
    'store', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'bills', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'approve', true,
        'print', true
      ),
      'invoiceFormat', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'setDefault', true
      ),
      'receiving', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'receive', true
      ),
      'returns', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'process', true
      ),
      'manage', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'viewAll', true
      ),
      'staff', jsonb_build_object(
        'view', true,
        'manage', true
      ),
      'reports', jsonb_build_object(
        'view', true,
        'generate', true,
        'export', true
      ),
      'dashboard', jsonb_build_object(
        'view', true,
        'viewAll', true
      ),
      'debitNote', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true
      ),
      'billingHistory', jsonb_build_object(
        'view', true,
        'export', true
      )
    ),
    
    -- VENDOR MODULE - All permissions
    'vendor', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'list', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
      ),
      'documents', jsonb_build_object(
        'view', true,
        'upload', true,
        'delete', true,
        'download', true
      ),
      'invoices', jsonb_build_object(
        'view', true,
        'download', true,
        'match', true
      ),
      'purchaseOrders', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'approve', true,
        'cancel', true
      ),
      'materialMapping', jsonb_build_object(
        'view', true,
        'edit', true,
        'create', true
      ),
      'priceComparison', jsonb_build_object(
        'view', true,
        'generate', true,
        'export', true
      ),
      'rating', jsonb_build_object(
        'view', true,
        'rate', true,
        'edit', true
      ),
      'history', jsonb_build_object(
        'view', true,
        'export', true
      ),
      'onboarding', jsonb_build_object(
        'view', true,
        'create', true,
        'approve', true
      ),
      'dashboard', jsonb_build_object(
        'view', true,
        'viewAll', true
      ),
      'reorderManagement', jsonb_build_object(
        'view', true,
        'edit', true
      )
    ),
    
    -- SALES MODULE - All permissions
    'sales', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'leads', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'convertToOpportunity', true,
        'export', true
      ),
      'opportunities', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'updateStatus', true,
        'updatePriority', true
      ),
      'quotations', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'generateFromAI', true,
        'createOrder', true,
        'send', true
      ),
      'orders', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'confirm', true,
        'ship', true,
        'cancel', true
      ),
      'customers', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'viewAll', true
      ),
      'reports', jsonb_build_object(
        'view', true,
        'generate', true,
        'export', true,
        'schedule', true
      ),
      'leaderboard', jsonb_build_object(
        'view', true,
        'viewAll', true
      ),
      'settings', jsonb_build_object(
        'view', true,
        'edit', true,
        'manage', true
      ),
      'activities', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
      ),
      'visits', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
      ),
      'communicationLog', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true
      ),
      'dashboard', jsonb_build_object(
        'view', true,
        'viewAll', true
      )
    ),
    
    -- HRMS MODULE - All permissions
    'hrms', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'employees', jsonb_build_object(
        'view', true,
        'viewAll', true,
        'create', true,
        'edit', true,
        'delete', true,
        'manageDocuments', true,
        'manageBankDetails', true
      ),
      'payroll', jsonb_build_object(
        'view', true,
        'generate', true,
        'approve', true,
        'settlePayslips', true,
        'viewPayslips', true,
        'manageFormats', true,
        'settlement', true
      ),
      'attendance', jsonb_build_object(
        'view', true,
        'markAttendance', true,
        'edit', true,
        'approve', true,
        'exportReport', true
      ),
      'leaves', jsonb_build_object(
        'view', true,
        'applyLeave', true,
        'approveLeave', true,
        'viewPolicy', true,
        'managePolicy', true
      ),
      'performance', jsonb_build_object(
        'view', true,
        'createCycle', true,
        'startAppraisal', true,
        'submitReview', true,
        'approveReview', true,
        'finalizeCycle', true
      ),
      'recruitment', jsonb_build_object(
        'view', true,
        'createJobOpening', true,
        'editJobOpening', true,
        'manageApplicants', true,
        'updateStage', true,
        'sendOffer', true
      ),
      'compliance', jsonb_build_object(
        'view', true,
        'manage', true,
        'viewReports', true
      ),
      'announcements', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'managePolicies', true
      ),
      'reports', jsonb_build_object(
        'view', true,
        'generate', true,
        'export', true,
        'schedule', true
      ),
      'dashboard', jsonb_build_object(
        'view', true,
        'viewAll', true
      )
    ),
    
    -- USER MANAGEMENT MODULE - All permissions
    'users', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'create', true,
      'edit', true,
      'delete', true,
      'manageRoles', true,
      'managePermissions', true,
      'manageSessions', true,
      'roles', jsonb_build_object(
        'view', true,
        'create', true,
        'edit', true,
        'delete', true,
        'manage', true
      ),
      'sessions', jsonb_build_object(
        'view', true,
        'revoke', true,
        'viewAll', true
      ),
      'permissions', jsonb_build_object(
        'view', true,
        'manage', true,
        'assign', true
      )
    ),
    
    -- SETTINGS MODULE - All permissions
    'settings', jsonb_build_object(
      'view', true,
      'edit', true,
      'manage', true,
      'profile', jsonb_build_object(
        'view', true,
        'edit', true,
        'manageSessions', true,
        'manageSecuritySettings', true
      ),
      'systemSettings', jsonb_build_object(
        'view', true,
        'edit', true,
        'manage', true
      ),
      'auditLog', jsonb_build_object(
        'view', true,
        'export', true,
        'filter', true
      ),
      'integrations', jsonb_build_object(
        'view', true,
        'manage', true,
        'connect', true,
        'disconnect', true
      ),
      'apiKeys', jsonb_build_object(
        'view', true,
        'create', true,
        'revoke', true
      ),
      'organization', jsonb_build_object(
        'view', true,
        'edit', true,
        'manageBilling', true
      )
    ),
    
    -- DASHBOARD MODULE - All permissions
    'dashboard', jsonb_build_object(
      'view', true,
      'viewAll', true,
      'access', true,
      'export', true
    ),
    
    -- SUPPLY CHAIN MODULE - All permissions (if exists)
    'supplyChain', jsonb_build_object(
      'view', true,
      'manage', true,
      'planning', true,
      'forecasting', true,
      'optimization', true
    ),
    
    -- ADMIN SPECIFIC - Full system access
    'admin', jsonb_build_object(
      'userManagement', true,
      'roleManagement', true,
      'permissionManagement', true,
      'systemConfiguration', true,
      'auditLogs', true,
      'dataExport', true,
      'dataImport', true,
      'systemMaintenance', true,
      'backupManagement', true,
      'apiManagement', true,
      'integrationManagement', true,
      'billingManagement', true,
      'organizationSettings', true,
      'securitySettings', true,
      'performanceMonitoring', true
    )
  )
)
ON CONFLICT DO NOTHING;

-- ========================================================================
-- STEP 2: ASSIGN ADMIN ROLE TO ADMIN USER
-- ========================================================================

-- First, find or create the admin user (assuming email: admin@arcus.local)
-- The admin user should have been created during initial setup
-- Get the admin user ID
WITH admin_user AS (
  SELECT id FROM users 
  WHERE email = 'admin@arcus.local' 
  LIMIT 1
),
admin_role AS (
  SELECT id FROM roles 
  WHERE name = 'admin' 
  LIMIT 1
)
INSERT INTO user_roles (user_id, role_id)
SELECT admin_user.id, admin_role.id 
FROM admin_user, admin_role
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ========================================================================
-- STEP 3: VERIFY ADMIN PERMISSIONS
-- ========================================================================

-- Query to verify admin has all permissions
SELECT 
  r.name as role_name,
  r.description,
  jsonb_pretty(r.permissions) as all_permissions,
  r.created_at,
  r.updated_at
FROM roles r
WHERE r.name = 'admin';

-- Query to verify admin user is assigned the role
SELECT 
  u.email as user_email,
  u.name as user_name,
  r.name as role_name,
  r.description as role_description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@arcus.local'
ORDER BY u.email, r.name;

-- ========================================================================
-- STEP 4: OPTIONAL - CREATE CASBIN POLICIES FOR ADMIN
-- ========================================================================

-- If using Casbin for fine-grained access control, add these policies:
-- (Note: This assumes you have a casbin_rules or similar table)

-- Admin can access all resources with all actions
-- INSERT INTO casbin_rules (p_type, v0, v1, v2, v3, v4)
-- SELECT 'p', 'admin', 'org:' || (SELECT organization_id FROM users WHERE email = 'admin@arcus.local' LIMIT 1), '*', '*'
-- WHERE NOT EXISTS (SELECT 1 FROM casbin_rules WHERE v0 = 'admin' AND v3 = '*' AND v4 = '*');

-- ========================================================================
-- NOTES
-- ========================================================================
/*
After running this script:

1. The 'admin' role will have full permissions to:
   ✓ View, create, edit, delete all data across all modules
   ✓ Manage users, roles, and permissions
   ✓ Access system settings and configurations
   ✓ Export/import data
   ✓ View audit logs
   ✓ Manage API keys and integrations

2. The admin user (admin@arcus.local) will be assigned the 'admin' role

3. Admin users will have access to:
   - All inventory operations (products, stock, goods movement, valuations)
   - All store operations (billing, invoices, receiving, returns)
   - All vendor operations (documents, prices, ratings, purchase orders)
   - All sales operations (leads, opportunities, quotations, orders)
   - All HRMS operations (employees, payroll, attendance, performance, recruitment)
   - All user management (create, edit, delete, manage roles)
   - All settings (profile, organization, integrations, API keys)
   - Full dashboard access with all reports and exports

4. To assign additional users as admins:
   UPDATE user_roles 
   SET role_id = (SELECT id FROM roles WHERE name = 'admin')
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.com');

5. To view permissions for any user:
   SELECT r.permissions FROM roles r
   JOIN user_roles ur ON r.id = ur.role_id
   JOIN users u ON ur.user_id = u.id
   WHERE u.email = 'user@company.com';

6. To revoke admin access from a user:
   DELETE FROM user_roles 
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@company.com')
   AND role_id = (SELECT id FROM roles WHERE name = 'admin');
*/

-- ========================================================================
-- END OF ADMIN PERMISSIONS SETUP
-- ========================================================================
