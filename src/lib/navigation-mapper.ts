/**
 * Navigation Permission Mapper
 * 
 * Maps old string-based permissions to new module:submodule format.
 * This allows gradual migration of the navigation configuration.
 */

import type { PermissionMap } from './rbac';

/**
 * Permission mapping from old string format to new module/submodule structure
 */
const PERMISSION_MAPPING: Record<string, { module: string; submodule: string }> = {
  // Dashboard
  'view-dashboard': { module: 'dashboard', submodule: 'view' },
  
  // Sales
  'view-own-leads': { module: 'sales', submodule: 'leads' },
  'view-all-leads': { module: 'sales', submodule: 'leads' },
  'create-lead': { module: 'sales', submodule: 'leads' },
  'edit-lead': { module: 'sales', submodule: 'leads' },
  'delete-lead': { module: 'sales', submodule: 'leads' },
  'view-all-opportunities': { module: 'sales', submodule: 'opportunities' },
  'create-opportunity': { module: 'sales', submodule: 'opportunities' },
  'edit-opportunity': { module: 'sales', submodule: 'opportunities' },
  'view-quotations': { module: 'sales', submodule: 'quotations' },
  'create-quotation': { module: 'sales', submodule: 'quotations' },
  
  // Inventory
  'view-all-inventory': { module: 'inventory', submodule: 'products' },
  'edit-inventory': { module: 'inventory', submodule: 'stock' },
  'manage-inventory': { module: 'inventory', submodule: 'products' },
  
  // Store
  'manage-stores': { module: 'store', submodule: 'bills' },
  'view-store-bills': { module: 'store', submodule: 'bills' },
  'view-store-invoices': { module: 'store', submodule: 'invoices' },
  
  // Users
  'manage-users': { module: 'users', submodule: 'viewAll' },
  'create-user': { module: 'users', submodule: 'create' },
  'edit-user': { module: 'users', submodule: 'edit' },
  'delete-user': { module: 'users', submodule: 'delete' },
  
  // Vendor/Supply
  'view-vendors': { module: 'vendor', submodule: 'viewAll' },
  'create-vendor': { module: 'vendor', submodule: 'create' },
  'edit-vendor': { module: 'vendor', submodule: 'edit' },
  'delete-vendor': { module: 'vendor', submodule: 'delete' },
  'view-supply-chain': { module: 'supply', submodule: 'vendors' },
  
  // HRMS
  'manage-payroll': { module: 'hrms', submodule: 'payroll' },
  'view-attendance': { module: 'hrms', submodule: 'attendance' },
  'manage-settlements': { module: 'hrms', submodule: 'settlement' },
  
  // Settings
  'view-settings': { module: 'settings', submodule: 'view' },
  'manage-roles': { module: 'settings', submodule: 'manageRoles' },
  
  // Orders and Quotes
  'manage-orders': { module: 'sales', submodule: 'invoices' },
  'manage-quotes': { module: 'sales', submodule: 'quotations' },
};

/**
 * Check if user has permission using the new PermissionMap structure
 * @param permissions - User's permission map
 * @param permissionString - Permission string (can be old format or new module:submodule:action format)
 * @returns true if user has permission
 */
export function hasOldPermission(
  permissions: PermissionMap | null,
  permissionString: string
): boolean {
  if (!permissions) return false;

  // Check if it's the new format (module:submodule or module:submodule:action)
  if (permissionString.includes(':')) {
    const parts = permissionString.split(':');
    const module = parts[0];
    const submodule = parts[1];
    const action = parts[2];

    const modulePerms = permissions[module];
    if (!modulePerms) return false;

    const submodulePerms = modulePerms[submodule];
    if (!submodulePerms) return false;

    // Handle 3-level structure (module:submodule:action)
    if (action && typeof submodulePerms === 'object') {
      return submodulePerms[action] === true;
    }

    // Handle 2-level structure (module:submodule) or 3-level where any action is true
    if (typeof submodulePerms === 'boolean') {
      return submodulePerms === true;
    }

    if (typeof submodulePerms === 'object') {
      // If checking module:submodule without specific action, check if ANY action is true
      return Object.values(submodulePerms).some(val => val === true);
    }

    return false;
  }

  // Fall back to old mapping for legacy permissions
  const mapping = PERMISSION_MAPPING[permissionString];
  
  if (!mapping) {
    // Silently return false for unmapped permissions - they might be handled by the new format
    return false;
  }

  const { module, submodule } = mapping;
  
  const modulePerms = permissions[module];
  if (!modulePerms) return false;

  const submodulePerms = modulePerms[submodule];
  
  // Handle both boolean and object submodule permissions
  if (typeof submodulePerms === 'boolean') {
    return submodulePerms === true;
  }
  
  if (typeof submodulePerms === 'object') {
    // If any action in the submodule is true, grant permission
    return Object.values(submodulePerms).some(val => val === true);
  }
  
  return false;
}

/**
 * Check if user has permission using new module:submodule format
 * @param permissions - User's permission map
 * @param module - Module name
 * @param submodule - Submodule name
 * @returns true if user has permission
 */
export function hasModulePermission(
  permissions: PermissionMap | null,
  module: string,
  submodule: string
): boolean {
  if (!permissions) return false;
  return permissions[module]?.[submodule] === true;
}

/**
 * Filter navigation items based on user permissions
 * @param navItems - Array of navigation items with permission field
 * @param permissions - User's permission map
 * @returns Filtered navigation items
 */
export function filterNavItems<T extends { permission?: string }>(
  navItems: T[],
  permissions: PermissionMap | null
): T[] {
  if (!permissions) return [];

  return navItems.filter((item) => {
    if (!item.permission) return true; // No permission required
    return hasOldPermission(permissions, item.permission);
  });
}

