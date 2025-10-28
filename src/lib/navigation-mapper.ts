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

    console.log('[Navigation] Checking permission string:', { permissionString, module, submodule, action });

    const modulePerms = permissions[module];
    if (!modulePerms) {
      console.log('[Navigation] Module not found:', module);
      return false;
    }

    // Strategy 1: Check if the exact permission key exists with true value
    // Handle formats like 'vendor:viewAll', 'sales:leads:view', etc.
    
    // First try the direct key lookup (e.g., modulePerms['viewAll'])
    if (modulePerms[submodule] === true) {
      console.log('[Navigation] Permission granted (direct submodule):', submodule);
      return true;
    }

    // Try nested permission with action (e.g., modulePerms['leads:view'])
    const nestedKey = `${submodule}:${action || 'view'}`;
    if (modulePerms[nestedKey] === true) {
      console.log('[Navigation] Permission granted (nested key):', nestedKey);
      return true;
    }

    // Try the full dotted permission (e.g., modulePerms['sales:leads:view'])
    const fullKey = `${module}:${submodule}:${action || 'view'}`;
    if (modulePerms[fullKey] === true) {
      console.log('[Navigation] Permission granted (full key):', fullKey);
      return true;
    }

    // Try checking if the full permission string is stored directly (e.g., modulePerms['inventory:products:view'])
    if (modulePerms[permissionString] === true) {
      console.log('[Navigation] Permission granted (full permission string):', permissionString);
      return true;
    }

    // Strategy 2: Check if submodule value is a boolean true
    const submoduleValue = modulePerms[submodule];
    if (typeof submoduleValue === 'boolean' && submoduleValue) {
      console.log('[Navigation] Permission granted (boolean submodule):', submodule);
      return true;
    }

    // Strategy 3: If submodule value is an object (nested actions), check if any action is true
    if (typeof submoduleValue === 'object' && submoduleValue !== null) {
      // Check if we're looking for a specific action
      if (action) {
        const actionResult = submoduleValue[action] === true;
        console.log('[Navigation] Permission check (action in object):', { submodule, action, result: actionResult });
        return actionResult;
      } else {
        // If no specific action, grant if ANY action in the submodule is true
        const result = Object.values(submoduleValue).some(val => val === true);
        console.log('[Navigation] Permission check (any action in object):', { submodule, result });
        return result;
      }
    }

    console.log('[Navigation] No permission found for:', permissionString);
    return false;
  }

  // Fall back to old mapping for legacy permissions
  const mapping = PERMISSION_MAPPING[permissionString];
  
  if (!mapping) {
    // Silently return false for unmapped permissions - they might be handled by the new format
    console.log('[Navigation] No mapping found for:', permissionString);
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
 * @param navItems - Navigation items to filter
 * @param permissions - User permissions map (can be null for admins)
 * @returns Filtered navigation items
 */
export function filterNavItems<T extends { permission?: string }>(
  navItems: T[],
  permissions: PermissionMap | null
): T[] {
  console.log('[Navigation] filterNavItems called with:', { 
    itemCount: navItems.length, 
    permissionsModules: permissions ? Object.keys(permissions).length : 'null',
    permissionModuleNames: permissions ? Object.keys(permissions) : 'null'
  });
  
  // If no permissions map provided, show all items (might happen for admins with fallback)
  if (!permissions) {
    console.log('[Navigation] No permissions provided, showing all items');
    return navItems;
  }

  console.log('[Navigation] Permission map available:', { 
    moduleCount: Object.keys(permissions).length,
    modules: Object.keys(permissions).slice(0, 5)
  });

  const filtered = navItems.filter((item) => {
    if (!item.permission) {
      console.log('[Navigation] Item has no permission requirement, including:', (item as any).label);
      return true;
    }
    const hasPermission = hasOldPermission(permissions, item.permission);
    console.log('[Navigation] Permission check:', { 
      itemLabel: (item as any).label, 
      permission: item.permission, 
      hasPermission,
      permissionModuleExists: Object.keys(permissions).includes(item.permission.split(':')[0])
    });
    return hasPermission;
  });

  console.log('[Navigation] Filtered items:', { 
    originalCount: navItems.length, 
    filteredCount: filtered.length,
    items: filtered.map((item: any) => item.label)
  });
  
  return filtered;
}

