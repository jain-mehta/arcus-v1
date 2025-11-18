#!/usr/bin/env node

/**
 * Debug script to check admin user role assignment
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://asuxcwlbzspsifvigmov.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdXhjd2xienNwc2lmdmlnbW92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MzQxOSwiZXhwIjoyMDc2MTY5NDE5fQ.CEWxpRUu-uvKnbwvvoc6TjJ12Ga9GHYtl5I3xLN8A48';

async function debugAdminUser() {
  console.log('🔍 Debugging admin user role assignment...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Find adminharsh@arcus.local user
    console.log('1️⃣  Finding adminharsh@arcus.local user...');
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', 'adminharsh@arcus.local');

    if (!users || users.length === 0) {
      console.log('   ❌ User not found');
      return;
    }

    const adminUser = users[0];
    console.log(`   ✅ Found user:`);
    console.log(`      ID: ${adminUser.id}`);
    console.log(`      Email: ${adminUser.email}`);
    console.log(`      Name: ${adminUser.name}\n`);

    // 2. Check user_roles assignment
    console.log('2️⃣  Checking user_roles assignment...');
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('id, user_id, role_id')
      .eq('user_id', adminUser.id);

    if (!userRoles || userRoles.length === 0) {
      console.log('   ❌ No roles assigned');
      return;
    }

    console.log(`   ✅ Found ${userRoles.length} role(s):`);
    userRoles.forEach((ur, idx) => {
      console.log(`      ${idx + 1}. role_id: ${ur.role_id}`);
    });
    console.log('');

    // 3. Check if role_id is 'admin' or a UUID
    const roleId = userRoles[0].role_id;
    console.log('3️⃣  Analyzing role_id...');
    if (roleId === 'admin') {
      console.log(`   ✅ role_id is 'admin' (STRING) - Correct!`);
    } else if (roleId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log(`   ⚠️  role_id is a UUID: ${roleId}`);
      console.log(`   This means the admin role was stored as a UUID, not the string 'admin'\n`);

      // Check if this UUID corresponds to a role named 'Administrator'
      console.log('4️⃣  Looking up the role...');
      const { data: role } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('id', roleId)
        .single();

      if (role) {
        console.log(`   ✅ Found role:`);
        console.log(`      ID: ${role.id}`);
        console.log(`      Name: ${role.name}`);
        console.log(`      Has Permissions: ${role.permissions ? Object.keys(role.permissions).length + ' modules' : 'none'}`);
        console.log('');

        // The issue is that checkPermission checks roleId === 'admin'
        // But we have a UUID roleId, so it doesn't match!
        console.log('❌ ISSUE FOUND:');
        console.log('   The user has a UUID role_id, but checkPermission() checks:');
        console.log('   if (userClaims.roleId === "admin")');
        console.log('   This will FAIL because UUID !== "admin" string\n');

        console.log('✅ SOLUTION:');
        console.log('   Either:');
        console.log('   1. Change user_roles to assign role_id: "admin" (string)');
        console.log('   2. Or check if role.name === "Administrator" in the RBAC logic\n');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAdminUser();
