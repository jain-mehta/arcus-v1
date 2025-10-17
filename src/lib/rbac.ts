/**
 * Role-Based Access Control (RBAC) System
 * 
 * Provides centralized permission checking for the entire application.
 * Supports hierarchical permissions with module → submodule granularity.
 * 
 * Permission Structure:
 * {
 *   store: { bills: true, invoices: true, viewPastBills: true },
 *   sales: { quotations: true, leads: false },
 *   inventory: { viewStock: true, editStock: false }
 * }
 */

import { getFirebaseAdmin } from './firebase/firebase-admin';
import type { User } from './firebase/types';

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
  // Admin role check - admins have all permissions
  if (userClaims.roleId === 'admin') {
    return true;
  }

  // If permissions are in custom claims (for performance)
  if (userClaims.permissions) {
    return checkPermissionInMap(userClaims.permissions, moduleName, submoduleName);
  }

  // Fallback: fetch permissions from Firestore
  if (userClaims.roleId && userClaims.orgId) {
    const { db } = getFirebaseAdmin();
    const roleDoc = await db.collection('roles').doc(userClaims.roleId).get();
    
    if (!roleDoc.exists) {
      return false;
    }
    
    const roleData = roleDoc.data();
    const permissions = roleData?.permissions as PermissionMap | undefined;
    
    if (!permissions) {
      return false;
    }
    
    return checkPermissionInMap(permissions, moduleName, submoduleName);
  }

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

  // Check if viewer is target's manager
  const { db } = getFirebaseAdmin();
  const targetUserDoc = await db.collection('users').doc(targetUserId).get();
  
  if (!targetUserDoc.exists) {
    return false;
  }
  
  const targetUser = targetUserDoc.data() as User;
  
  // Direct manager check
  if (targetUser.reportsTo === viewerClaims.uid) {
    return true;
  }

  // Check if special permission to view all users in org
  const canViewAll = await checkPermission(viewerClaims, 'users', 'viewAll');
  if (canViewAll && targetUser.orgId === viewerClaims.orgId) {
    return true;
  }

  return false;
}

/**
 * Get all user IDs that the given user can manage (direct reports)
 * @param managerId - User ID of the manager
 * @param orgId - Organization ID to scope the query
 * @returns Array of user IDs
 */
export async function getDirectReports(managerId: string, orgId?: string): Promise<string[]> {
  const { db } = getFirebaseAdmin();
  
  let query = db.collection('users').where('reportsTo', '==', managerId);
  
  if (orgId) {
    query = query.where('orgId', '==', orgId);
  }
  
  const subordinatesSnapshot = await query.get();
  
  return subordinatesSnapshot.docs.map(doc => doc.id);
}

/**
 * Get all subordinates (recursive) for a manager
 * @param managerId - User ID of the manager
 * @param orgId - Organization ID
 * @returns Array of all subordinate user IDs (direct and indirect)
 */
export async function getSubordinates(managerId: string, orgId: string): Promise<string[]> {
  const directReports = await getDirectReports(managerId, orgId);
  const allSubordinates = new Set(directReports);
  
  // Recursively get subordinates of subordinates
  for (const reportId of directReports) {
    const subReports = await getSubordinates(reportId, orgId);
    subReports.forEach(id => allSubordinates.add(id));
  }
  
  return Array.from(allSubordinates);
}

/**
 * Get role permissions from Firestore
 * @param roleId - Role ID
 * @returns Permission map or null if not found
 */
export async function getRolePermissions(roleId: string): Promise<PermissionMap | null> {
  const { db } = getFirebaseAdmin();
  const roleDoc = await db.collection('roles').doc(roleId).get();
  
  if (!roleDoc.exists) {
    // Fallback: if role not found in Firestore (e.g., during initial setup),
    // provide minimal admin permissions for 'admin' role
    if (roleId === 'admin') {
      console.warn('[RBAC] Admin role not found in Firestore, using fallback permissions');
      return {
        dashboard: { view: true },
        store: { bills: true, invoices: true, viewPastBills: true },
        sales: { quotations: true, leads: true, viewAll: true },
        inventory: { viewStock: true, editStock: true },
        hrms: { payroll: true, attendance: true, settlement: true },
        settings: { manageRoles: true, manageUsers: true },
        users: { viewAll: true, create: true, edit: true, delete: true },
        vendor: { viewAll: true, create: true, edit: true, delete: true },
      };
    }
    return null;
  }
  
  const roleData = roleDoc.data();
  return (roleData?.permissions as PermissionMap) || null;
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
