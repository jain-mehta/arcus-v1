#!/usr/bin/env node

/**
 * Seed Multiple Users with Different Roles
 * Creates admin, sales executive, intern, and manager users
 * 
 * Usage: node seed-users-with-roles.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Admin permissions - all modules with all actions
const ADMIN_PERMISSIONS_CONFIG = {
  dashboard: { view: true, manage: true, 'dashboard:view': true, 'dashboard:manage': true },
  
  sales: {
    'sales:dashboard:view': true,
    'sales:leads:view': true,
    'sales:leads:create': true,
    'sales:leads:edit': true,
    'sales:leads:delete': true,
    'sales:opportunities:view': true,
    'sales:opportunities:create': true,
    'sales:opportunities:edit': true,
    'sales:opportunities:delete': true,
    'sales:quotations:view': true,
    'sales:quotations:create': true,
    'sales:quotations:edit': true,
    'sales:quotations:delete': true,
    'sales:orders:view': true,
    'sales:orders:create': true,
    'sales:orders:edit': true,
    'sales:orders:delete': true,
    'sales:customers:view': true,
    'sales:customers:create': true,
    'sales:customers:edit': true,
    'sales:customers:delete': true,
    'sales:activities:view': true,
    'sales:activities:create': true,
    'sales:visits:view': true,
    'sales:visits:create': true,
    'sales:leaderboard:view': true,
    'sales:reports:view': true,
    'sales:settings:edit': true,
    view: true, create: true, edit: true, delete: true, manage: true
  },
  
  inventory: {
    'inventory:overview:view': true,
    'inventory:products:view': true,
    'inventory:products:create': true,
    'inventory:goodsInward:view': true,
    'inventory:goodsInward:create': true,
    'inventory:goodsOutward:view': true,
    'inventory:goodsOutward:create': true,
    'inventory:transfers:view': true,
    'inventory:transfers:create': true,
    'inventory:counting:view': true,
    'inventory:counting:create': true,
    'inventory:valuationReports:view': true,
    'inventory:qr:generate': true,
    'inventory:factory:view': true,
    'inventory:store:view': true,
    'inventory:aiCatalog:view': true,
    view: true, create: true, edit: true, delete: true, manage: true
  },
  
  store: {
    'store:overview:view': true,
    'store:bills:view': true,
    'store:billingHistory:view': true,
    'store:dashboard:view': true,
    'store:debitNote:view': true,
    'store:invoiceFormat:view': true,
    'store:inventory:view': true,
    'store:manage': true,
    'store:receiving:view': true,
    'store:reports:view': true,
    'store:returns:view': true,
    'store:staff:view': true,
    view: true, create: true, edit: true, delete: true, manage: true
  },
  
  hrms: {
    'hrms:overview:view': true,
    'hrms:announcements:view': true,
    'hrms:attendance:view': true,
    'hrms:compliance:view': true,
    'hrms:employees:view': true,
    'hrms:leaves:view': true,
    'hrms:payroll:view': true,
    'hrms:performance:view': true,
    'hrms:recruitment:view': true,
    'hrms:reports:view': true,
    view: true, create: true, edit: true, delete: true, manage: true
  },
  
  vendor: {
    'vendor:view': true,
    'vendor:viewAll': true,
    view: true, viewAll: true, create: true, edit: true, delete: true, manage: true
  },
  
  reports: {
    'reports:view': true,
    view: true, create: true, edit: true, delete: true, manage: true
  },
  
  settings: {
    'settings:view': true,
    'settings:manage': true,
    view: true, manage: true, create: true, edit: true, delete: true
  },
  
  audit: {
    'audit:view': true,
    'audit:manage': true,
    view: true, manage: true
  },
  
  admin: {
    'admin:manage': true,
    view: true, manage: true, create: true, edit: true, delete: true
  },
  
  'supply-chain': {
    'supply-chain:view': true,
    'supply-chain:manage': true,
    view: true, manage: true, create: true, edit: true, delete: true
  }
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define users to create
const USERS_TO_CREATE = [
  {
    email: 'admin@yourbusiness.local',
    password: 'Admin@123456',
    name: 'Admin User',
    role: 'Administrator',
    description: 'Full system access'
  },
  {
    email: 'sales-exec@yourbusiness.local',
    password: 'SalesExec@123456',
    name: 'Sales Executive',
    role: 'Sales Executive',
    description: 'Can manage sales leads, opportunities, and quotations'
  },
  {
    email: 'intern@yourbusiness.local',
    password: 'Intern@123456',
    name: 'Intern Sales',
    role: 'Intern Sales',
    description: 'Limited access to view sales leads and quotations'
  },
  {
    email: 'manager@yourbusiness.local',
    password: 'Manager@123456',
    name: 'Manager',
    role: 'Manager',
    description: 'Can manage their team and view reports'
  }
];

// Define role permissions
const ROLE_PERMISSIONS = {
  'Administrator': ADMIN_PERMISSIONS_CONFIG,  // Use full admin permissions
  
  'Sales Executive': {
    dashboard: { view: true, 'dashboard:view': true },
    sales: {
      'sales:dashboard': true,
      'sales:leads:view': true,
      'sales:leads:create': true,
      'sales:leads:edit': true,
      'sales:leads:editOwn': true,
      'sales:opportunities:view': true,
      'sales:opportunities:create': true,
      'sales:quotations:view': true,
      'sales:quotations:create': true,
      'sales:quotations:edit': true,
      'sales:customers:view': true,
      'sales:customers:create': true,
      'sales:activities:view': true,
      'sales:reports:view': true,
      viewAll: true,
      view: true,
      create: true,
      edit: true
    },
    vendor: {
      'vendor:view': true,
      'vendor:viewAll': true,
      view: true,
      viewAll: true
    },
    reports: {
      'reports:view': true,
      view: true
    }
  },
  
  'Intern Sales': {
    dashboard: { view: true, 'dashboard:view': true },
    sales: {
      'sales:dashboard': true,
      'sales:leads:view': true,
      'sales:leads:viewOwn': true,
      'sales:quotations:view': true,
      'sales:quotations:viewOwn': true,
      'sales:reports:view': true,
      view: true
    }
  },
  
  'Manager': {
    dashboard: { view: true, 'dashboard:view': true },
    sales: { view: true },
    inventory: { view: true },
    vendor: { view: true },
    store: { view: true },
    hrms: { view: true },
    users: { 'users:viewAll': true },
    reports: { view: true }
  }
};

async function seedUsers() {
  console.log('========================================');
  console.log('🌱 Seeding Users with Roles');
  console.log('========================================\n');

  try {
    // First, create all roles
    console.log('1️⃣ Creating Roles...\n');
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();

      if (existingRole) {
        console.log(`   ✓ Role "${roleName}" already exists`);
        
        // Update permissions if they changed
        const permissions = ROLE_PERMISSIONS[roleName];
        await supabase
          .from('roles')
          .update({ permissions })
          .eq('id', existingRole.id);
      } else {
        const { data: newRole, error } = await supabase
          .from('roles')
          .insert({
            name: roleName,
            description: `${roleName} role`,
            permissions: ROLE_PERMISSIONS[roleName]
          })
          .select('id')
          .single();

        if (error) {
          console.log(`   ❌ Error creating role "${roleName}": ${error.message}`);
        } else {
          console.log(`   ✓ Created role "${roleName}"`);
        }
      }
    }

    console.log('\n2️⃣ Creating Users...\n');

    // Then, create users and assign roles
    for (const userConfig of USERS_TO_CREATE) {
      console.log(`   Creating user: ${userConfig.email}`);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some(u => u.email === userConfig.email);

      let userId = null;

      if (userExists) {
        const existingUser = existingUsers.users.find(u => u.email === userConfig.email);
        userId = existingUser.id;
        console.log(`     ✓ User already exists with ID: ${userId}`);
      } else {
        // Create user in auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userConfig.email,
          password: userConfig.password,
          email_confirm: true,
          user_metadata: {
            fullName: userConfig.name,
            role: userConfig.role
          }
        });

        if (createError) {
          console.log(`     ❌ Error creating user: ${createError.message}`);
          continue;
        }

        userId = newUser.user.id;
        console.log(`     ✓ Created in Auth: ${userConfig.email}`);
        console.log(`     🔑 Password: ${userConfig.password}`);
      }

      // Ensure user profile exists in public.users
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from('users').insert({
          id: userId,
          email: userConfig.email,
          name: userConfig.name
        });
        if (profileError) {
          console.log(`     ⚠️  Error creating user profile: ${profileError.message}`);
          // Try to update instead if insert failed
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: userConfig.email,
              name: userConfig.name
            })
            .eq('id', userId);
          if (updateError) {
            console.log(`        Also failed to update: ${updateError.message}`);
            continue; // Skip role assignment if we can't create/update user profile
          } else {
            console.log(`        ✓ Updated user profile instead`);
          }
        } else {
          console.log(`     ✓ Created user profile`);
        }
      } else {
        console.log(`     ✓ User profile already exists`);
      }
      
      // Small delay to ensure profile is fully committed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get role ID
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', userConfig.role)
        .single();

      if (!roleData) {
        console.log(`     ❌ Role "${userConfig.role}" not found`);
        continue;
      }

      // Check if user already has this role
      const { data: existingUserRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role_id', roleData.id)
        .single();

      if (existingUserRole) {
        console.log(`     ✓ Role "${userConfig.role}" already assigned`);
      } else {
        const { error: assignError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: roleData.id,
            assigned_at: new Date().toISOString()
          });

        if (assignError) {
          console.log(`     ❌ Error assigning role: ${assignError.message}`);
        } else {
          console.log(`     ✓ Assigned role: "${userConfig.role}"`);
        }
      }

      console.log('');
    }

    console.log('\n========================================');
    console.log('✅ User Seeding Complete!');
    console.log('========================================\n');

    console.log('📋 Summary of created users:\n');
    for (const user of USERS_TO_CREATE) {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    }

    console.log('🎯 Next Steps:');
    console.log('   1. Log in with one of the users above');
    console.log('   2. Verify modules are visible based on role');
    console.log('   3. Test permission checks work correctly\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

seedUsers();
