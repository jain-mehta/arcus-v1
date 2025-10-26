#!/usr/bin/env node

/**
 * Seed Control Plane CLI
 * Initialize control-plane database with demo data
 * 
 * Usage:
 *   pnpm run seed:control-plane
 *   pnpm run seed:control-plane --demo
 *   pnpm run seed:control-plane --clear
 */

import 'reflect-metadata';
import { initializeControlDB, ControlDataSource } from '../src/lib/controlDataSource.js';
import { TenantMetadata } from '../src/entities/control/tenant-metadata.entity.js';
import { UserMapping } from '../src/entities/control/user-mapping.entity.js';
import { Session } from '../src/entities/control/session.entity.js';

const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const shouldDemo = args.includes('--demo') || args.length === 0;

async function main() {
  console.log('\n🌱 Control Plane Seeder\n');

  try {
    // Initialize DataSource
    console.log('📦 Initializing control-plane database...');
    const dataSource = await initializeControlDB();

    if (!dataSource) {
      console.error('❌ Failed to initialize control-plane');
      process.exit(1);
    }

    // Clear if requested
    if (shouldClear) {
      console.log('🗑️  Clearing existing data...');
      const userMappingRepo = dataSource.getRepository(UserMapping);
      const sessionRepo = dataSource.getRepository(Session);
      const tenantRepo = dataSource.getRepository(TenantMetadata);

      await userMappingRepo.clear();
      await sessionRepo.clear();
      await tenantRepo.clear();

      console.log('✅ Data cleared\n');
    }

    // Seed demo data
    if (shouldDemo) {
      console.log('📝 Seeding demo data...\n');

      const tenantRepo = dataSource.getRepository(TenantMetadata);
      const userMappingRepo = dataSource.getRepository(UserMapping);

      // Demo tenant
      const demoTenant = await tenantRepo.findOne({
        where: { tenant_id: 'demo-tenant' },
      });

      if (!demoTenant) {
        console.log('  📌 Creating Demo Tenant...');
        const newTenant = tenantRepo.create({
          tenant_id: 'demo-tenant',
          tenant_name: 'Demo Corporation',
          status: 'active',
          database_url:
            process.env.DATABASE_URL ||
            'postgresql://postgres:postgres@postgres:5432/demo_tenant_db',
          database_region: 'us-east-1',
          provisioning_status: 'ready',
          migrations_applied: true,
        });

        await tenantRepo.save(newTenant);
        console.log('     ✅ Demo Tenant created\n');
      } else {
        console.log('     ⚠️  Demo Tenant already exists\n');
      }

      // Demo users
      const demoUsers = [
        {
          supabase_user_id: 'user-admin-001',
          email: 'admin@demo.com',
          role: 'Admin',
          department: 'Management',
          is_active: true,
        },
        {
          supabase_user_id: 'user-sales-manager-001',
          email: 'sales.manager@demo.com',
          role: 'Sales Manager',
          department: 'Sales',
          is_active: true,
        },
        {
          supabase_user_id: 'user-sales-exec-001',
          email: 'sales.exec@demo.com',
          role: 'Sales Executive',
          department: 'Sales',
          is_active: true,
        },
        {
          supabase_user_id: 'user-inventory-001',
          email: 'inventory@demo.com',
          role: 'Inventory Manager',
          department: 'Inventory',
          is_active: true,
        },
        {
          supabase_user_id: 'user-hr-001',
          email: 'hr@demo.com',
          role: 'HR Manager',
          department: 'HR',
          is_active: true,
        },
      ];

      for (const userData of demoUsers) {
        const existing = await userMappingRepo.findOne({
          where: {
            supabase_user_id: userData.supabase_user_id,
            tenant_id: 'demo-tenant',
          },
        });

        if (!existing) {
          console.log(`  📌 Creating user: ${userData.email}...`);

          const userMapping = userMappingRepo.create({
            supabase_user_id: userData.supabase_user_id,
            tenant_id: 'demo-tenant',
            email: userData.email,
            role: userData.role,
            department: userData.department,
            is_active: userData.is_active,
            permissions_snapshot: {}, // Will be populated by Permify
          });

          await userMappingRepo.save(userMapping);
          console.log(`     ✅ ${userData.email}\n`);
        }
      }

      console.log('✅ Demo data seeded\n');
    }

    console.log('🎉 Seeding complete!');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
