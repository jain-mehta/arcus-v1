#!/usr/bin/env node

/**
 * Tenant Provisioning CLI
 * Create and initialize a new tenant database
 * 
 * Usage:
 *   pnpm run provision:tenant --tenant-id="acme-corp" --tenant-name="Acme Corp" --region="us-east-1"
 *   pnpm run provision:tenant --id acme --name "Acme" (short flags)
 */

import 'reflect-metadata';
import { createTenantDatabase, generateTenantDatabaseUrl } from '../src/lib/supabase/admin-client.js';
import { initializeControlDB, ControlDataSource } from '../src/lib/controlDataSource.js';
import { TenantMetadata } from '../src/entities/control/tenant-metadata.entity.js';

const args = process.argv.slice(2);
const flags = {};

// Parse CLI flags
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    const value = args[i + 1]?.startsWith('--') ? 'true' : args[i + 1];
    flags[key] = value || 'true';
    if (!value || value.startsWith('--')) i--;
    else i++;
  } else if (args[i].startsWith('-')) {
    const key = args[i].substring(1);
    const value = args[i + 1]?.startsWith('-') ? 'true' : args[i + 1];
    flags[key] = value || 'true';
    if (!value || value.startsWith('-')) i--;
    else i++;
  }
}

async function main() {
  console.log('🚀 Tenant Provisioning CLI');

  try {
    // Get tenant ID and name
    const tenantId = flags['tenant-id'] || flags['id'];
    const tenantName = flags['tenant-name'] || flags['name'];
    const region = flags['region'] || 'us-east-1';

    if (!tenantId) {
      console.error('❌ Error: --tenant-id is required');
      console.log('Usage: pnpm run provision:tenant --tenant-id="acme" --tenant-name="Acme Corp"');
      process.exit(1);
    }

    if (!tenantName) {
      console.error('❌ Error: --tenant-name is required');
      console.log('Usage: pnpm run provision:tenant --tenant-id="acme" --tenant-name="Acme Corp"');
      process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Tenant Name: ${tenantName}`);
    console.log(`   Region: ${region}`);

    // Step 1: Create database
    console.log('Step 1️⃣ : Creating tenant database...');
    const tenantDb = await createTenantDatabase({
      tenantId,
      tenantName,
      region,
    });

    console.log(`✅ Database created with URL: ${tenantDb.databaseUrl}`);

    // Step 2: Initialize control-plane database
    console.log('Step 2️⃣ : Initializing control-plane database...');
    const controlDataSource = await initializeControlDB();

    if (!controlDataSource) {
      throw new Error('Failed to initialize control-plane database');
    }

    console.log('✅ Control-plane initialized');

    // Step 3: Register tenant in control-plane
    console.log('Step 3️⃣ : Registering tenant in control-plane...');
    const tenantRepo = controlDataSource.getRepository(TenantMetadata);

    const existingTenant = await tenantRepo.findOne({
      where: { tenant_id: tenantId },
    });

    if (existingTenant) {
      console.warn(`⚠️  Tenant ${tenantId} already exists. Skipping registration.`);
    } else {
      const newTenant = tenantRepo.create({
        tenant_id: tenantId,
        tenant_name: tenantName,
        status: 'active',
        database_url: tenantDb.databaseUrl,
        database_region: region,
        provisioning_status: 'provisioning',
        migrations_applied: false,
        metadata: {
          created_by: 'cli',
          created_at: new Date().toISOString(),
        },
      });

      await tenantRepo.save(newTenant);
      console.log(`✅ Tenant registered in control-plane`);
    }

    // Step 4: Success
    console.log('🎉 Tenant provisioning complete!');
    console.log('📝 Next steps:');
    console.log(`   1. Run migrations: pnpm run migrate:tenant --tenant-id=${tenantId}`);
    console.log(`   2. Seed demo data: pnpm run seed:tenant --tenant-id=${tenantId}`);
    console.log(`   3. Create user: pnpm run add-user --tenant-id=${tenantId} --email=admin@${tenantId}.com`);

    await controlDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
