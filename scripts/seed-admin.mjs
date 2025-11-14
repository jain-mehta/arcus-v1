/**
 * Seed Admin User for Development
 * Creates admin user with full RBAC permissions via Supabase Auth
 * 
 * Usage: npm run seed:admin
 * Note: This script uses Supabase's native authentication
 * No custom tables needed - uses session management instead
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@arcus.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Full admin permissions across all modules
const ADMIN_PERMISSIONS = {
  dashboard: { create: true, read: true, update: true, delete: true, manage: true },
  users: { create: true, read: true, update: true, delete: true, manage: true },
  roles: { create: true, read: true, update: true, delete: true, manage: true },
  permissions: { create: true, read: true, update: true, delete: true, manage: true },
  store: { create: true, read: true, update: true, delete: true, manage: true },
  sales: { create: true, read: true, update: true, delete: true, manage: true },
  vendor: { create: true, read: true, update: true, delete: true, manage: true },
  inventory: { create: true, read: true, update: true, delete: true, manage: true },
  hrms: { create: true, read: true, update: true, delete: true, manage: true },
  reports: { create: true, read: true, update: true, delete: true, manage: true },
  settings: { create: true, read: true, update: true, delete: true, manage: true },
  audit: { create: true, read: true, update: true, delete: true, manage: true },
  admin: { create: true, read: true, update: true, delete: true, manage: true },
};

async function seedAdmin() {
  console.log('🌱 Seeding admin user via Supabase Auth...');

  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }

    // Create Supabase admin client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('1️⃣  Creating admin user in Supabase Auth...');
    
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .auth
      .admin
      .listUsers();

    if (checkError) {
      throw new Error(`Failed to list users: ${checkError.message}`);
    }

    const adminExists = existingUsers?.users?.some(u => u.email === ADMIN_EMAIL);

    if (adminExists) {
      console.log(`   ⏭️  Admin user already exists: ${ADMIN_EMAIL}`);
    } else {
      // Create user with auth.admin
      const { data: newUser, error: createError } = await supabase
        .auth
        .admin
        .createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            fullName: 'System Administrator',
            role: 'admin',
            permissions: ADMIN_PERMISSIONS,
            isSystemAdmin: true,
          },
        });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      console.log(`   ✅ Created admin user: ${ADMIN_EMAIL}`);
      console.log(`   🔐 Password: ${ADMIN_PASSWORD}`);
    }

    console.log('2️⃣  Creating admin profile in application database...');
    
    // Get admin user ID from Supabase Auth
    const { data: { users: allUsers }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const adminAuthUser = allUsers?.find(u => u.email === ADMIN_EMAIL);
    if (!adminAuthUser) {
      throw new Error(`Admin user not found in Supabase Auth`);
    }

    console.log(`   📝 Admin Auth ID: ${adminAuthUser.id}`);

    // Create admin profile in public.users table
    // This is CRITICAL for multi-layer architecture:
    // - auth.users (Supabase managed) = credentials
    // - public.users (app managed) = user profile + metadata
    
    const { data: existingUserProfile, error: checkProfileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', adminAuthUser.id)
      .maybeSingle();

    if (checkProfileError && checkProfileError.code !== 'PGRST116') {
      throw new Error(`Failed to check user profile: ${checkProfileError.message}`);
    }

    if (!existingUserProfile) {
      const { error: createProfileError } = await supabase
        .from('users')
        .insert({
          id: adminAuthUser.id,
          email: ADMIN_EMAIL,
          full_name: 'System Administrator',
          password_hash: '', // Not used - auth via Supabase
          is_active: true,
          is_email_verified: true,
          email_verified_at: new Date().toISOString(),
        });

      if (createProfileError) {
        throw new Error(`Failed to create admin profile: ${createProfileError.message}`);
      }

      console.log(`   ✅ Created admin profile in public.users table`);
    } else {
      console.log(`   ⏭️  Admin profile already exists`);
    }

    // Store credentials for reference
    const adminCredentials = {
      authId: adminAuthUser.id,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      fullName: 'System Administrator',
      role: 'admin',
      permissions: ADMIN_PERMISSIONS,
      isSystemAdmin: true,
      createdAt: new Date().toISOString(),
    };

    console.log(`   ✅ Admin credentials and profile synced`);

    // Print summary
    console.log('' + '='.repeat(75));
    console.log('✅ Admin Seeding Completed Successfully!');
    
    console.log('📋 ARCHITECTURE:');
    console.log('📋 ARCHITECTURE:');
    console.log('   Authentication Layer: Supabase Auth (auth.users table)');
    console.log('   User Profile Layer: PostgreSQL (public.users table)');
    console.log('   Sync: Automatic on login via /api/auth/login');

    console.log('📋 ADMIN ACCOUNT DETAILS:');;
    console.log(`   Email:        ${ADMIN_EMAIL}`);
    console.log(`   Password:     ${ADMIN_PASSWORD}`);
    console.log(`   Full Name:    System Administrator`);
    console.log(`   Role:         System Administrator`);
    console.log(`   Status:       Active & Email Verified`);
    
    console.log('🔐 GRANTED PERMISSIONS (All modules, all actions):');
    Object.entries(ADMIN_PERMISSIONS).forEach(([module, perms]) => {
      const actions = Object.keys(perms).filter(k => perms[k]);
      console.log(`   ✅ ${module.padEnd(15)} → ${actions.join(', ')}`);
    });

    console.log('🎯 FUNCTIONALITY ACCESS:');
    console.log('   ✅ Dashboard View & Management');
    console.log('   ✅ User Management (Create, Edit, Delete)');
    console.log('   ✅ Role Management (Create, Edit, Delete)');
    console.log('   ✅ Permission Management');
    console.log('   ✅ Store & Inventory Management');
    console.log('   ✅ Sales & Purchase Orders');
    console.log('   ✅ Vendor Management');
    console.log('   ✅ HRMS & Employee Management');
    console.log('   ✅ Reports & Analytics');
    console.log('   ✅ Settings & Configuration');
    console.log('   ✅ Audit Logs & Monitoring');
    console.log('   ✅ Admin Functions');

    console.log('🚀 NEXT STEPS:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Go to: http://localhost:3000/login');
    console.log(`   3. Login with: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log('   4. Access full dashboard with admin privileges');
    
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   • Change this password in production immediately');
    console.log('   • Use environment variables for credentials');
    console.log('   • Enable 2FA for production admin accounts');
    console.log('   • Rotate credentials regularly');
    console.log('='.repeat(75));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Failed:', error.message || error);
    console.error('Troubleshooting:');
    console.error('1. Verify SUPABASE_URL is set correctly');
    console.error('2. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly');
    console.error('3. Check Supabase connection and credentials');
    console.error('4. Ensure you have network access to Supabase');
    process.exit(1);
  }
}

// Run seed
seedAdmin();
