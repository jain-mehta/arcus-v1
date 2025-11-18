/**
 * Admin Permissions Helper
 * 
 * Utilities to manage admin permissions programmatically
 * Run this during app initialization or use directly
 */

import { getSupabaseServerClient } from '@/lib/supabase/client';
import type { ActionResponse } from '@/lib/actions-utils';

export const ADMIN_PERMISSIONS = {
  // INVENTORY MODULE
  inventory: {
    view: true,
    viewAll: true,
    productMaster: { view: true, create: true, edit: true, delete: true, import: true, export: true, manageVariants: true, managePricing: true },
    stock: { view: true, viewAll: true, addStock: true, removeStock: true, transfer: true, adjust: true },
    goodsInward: { view: true, create: true, edit: true, approve: true, receive: true },
    goodsOutward: { view: true, create: true, edit: true, approve: true, dispatch: true },
    transfers: { view: true, create: true, approve: true, execute: true },
    cycleCounting: { view: true, create: true, edit: true, approve: true, finalize: true },
    valuationReports: { view: true, generate: true, export: true },
    qr: { generate: true, view: true, print: true },
    aiCatalog: { use: true, manage: true },
  },

  // STORE MODULE
  store: {
    view: true,
    viewAll: true,
    bills: { view: true, create: true, edit: true, delete: true, approve: true, print: true },
    invoiceFormat: { view: true, create: true, edit: true, delete: true, setDefault: true },
    receiving: { view: true, create: true, edit: true, approve: true, receive: true },
    returns: { view: true, create: true, edit: true, approve: true, process: true },
    manage: { view: true, create: true, edit: true, delete: true, viewAll: true },
    staff: { view: true, manage: true },
    reports: { view: true, generate: true, export: true },
    dashboard: { view: true, viewAll: true },
    debitNote: { view: true, create: true, edit: true, approve: true },
    billingHistory: { view: true, export: true },
  },

  // VENDOR MODULE
  vendor: {
    view: true,
    viewAll: true,
    list: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, upload: true, delete: true, download: true },
    invoices: { view: true, download: true, match: true },
    purchaseOrders: { view: true, create: true, edit: true, approve: true, cancel: true },
    materialMapping: { view: true, edit: true, create: true },
    priceComparison: { view: true, generate: true, export: true },
    rating: { view: true, rate: true, edit: true },
    history: { view: true, export: true },
    onboarding: { view: true, create: true, approve: true },
    dashboard: { view: true, viewAll: true },
    reorderManagement: { view: true, edit: true },
  },

  // SALES MODULE
  sales: {
    view: true,
    viewAll: true,
    leads: { view: true, create: true, edit: true, delete: true, convertToOpportunity: true, export: true },
    opportunities: { view: true, create: true, edit: true, delete: true, updateStatus: true, updatePriority: true },
    quotations: { view: true, create: true, edit: true, delete: true, generateFromAI: true, createOrder: true, send: true },
    orders: { view: true, create: true, edit: true, delete: true, confirm: true, ship: true, cancel: true },
    customers: { view: true, create: true, edit: true, delete: true, viewAll: true },
    reports: { view: true, generate: true, export: true, schedule: true },
    leaderboard: { view: true, viewAll: true },
    settings: { view: true, edit: true, manage: true },
    activities: { view: true, create: true, edit: true, delete: true },
    visits: { view: true, create: true, edit: true, delete: true },
    communicationLog: { view: true, create: true, edit: true, delete: true },
    dashboard: { view: true, viewAll: true },
  },

  // HRMS MODULE
  hrms: {
    view: true,
    viewAll: true,
    employees: { view: true, viewAll: true, create: true, edit: true, delete: true, manageDocuments: true, manageBankDetails: true },
    payroll: { view: true, generate: true, approve: true, settlePayslips: true, viewPayslips: true, manageFormats: true, settlement: true },
    attendance: { view: true, markAttendance: true, edit: true, approve: true, exportReport: true },
    leaves: { view: true, applyLeave: true, approveLeave: true, viewPolicy: true, managePolicy: true },
    performance: { view: true, createCycle: true, startAppraisal: true, submitReview: true, approveReview: true, finalizeCycle: true },
    recruitment: { view: true, createJobOpening: true, editJobOpening: true, manageApplicants: true, updateStage: true, sendOffer: true },
    compliance: { view: true, manage: true, viewReports: true },
    announcements: { view: true, create: true, edit: true, delete: true, managePolicies: true },
    reports: { view: true, generate: true, export: true, schedule: true },
    dashboard: { view: true, viewAll: true },
  },

  // USERS/ROLES MANAGEMENT
  users: {
    view: true,
    viewAll: true,
    create: true,
    edit: true,
    delete: true,
    manageRoles: true,
    managePermissions: true,
    manageSessions: true,
    roles: { view: true, create: true, edit: true, delete: true, manage: true },
    sessions: { view: true, revoke: true, viewAll: true },
    permissions: { view: true, manage: true, assign: true },
  },

  // SETTINGS MODULE
  settings: {
    view: true,
    edit: true,
    manage: true,
    profile: { view: true, edit: true, manageSessions: true, manageSecuritySettings: true },
    systemSettings: { view: true, edit: true, manage: true },
    auditLog: { view: true, export: true, filter: true },
    integrations: { view: true, manage: true, connect: true, disconnect: true },
    apiKeys: { view: true, create: true, revoke: true },
    organization: { view: true, edit: true, manageBilling: true },
  },

  // DASHBOARD
  dashboard: {
    view: true,
    viewAll: true,
    access: true,
    export: true,
  },

  // SUPPLY CHAIN
  supplyChain: {
    view: true,
    manage: true,
    planning: true,
    forecasting: true,
    optimization: true,
  },

  // ADMIN SYSTEM ACCESS
  admin: {
    userManagement: true,
    roleManagement: true,
    permissionManagement: true,
    systemConfiguration: true,
    auditLogs: true,
    dataExport: true,
    dataImport: true,
    systemMaintenance: true,
    backupManagement: true,
    apiManagement: true,
    integrationManagement: true,
    billingManagement: true,
    organizationSettings: true,
    securitySettings: true,
    performanceMonitoring: true,
  },
};

/**
 * Setup admin permissions in database
 * Call this during app initialization or manually
 */
export async function setupAdminPermissions(
  adminUserEmail: string = 'admin@arcus.local'
): Promise<ActionResponse> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return {
        success: false,
        error: 'Database connection failed',
      };
    }

    // Step 1: Create or update admin role with full permissions
    const { data: existingRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'admin')
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Failed to fetch admin role: ${roleError.message}`,
      };
    }

    let roleId: string;

    if (existingRole) {
      // Update existing admin role with full permissions
      const { data, error } = await supabase
        .from('roles')
        .update({
          permissions: ADMIN_PERMISSIONS,
          description: 'Full system administrator access - can view, create, edit, delete all data and manage user permissions',
        })
        .eq('id', existingRole.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update admin role: ${error.message}`,
        };
      }
      roleId = data.id;
    } else {
      // Create new admin role
      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: 'admin',
          description: 'Full system administrator access - can view, create, edit, delete all data and manage user permissions',
          permissions: ADMIN_PERMISSIONS,
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to create admin role: ${error.message}`,
        };
      }
      roleId = data.id;
    }

    // Step 2: Find admin user and assign admin role
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminUserEmail)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Failed to find admin user: ${userError.message}`,
      };
    }

    if (!adminUser) {
      return {
        success: false,
        error: `Admin user not found: ${adminUserEmail}. Create user first.`,
      };
    }

    // Step 3: Assign admin role to admin user
    const { error: assignError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: adminUser.id,
          role_id: roleId,
        },
        { onConflict: 'user_id,role_id' }
      );

    if (assignError) {
      return {
        success: false,
        error: `Failed to assign admin role: ${assignError.message}`,
      };
    }

    return {
      success: true,
      message: `Admin permissions successfully configured for ${adminUserEmail}`,
      data: {
        roleId,
        userId: adminUser.id,
        email: adminUserEmail,
        permissions: Object.keys(ADMIN_PERMISSIONS).length + ' modules with full access',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Setup failed: ${error.message}`,
    };
  }
}

/**
 * Get admin permissions object
 */
export function getAdminPermissions() {
  return ADMIN_PERMISSIONS;
}

/**
 * Check if a user has a specific permission
 */
export function hasAdminPermission(
  permissions: any,
  moduleName: string,
  submoduleName?: string,
  actionName?: string
): boolean {
  if (!permissions) return false;

  // Check admin module - if admin has any permission, return true
  if (permissions.admin) return true;

  // Navigate through the permission structure
  let current = permissions[moduleName];
  if (!current) return false;

  if (!submoduleName) return !!current;
  
  current = current[submoduleName];
  if (!current) return false;

  if (!actionName) return !!current;
  
  return !!current[actionName];
}

/**
 * Get all modules and permissions summary
 */
export function getPermissionsSummary() {
  return {
    totalModules: Object.keys(ADMIN_PERMISSIONS).length,
    modules: Object.keys(ADMIN_PERMISSIONS),
    totalPermissions: Object.values(ADMIN_PERMISSIONS).reduce((acc, module: any) => {
      return acc + countPermissions(module);
    }, 0),
  };
}

function countPermissions(obj: any, count = 0): number {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      count += countPermissions(obj[key]);
    } else if (obj[key] === true) {
      count++;
    }
  }
  return count;
}
