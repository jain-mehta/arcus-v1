/**
 * Seed Casbin policies with default roles and permissions
 * 
 * Usage:
 *   npm run seed-casbin [organizationId]
 * 
 * This script initializes an organization with:
 * - Default roles (admin, sales_manager, sales_executive, etc.)
 * - Role permissions matching the platform requirements
 * - Comprehensive permission coverage for all 14 modules
 */

import { loadPoliciesFromJSON } from '../src/lib/casbinClient';

const defaultPolicies: {
  organizationId: string;
  roles: {
    [roleName: string]: {
      permissions: Array<{
        resource: string;
        action: string;
        effect?: 'allow' | 'deny';
      }>;
    };
  };
} = {
  organizationId: '', // Will be set from command line
  roles: {
    // ADMIN - Full system access
    admin: {
      permissions: [
        { resource: '*', action: '*', effect: 'allow' },
      ],
    },

    // SALES ROLES
    sales_manager: {
      permissions: [
        // Full sales module access
        { resource: 'sales:leads', action: '*', effect: 'allow' },
        { resource: 'sales:opportunities', action: '*', effect: 'allow' },
        { resource: 'sales:quotations', action: '*', effect: 'allow' },
        { resource: 'sales:orders', action: '*', effect: 'allow' },
        { resource: 'sales:invoices', action: '*', effect: 'allow' },
        { resource: 'sales:payments', action: 'view', effect: 'allow' },
        { resource: 'sales:payments', action: 'edit', effect: 'allow' },
        
        // Customer access
        { resource: 'sales:customers', action: '*', effect: 'allow' },
        
        // Reports
        { resource: 'reports:sales', action: '*', effect: 'allow' },
        { resource: 'dashboard:sales', action: 'view', effect: 'allow' },
      ],
    },

    sales_executive: {
      permissions: [
        { resource: 'sales:leads', action: 'view', effect: 'allow' },
        { resource: 'sales:leads', action: 'create', effect: 'allow' },
        { resource: 'sales:leads', action: 'edit', effect: 'allow' },
        
        { resource: 'sales:opportunities', action: 'view', effect: 'allow' },
        { resource: 'sales:opportunities', action: 'create', effect: 'allow' },
        { resource: 'sales:opportunities', action: 'edit', effect: 'allow' },
        
        { resource: 'sales:quotations', action: 'view', effect: 'allow' },
        { resource: 'sales:quotations', action: 'create', effect: 'allow' },
        
        { resource: 'sales:customers', action: 'view', effect: 'allow' },
        { resource: 'sales:customers', action: 'create', effect: 'allow' },
        
        { resource: 'dashboard:sales', action: 'view', effect: 'allow' },
      ],
    },

    // STORE/POS ROLES
    store_manager: {
      permissions: [
        { resource: 'store:pos', action: '*', effect: 'allow' },
        { resource: 'store:products', action: '*', effect: 'allow' },
        { resource: 'store:catalog', action: '*', effect: 'allow' },
        { resource: 'store:bills', action: 'view', effect: 'allow' },
        { resource: 'store:bills', action: 'create', effect: 'allow' },
        { resource: 'store:bills', action: 'edit', effect: 'allow' },
        { resource: 'store:returns', action: '*', effect: 'allow' },
        
        { resource: 'inventory:stock', action: 'view', effect: 'allow' },
        { resource: 'inventory:stock', action: 'edit', effect: 'allow' },
        
        { resource: 'reports:store', action: 'view', effect: 'allow' },
        { resource: 'dashboard:store', action: 'view', effect: 'allow' },
      ],
    },

    store_supervisor: {
      permissions: [
        { resource: 'store:pos', action: 'view', effect: 'allow' },
        { resource: 'store:pos', action: 'create', effect: 'allow' },
        { resource: 'store:products', action: 'view', effect: 'allow' },
        { resource: 'store:bills', action: 'view', effect: 'allow' },
        { resource: 'store:bills', action: 'create', effect: 'allow' },
        { resource: 'inventory:stock', action: 'view', effect: 'allow' },
        { resource: 'dashboard:store', action: 'view', effect: 'allow' },
      ],
    },

    // INVENTORY ROLES
    inventory_manager: {
      permissions: [
        { resource: 'inventory:stock', action: '*', effect: 'allow' },
        { resource: 'inventory:warehouses', action: '*', effect: 'allow' },
        { resource: 'inventory:transfers', action: '*', effect: 'allow' },
        { resource: 'inventory:adjustments', action: '*', effect: 'allow' },
        
        { resource: 'vendor:list', action: 'view', effect: 'allow' },
        { resource: 'vendor:orders', action: 'view', effect: 'allow' },
        { resource: 'vendor:orders', action: 'create', effect: 'allow' },
        
        { resource: 'reports:inventory', action: 'view', effect: 'allow' },
        { resource: 'dashboard:inventory', action: 'view', effect: 'allow' },
      ],
    },

    inventory_clerk: {
      permissions: [
        { resource: 'inventory:stock', action: 'view', effect: 'allow' },
        { resource: 'inventory:stock', action: 'edit', effect: 'allow' },
        { resource: 'inventory:adjustments', action: 'view', effect: 'allow' },
        { resource: 'inventory:adjustments', action: 'create', effect: 'allow' },
        { resource: 'dashboard:inventory', action: 'view', effect: 'allow' },
      ],
    },

    // VENDOR MANAGEMENT ROLES
    vendor_manager: {
      permissions: [
        { resource: 'vendor:list', action: '*', effect: 'allow' },
        { resource: 'vendor:orders', action: '*', effect: 'allow' },
        { resource: 'vendor:payments', action: 'view', effect: 'allow' },
        { resource: 'vendor:payments', action: 'create', effect: 'allow' },
        { resource: 'vendor:payments', action: 'edit', effect: 'allow' },
        { resource: 'vendor:contracts', action: '*', effect: 'allow' },
        
        { resource: 'reports:vendor', action: 'view', effect: 'allow' },
        { resource: 'dashboard:vendor', action: 'view', effect: 'allow' },
      ],
    },

    // FINANCE/ACCOUNTING ROLES
    accountant: {
      permissions: [
        { resource: 'finance:accounts', action: 'view', effect: 'allow' },
        { resource: 'finance:accounts', action: 'create', effect: 'allow' },
        { resource: 'finance:accounts', action: 'edit', effect: 'allow' },
        
        { resource: 'finance:transactions', action: 'view', effect: 'allow' },
        { resource: 'finance:transactions', action: 'create', effect: 'allow' },
        
        { resource: 'finance:ledger', action: 'view', effect: 'allow' },
        { resource: 'finance:journals', action: 'view', effect: 'allow' },
        { resource: 'finance:journals', action: 'create', effect: 'allow' },
        
        { resource: 'sales:invoices', action: 'view', effect: 'allow' },
        { resource: 'sales:payments', action: 'view', effect: 'allow' },
        { resource: 'vendor:payments', action: 'view', effect: 'allow' },
        
        { resource: 'reports:finance', action: 'view', effect: 'allow' },
        { resource: 'dashboard:finance', action: 'view', effect: 'allow' },
      ],
    },

    finance_manager: {
      permissions: [
        { resource: 'finance:*', action: '*', effect: 'allow' },
        { resource: 'sales:invoices', action: 'view', effect: 'allow' },
        { resource: 'sales:payments', action: '*', effect: 'allow' },
        { resource: 'vendor:payments', action: '*', effect: 'allow' },
        { resource: 'reports:finance', action: '*', effect: 'allow' },
        { resource: 'dashboard:finance', action: 'view', effect: 'allow' },
      ],
    },

    // HRMS ROLES
    hr_manager: {
      permissions: [
        { resource: 'hrms:employees', action: '*', effect: 'allow' },
        { resource: 'hrms:attendance', action: '*', effect: 'allow' },
        { resource: 'hrms:leave', action: '*', effect: 'allow' },
        { resource: 'hrms:payroll', action: '*', effect: 'allow' },
        { resource: 'hrms:performance', action: 'view', effect: 'allow' },
        { resource: 'hrms:performance', action: 'edit', effect: 'allow' },
        { resource: 'hrms:recruitment', action: '*', effect: 'allow' },
        
        { resource: 'reports:hrms', action: 'view', effect: 'allow' },
        { resource: 'dashboard:hrms', action: 'view', effect: 'allow' },
      ],
    },

    hr_executive: {
      permissions: [
        { resource: 'hrms:employees', action: 'view', effect: 'allow' },
        { resource: 'hrms:employees', action: 'create', effect: 'allow' },
        { resource: 'hrms:employees', action: 'edit', effect: 'allow' },
        
        { resource: 'hrms:attendance', action: 'view', effect: 'allow' },
        { resource: 'hrms:attendance', action: 'edit', effect: 'allow' },
        
        { resource: 'hrms:leave', action: 'view', effect: 'allow' },
        { resource: 'hrms:leave', action: 'edit', effect: 'allow' },
        
        { resource: 'hrms:recruitment', action: 'view', effect: 'allow' },
        { resource: 'hrms:recruitment', action: 'create', effect: 'allow' },
        
        { resource: 'dashboard:hrms', action: 'view', effect: 'allow' },
      ],
    },

    // PROJECT MANAGEMENT ROLES
    project_manager: {
      permissions: [
        { resource: 'projects:list', action: '*', effect: 'allow' },
        { resource: 'projects:tasks', action: '*', effect: 'allow' },
        { resource: 'projects:milestones', action: '*', effect: 'allow' },
        { resource: 'projects:resources', action: 'view', effect: 'allow' },
        { resource: 'projects:resources', action: 'edit', effect: 'allow' },
        { resource: 'projects:budgets', action: 'view', effect: 'allow' },
        { resource: 'projects:budgets', action: 'edit', effect: 'allow' },
        
        { resource: 'reports:projects', action: 'view', effect: 'allow' },
        { resource: 'dashboard:projects', action: 'view', effect: 'allow' },
      ],
    },

    team_member: {
      permissions: [
        { resource: 'projects:tasks', action: 'view', effect: 'allow' },
        { resource: 'projects:tasks', action: 'edit', effect: 'allow' },
        { resource: 'projects:milestones', action: 'view', effect: 'allow' },
        { resource: 'dashboard:projects', action: 'view', effect: 'allow' },
      ],
    },

    // ANALYTICS/REPORTING ROLES
    analyst: {
      permissions: [
        { resource: 'reports:sales', action: 'view', effect: 'allow' },
        { resource: 'reports:inventory', action: 'view', effect: 'allow' },
        { resource: 'reports:store', action: 'view', effect: 'allow' },
        { resource: 'reports:finance', action: 'view', effect: 'allow' },
        { resource: 'reports:hrms', action: 'view', effect: 'allow' },
        { resource: 'reports:vendor', action: 'view', effect: 'allow' },
        { resource: 'reports:projects', action: 'view', effect: 'allow' },
        
        { resource: 'dashboard:*', action: 'view', effect: 'allow' },
        { resource: 'analytics:*', action: 'view', effect: 'allow' },
      ],
    },

    // BASIC ACCESS ROLES
    viewer: {
      permissions: [
        { resource: 'dashboard:*', action: 'view', effect: 'allow' },
      ],
    },

    employee: {
      permissions: [
        { resource: 'hrms:attendance:self', action: 'view', effect: 'allow' },
        { resource: 'hrms:leave:self', action: 'view', effect: 'allow' },
        { resource: 'hrms:leave:self', action: 'create', effect: 'allow' },
        { resource: 'hrms:payroll:self', action: 'view', effect: 'allow' },
        { resource: 'dashboard:self', action: 'view', effect: 'allow' },
      ],
    },
  },
};

async function seedPolicies(organizationId: string) {
  console.log(`🌱 Seeding Casbin policies for organization: ${organizationId}`);

  const policiesWithOrgId = {
    ...defaultPolicies,
    organizationId,
  };

  try {
    await loadPoliciesFromJSON(policiesWithOrgId);
    
    console.log('✅ Successfully seeded policies!');
    console.log('Roles created:');
    Object.keys(defaultPolicies.roles).forEach((role, idx) => {
      const permCount = (defaultPolicies.roles as any)[role].permissions.length;
      console.log(`  ${idx + 1}. ${role.padEnd(20)} (${permCount} permissions)`);
    });
    
    console.log(`Total: ${Object.keys(defaultPolicies.roles).length} roles`);
  } catch (error) {
    console.error('❌ Failed to seed policies:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const organizationId = args[0];

if (!organizationId) {
  console.error('❌ Usage: npm run seed-casbin <organizationId>');
  console.error('   Example: npm run seed-casbin org123');
  process.exit(1);
}

seedPolicies(organizationId).then(() => {
  console.log('✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
