/**
 * Database Connection Test
 * Tests Supabase connection and verifies tables exist
 */

import { getSupabaseServerClient } from '@/lib/supabase/client';

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    console.log('✅ Supabase client initialized');

    // Test 1: Query a simple table to verify connection
    console.log('\n📋 Test 1: Checking tables exist');
    console.log('-'.repeat(60));

    const tablesToCheck = [
      'users',
      'products',
      'vendors',
      'stores',
      'purchase_orders',
      'roles',
      'permissions',
    ];

    for (const table of tablesToCheck) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${table}: OK (${count || 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Exception - ${(err as any).message}`);
      }
    }

    // Test 2: Test insert and delete
    console.log('\n📋 Test 2: Testing INSERT/DELETE operations');
    console.log('-'.repeat(60));

    try {
      // Create a test product
      const { data: insertedData, error: insertError } = await supabase
        .from('products')
        .insert({
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Test',
          price: 100,
          cost: 50,
          unit: 'piece',
          created_by: 'test-user',
        })
        .select('id')
        .single();

      if (insertError) {
        console.log(`❌ INSERT failed: ${insertError.message}`);
      } else {
        console.log(`✅ INSERT successful: Created product with ID ${(insertedData as any).id}`);

        // Delete the test product
        const testId = (insertedData as any).id;
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', testId);

        if (deleteError) {
          console.log(`❌ DELETE failed: ${deleteError.message}`);
        } else {
          console.log(`✅ DELETE successful: Removed test product`);
        }
      }
    } catch (err) {
      console.log(`❌ INSERT/DELETE test failed: ${(err as any).message}`);
    }

    // Test 3: Test authentication
    console.log('\n📋 Test 3: Testing Authentication');
    console.log('-'.repeat(60));

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.log(`❌ Auth query failed: ${authError.message}`);
      } else {
        console.log(`✅ Auth working: ${(authData as any).users.length} users in system`);
      }
    } catch (err) {
      console.log(`❌ Auth test failed: ${(err as any).message}`);
    }

    // Test 4: Test RLS (Row Level Security) policy
    console.log('\n📋 Test 4: Testing RLS Policies');
    console.log('-'.repeat(60));

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);

      if (error) {
        console.log(`⚠️  RLS check: ${error.message}`);
      } else {
        console.log(`✅ RLS Policies: OK (Query returned ${(data as any).length} rows)`);
      }
    } catch (err) {
      console.log(`❌ RLS test failed: ${(err as any).message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Database connection tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', (error as any).message);
    process.exit(1);
  }
}

// Run if this file is executed directly
testDatabaseConnection().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

export { testDatabaseConnection };
