#!/usr/bin/env node

/**
 * Diagnostic Script: Check Submodule Visibility Issues
 * 
 * This script checks:
 * 1. Admin user exists and has proper role
 * 2. Role name is "Administrator"  (critical for RBAC)
 * 3. All 44 permission keys are in config
 * 4. Permission keys match navigation config
 * 
 * Usage: node diagnose-submodules.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REQUIRED_PERMISSIONS = [
  // Sales (11)
  'sales:dashboard:view',
  'sales:leads:view',
  'sales:opportunities:view',
  'sales:quotations:view',
  'sales:orders:view',
  'sales:customers:view',
  'sales:activities:view',
  'sales:visits:view',
  'sales:leaderboard:view',
  'sales:reports:view',
  'sales:settings:edit',
  
  // Inventory (11)
  'inventory:overview:view',
  'inventory:products:view',
  'inventory:goodsInward:view',
  'inventory:goodsOutward:view',
  'inventory:transfers:view',
  'inventory:counting:view',
  'inventory:valuationReports:view',
  'inventory:qr:generate',
  'inventory:factory:view',
  'inventory:store:view',
  'inventory:aiCatalog:view',
  
  // Store (12)
  'store:overview:view',
  'store:bills:view',
  'store:billingHistory:view',
  'store:dashboard:view',
  'store:debitNote:view',
  'store:invoiceFormat:view',
  'store:inventory:view',
  'store:manage',
  'store:receiving:view',
  'store:reports:view',
  'store:returns:view',
  'store:staff:view',
  
  // HRMS (10)
  'hrms:overview:view',
  'hrms:announcements:view',
  'hrms:attendance:view',
  'hrms:compliance:view',
  'hrms:employees:view',
  'hrms:leaves:view',
  'hrms:payroll:view',
  'hrms:performance:view',
  'hrms:recruitment:view',
  'hrms:reports:view',
];

console.log('🔍 SUBMODULE VISIBILITY DIAGNOSTIC\n');
console.log('=' .repeat(60) + '\n');

// Check 1: Admin user exists
console.log('CHECK 1: Admin User in Database');
console.log('-'.repeat(60));

const { data: authUsers } = await supabase.auth.admin.listUsers();
const adminAuthUser = authUsers?.users?.find(u => u.email === 'admin@yourbusiness.local');

if (adminAuthUser) {
  console.log(`✅ Admin auth user found: ${adminAuthUser.email}`);
  console.log(`   ID: ${adminAuthUser.id}`);
} else {
  console.log(`❌ Admin user NOT found in auth.users`);
  console.log(`   Expected email: admin@yourbusiness.local`);
  console.log(`   Tip: Run 'node seed-users-with-roles.mjs' to create admin user\n`);
}

// Check 2: User record in public.users
if (adminAuthUser) {
  const { data: publicUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', adminAuthUser.id)
    .single();
  
  console.log('\nCHECK 2: User Record in public.users');
  console.log('-'.repeat(60));
  
  if (publicUser) {
    console.log(`✅ Public user record found`);
    console.log(`   ID: ${publicUser.id}`);
    console.log(`   Email: ${publicUser.email}`);
  } else {
    console.log(`❌ No public user record found`);
    console.log(`   Tip: User auth record exists but not in public.users\n`);
  }
}

// Check 3: User Role Assignment
if (adminAuthUser) {
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', adminAuthUser.id);
  
  console.log('\nCHECK 3: User Role Assignment');
  console.log('-'.repeat(60));
  
  if (userRoles && userRoles.length > 0) {
    console.log(`✅ User has ${userRoles.length} role(s) assigned`);
    const roleId = userRoles[0].role_id;
    console.log(`   Role ID: ${roleId}`);
    
    // Check 4: Role Details
    const { data: roleData } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();
    
    console.log('\nCHECK 4: Role Details');
    console.log('-'.repeat(60));
    
    if (roleData) {
      console.log(`✅ Role found in database`);
      console.log(`   ID: ${roleData.id}`);
      console.log(`   Name: ${roleData.name}`);
      
      if (roleData.name === 'Administrator') {
        console.log(`   ✅ Role name is "Administrator" (CORRECT for RBAC)`);
      } else {
        console.log(`   ❌ Role name is "${roleData.name}", expected "Administrator"`);
        console.log(`      This is why submodules are missing!`);
        console.log(`      The RBAC check: if (roleName === 'Administrator') fails\n`);
      }
    } else {
      console.log(`❌ Role NOT found in roles table`);
      console.log(`   Role ID: ${roleId}\n`);
    }
  } else {
    console.log(`❌ No roles assigned to user`);
    console.log(`   User has no role_id in user_roles table`);
    console.log(`   Tip: Assign Administrator role to user\n`);
  }
}

// Check 5: Permission Keys in Config
console.log('\nCHECK 5: Permission Keys in admin-permissions-config.ts');
console.log('-'.repeat(60));

try {
  const configContent = fs.readFileSync('src/lib/admin-permissions-config.ts', 'utf8');
  
  let foundCount = 0;
  const missingKeys = [];
  
  REQUIRED_PERMISSIONS.forEach(key => {
    if (configContent.includes(`'${key}':`)) {
      foundCount++;
    } else {
      missingKeys.push(key);
    }
  });
  
  console.log(`✅ Found ${foundCount}/${REQUIRED_PERMISSIONS.length} permission keys`);
  
  if (missingKeys.length > 0) {
    console.log(`\n❌ Missing ${missingKeys.length} permission keys:`);
    missingKeys.forEach(key => console.log(`   - ${key}`));
  } else {
    console.log(`✅ All required permission keys are present`);
  }
} catch (error) {
  console.log(`⚠️  Could not read admin-permissions-config.ts: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\nDIAGNOSTIC SUMMARY:\n');

if (!adminAuthUser) {
  console.log('🔴 CRITICAL: Admin user not created');
  console.log('   → Run: node seed-users-with-roles.mjs\n');
}

console.log('💡 NEXT STEPS:\n');
console.log('1. Check if admin user exists with "Administrator" role');
console.log('2. If missing, run: node seed-users-with-roles.mjs');
console.log('3. Login as admin@yourbusiness.local');
console.log('4. Open browser console and check for role name in user claims');
console.log('5. Verify 44 submodules are visible\n');

console.log('📋 WHAT TO CHECK IN BROWSER CONSOLE:\n');
console.log('Look for these in the network response when you login:');
console.log('- uid: your-user-id');
console.log('- email: admin@yourbusiness.local');
console.log('- roleName: "Administrator"  ← CRITICAL\n');

console.log('If roleName is null or not "Administrator", that\'s why');
console.log('submodules are missing! The RBAC check will fail.\n');
