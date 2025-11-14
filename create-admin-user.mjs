#!/usr/bin/env node

/**
 * Create Admin User in Supabase
 * This script creates the test admin user needed for E2E tests
 * 
 * Usage: node create-admin-user.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

const ADMIN_EMAIL = 'admin@arcus.local';
const ADMIN_PASSWORD = 'Admin@123456';

async function createAdmin() {
  console.log('========================================');
  console.log('🔐 Creating Admin User for Tests');
  console.log('========================================');

  try {
    // Create Supabase client with service role (admin access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('1️⃣  Checking if user already exists...');
    
    // List all users to check if admin exists
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const adminExists = allUsers?.users?.some(u => u.email === ADMIN_EMAIL);

    if (adminExists) {
      console.log(`   ⏭️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log('✅ Admin user is ready for testing');
      process.exit(0);
    }

    console.log(`   ✓ User doesn't exist, creating...`);

    console.log('2️⃣  Creating user in Supabase Auth...');
    
    // Create the user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        fullName: 'Admin User',
        role: 'admin',
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log(`   ✓ Created user in Supabase Auth`);
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`   ✅ Email auto-confirmed`);

    console.log('3️⃣  Creating user profile in database...');

    const { error: insertError } = await supabase.from('users').insert({
      id: newUser.user.id,
      email: ADMIN_EMAIL,
      full_name: 'Admin User',
      is_active: true,
      is_email_verified: true,
      email_verified_at: new Date().toISOString(),
    }).select();

    if (insertError && !insertError.message.includes('duplicate')) {
      console.log(`   ⚠️  Warning: Could not create profile: ${insertError.message}`);
    } else if (insertError && insertError.message.includes('duplicate')) {
      console.log(`   ⏭️  Profile already exists`);
    } else {
      console.log(`   ✓ Created user profile in database`);
    }

    console.log('========================================');
    console.log('✅ Admin User Created Successfully!');
    console.log('========================================');
    
    console.log('🎯 YOU CAN NOW:');
    console.log(`   1. Run: npm run dev`);
    console.log(`   2. Go to: http://localhost:3000/login`);
    console.log(`   3. Login with:`);
    console.log(`      📧 Email: ${ADMIN_EMAIL}`);
    console.log(`      🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`   4. Run tests: npm run test:e2e`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Troubleshooting:');
    console.error('  1. Check internet connection to Supabase');
    console.error('  2. Verify Supabase credentials in .env.local');
    console.error('  3. Check Supabase project is not deleted');
    console.error('  4. Try again in a few seconds');
    process.exit(1);
  }
}

createAdmin();
