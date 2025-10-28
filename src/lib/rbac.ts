/**
 * Role-Based Access Control (RBAC) System
 * 
 * Provides centralized permission checking for the entire application.
 * Supports hierarchical permissions with module :: submodule granularity.
 * 
 * Permission Structure:
 * {
 *   store: { bills: true, invoices: true, viewPastBills: true },
 *   sales: { quotations: true, leads: false },
 *   inventory: { viewStock: true, editStock: false }
 * }
 */

import type { User } from './mock-data/types';

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
  reportsTo?: string;
  permissions?: PermissionMap;
}

/**
 * Assert that a user has a specific permission
 * @param userClaims - Decoded user claims from session
 * @param moduleName - Module name (e.g., 'store', 'sales')
 * @param submoduleName - Submodule name (e.g., 'bills', 'quotations')
 * @throws Error with 403 status if permission denied
 */
export async function assertPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string
): Promise<void> {
  const hasPermission = await checkPermission(userClaims, moduleName, submoduleName);
  
  if (!hasPermission) {
    const permissionStr = submoduleName 
      ? `${moduleName}:${submoduleName}` 
      : moduleName;
    const error: any = new Error(`Permission denied: ${permissionStr}`);
    error.status = 403;
    throw error;
  }
}

/**
 * Check if user has a specific permission
 * @param userClaims - Decoded user claims from session
 * @param moduleName - Module name
 * @param submoduleName - Optional submodule name
 * @returns true if permission granted, false otherwise
 */
export async function checkPermission(
  userClaims: UserClaims,
  moduleName: string,
  submoduleName?: string
): Promise<boolean> {
  console.log('[RBAC] Checking permission:', { userId: userClaims.uid, email: userClaims.email, moduleName, submoduleName, roleId: userClaims.roleId });

  // FIRST: Check if user is admin by email (primary check)
  // Support multiple admin emails
  const adminEmails = ['admin@arcus.local'];
  console.log('[RBAC] Email check:', { userEmail: userClaims.email, isAdmin: userClaims.email ? adminEmails.includes(userClaims.email) : false });
  
  if (userClaims.email && adminEmails.includes(userClaims.email)) {
    console.log('[RBAC] Admin user detected by email, granting all permissions');
    return true;
  }

  // SECOND: Check if user has admin role
  // Admins have all permissions
  console.log('[RBAC] Role check:', { userRole: userClaims.roleId, isAdmin: userClaims.roleId === 'admin' });
  
  if (userClaims.roleId === 'admin') {
    console.log('[RBAC] Admin role detected, granting all permissions');
    return true;
  }

  // THIRD: Check if permissions are in custom claims (for performance)
  const claimsPerms = (userClaims as any).permissions;
  if (claimsPerms) {
    const result = checkPermissionInMap(claimsPerms, moduleName, submoduleName);
    console.log('[RBAC] Permission result from claims:', result);
    return result;
  }

  // Fallback: TODO fetch permissions from Supabase
  // For now, return false if no permissions found
  console.log('[RBAC] No permissions found, denying access');
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
 * @param roleId - Role ID
 * @returns Permission map or null if not found
 */
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  console.log('[RBAC] getRolePermissions called for roleId:', roleId);
  
  // TODO: Implement Supabase query for role permissions
  // For now, provide complete admin permissions for 'admin' role
  if (roleId === 'admin') {
    console.log('[RBAC] Returning full admin permissions for admin role with 200+ submodule permissions');
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

      // MODULE 5: Store
      store: { 
        bills: true,
        invoices: true, 
        viewPastBills: true,
        customers: true,
        manage: true,
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
        'store:manage': true,
        'store:debitNote': true,
        'store:creditNote': true,
        'store:reports': true,
        'store:returns': true,
        'store:receiving': true,
        'store:viewBalance': true,
        'store:createProfile': true,
        'store:editProfile': true,
        'store:viewProfile': true,
        // Stores module submodules from UI
        'store:dashboard': true,
        'store:manageStores': true,
        'store:manageStores:view': true,
        'store:manageStores:create': true,
        'store:manageStores:edit': true,
        'store:manageStores:delete': true,
        'store:billingHistory': true,
        'store:billingHistory:view': true,
        'store:billingHistory:export': true,
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
        'store:reports:view': true,
        'store:reports:generate': true,
        'store:reports:export': true,
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

      // MODULE 6: Sales
      sales: { 
        // Dashboard
        'sales:dashboard': true,
        // Leads Management
        'sales:leads:view': true,
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
        // Opportunities
        'sales:opportunities:view': true,
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
        // Quotations
        'sales:quotations:view': true,
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
        // Invoices
        'sales:invoices:view': true,
        'sales:invoices:viewOwn': true,
        'sales:invoices:viewAll': true,
        'sales:invoices:create': true,
        'sales:invoices:edit': true,
        'sales:invoices:delete': true,
        'sales:invoices:approve': true,
        'sales:invoices:send': true,
        'sales:invoices:export': true,
        'sales:invoices:viewPayments': true,
        // Other submodules
        'sales:activities': true,
        'sales:customers': true,
        'sales:visits': true,
        'sales:visitLogs': true,
        'sales:leaderboard': true,
        'sales:orders': true,
        'sales:settings': true,
        'sales:reports': true,
        'sales:reportsKpis': true,
        // Legacy
        quotations: true, 
        leads: true, 
        opportunities: true,
        invoices: true,
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

      // MODULE 8: Inventory
      inventory: { 
        viewStock: true,
        editStock: true,
        viewAll: true,
        view: true,
        create: true,
        edit: true,
        delete: true,
        manage: true,
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
        'inventory:valuationReports': true,
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
        'inventory:products:view': true,
        'inventory:products:create': true,
        'inventory:stock:view': true,
        'inventory:stock:addStock': true,
        'inventory:stock:removeStock': true,
        'inventory:stock:transferStock': true,
        'inventory:stock:adjustStock': true,
        'inventory:stock:viewStockValue': true,
        'inventory:barcodes:generate': true,
        'inventory:stockAlerts:view': true
      },

      // MODULE 9: HRMS
      hrms: { 
        payroll: true,
        attendance: true, 
        settlement: true,
        employees: true,
        leaves: true,
        performance: true,
        recruitment: true,
        announcements: true,
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
        // Employee Management
        'hrms:employees:view': true,
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
        // Payroll
        'hrms:payroll:view': true,
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
        // Attendance
        'hrms:attendance:view': true,
        'hrms:attendance:viewAll': true,
        'hrms:attendance:viewOwn': true,
        'hrms:attendance:mark': true,
        'hrms:attendance:edit': true,
        'hrms:attendance:approve': true,
        'hrms:attendance:viewReports': true,
        'hrms:attendance:manageShifts': true,
        'hrms:attendance:export': true,
        // Settlement
        'hrms:settlement:view': true,
        'hrms:settlement:viewAll': true,
        'hrms:settlement:create': true,
        'hrms:settlement:process': true,
        'hrms:settlement:approve': true,
        'hrms:settlement:viewDocuments': true,
        'hrms:settlement:export': true,
        // Leaves
        'hrms:leaves:view': true,
        'hrms:leaves:viewAll': true,
        'hrms:leaves:viewOwn': true,
        'hrms:leaves:apply': true,
        'hrms:leaves:create': true,
        'hrms:leaves:approve': true,
        'hrms:leaves:reject': true,
        'hrms:leaves:viewBalance': true,
        'hrms:leaves:managePolicy': true,
        'hrms:leaves:cancelLeave': true,
        // Performance
        'hrms:performance:view': true,
        'hrms:performance:viewAll': true,
        'hrms:performance:create': true,
        'hrms:performance:manage': true,
        'hrms:performance:edit': true,
        // Recruitment
        'hrms:recruitment:view': true,
        'hrms:recruitment:manage': true,
        'hrms:recruitment:applicants': true,
        'hrms:recruitment:createJob': true,
        'hrms:recruitment:viewCandidates': true,
        'hrms:recruitment:scheduleInterview': true,
        'hrms:recruitment:updateStatus': true,
        'hrms:recruitment:makeOffer': true,
        // Announcements
        'hrms:announcements:view': true,
        'hrms:announcements:create': true,
        'hrms:announcements:edit': true,
        'hrms:announcements:delete': true,
        // Compliance & Reports
        'hrms:compliance': true,
        'hrms:reports': true,
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
  return null;
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

