/**
 * Role-Based Access Control (RBAC) System
 * 
 * Powered by Casbin - Enterprise-grade authorization engine
 * 
 * Features:
 * - Domain-based multi-tenancy (per organization)
 * - Hierarchical roles with inheritance
 * - Resource-level permissions with wildcard support
 * - Dynamic policy management
 * - Audit logging integration
 * 
 * Permission Structure:
 * - Subject: user:{userId} or role:{roleName}
 * - Domain: org:{organizationId}
 * - Object: resource path (e.g., 'sales:leads:*', 'store:pos:access')
 * - Action: operation (e.g., 'view', 'create', 'edit', 'delete', '*')
 * 
 * Example Permission Check:
 * user:123, org:456, sales:leads, view -> true/false
 */

// Database types for RBAC
interface User {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
  role_ids?: string[];
  is_active?: boolean;
}
import { checkCasbin, getPermissionsForUser, initCasbin } from './casbinClient';

export interface PermissionMap {
  [module: string]: {
    [submodule: string]: boolean;
  };
}

export interface UserClaims {
  uid: string;
  email?: string;
  orgId?: string;
  roleId?: string;
  roleName?: string | null;  // Add role name for RBAC checks (can be null)
  reportsTo?: string;
  permissions?: PermissionMap;
}

/**
 * Assert that a user has a specific permission
 * @param userClaims - Decoded user claims from session
 * @param moduleName - Module name (e.g., 'store', 'sales')
 * @param submoduleName - Submodule name (e.g., 'bills', 'quotations')
 * @param action - Action to check (default: 'view')
 * @throws Error with 403 status if permission denied
 */
export async function assertPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string,
  action: string = 'view'
): Promise<void> {
  const hasPermission = await checkPermission(userClaims, moduleName, submoduleName, action);
  
  if (!hasPermission) {
    const permissionStr = submoduleName 
      ? `${moduleName}:${submoduleName}:${action}` 
      : `${moduleName}:${action}`;
    const error: any = new Error(`Permission denied: ${permissionStr}`);
    error.status = 403;
    throw error;
  }
}

/**
 * Get all permissions for a user (from Casbin, including role inheritance)
 * @param userClaims - User claims from session
 * @returns Array of permission objects { resource, action, effect }
 */
export async function getAllUserPermissions(userClaims: UserClaims): Promise<Array<{resource: string, action: string, effect: string}>> {
  // Import from policyAdapterCasbin
  const { getUserPermissions } = await import('./policyAdapterCasbin');
  
  if (!userClaims.orgId) {
    console.log('[RBAC] No organization ID, returning empty permissions');
    return [];
  }

  try {
    const permissions = await getUserPermissions(userClaims.uid, userClaims.orgId);
    console.log(`[RBAC] Retrieved ${permissions.length} permissions for user ${userClaims.uid}`);
    // Map to ensure proper types
    return permissions.map(p => ({
      resource: p.resource,
      action: p.action,
      effect: p.effect || 'allow'
    }));
  } catch (error) {
    console.error('[RBAC] Failed to get user permissions:', error);
    return [];
  }
}

/**
 * Check if user has a specific permission using Casbin
 * @param userClaims - Decoded user claims from session
 * @param moduleName - Module name (e.g., 'sales', 'store', 'inventory')
 * @param submoduleName - Optional submodule name (e.g., 'leads', 'bills')
 * @param action - Optional action (defaults to 'view')
 * @returns true if permission granted, false otherwise
 */
export async function checkPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string,
  action: string = 'view'
): Promise<boolean> {
  console.log('[RBAC] Checking permission:', { 
    userId: userClaims.uid, 
    email: userClaims.email, 
    moduleName, 
    submoduleName,
    action,
    orgId: userClaims.orgId,
    roleId: userClaims.roleId 
  });

  // Initialize Casbin if not already done
  try {
    await initCasbin();
  } catch (error) {
    console.error('[RBAC] Failed to initialize Casbin:', error);
    // Fall back to basic checks on initialization failure
  }

  // SPECIAL CASE: All authenticated users can view dashboard
  if (moduleName === 'dashboard' && action === 'view') {
    console.log('[RBAC] ✅ All authenticated users can access dashboard');
    return true;
  }

  // FIRST: Check if user has admin role (by role name, from database)
  console.log('[RBAC] Role check:', { 
    userRole: userClaims.roleId, 
    roleName: userClaims.roleName,
    isAdmin: userClaims.roleName === 'Administrator' 
  });
  
  if (userClaims.roleName === 'Administrator') {
    console.log('[RBAC] ✅ Administrator role detected, granting all permissions');
    return true;
  }

  // SECOND: Use Casbin for permission check
  const orgId = userClaims.orgId || 'default-org';
  try {
    // Build resource path
    const resource = submoduleName
      ? `${moduleName}:${submoduleName}`
      : moduleName;

    const allowed = await checkCasbin({
      userId: userClaims.uid,
      organizationId: orgId,
      resource,
      action,
    });

    console.log(`[RBAC] Casbin check result: ${allowed ? '✅ ALLOWED' : '❌ DENIED'}`);
    return allowed;
  } catch (error) {
    console.error('[RBAC] Casbin check error:', error);
    // Fall through to legacy check
  }

  // THIRD: Fallback to legacy permission map (for backward compatibility)
  const claimsPerms = (userClaims as any).permissions;
  if (claimsPerms) {
    const result = checkPermissionInMap(claimsPerms, moduleName, submoduleName);
    console.log('[RBAC] Legacy permission check result:', result);
    return result;
  }

  // No permissions found
  console.log('[RBAC] ❌ No permissions found, denying access');
  return false;
}

/**
 * Helper to check permission in a permission map
 */
function checkPermissionInMap(
  permissions: PermissionMap,
  moduleName: string,
  submoduleName?: string
): boolean {
  const modulePerms = permissions[moduleName];
  
  if (!modulePerms) {
    return false;
  }

  // If checking module-level only
  if (!submoduleName) {
    // Grant access if any submodule permission is true
    return Object.values(modulePerms).some(val => {
      if (typeof val === 'boolean') return val === true;
      if (typeof val === 'object') {
        // Check if any action in the submodule is true
        return Object.values(val).some(actionVal => actionVal === true);
      }
      return false;
    });
  }

  // Check specific submodule permission
  const submodulePerms = modulePerms[submoduleName];
  
  // If it's a boolean (2-level structure)
  if (typeof submodulePerms === 'boolean') {
    return submodulePerms === true;
  }
  
  // If it's an object (3-level structure with actions)
  if (submodulePerms && typeof submodulePerms === 'object') {
    // Grant access if any action is true
    return Object.values(submodulePerms).some(val => val === true);
  }
  
  return false;
}

/**
 * Check if viewer can view target user's data
 * Used for hierarchical data filtering (managers viewing subordinates)
 * 
 * @param viewerClaims - The user trying to view data
 * @param targetUserId - The user ID whose data is being viewed
 * @returns true if viewer can see target's data
 */
export async function canViewUserData(
  viewerClaims: UserClaims,
  targetUserId: string
): Promise<boolean> {
  // Admin can view all
  if (viewerClaims.roleId === 'admin') {
    return true;
  }

  // Can view own data
  if (viewerClaims.uid === targetUserId) {
    return true;
  }

  // TODO: Check if viewer is target's manager in Supabase
  // For now, allow viewing own data only
  return false;
}

/**
 * Get all user IDs that the given user can manage (direct reports)
 * @param managerId - User ID of the manager
 * @param orgId - Organization ID to scope the query
 * @returns Array of user IDs
 */
export async function getDirectReports(managerId: string, orgId?: string): Promise<string[]> {
  // TODO: Implement Supabase query for direct reports
  return [];
}

/**
 * Get all subordinates (recursive) for a manager
 * @param managerId - User ID of the manager
 * @param orgId - Organization ID
 * @returns Array of all subordinate user IDs (direct and indirect)
 */
export async function getSubordinates(managerId: string, orgId: string): Promise<string[]> {
  // TODO: Implement Supabase query for all subordinates
  return [];
}

/**
 * Get role permissions
 * @param roleId - Role ID (UUID from database)
 * @param roleName - Role name (e.g., 'Administrator')
 * @returns Permission map or null if not found
 */
export async function getRolePermissions(roleId: string, roleName?: string | null): Promise<PermissionMap | null> {
  console.log('[RBAC] getRolePermissions called for:', { roleId, roleName });
  
  // If admin role by NAME, return full admin permissions
  if (roleName === 'Administrator') {
    console.log('[RBAC] ✅ Administrator role detected, returning full admin permissions for admin role with 200+ submodule permissions');
    return {
      // MODULE 1: Dashboard
      dashboard: { 
        view: true, 
        manage: true,
        'dashboard:view': true,
        'dashboard:manage': true
      },

      // MODULE 2: Users
      users: { 
        viewAll: true,
        view: true,
        create: true, 
        edit: true, 
        delete: true, 
        manage: true,
        'users:viewAll': true,
        'users:view': true,
        'users:create': true,
        'users:edit': true,
        'users:delete': true,
        'users:manage': true,
        'users:invite': true,
        'users:deactivate': true,
        'users:activate': true,
        'users:resetPassword': true,
        'users:changeRole': true
      },

      // MODULE 3: Roles
      roles: { 
        viewAll: true,
        view: true,
        create: true, 
        edit: true, 
        delete: true, 
        manage: true,
        'roles:viewAll': true,
        'roles:view': true,
        'roles:create': true,
        'roles:edit': true,
        'roles:delete': true,
        'roles:manage': true,
        'roles:assignPermissions': true,
        'roles:clone': true
      },

      // MODULE 4: Permissions
      permissions: { 
        viewAll: true,
        view: true,
        create: true, 
        edit: true, 
        delete: true, 
        manage: true,
        'permissions:viewAll': true,
        'permissions:view': true,
        'permissions:create': true,
        'permissions:edit': true,
        'permissions:delete': true,
        'permissions:manage': true,
        'permissions:assign': true
      },

      // MODULE 5: Store (12 submodules from navigation config)
      store: { 
        // From navigation config - ALL permission strings
        'store:overview:view': true,  // Store Dashboard
        'store:bills:view': true,  // POS Billing
        'store:billingHistory:view': true,  // Billing History
        'store:dashboard:view': true,  // Store Manager Dashboard
        'store:debitNote:view': true,  // Create Debit Note
        'store:invoiceFormat:view': true,  // Invoice Format Editor
        'store:inventory:view': true,  // Store Inventory
        'store:manage': true,  // Manage Stores (existing)
        'store:receiving:view': true,  // Product Receiving
        'store:reports:view': true,  // Store Reports & Comparison
        'store:returns:view': true,  // Returns & Damaged Goods
        'store:staff:view': true,  // Staff & Shift Logs
        
        // Additional store permissions
        'store:bills:create': true,
        'store:bills:edit': true,
        'store:bills:delete': true,
        'store:bills:print': true,
        'store:billingHistory:export': true,
        'store:debitNote:create': true,
        'store:debitNote:edit': true,
        'store:debitNote:approve': true,
        'store:invoiceFormat:create': true,
        'store:invoiceFormat:edit': true,
        'store:invoiceFormat:delete': true,
        'store:inventory:create': true,
        'store:inventory:edit': true,
        'store:inventory:transfer': true,
        'store:manage:create': true,
        'store:manage:edit': true,
        'store:manage:delete': true,
        'store:receiving:create': true,
        'store:receiving:approve': true,
        'store:reports:generate': true,
        'store:reports:export': true,
        'store:returns:create': true,
        'store:returns:approve': true,
        'store:staff:create': true,
        'store:staff:edit': true,
        'store:staff:delete': true,
        'store:staff:assignShift': true,
        
        // Legacy support
        bills: true,
        invoices: true, 
        viewPastBills: true,
        customers: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        'store:bills': true,
        'store:invoices': true,
        'store:viewPastBills': true,
        'store:customers': true,
        'store:view': true,
        'store:create': true,
        'store:edit': true,
        'store:delete': true,
        'store:debitNote': true,
        'store:creditNote': true,
        'store:viewBalance': true,
        'store:createProfile': true,
        'store:editProfile': true,
        'store:viewProfile': true,
        // Stores module submodules from UI
        'store:manageStores': true,
        'store:manageStores:view': true,
        'store:manageStores:create': true,
        'store:manageStores:edit': true,
        'store:manageStores:delete': true,
        'store:billingHistory': true,
        'store:debitNotes': true,
        'store:debitNotes:view': true,
        'store:debitNotes:create': true,
        'store:debitNotes:edit': true,
        'store:debitNotes:delete': true,
        'store:debitNotes:approve': true,
        'store:receiveProducts': true,
        'store:receiveProducts:view': true,
        'store:receiveProducts:create': true,
        'store:receiveProducts:edit': true,
        'store:receiveProducts:approve': true,
        'store:staffShifts': true,
        'store:staffShifts:view': true,
        'store:staffShifts:create': true,
        'store:staffShifts:edit': true,
        'store:staffShifts:delete': true,
        'store:staffShifts:assign': true,
        'store:invoiceFormats': true,
        'store:invoiceFormats:view': true,
        'store:invoiceFormats:create': true,
        'store:invoiceFormats:edit': true,
        'store:invoiceFormats:delete': true,
        // POS System
        'store:pos': true,
        'store:pos:access': true,
        'store:pos:processReturn': true,
        'store:pos:viewTransactions': true,
        'store:pos:managePayments': true,
        'store:pos:closeTill': true,
        'store:pos:openTill': true
      },

      // MODULE 6: Sales (11 submodules from navigation config)
      sales: { 
        // From navigation config - ALL permission strings
        'sales:dashboard:view': true,  // Sales Dashboard
        'sales:leads:view': true,      // Lead Management
        'sales:opportunities:view': true,  // Sales Pipeline
        'sales:quotations:view': true,  // Quotations
        'sales:orders:view': true,     // Sales Orders
        'sales:customers:view': true,  // Customer Accounts
        'sales:activities:view': true, // Sales Activities Log
        'sales:visits:view': true,     // Log a Dealer Visit
        'sales:leaderboard:view': true, // Sales Leaderboard
        'sales:reports:view': true,    // Sales Reports & KPIs
        'sales:settings:edit': true,   // Sales Settings
        
        // Additional sales permissions
        'sales:leads:viewOwn': true,
        'sales:leads:viewTeam': true,
        'sales:leads:viewAll': true,
        'sales:leads:create': true,
        'sales:leads:edit': true,
        'sales:leads:editOwn': true,
        'sales:leads:delete': true,
        'sales:leads:deleteOwn': true,
        'sales:leads:assign': true,
        'sales:leads:export': true,
        'sales:leads:import': true,
        'sales:opportunities:viewOwn': true,
        'sales:opportunities:viewTeam': true,
        'sales:opportunities:viewAll': true,
        'sales:opportunities:create': true,
        'sales:opportunities:edit': true,
        'sales:opportunities:editOwn': true,
        'sales:opportunities:delete': true,
        'sales:opportunities:updateStage': true,
        'sales:opportunities:assign': true,
        'sales:opportunities:export': true,
        'sales:quotations:viewOwn': true,
        'sales:quotations:viewTeam': true,
        'sales:quotations:viewAll': true,
        'sales:quotations:create': true,
        'sales:quotations:edit': true,
        'sales:quotations:editOwn': true,
        'sales:quotations:delete': true,
        'sales:quotations:approve': true,
        'sales:quotations:send': true,
        'sales:quotations:export': true,
        'sales:quotations:viewPricing': true,
        'sales:orders:viewOwn': true,
        'sales:orders:viewAll': true,
        'sales:orders:create': true,
        'sales:orders:edit': true,
        'sales:orders:delete': true,
        'sales:orders:approve': true,
        'sales:customers:viewAll': true,
        'sales:customers:create': true,
        'sales:customers:edit': true,
        'sales:customers:delete': true,
        'sales:activities:viewAll': true,
        'sales:activities:create': true,
        'sales:visits:viewAll': true,
        'sales:visits:create': true,
        'sales:visits:edit': true,
        'sales:leaderboard:viewAll': true,
        'sales:reports:viewAll': true,
        'sales:reports:export': true,
        'sales:settings:view': true,
        // Legacy support
        'sales:dashboard': true,
        quotations: true, 
        leads: true, 
        opportunities: true,
        orders: true,
        customers: true,
        activities: true,
        visits: true,
        leaderboard: true,
        reports: true,
        settings: true,
        viewAll: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },

      // MODULE 7: Vendor
      vendor: { 
        viewAll: true,
        view: true,
        create: true, 
        edit: true, 
        delete: true, 
        manage: true,
        'vendor:viewAll': true,
        'vendor:view': true,
        'vendor:create': true,
        'vendor:edit': true,
        'vendor:delete': true,
        'vendor:manage': true,
        'vendor:documents': true,
        'vendor:communicationLog': true,
        'vendor:history': true,
        'vendor:rating': true,
        'vendor:priceComparison': true,
        'vendor:purchaseOrders': true,
        'vendor:invoices': true,
        'vendor:materialMapping': true,
        'vendor:reorderManagement': true,
        'vendor:profile': true,
        // Vendor UI submodules from screenshot
        'vendor:dashboard': true,
        'vendor:dashboard:view': true,
        'vendor:dashboard:metrics': true,
        'vendor:profiles': true,
        'vendor:profiles:view': true,
        'vendor:profiles:create': true,
        'vendor:profiles:edit': true,
        'vendor:profiles:delete': true,
        'vendor:onboarding': true,
        'vendor:onboarding:view': true,
        'vendor:onboarding:create': true,
        'vendor:onboarding:manage': true,
        'vendor:rawMaterialCatalog': true,
        'vendor:rawMaterialCatalog:view': true,
        'vendor:rawMaterialCatalog:edit': true,
        'vendor:contractDocuments': true,
        'vendor:contractDocuments:view': true,
        'vendor:contractDocuments:upload': true,
        'vendor:contractDocuments:download': true,
        'vendor:contractDocuments:delete': true,
        'vendor:purchaseHistory': true,
        'vendor:purchaseHistory:view': true,
        'vendor:purchaseHistory:export': true,
        'vendor:priceComparison:view': true,
        'vendor:priceComparison:analyze': true,
        // Missing permissions from nav config
        'vendor:viewPerformance': true,
        'vendor:communicate': true
      },

      // MODULE 8: Inventory (11 submodules from navigation config)
      inventory: { 
        // From navigation config - ALL permission strings
        'inventory:overview:view': true,  // Inventory Dashboard
        'inventory:products:view': true,  // Product Master
        'inventory:goodsInward:view': true,  // Goods Inward (GRN)
        'inventory:goodsOutward:view': true,  // Goods Outward
        'inventory:transfers:view': true,  // Stock Transfers
        'inventory:counting:view': true,  // Cycle Counting & Auditing
        'inventory:valuationReports:view': true,  // Inventory Valuation Reports
        'inventory:qr:generate': true,  // QR Code Generator
        'inventory:factory:view': true,  // Factory Inventory
        'inventory:store:view': true,  // Store Inventory
        'inventory:aiCatalog:view': true,  // AI Catalog Assistant
        
        // Additional inventory permissions
        'inventory:products:create': true,
        'inventory:products:edit': true,
        'inventory:products:delete': true,
        'inventory:goodsInward:create': true,
        'inventory:goodsInward:edit': true,
        'inventory:goodsOutward:create': true,
        'inventory:goodsOutward:edit': true,
        'inventory:transfers:create': true,
        'inventory:transfers:edit': true,
        'inventory:transfers:approve': true,
        'inventory:counting:create': true,
        'inventory:counting:edit': true,
        'inventory:counting:approve': true,
        'inventory:valuationReports:export': true,
        'inventory:factory:create': true,
        'inventory:factory:edit': true,
        'inventory:store:create': true,
        'inventory:store:edit': true,
        'inventory:aiCatalog:manage': true,
        
        // Legacy support
        'inventory:viewStock': true,
        'inventory:editStock': true,
        'inventory:viewAll': true,
        'inventory:view': true,
        'inventory:create': true,
        'inventory:edit': true,
        'inventory:delete': true,
        'inventory:manage': true,
        'inventory:productMaster': true,
        'inventory:cycleCounting': true,
        'inventory:goodsInward': true,
        'inventory:goodsOutward': true,
        'inventory:stockTransfers': true,
        'inventory:factory': true,
        'inventory:store': true,
        'inventory:qrCodeGenerator': true,
        'inventory:aiCatalogAssistant': true,
        'inventory:reports': true,
        // Inventory UI dashboard metrics
        'inventory:totalProductsSkus': true,
        'inventory:totalInventoryValue': true,
        'inventory:lowStockItems': true,
        'inventory:inventoryByCategory': true,
        'inventory:recentStockAlerts': true,
        // Inventory sub-module permissions (3-level nested permissions)
        'inventory:stock:view': true,
        'inventory:stock:addStock': true,
        'inventory:stock:removeStock': true,
        'inventory:stock:transferStock': true,
        'inventory:stock:adjustStock': true,
        'inventory:stock:viewStockValue': true,
        'inventory:barcodes:generate': true,
        'inventory:stockAlerts:view': true,
        viewStock: true,
        editStock: true,
        viewAll: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: true
      },

      // MODULE 9: HRMS (11 submodules from navigation config)
      hrms: { 
        // From navigation config - ALL permission strings
        'hrms:overview:view': true,  // HRMS Dashboard
        'hrms:announcements:view': true,  // Announcements
        'hrms:attendance:view': true,  // Attendance & Shifts
        'hrms:compliance:view': true,  // Compliance
        'hrms:employees:view': true,  // Employee Directory
        'hrms:leaves:view': true,  // Leave Management
        'hrms:payroll:view': true,  // Payroll
        'hrms:performance:view': true,  // Performance
        'hrms:recruitment:view': true,  // Recruitment
        'hrms:reports:view': true,  // Reports & Analytics
        
        // Additional HRMS permissions
        'hrms:employees:viewAll': true,
        'hrms:employees:viewOwn': true,
        'hrms:employees:create': true,
        'hrms:employees:edit': true,
        'hrms:employees:delete': true,
        'hrms:employees:viewSalary': true,
        'hrms:employees:editSalary': true,
        'hrms:employees:viewDocuments': true,
        'hrms:employees:manageDocuments': true,
        'hrms:employees:export': true,
        'hrms:payroll:viewAll': true,
        'hrms:payroll:process': true,
        'hrms:payroll:approve': true,
        'hrms:payroll:viewReports': true,
        'hrms:payroll:generatePayslips': true,
        'hrms:payroll:export': true,
        'hrms:payroll:create': true,
        'hrms:payroll:edit': true,
        'hrms:payroll:manage': true,
        'hrms:payroll:formats': true,
        'hrms:payroll:generate': true,
        'hrms:payroll:settlement': true,
        'hrms:attendance:viewAll': true,
        'hrms:attendance:viewOwn': true,
        'hrms:attendance:mark': true,
        'hrms:attendance:edit': true,
        'hrms:attendance:approve': true,
        'hrms:attendance:viewReports': true,
        'hrms:attendance:manageShifts': true,
        'hrms:attendance:export': true,
        'hrms:settlement:view': true,
        'hrms:settlement:viewAll': true,
        'hrms:settlement:create': true,
        'hrms:settlement:process': true,
        'hrms:settlement:approve': true,
        'hrms:settlement:viewDocuments': true,
        'hrms:settlement:export': true,
        'hrms:leaves:viewAll': true,
        'hrms:leaves:viewOwn': true,
        'hrms:leaves:apply': true,
        'hrms:leaves:create': true,
        'hrms:leaves:approve': true,
        'hrms:leaves:reject': true,
        'hrms:leaves:viewBalance': true,
        'hrms:leaves:managePolicy': true,
        'hrms:leaves:cancelLeave': true,
        'hrms:performance:viewAll': true,
        'hrms:performance:create': true,
        'hrms:performance:manage': true,
        'hrms:performance:edit': true,
        'hrms:recruitment:manage': true,
        'hrms:recruitment:applicants': true,
        'hrms:recruitment:createJob': true,
        'hrms:recruitment:viewCandidates': true,
        'hrms:recruitment:scheduleInterview': true,
        'hrms:recruitment:updateStatus': true,
        'hrms:recruitment:makeOffer': true,
        'hrms:announcements:create': true,
        'hrms:announcements:edit': true,
        'hrms:announcements:delete': true,
        'hrms:compliance:manage': true,
        'hrms:reports:generate': true,
        'hrms:reports:export': true,
        
        // Legacy support
        payroll: true,
        attendance: true, 
        settlement: true,
        employees: true,
        leaves: true,
        performance: true,
        recruitment: true,
        announcements: true,
        compliance: true,
        reports: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: true,
        'hrms:payroll': true,
        'hrms:attendance': true,
        'hrms:settlement': true,
        'hrms:employees': true,
        'hrms:leaves': true,
        'hrms:performance': true,
        'hrms:recruitment': true,
        'hrms:announcements': true,
        'hrms:view': true,
        'hrms:create': true,
        'hrms:edit': true,
        'hrms:delete': true,
        'hrms:manage': true,
        // HRMS UI submodules from screenshot
        'hrms:dashboard': true,
        'hrms:dashboard:view': true,
        'hrms:dashboard:metrics': true,
        'hrms:employeeDirectory': true,
        'hrms:employeeDirectory:view': true,
        'hrms:employeeDirectory:manage': true,
        'hrms:attendanceShifts': true,
        'hrms:attendanceShifts:view': true,
        'hrms:attendanceShifts:mark': true,
        'hrms:attendanceShifts:manage': true,
        'hrms:leaveManagement': true,
        'hrms:leaveManagement:view': true,
        'hrms:leaveManagement:apply': true,
        'hrms:leaveManagement:approve': true,
        'hrms:reportsAnalytics': true,
        'hrms:reportsAnalytics:view': true,
        'hrms:reportsAnalytics:generate': true,
        'hrms:reportsAnalytics:export': true
      },

      // MODULE 10: Reports
      reports: { 
        viewAll: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: true,
        'reports:viewAll': true,
        'reports:view': true,
        'reports:create': true,
        'reports:edit': true,
        'reports:delete': true,
        'reports:manage': true,
        'reports:salesReports': true,
        'reports:inventoryReports': true,
        'reports:hrmsReports': true,
        'reports:storeReports': true,
        'reports:vendorReports': true,
        'reports:export': true,
        'reports:schedule': true
      },

      // MODULE 11: Settings
      settings: { 
        manageRoles: true, 
        manageUsers: true,
        manage: true,
        view: true,
        'settings:manageRoles': true,
        'settings:manageUsers': true,
        'settings:manage': true,
        'settings:view': true,
        'settings:profile': true,
        'settings:auditLog': true,
        'settings:permissions': true,
        'settings:organization': true,
        'settings:integrations': true,
        'settings:backup': true,
        'settings:security': true
      },

      // MODULE 12: Audit
      audit: { 
        viewAll: true,
        view: true,
        manage: true,
        'audit:viewAll': true,
        'audit:view': true,
        'audit:manage': true,
        'audit:export': true,
        'audit:filter': true
      },

      // MODULE 13: Admin
      admin: { 
        manage: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        'admin:manage': true,
        'admin:view': true,
        'admin:create': true,
        'admin:edit': true,
        'admin:delete': true,
        'admin:systemSettings': true,
        'admin:userManagement': true,
        'admin:security': true,
        'admin:monitoring': true
      },

      // MODULE 14: Supply Chain (if exists)
      'supply-chain': {
        view: true,
        manage: true,
        create: true,
        edit: true,
        delete: true,
        'supply-chain:view': true,
        'supply-chain:manage': true,
        'supply-chain:create': true,
        'supply-chain:edit': true,
        'supply-chain:delete': true,
        'supply-chain:tracking': true,
        'supply-chain:forecasting': true,
        // Supply Chain sub-modules from nav config
        'supply:purchaseOrders:view': true,
        'supply:purchaseOrders:create': true,
        'supply:purchaseOrders:edit': true,
        'supply:purchaseOrders:approve': true,
        'supply:purchaseOrders:delete': true,
        'supply:bills:view': true,
        'supply:bills:create': true,
        'supply:bills:edit': true,
        'supply:bills:approve': true,
        'supply:bills:delete': true,
        // Alternative naming conventions
        'supply-chain:purchaseOrders:view': true,
        'supply-chain:purchaseOrders:create': true,
        'supply-chain:purchaseOrders:edit': true,
        'supply-chain:purchaseOrders:approve': true,
        'supply-chain:bills:view': true,
        'supply-chain:bills:create': true,
        'supply-chain:bills:edit': true,
        'supply-chain:bills:approve': true
      }
    };
  }

  // For non-admin roles, query the database
  console.log('[RBAC] Querying database for non-admin role:', roleId);
  try {
    const { getSupabaseServerClient } = await import('./supabase/client');
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      console.error('[RBAC] Supabase client not available');
      return null;
    }

    // Query the role from database
    const { data: roleData, error } = await supabase
      .from('roles')
      .select('permissions')
      .eq('id', roleId)
      .single();

    if (error || !roleData) {
      console.log('[RBAC] Role not found:', roleId);
      return null;
    }

    // Parse permissions from JSON
    const permissions = roleData.permissions;
    console.log('[RBAC] Retrieved permissions for role', roleId, ':', permissions ? Object.keys(permissions).length : 0, 'modules');

    if (!permissions) {
      console.log('[RBAC] No permissions found for role:', roleId);
      return null;
    }

    // Transform the permissions into PermissionMap format
    // If permissions is already in the right format, use it directly
    if (typeof permissions === 'object' && !Array.isArray(permissions)) {
      console.log('[RBAC] Permissions is object format, using directly');
      return permissions as PermissionMap;
    }

    // If permissions is an array of permission objects, convert it
    if (Array.isArray(permissions)) {
      console.log('[RBAC] Permissions is array format, converting to PermissionMap');
      const permissionMap: PermissionMap = {};
      
      for (const perm of permissions) {
        if (perm.resource && perm.action) {
          // Parse "module:submodule" format
          const parts = perm.resource.split(':');
          const module = parts[0];
          const submodule = parts[1] || perm.action;
          
          if (!permissionMap[module]) {
            permissionMap[module] = {};
          }
          
          // Set the permission key to true
          const key = parts.length > 1 ? `${submodule}:${perm.action}` : submodule;
          permissionMap[module][key] = true;
          
          // Also set shorthand key for compatibility
          if (!permissionMap[module][submodule]) {
            permissionMap[module][submodule] = true;
          }
        }
      }
      
      console.log('[RBAC] Converted permissions:', Object.keys(permissionMap));
      return permissionMap;
    }

    console.log('[RBAC] Could not parse permissions format');
    return null;
  } catch (error) {
    console.error('[RBAC] Error fetching role permissions:', error);
    return null;
  }
}

/**
 * Check if user has a specific permission (convenience wrapper)
 * @param userClaims - User claims
 * @param moduleName - Module name
 * @param submoduleName - Submodule name
 * @returns true if user has permission
 */
export async function hasPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string
): Promise<boolean> {
  return checkPermission(userClaims, moduleName, submoduleName);
}

