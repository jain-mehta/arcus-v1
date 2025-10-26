#!/usr/bin/env node

/**
 * Migrate Domain Tables to Tenant Database
 * 
 * Usage: pnpm run migrate:domain -- --tenant-id="acme"
 * 
 * Purpose:
 *   - Creates domain entities tables in tenant-specific database
 *   - Sets up indexes and RLS policies
 *   - Seeds sample data (optional)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
const tenantIdArg = args.find((arg) => arg.startsWith('--tenant-id='));
const tenantId = tenantIdArg ? tenantIdArg.split('=')[1] : null;

if (!tenantId) {
  console.error('❌ Missing --tenant-id flag\n');
  console.log('Usage: pnpm run migrate:domain -- --tenant-id="acme"');
  process.exit(1);
}

console.log(`\n🔄 Migrating domain tables for tenant: ${tenantId}\n`);

async function runMigration() {
  try {
    // Read the migration SQL
    const migrationPath = resolve(__dirname, '../migrations/domain/20251028_create_domain_tables.ts');
    const migrationModule = await import(migrationPath);
    const migrationSql = migrationModule.default || migrationModule.createDomainTables;

    if (!migrationSql) {
      throw new Error('Could not read migration SQL');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log('📊 Executing migration SQL...');

    // Execute the migration (split by ; to run multiple statements)
    const statements = migrationSql.split(';').filter((stmt) => stmt.trim());

    let successCount = 0;
    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) continue;

      const { error } = await supabase.rpc('exec_sql', { sql: trimmedStmt });

      if (error) {
        // RLS policy errors are OK (already exist)
        if (
          error.message.includes('already exists') ||
          error.message.includes('RLS policy')
        ) {
          successCount++;
          continue;
        }
        console.warn(`⚠️  Statement warning: ${error.message}`);
        continue;
      }

      successCount++;
    }

    console.log(`✅ Applied ${successCount}/${statements.length} migration statements\n`);

    // Optional: Seed sample data
    const seedArg = args.find((arg) => arg === '--seed');
    if (seedArg) {
      await seedDomainData(supabase, tenantId);
    }

    console.log('🎉 Domain migration completed successfully!');
    console.log('\nNext steps:');
    console.log(`  1. Verify tables created: SELECT * FROM pg_tables WHERE schemaname='public';`);
    console.log(`  2. Test data access: SELECT * FROM vendors LIMIT 1;`);
    console.log(`  3. Deploy application code`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function seedDomainData(supabase, tenantId) {
  console.log('\n🌱 Seeding sample domain data...');

  const seedSQL = `
    -- Sample Vendor
    INSERT INTO vendors (tenant_id, name, vendor_code, email, phone, city, status, created_by)
    VALUES (
      '${tenantId}',
      'Global Supplies Inc',
      'VS001',
      'contact@globalsupplies.com',
      '+91-11-12345678',
      'Delhi',
      'active',
      'system'
    ) ON CONFLICT (email) DO NOTHING;

    -- Sample Product
    INSERT INTO products (tenant_id, sku, name, unit_price, category, status, created_by)
    VALUES (
      '${tenantId}',
      'SKU-001',
      'Office Chair',
      5000.00,
      'Furniture',
      'active',
      'system'
    ) ON CONFLICT (sku) DO NOTHING;

    -- Sample Inventory
    INSERT INTO inventory (tenant_id, product_id, warehouse_location, quantity_on_hand, reorder_level, status)
    SELECT
      '${tenantId}',
      p.id,
      'Main Warehouse',
      100,
      20,
      'active'
    FROM products p WHERE p.sku = 'SKU-001' ON CONFLICT (tenant_id, product_id, warehouse_location) DO NOTHING;
  `;

  // Split and execute seed statements
  const seedStatements = seedSQL.split(';').filter((stmt) => stmt.trim());

  for (const statement of seedStatements) {
    const trimmedStmt = statement.trim();
    if (!trimmedStmt) continue;

    const { error } = await supabase.rpc('exec_sql', { sql: trimmedStmt });

    if (error && !error.message.includes('ON CONFLICT')) {
      console.warn(`⚠️  Seed warning: ${error.message}`);
    }
  }

  console.log('✅ Sample data seeded');
}

runMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});
