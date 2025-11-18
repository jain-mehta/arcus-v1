#!/usr/bin/env node

/**
 * Test script to verify permission visibility
 * This simulates the permission checking process for admin user
 */

import { getRolePermissions } from './src/lib/rbac.js';

// Simulate the navigation config from actions.ts
const navigationConfig = {
  "/dashboard/sales": [
    { href: "/dashboard/sales", label: "Sales Dashboard", icon: "barChart2", permission: "sales:dashboard:view" },
    { href: "/dashboard/sales/leads", label: "Lead Management", icon: "logo", permission: "sales:leads:view" },
    { href: "/dashboard/sales/opportunities", label: "Sales Pipeline", icon: "folderKanban", permission: "sales:opportunities:view" },
    { href: "/dashboard/sales/quotations", label: "Quotations", icon: "fileText", permission: "sales:quotations:view" },
    { href: "/dashboard/sales/orders", label: "Sales Orders", icon: "shoppingCart", permission: "sales:orders:view" },
    { href: "/dashboard/sales/customers", label: "Customer Accounts", icon: "users", permission: "sales:customers:view" },
    { href: "/dashboard/sales/activities", label: "Sales Activities Log", icon: "activity", permission: "sales:activities:view" },
    { href: "/dashboard/sales/visits", label: "Log a Dealer Visit", icon: "mapPin", permission: "sales:visits:view" },
    { href: "/dashboard/sales/leaderboard", label: "Sales Leaderboard", icon: "trophy", permission: "sales:leaderboard:view" },
    { href: "/dashboard/sales/reports", label: "Sales Reports & KPIs", icon: "barChart", permission: "sales:reports:view" },
    { href: "/dashboard/sales/settings", label: "Sales Settings", icon: "settings", permission: "sales:settings:edit" },
  ],
  "/dashboard/inventory": [
    { href: "/dashboard/inventory", label: "Inventory Dashboard", icon: "package", permission: "inventory:overview:view" },
    { href: "/dashboard/inventory/product-master", label: "Product Master", icon: "database", permission: "inventory:products:view" },
    { href: "/dashboard/inventory/goods-inward", label: "Goods Inward (GRN)", icon: "arrowDownToLine", permission: "inventory:goodsInward:view" },
    { href: "/dashboard/inventory/goods-outward", label: "Goods Outward", icon: "arrowUpFromLine", permission: "inventory:goodsOutward:view" },
    { href: "/dashboard/inventory/stock-transfers", label: "Stock Transfers", icon: "arrowRightLeft", permission: "inventory:transfers:view" },
    { href: "/dashboard/inventory/cycle-counting", label: "Cycle Counting & Auditing", icon: "calculator", permission: "inventory:counting:view" },
    { href: "/dashboard/inventory/valuation-reports", label: "Inventory Valuation Reports", icon: "barChart", permission: "inventory:valuationReports:view" },
    { href: "/dashboard/inventory/qr-code-generator", label: "QR Code Generator", icon: "qrCode", permission: "inventory:qr:generate" },
    { href: "/dashboard/inventory/factory", label: "Factory Inventory", icon: "building2", permission: "inventory:factory:view" },
    { href: "/dashboard/inventory/store", label: "Store Inventory", icon: "store", permission: "inventory:store:view" },
    { href: "/dashboard/inventory/ai-catalog-assistant", label: "AI Catalog Assistant", icon: "sparkles", permission: "inventory:aiCatalog:view" },
  ],
  "/dashboard/store": [
    { href: "/dashboard/store", label: "Store Dashboard", icon: "store", permission: "store:overview:view" },
    { href: "/dashboard/store/billing", label: "POS Billing", icon: "calculator", permission: "store:bills:view" },
    { href: "/dashboard/store/billing-history", label: "Billing History", icon: "history", permission: "store:billingHistory:view" },
    { href: "/dashboard/store/dashboard", label: "Store Manager Dashboard", icon: "barChart2", permission: "store:dashboard:view" },
    { href: "/dashboard/store/debit-note", label: "Create Debit Note", icon: "fileBarChart", permission: "store:debitNote:view" },
    { href: "/dashboard/store/invoice-format", label: "Invoice Format Editor", icon: "fileText", permission: "store:invoiceFormat:view" },
    { href: "/dashboard/store/inventory", label: "Store Inventory", icon: "package", permission: "store:inventory:view" },
    { href: "/dashboard/store/manage", label: "Manage Stores", icon: "settings", permission: "store:manage" },
    { href: "/dashboard/store/receiving", label: "Product Receiving", icon: "packageOpen", permission: "store:receiving:view" },
    { href: "/dashboard/store/reports", label: "Store Reports & Comparison", icon: "barChart", permission: "store:reports:view" },
    { href: "/dashboard/store/returns", label: "Returns & Damaged Goods", icon: "undo", permission: "store:returns:view" },
    { href: "/dashboard/store/staff", label: "Staff & Shift Logs", icon: "users", permission: "store:staff:view" },
  ],
  "/dashboard/hrms": [
    { href: "/dashboard/hrms", label: "HRMS Dashboard", icon: "users", permission: "hrms:overview:view" },
    { href: "/dashboard/hrms/announcements", label: "Announcements", icon: "bell", permission: "hrms:announcements:view" },
    { href: "/dashboard/hrms/attendance", label: "Attendance & Shifts", icon: "clock", permission: "hrms:attendance:view" },
    { href: "/dashboard/hrms/compliance", label: "Compliance", icon: "shield", permission: "hrms:compliance:view" },
    { href: "/dashboard/hrms/employees", label: "Employee Directory", icon: "user", permission: "hrms:employees:view" },
    { href: "/dashboard/hrms/leaves", label: "Leave Management", icon: "calendar", permission: "hrms:leaves:view" },
    { href: "/dashboard/hrms/payroll", label: "Payroll", icon: "creditCard", permission: "hrms:payroll:view" },
    { href: "/dashboard/hrms/performance", label: "Performance", icon: "target", permission: "hrms:performance:view" },
    { href: "/dashboard/hrms/recruitment", label: "Recruitment", icon: "userPlus", permission: "hrms:recruitment:view" },
    { href: "/dashboard/hrms/reports", label: "Reports & Analytics", icon: "barChart", permission: "hrms:reports:view" },
  ],
};

// Simple permission checker that mimics the 7-strategy fallback
function hasPermission(permissionKey, permissionsMap) {
  if (!permissionKey || !permissionsMap) return false;
  
  // Strategy 1: Direct match
  if (permissionsMap[permissionKey]) return true;
  
  // Strategy 2: Check module level
  const [module, ...rest] = permissionKey.split(':');
  if (permissionsMap[module] && permissionsMap[module][permissionKey]) return true;
  
  // Strategy 3: Check if module has wildcard
  if (permissionsMap[module] && permissionsMap[module].view) return true;
  
  // Strategy 4: Check for manage permission
  if (permissionsMap[module] && permissionsMap[module].manage) return true;
  
  // Strategy 5: Check simple module name
  if (permissionsMap[module]) return true;
  
  // Strategy 6: Check for any true value in module
  if (typeof permissionsMap[module] === 'object') {
    for (const [key, value] of Object.entries(permissionsMap[module])) {
      if (value === true) return true;
    }
  }
  
  return false;
}

console.log('\n===== PERMISSION VISIBILITY TEST =====\n');

// Get admin permissions
const adminPerms = getRolePermissions({ 
  roleId: 'test-admin',
  roleName: 'Administrator' 
});

console.log(`✅ Admin permissions loaded: ${Object.keys(adminPerms).length} modules\n`);

let totalVisible = 0;
let totalMissing = 0;
const missingPermissions = [];

for (const [path, items] of Object.entries(navigationConfig)) {
  console.log(`\n📂 ${path}`);
  console.log('─'.repeat(50));
  
  let pathVisible = 0;
  let pathMissing = 0;
  
  for (const item of items) {
    const permission = item.permission;
    const hasAccess = hasPermission(permission, adminPerms);
    
    if (hasAccess) {
      console.log(`  ✅ ${item.label} (${permission})`);
      pathVisible++;
      totalVisible++;
    } else {
      console.log(`  ❌ ${item.label} (${permission})`);
      pathMissing++;
      totalMissing++;
      missingPermissions.push({
        path,
        label: item.label,
        permission
      });
    }
  }
  
  console.log(`   → ${pathVisible}/${items.length} visible`);
}

console.log('\n' + '='.repeat(50));
console.log(`\n📊 SUMMARY:`);
console.log(`   Total Visible: ${totalVisible}`);
console.log(`   Total Missing: ${totalMissing}`);
console.log(`   Percentage: ${((totalVisible / (totalVisible + totalMissing)) * 100).toFixed(1)}%`);

if (missingPermissions.length > 0) {
  console.log(`\n⚠️  Missing Permissions:`);
  console.log('─'.repeat(50));
  for (const missing of missingPermissions) {
    console.log(`   ${missing.permission} (${missing.label})`);
  }
}

console.log('\n' + '='.repeat(50) + '\n');

if (totalMissing === 0) {
  console.log('🎉 All permissions are visible!');
} else {
  console.log(`⚠️  ${totalMissing} permissions still need to be fixed.`);
}
