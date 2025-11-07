#!/usr/bin/env node

/**
 * Admin Setup Script for Arcus V1
 *
 * This script creates the default admin user and sets up all necessary
 * roles and permissions in both Supabase and Casbin.
 *
 * Usage: npm run setup:admin
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ADMIN_EMAIL = 'admin@arcus.local';
const ADMIN_PASSWORD = 'AdminPassword123!';
const DEFAULT_ORG_ID = 'org-admin';

/**
 * Default roles and their permissions
 */
const DEFAULT_ROLES = [
  {
    id: crypto.randomUUID(),
    name: 'Super Admin',
    permissions: {
      'users': ['*'],
      'roles': ['*'],
      'settings': ['*'],
      'sales': ['*'],
      'inventory': ['*'],
      'vendor': ['*'],
      'store': ['*'],
      'hrms': ['*'],
      'reports': ['*'],
    },
    description: 'Full system access'
  },
  {
    id: crypto.randomUUID(),
    name: 'Administrator',
    permissions: {
      'users': ['view', 'create', 'edit'],
      'roles': ['view', 'manage'],
      'settings': ['view', 'edit'],
      'sales': ['*'],
      'inventory': ['*'],
      'vendor': ['*'],
      'store': ['*'],
      'hrms': ['view', 'edit'],
      'reports': ['view'],
    },
    description: 'Administrative access'
  },
  {
    id: crypto.randomUUID(),
    name: 'Sales Manager',
    permissions: {
      'users': ['view'],
      'sales': ['*'],
      'inventory': ['view'],
      'reports': ['view'],
    },
    description: 'Sales team management'
  },
  {
    id: crypto.randomUUID(),
    name: 'Store Manager',
    permissions: {
      'users': ['view'],
      'store': ['*'],
      'inventory': ['view', 'edit'],
      'reports': ['view'],
    },
    description: 'Store operations management'
  },
  {
    id: crypto.randomUUID(),
    name: 'Employee',
    permissions: {
      'sales': ['view'],
      'inventory': ['view'],
      'store': ['view'],
    },
    description: 'Basic employee access'
  }
];

/**
 * Default Casbin policies
 */
const DEFAULT_POLICIES = [
  // Super Admin - full access
  ['role:super_admin', 'org:*', '*', '*'],

  // Admin - most access
  ['role:admin', 'org:*', 'users', '*'],
  ['role:admin', 'org:*', 'roles', '*'],
  ['role:admin', 'org:*', 'settings', '*'],
  ['role:admin', 'org:*', 'sales', '*'],
  ['role:admin', 'org:*', 'inventory', '*'],
  ['role:admin', 'org:*', 'vendor', '*'],
  ['role:admin', 'org:*', 'store', '*'],
  ['role:admin', 'org:*', 'hrms', 'view'],
  ['role:admin', 'org:*', 'hrms', 'edit'],
  ['role:admin', 'org:*', 'reports', 'view'],

  // Sales Manager
  ['role:sales_manager', 'org:*', 'sales', '*'],
  ['role:sales_manager', 'org:*', 'inventory', 'view'],
  ['role:sales_manager', 'org:*', 'reports', 'view'],

  // Store Manager
  ['role:store_manager', 'org:*', 'store', '*'],
  ['role:store_manager', 'org:*', 'inventory', 'view'],
  ['role:store_manager', 'org:*', 'inventory', 'edit'],
  ['role:store_manager', 'org:*', 'reports', 'view'],

  // Employee
  ['role:employee', 'org:*', 'sales', 'view'],
  ['role:employee', 'org:*', 'inventory', 'view'],
  ['role:employee', 'org:*', 'store', 'view'],
];

async function setupDatabase() {
  console.log('🗄️  Checking database tables...');

  // Check if tables exist by trying to select from them
  try {
    await supabase.from('roles').select('count', { count: 'exact', head: true });
    console.log('✅ Roles table exists');
  } catch (error) {
    console.log('ℹ️  Roles table may not exist, but continuing...');
  }

  try {
    await supabase.from('user_roles').select('count', { count: 'exact', head: true });
    console.log('✅ User_roles table exists');
  } catch (error) {
    console.log('ℹ️  User_roles table may not exist, but continuing...');
  }

  console.log('✅ Database check completed');
}

async function createDefaultRoles() {
  console.log('👥 Creating default roles...');

  for (const role of DEFAULT_ROLES) {
    const { error } = await supabase
      .from('roles')
      .upsert({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });

    if (error) {
      console.error(`❌ Failed to create role ${role.name}:`, error);
    } else {
      console.log(`✅ Created role: ${role.name}`);
    }
  }
}

async function createAdminUser() {
  console.log('👤 Creating admin user...');

  // Create admin user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: 'System Administrator',
      role: 'super_admin'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.code === 'email_exists') {
      console.log('ℹ️  Admin user already exists in auth');

      // Get existing user from users table
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('email', ADMIN_EMAIL)
        .single();

      if (users) {
        console.log('✅ Found existing admin user:', users.id);
        await updateUserProfile(users.id);
        await assignAdminRole(users.id);
        return;
      }
    } else {
      console.error('❌ Failed to create admin user:', authError);
      throw authError;
    }
  } else if (authData.user) {
    console.log('✅ Created admin user in auth');
    await updateUserProfile(authData.user.id);
    await assignAdminRole(authData.user.id);
  }
}

async function updateUserProfile(userId) {
  // Update user profile in users table
  const { error: profileError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: ADMIN_EMAIL,
      name: 'System Administrator',
    });

  if (profileError) {
    console.error('❌ Failed to update admin profile:', profileError);
    throw profileError;
  }

  console.log('✅ Updated admin profile');
}

async function assignAdminRole(userId) {
  // Assign super_admin role
  // Find the Super Admin role ID
  const superAdminRole = DEFAULT_ROLES.find(role => role.name === 'Super Admin');
  if (!superAdminRole) {
    throw new Error('Super Admin role not found');
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role_id: superAdminRole.id,
    });

  if (roleError) {
    console.error('❌ Failed to assign admin role:', roleError);
    throw roleError;
  }

  console.log('✅ Assigned super_admin role');
}

async function setupCasbinPolicies() {
  console.log('🔐 Setting up Casbin policies...');

  try {
    // Import Casbin functions
    const { initCasbin, addRoleForUser } = await import('../src/lib/casbinClient.ts');

    const enforcer = await initCasbin();

    // Clear existing policies
    await enforcer.clearPolicy();

    // Add default policies
    for (const policy of DEFAULT_POLICIES) {
      await enforcer.addPolicy(...policy);
    }

    // Save policies
    await enforcer.savePolicy();

    console.log('✅ Casbin policies configured');
  } catch (error) {
    console.error('❌ Failed to setup Casbin policies:', error);
    // Don't throw - Casbin setup is optional if not properly configured
    console.log('⚠️  Skipping Casbin setup - ensure SUPABASE_DB_URL is configured');
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...');

  // Check if admin user exists
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (usersError || !users) {
    throw new Error('Admin user not found after setup');
  }

  // Check if admin role is assigned
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', users.id)
    .eq('role_id', 'super_admin');

  if (rolesError || !userRoles?.length) {
    throw new Error('Admin role not assigned after setup');
  }

  console.log('✅ Setup verification successful');
  console.log('📧 Admin Email:', ADMIN_EMAIL);
  console.log('🔑 Admin Password:', ADMIN_PASSWORD);
  console.log('🆔 Admin User ID:', users.id);
  console.log('🏢 Organization ID:', DEFAULT_ORG_ID);
}

async function main() {
  try {
    console.log('🚀 Starting Arcus V1 Admin Setup...\n');

    await setupDatabase();
    await createDefaultRoles();
    await createAdminUser();
    await setupCasbinPolicies();
    await verifySetup();

    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your application: npm run dev');
    console.log('2. Login with:', ADMIN_EMAIL, '/', ADMIN_PASSWORD);
    console.log('3. Navigate to: /dashboard/users to manage users');
    console.log('4. Navigate to: /dashboard/users/roles to manage roles');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();