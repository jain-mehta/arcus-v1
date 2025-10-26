// ============================================================
// PERMIFY PLAYGROUND DEMO & TEST CASES
// ============================================================
// Copy the schema.perm content first, then use these tests below
// URL: https://playground.permify.co

// ============================================================
// TEST DATA: SAMPLE USERS, ROLES, AND PERMISSIONS
// ============================================================

// Sample User: Sales Manager
[
  {"entity": "user", "key": "user_1"},
  {"entity": "role", "key": "sales_manager"},
  {"relation": "user_1@user", "relation_name": "has_role", "object": "sales_manager@role"}
]

// Permissions for Sales Manager Role
[
  {"relation": "sales_manager@role", "relation_name": "can", "object": "view_dashboard"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "view_analytics"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_leads_view"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_leads_edit"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_leads_assign"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_opportunities_view"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_opportunities_edit"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_quotations_view"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_quotations_approve"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "sales_invoices_view"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "inventory_products_view"},
  {"relation": "sales_manager@role", "relation_name": "can", "object": "admin_users_viewAuditLog"}
]

// Sample User: Sales Executive
[
  {"entity": "user", "key": "user_2"},
  {"entity": "role", "key": "sales_executive"},
  {"relation": "user_2@user", "relation_name": "has_role", "object": "sales_executive@role"}
]

// Permissions for Sales Executive Role
[
  {"relation": "sales_executive@role", "relation_name": "can", "object": "view_dashboard"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_leads_view"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_leads_create"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_leads_edit"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_opportunities_create"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_opportunities_edit"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_quotations_create"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_quotations_edit"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "sales_invoices_view"},
  {"relation": "sales_executive@role", "relation_name": "can", "object": "inventory_products_view"}
]

// Sample User: Admin
[
  {"entity": "user", "key": "user_admin"},
  {"entity": "role", "key": "admin"},
  {"relation": "user_admin@user", "relation_name": "has_role", "object": "admin@role"}
]

// Permissions for Admin Role (ALL 230 PERMISSIONS)
[
  // Dashboard
  {"relation": "admin@role", "relation_name": "can", "object": "view_dashboard"},
  {"relation": "admin@role", "relation_name": "can", "object": "view_analytics"},
  {"relation": "admin@role", "relation_name": "can", "object": "view_reports"},
  {"relation": "admin@role", "relation_name": "can", "object": "export_data"},
  
  // Sales Leads (all 12)
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_view"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_viewOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_viewTeam"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_viewAll"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_create"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_edit"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_editOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_delete"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_deleteOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_assign"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_export"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_leads_import"},
  
  // Sales Opportunities (all 11)
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_view"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_viewOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_viewTeam"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_viewAll"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_create"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_edit"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_editOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_delete"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_updateStage"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_assign"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_opportunities_export"},
  
  // Sales Quotations (all 12)
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_view"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_viewOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_viewTeam"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_viewAll"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_create"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_edit"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_editOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_delete"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_approve"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_send"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_export"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_quotations_viewPricing"},
  
  // Sales Invoices (all 10)
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_view"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_viewOwn"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_viewAll"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_create"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_edit"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_delete"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_approve"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_send"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_export"},
  {"relation": "admin@role", "relation_name": "can", "object": "sales_invoices_viewPaymentStatus"},
  
  // ... (continue for all 230 permissions - sample shows pattern)
  // For full list, replicate the pattern for all actions
  
  // User Management (all 8)
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_viewAll"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_create"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_edit"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_delete"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_resetPassword"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_assignRoles"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_deactivate"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_users_viewAuditLog"},
  
  // System Settings (all 8)
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_view"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageRoles"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageUsers"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageOrganization"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_viewAuditLog"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageIntegrations"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageBilling"},
  {"relation": "admin@role", "relation_name": "can", "object": "admin_settings_manageNotifications"}
]

// ============================================================
// SAMPLE QUERIES / PERMISSION CHECKS
// ============================================================

// Query 1: Can Sales Manager view dashboard?
// Expected: YES
// Query: user_1@user#view_dashboard

// Query 2: Can Sales Executive approve quotations?
// Expected: NO (permission denied)
// Query: user_2@user#sales_quotations_approve

// Query 3: Can Admin manage roles?
// Expected: YES
// Query: user_admin@user#admin_settings_manageRoles

// Query 4: Can Sales Manager view all leads?
// Expected: YES (based on permissions granted)
// Query: user_1@user#sales_leads_view

// Query 5: Can Sales Executive create invoices?
// Expected: NO (permission denied)
// Query: user_2@user#sales_invoices_create

// ============================================================
// HOW TO USE THIS IN PERMIFY PLAYGROUND
// ============================================================

// STEPS:
// 1. Go to https://playground.permify.co
// 2. Copy & paste the schema.perm content (all actions)
// 3. Click "Save Schema"
// 4. Scroll down to "Enter Relationships" section
// 5. Paste all the JSON relationships above
// 6. Click "Add Relationships"
// 7. Go to the "Run a Query" section
// 8. Try one of the sample queries above
// 9. Click "Run Query" to see PERMITED or DENIED result

// ============================================================
// QUICK PERMISSION REFERENCE
// ============================================================

/*
TOTAL: 230 PERMISSIONS

✓ Dashboard: 4
✓ Sales - Leads: 12
✓ Sales - Opportunities: 11
✓ Sales - Quotations: 12
✓ Sales - Invoices: 10
✓ Inventory - Products: 12
✓ Inventory - Stock: 11
✓ Inventory - Categories: 5
✓ Inventory - Alerts: 4
✓ Inventory - Pricing: 5
✓ Inventory - Barcodes: 4
✓ Store - Bills: 11
✓ Store - Invoices: 8
✓ Store - POS: 8
✓ Store - Customers: 6
✓ Supply Chain - Vendors: 9
✓ Supply Chain - PO: 10
✓ Supply Chain - Bills: 9
✓ Supply Chain - GRN: 5
✓ HRMS - Employees: 11
✓ HRMS - Payroll: 7
✓ HRMS - Attendance: 9
✓ HRMS - Settlement: 7
✓ HRMS - Leave: 9
✓ HRMS - Recruitment: 6
✓ Vendor Portal: 10
✓ User Management: 8
✓ System Settings: 8

PREDEFINED ROLES:
1. Admin (230 perms - all)
2. Sales President (~135 perms)
3. Sales Manager (~52 perms)
4. Sales Executive (~17 perms)
5. Inventory Manager (~45 perms)
6. Store Supervisor (~39 perms)
7. HR Manager (~59 perms)
8. Procurement Officer (~37 perms)
9. Finance Approver (~8 perms)
10. Reporting Officer (~14 perms - read-only)
*/
