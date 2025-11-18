-- Fix Admin Permissions: Add ALL missing permission keys
-- This script updates the Administrator role with ALL permission keys from the navigation config

UPDATE roles 
SET permissions = jsonb_build_object(
  'dashboard', jsonb_build_object(
    'view', true,
    'dashboard:view', true
  ),
  
  'users', jsonb_build_object(
    'viewAll', true,
    'users:viewAll', true,
    'users:roles:viewAll', true,
    'users:sessions:view', true
  ),
  
  'settings', jsonb_build_object(
    'view', true,
    'settings:view', true,
    'settings:profile:view', true,
    'settings:auditLog:view', true
  ),
  
  -- Sales Module (11 submodules)
  'sales', jsonb_build_object(
    'dashboard:view', true,
    'sales:dashboard:view', true,
    'leads:view', true,
    'sales:leads:view', true,
    'opportunities:view', true,
    'sales:opportunities:view', true,
    'quotations:view', true,
    'sales:quotations:view', true,
    'orders:view', true,
    'sales:orders:view', true,
    'customers:view', true,
    'sales:customers:view', true,
    'activities:view', true,
    'sales:activities:view', true,
    'visits:view', true,
    'sales:visits:view', true,
    'leaderboard:view', true,
    'sales:leaderboard:view', true,
    'reports:view', true,
    'sales:reports:view', true,
    'settings:edit', true,
    'sales:settings:edit', true
  ),
  
  -- Vendor Module (12 submodules)
  'vendor', jsonb_build_object(
    'view', true,
    'vendor:view', true,
    'viewAll', true,
    'vendor:viewAll', true,
    'onboarding', true,
    'vendor:onboarding', true,
    'purchaseOrders', true,
    'vendor:purchaseOrders', true,
    'invoices', true,
    'vendor:invoices', true,
    'materialMapping', true,
    'vendor:materialMapping', true,
    'priceComparison', true,
    'vendor:priceComparison', true,
    'documents', true,
    'vendor:documents', true,
    'rating', true,
    'vendor:rating', true,
    'communicationLog', true,
    'vendor:communicationLog', true,
    'history', true,
    'vendor:history', true,
    'reorderManagement', true,
    'vendor:reorderManagement', true
  ),
  
  -- Inventory Module (11 submodules)
  'inventory', jsonb_build_object(
    'overview:view', true,
    'inventory:overview:view', true,
    'products:view', true,
    'inventory:products:view', true,
    'goodsInward:view', true,
    'inventory:goodsInward:view', true,
    'goodsOutward:view', true,
    'inventory:goodsOutward:view', true,
    'transfers:view', true,
    'inventory:transfers:view', true,
    'counting:view', true,
    'inventory:counting:view', true,
    'valuationReports:view', true,
    'inventory:valuationReports:view', true,
    'qr:generate', true,
    'inventory:qr:generate', true,
    'factory:view', true,
    'inventory:factory:view', true,
    'store:view', true,
    'inventory:store:view', true,
    'aiCatalog:view', true,
    'inventory:aiCatalog:view', true,
    'viewAll', true,
    'inventory:viewAll', true
  ),
  
  -- Store Module (12 submodules)
  'store', jsonb_build_object(
    'overview:view', true,
    'store:overview:view', true,
    'bills:view', true,
    'store:bills:view', true,
    'billingHistory:view', true,
    'store:billingHistory:view', true,
    'dashboard:view', true,
    'store:dashboard:view', true,
    'debitNote:view', true,
    'store:debitNote:view', true,
    'invoiceFormat:view', true,
    'store:invoiceFormat:view', true,
    'inventory:view', true,
    'store:inventory:view', true,
    'manage', true,
    'store:manage', true,
    'receiving:view', true,
    'store:receiving:view', true,
    'reports:view', true,
    'store:reports:view', true,
    'returns:view', true,
    'store:returns:view', true,
    'staff:view', true,
    'store:staff:view', true
  ),
  
  -- HRMS Module (10 submodules)
  'hrms', jsonb_build_object(
    'overview:view', true,
    'hrms:overview:view', true,
    'announcements:view', true,
    'hrms:announcements:view', true,
    'attendance:view', true,
    'hrms:attendance:view', true,
    'compliance:view', true,
    'hrms:compliance:view', true,
    'employees:view', true,
    'hrms:employees:view', true,
    'leaves:view', true,
    'hrms:leaves:view', true,
    'payroll:view', true,
    'hrms:payroll:view', true,
    'performance:view', true,
    'hrms:performance:view', true,
    'recruitment:view', true,
    'hrms:recruitment:view', true,
    'reports:view', true,
    'hrms:reports:view', true
  ),
  
  -- Supply Chain Module (1 submodule)
  'supply-chain', jsonb_build_object(
    'view', true,
    'supplyChain:view', true,
    'supply-chain:view', true
  )
)
WHERE name = 'Administrator';

-- Verify the update
SELECT name, jsonb_object_keys(permissions) as module_count
FROM roles
WHERE name = 'Administrator';

-- Show all permission keys
SELECT jsonb_each_text(permissions) as all_permissions
FROM roles
WHERE name = 'Administrator'
LIMIT 100;
