#!/usr/bin/env node

/**
 * Seed Admin User: adminharsh@arcus.local
 * Creates a new admin user with full system permissions
 * 
 * Usage: node seed-adminharsh.mjs
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

const ADMIN_EMAIL = 'adminharsh@arcus.local';
const ADMIN_PASSWORD = 'AdminHarsh@123456';

// Full admin permissions - MUST match src/lib/rbac.ts getAdminPermissions()
const ADMIN_PERMISSIONS = {
  dashboard: { view: true, manage: true, 'dashboard:view': true, 'dashboard:manage': true },
  users: { viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'users:viewAll': true, 'users:view': true, 'users:create': true, 'users:edit': true, 'users:delete': true, 'users:manage': true, 'users:invite': true, 'users:deactivate': true, 'users:activate': true, 'users:resetPassword': true, 'users:changeRole': true },
  roles: { viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'roles:viewAll': true, 'roles:view': true, 'roles:create': true, 'roles:edit': true, 'roles:delete': true, 'roles:manage': true, 'roles:assignPermissions': true, 'roles:clone': true },
  permissions: { viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'permissions:viewAll': true, 'permissions:view': true, 'permissions:create': true, 'permissions:edit': true, 'permissions:delete': true, 'permissions:manage': true, 'permissions:assign': true },
  store: { bills: true, invoices: true, viewPastBills: true, customers: true, manage: true, view: true, create: true, edit: true, delete: true, 'store:bills': true, 'store:invoices': true, 'store:viewPastBills': true, 'store:customers': true, 'store:view': true, 'store:create': true, 'store:edit': true, 'store:delete': true, 'store:manage': true, 'store:debitNote': true, 'store:creditNote': true, 'store:reports': true, 'store:returns': true, 'store:receiving': true, 'store:viewBalance': true, 'store:createProfile': true, 'store:editProfile': true, 'store:viewProfile': true, 'store:dashboard': true, 'store:manageStores': true, 'store:manageStores:view': true, 'store:manageStores:create': true, 'store:manageStores:edit': true, 'store:manageStores:delete': true, 'store:billingHistory': true, 'store:billingHistory:view': true, 'store:billingHistory:export': true, 'store:debitNotes': true, 'store:debitNotes:view': true, 'store:debitNotes:create': true, 'store:debitNotes:edit': true, 'store:debitNotes:delete': true, 'store:debitNotes:approve': true, 'store:receiveProducts': true, 'store:receiveProducts:view': true, 'store:receiveProducts:create': true, 'store:receiveProducts:edit': true, 'store:receiveProducts:approve': true, 'store:reports:view': true, 'store:reports:generate': true, 'store:reports:export': true, 'store:staffShifts': true, 'store:staffShifts:view': true, 'store:staffShifts:create': true, 'store:staffShifts:edit': true, 'store:staffShifts:delete': true, 'store:staffShifts:assign': true, 'store:invoiceFormats': true, 'store:invoiceFormats:view': true, 'store:invoiceFormats:create': true, 'store:invoiceFormats:edit': true, 'store:invoiceFormats:delete': true, 'store:pos': true, 'store:pos:access': true, 'store:pos:processReturn': true, 'store:pos:viewTransactions': true, 'store:pos:managePayments': true, 'store:pos:closeTill': true, 'store:pos:openTill': true },
  sales: { 'sales:dashboard': true, 'sales:leads:view': true, 'sales:leads:viewOwn': true, 'sales:leads:viewTeam': true, 'sales:leads:viewAll': true, 'sales:leads:create': true, 'sales:leads:edit': true, 'sales:leads:editOwn': true, 'sales:leads:delete': true, 'sales:leads:deleteOwn': true, 'sales:leads:assign': true, 'sales:leads:export': true, 'sales:leads:import': true, 'sales:opportunities:view': true, 'sales:opportunities:viewOwn': true, 'sales:opportunities:viewTeam': true, 'sales:opportunities:viewAll': true, 'sales:opportunities:create': true, 'sales:opportunities:edit': true, 'sales:opportunities:editOwn': true, 'sales:opportunities:delete': true, 'sales:opportunities:updateStage': true, 'sales:opportunities:assign': true, 'sales:opportunities:export': true, 'sales:quotations:view': true, 'sales:quotations:viewOwn': true, 'sales:quotations:viewTeam': true, 'sales:quotations:viewAll': true, 'sales:quotations:create': true, 'sales:quotations:edit': true, 'sales:quotations:editOwn': true, 'sales:quotations:delete': true, 'sales:quotations:approve': true, 'sales:quotations:send': true, 'sales:quotations:export': true, 'sales:quotations:viewPricing': true, 'sales:invoices:view': true, 'sales:invoices:viewOwn': true, 'sales:invoices:viewAll': true, 'sales:invoices:create': true, 'sales:invoices:edit': true, 'sales:invoices:delete': true, 'sales:invoices:approve': true, 'sales:invoices:send': true, 'sales:invoices:export': true, 'sales:invoices:viewPayments': true, 'sales:activities': true, 'sales:customers': true, 'sales:visits': true, 'sales:visitLogs': true, 'sales:leaderboard': true, 'sales:orders': true, 'sales:settings': true, 'sales:reports': true, 'sales:reportsKpis': true, quotations: true, leads: true, opportunities: true, invoices: true, viewAll: true, view: true, create: true, edit: true, delete: true, manage: true },
  vendor: { viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'vendor:viewAll': true, 'vendor:view': true, 'vendor:create': true, 'vendor:edit': true, 'vendor:delete': true, 'vendor:manage': true, 'vendor:documents': true, 'vendor:communicationLog': true, 'vendor:history': true, 'vendor:rating': true, 'vendor:priceComparison': true, 'vendor:purchaseOrders': true, 'vendor:invoices': true, 'vendor:materialMapping': true, 'vendor:reorderManagement': true, 'vendor:profile': true, 'vendor:dashboard': true, 'vendor:dashboard:view': true, 'vendor:dashboard:metrics': true, 'vendor:profiles': true, 'vendor:profiles:view': true, 'vendor:profiles:create': true, 'vendor:profiles:edit': true, 'vendor:profiles:delete': true, 'vendor:onboarding': true, 'vendor:onboarding:view': true, 'vendor:onboarding:create': true, 'vendor:onboarding:manage': true, 'vendor:rawMaterialCatalog': true, 'vendor:rawMaterialCatalog:view': true, 'vendor:rawMaterialCatalog:edit': true, 'vendor:contractDocuments': true, 'vendor:contractDocuments:view': true, 'vendor:contractDocuments:upload': true, 'vendor:contractDocuments:download': true, 'vendor:contractDocuments:delete': true, 'vendor:purchaseHistory': true, 'vendor:purchaseHistory:view': true, 'vendor:purchaseHistory:export': true, 'vendor:priceComparison:view': true, 'vendor:priceComparison:analyze': true, 'vendor:viewPerformance': true, 'vendor:communicate': true },
  inventory: { viewStock: true, editStock: true, viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'inventory:viewStock': true, 'inventory:editStock': true, 'inventory:viewAll': true, 'inventory:view': true, 'inventory:create': true, 'inventory:edit': true, 'inventory:delete': true, 'inventory:manage': true, 'inventory:productMaster': true, 'inventory:cycleCounting': true, 'inventory:goodsInward': true, 'inventory:goodsOutward': true, 'inventory:stockTransfers': true, 'inventory:valuationReports': true, 'inventory:factory': true, 'inventory:store': true, 'inventory:qrCodeGenerator': true, 'inventory:aiCatalogAssistant': true, 'inventory:reports': true, 'inventory:totalProductsSkus': true, 'inventory:totalInventoryValue': true, 'inventory:lowStockItems': true, 'inventory:inventoryByCategory': true, 'inventory:recentStockAlerts': true, 'inventory:products:view': true, 'inventory:products:create': true, 'inventory:stock:view': true, 'inventory:stock:addStock': true, 'inventory:stock:removeStock': true, 'inventory:stock:transferStock': true, 'inventory:stock:adjustStock': true, 'inventory:stock:viewStockValue': true, 'inventory:barcodes:generate': true, 'inventory:stockAlerts:view': true },
  hrms: { payroll: true, attendance: true, settlement: true, employees: true, leaves: true, performance: true, recruitment: true, announcements: true, view: true, create: true, edit: true, delete: true, manage: true, 'hrms:payroll': true, 'hrms:attendance': true, 'hrms:settlement': true, 'hrms:employees': true, 'hrms:leaves': true, 'hrms:performance': true, 'hrms:recruitment': true, 'hrms:announcements': true, 'hrms:view': true, 'hrms:create': true, 'hrms:edit': true, 'hrms:delete': true, 'hrms:manage': true, 'hrms:employees:view': true, 'hrms:employees:viewAll': true, 'hrms:employees:viewOwn': true, 'hrms:employees:create': true, 'hrms:employees:edit': true, 'hrms:employees:delete': true, 'hrms:employees:viewSalary': true, 'hrms:employees:editSalary': true, 'hrms:employees:viewDocuments': true, 'hrms:employees:manageDocuments': true, 'hrms:employees:export': true, 'hrms:payroll:view': true, 'hrms:payroll:viewAll': true, 'hrms:payroll:process': true, 'hrms:payroll:approve': true, 'hrms:payroll:viewReports': true, 'hrms:payroll:generatePayslips': true, 'hrms:payroll:export': true, 'hrms:payroll:create': true, 'hrms:payroll:edit': true, 'hrms:payroll:manage': true, 'hrms:payroll:formats': true, 'hrms:payroll:generate': true, 'hrms:payroll:settlement': true, 'hrms:attendance:view': true, 'hrms:attendance:viewAll': true, 'hrms:attendance:viewOwn': true, 'hrms:attendance:mark': true, 'hrms:attendance:edit': true, 'hrms:attendance:approve': true, 'hrms:attendance:viewReports': true, 'hrms:attendance:manageShifts': true, 'hrms:attendance:export': true, 'hrms:settlement:view': true, 'hrms:settlement:viewAll': true, 'hrms:settlement:create': true, 'hrms:settlement:process': true, 'hrms:settlement:approve': true, 'hrms:settlement:viewDocuments': true, 'hrms:settlement:export': true, 'hrms:leaves:view': true, 'hrms:leaves:viewAll': true, 'hrms:leaves:viewOwn': true, 'hrms:leaves:apply': true, 'hrms:leaves:create': true, 'hrms:leaves:approve': true, 'hrms:leaves:reject': true, 'hrms:leaves:viewBalance': true, 'hrms:leaves:managePolicy': true, 'hrms:leaves:cancelLeave': true, 'hrms:performance:view': true, 'hrms:performance:viewAll': true, 'hrms:performance:create': true, 'hrms:performance:manage': true, 'hrms:performance:edit': true, 'hrms:recruitment:view': true, 'hrms:recruitment:manage': true, 'hrms:recruitment:applicants': true, 'hrms:recruitment:createJob': true, 'hrms:recruitment:viewCandidates': true, 'hrms:recruitment:scheduleInterview': true, 'hrms:recruitment:updateStatus': true, 'hrms:recruitment:makeOffer': true, 'hrms:announcements:view': true, 'hrms:announcements:create': true, 'hrms:announcements:edit': true, 'hrms:announcements:delete': true, 'hrms:compliance': true, 'hrms:reports': true, 'hrms:dashboard': true, 'hrms:dashboard:view': true, 'hrms:dashboard:metrics': true, 'hrms:employeeDirectory': true, 'hrms:employeeDirectory:view': true, 'hrms:employeeDirectory:manage': true, 'hrms:attendanceShifts': true, 'hrms:attendanceShifts:view': true, 'hrms:attendanceShifts:mark': true, 'hrms:attendanceShifts:manage': true, 'hrms:leaveManagement': true, 'hrms:leaveManagement:view': true, 'hrms:leaveManagement:apply': true, 'hrms:leaveManagement:approve': true, 'hrms:reportsAnalytics': true, 'hrms:reportsAnalytics:view': true, 'hrms:reportsAnalytics:generate': true, 'hrms:reportsAnalytics:export': true },
  reports: { viewAll: true, view: true, create: true, edit: true, delete: true, manage: true, 'reports:viewAll': true, 'reports:view': true, 'reports:create': true, 'reports:edit': true, 'reports:delete': true, 'reports:manage': true, 'reports:salesReports': true, 'reports:inventoryReports': true, 'reports:hrmsReports': true, 'reports:storeReports': true, 'reports:vendorReports': true, 'reports:export': true, 'reports:schedule': true },
  settings: { manageRoles: true, manageUsers: true, manage: true, view: true, 'settings:manageRoles': true, 'settings:manageUsers': true, 'settings:manage': true, 'settings:view': true, 'settings:profile': true, 'settings:auditLog': true, 'settings:permissions': true, 'settings:organization': true, 'settings:integrations': true, 'settings:backup': true, 'settings:security': true },
  audit: { viewAll: true, view: true, manage: true, 'audit:viewAll': true, 'audit:view': true, 'audit:manage': true, 'audit:export': true, 'audit:filter': true },
  admin: { manage: true, view: true, create: true, edit: true, delete: true, 'admin:manage': true, 'admin:view': true, 'admin:create': true, 'admin:edit': true, 'admin:delete': true, 'admin:systemSettings': true, 'admin:userManagement': true, 'admin:security': true, 'admin:monitoring': true },
  'supply-chain': { view: true, manage: true, create: true, edit: true, delete: true, 'supply-chain:view': true, 'supply-chain:manage': true, 'supply-chain:create': true, 'supply-chain:edit': true, 'supply-chain:delete': true, 'supply-chain:tracking': true, 'supply-chain:forecasting': true, 'supply:purchaseOrders:view': true, 'supply:purchaseOrders:create': true, 'supply:purchaseOrders:edit': true, 'supply:purchaseOrders:approve': true, 'supply:purchaseOrders:delete': true, 'supply:bills:view': true, 'supply:bills:create': true, 'supply:bills:edit': true, 'supply:bills:approve': true, 'supply:bills:delete': true, 'supply-chain:purchaseOrders:view': true, 'supply-chain:purchaseOrders:create': true, 'supply-chain:purchaseOrders:edit': true, 'supply-chain:purchaseOrders:approve': true, 'supply-chain:bills:view': true, 'supply-chain:bills:create': true, 'supply-chain:bills:edit': true, 'supply-chain:bills:approve': true }
};

async function seedAdminHarsh() {
  console.log('========================================');
  console.log('🔐 Seeding Admin User: adminharsh@arcus.local');
  console.log('========================================');

  try {
    // Create Supabase client with service role (admin access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('\n1️⃣  Checking if user already exists...');
    
    // Check if admin already exists
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const adminExists = allUsers?.users?.some(u => u.email === ADMIN_EMAIL);

    if (adminExists) {
      console.log(`   ⏭️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log('   ✅ Skipping user creation, checking profile...\n');
    } else {
      console.log(`   ✓ User doesn't exist, creating...\n`);

      console.log('2️⃣  Creating user in Supabase Auth...');
      
      // Create the user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          fullName: 'Admin Harsh',
          role: 'admin',
          permissions: ADMIN_PERMISSIONS,
          isSystemAdmin: true,
        },
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      console.log(`   ✓ Created user in Supabase Auth`);
      console.log(`   📧 Email: ${ADMIN_EMAIL}`);
      console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
      console.log(`   ✅ Email auto-confirmed\n`);

      console.log('3️⃣  Creating user profile in database...');

      const { error: insertError } = await supabase.from('users').insert({
        id: newUser.user.id,
        email: ADMIN_EMAIL,
        name: 'Admin Harsh',
        metadata: {
          isAdmin: true,
          role: 'admin',
          permissions: ADMIN_PERMISSIONS,
        },
      }).select();

      if (insertError && !insertError.message.includes('duplicate')) {
        console.log(`   ⚠️  Warning: Could not create profile: ${insertError.message}`);
      } else if (insertError && insertError.message.includes('duplicate')) {
        console.log(`   ⏭️  Profile already exists`);
      } else {
        console.log(`   ✓ Created user profile in database\n`);
      }
    }

    console.log('4️⃣  Assigning admin role and permissions...');

    // Get the user from Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    const user = authUser?.users?.find(u => u.email === ADMIN_EMAIL);
    
    if (!user) {
      throw new Error('Could not find user in Supabase Auth');
    }

    const userId = user.id;

    // First, ensure the user profile exists in the users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      console.log(`   Creating user profile...`);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: ADMIN_EMAIL,
          name: 'Admin Harsh',
          metadata: {
            isAdmin: true,
            role: 'admin',
          },
        });

      if (insertError) {
        console.log(`   ⚠️  Note: ${insertError.message}`);
      } else {
        console.log(`   ✓ Created user profile`);
      }
    } else {
      console.log(`   ✓ User profile already exists`);
    }

    // Now find or create the 'Administrator' role
    let adminRoleId = null;
    const { data: existingAdminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Administrator')
      .single();

    if (existingAdminRole) {
      adminRoleId = existingAdminRole.id;
      console.log(`   ✓ Found existing Administrator role`);
    } else {
      console.log(`   Creating Administrator role...`);
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert({
          name: 'Administrator',
          description: 'Full system access with all modules and permissions',
          permissions: ADMIN_PERMISSIONS,
        })
        .select('id')
        .single();

      if (createRoleError) {
        console.log(`   ⚠️  Note: Could not create role: ${createRoleError.message}`);
      } else {
        adminRoleId = newRole?.id;
        console.log(`   ✓ Created Administrator role`);
      }
    }

    // Assign the Administrator role to user
    if (adminRoleId) {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', adminRoleId)
        .single();

      if (!existingRole) {
        const { error: assignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: adminRoleId,
            assigned_at: new Date().toISOString(),
          });

        if (assignError) {
          console.log(`   ⚠️  Note: ${assignError.message}`);
        } else {
          console.log(`   ✓ Assigned Administrator role to user`);
        }
      } else {
        console.log(`   ✓ Administrator role already assigned`);
      }
    }

    console.log('\n========================================');
    console.log('✅ Admin User Created Successfully!');
    console.log('========================================');
    
    console.log('\n🎯 YOU CAN NOW:');
    console.log(`   1. Run: npm run dev`);
    console.log(`   2. Go to: http://localhost:3000/login`);
    console.log(`   3. Login with:`);
    console.log(`      📧 Email: ${ADMIN_EMAIL}`);
    console.log(`      🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`   4. Access all modules with full permissions!`);

    console.log('\n🔐 GRANTED PERMISSIONS (All modules):');
    Object.keys(ADMIN_PERMISSIONS).forEach(module => {
      console.log(`   ✅ ${module}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding admin user:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check internet connection to Supabase');
    console.error('  2. Verify Supabase credentials in .env.local');
    console.error('  3. Check Supabase project is not deleted');
    console.error('  4. Try again in a few seconds');
    process.exit(1);
  }
}

seedAdminHarsh();
