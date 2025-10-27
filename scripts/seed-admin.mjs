/**
 * Seed Control-Plane Database
 * Creates admin user, default organization, and system roles
 * 
 * Usage: pnpm seed:admin
 */

import 'reflect-metadata';
import { getControlRepo } from '../src/lib/controlDataSource.js';
import { User, Organization, Role, UserRole } from '../src/lib/entities/auth.entity.js';
import { hashPassword } from '../src/lib/auth.js';
import crypto from 'crypto';

// Admin credentials - CHANGE THESE IN PRODUCTION!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@arcus.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = 'System Administrator';

// Default organization
const ORG_SLUG = process.env.ORG_SLUG || 'demo-org';
const ORG_NAME = process.env.ORG_NAME || 'Demo Organization';
const ORG_DB_URL = process.env.ORG_DB_URL || 'postgresql://postgres:postgres123@localhost:5432/arcus_demo_org';

// System roles with permissions
const SYSTEM_ROLES = [
  {
    name: 'admin',
    description: 'Full system administrator with all permissions',
    permissions: {
      vendors: { view: true, create: true, edit: true, delete: true },
      products: { view: true, create: true, edit: true, delete: true },
      inventory: { view: true, create: true, edit: true, delete: true },
      purchaseOrders: { view: true, create: true, edit: true, delete: true, approve: true },
      salesOrders: { view: true, create: true, edit: true, delete: true, approve: true },
      employees: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, export: true },
      settings: { view: true, edit: true },
      users: { view: true, create: true, edit: true, delete: true },
      roles: { view: true, create: true, edit: true, delete: true },
    },
    isSystemRole: true,
  },
  {
    name: 'manager',
    description: 'Department manager with most permissions',
    permissions: {
      vendors: { view: true, create: true, edit: true, delete: false },
      products: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      purchaseOrders: { view: true, create: true, edit: true, delete: false, approve: true },
      salesOrders: { view: true, create: true, edit: true, delete: false, approve: true },
      employees: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, export: true },
      settings: { view: true, edit: false },
      users: { view: true, create: false, edit: false, delete: false },
      roles: { view: true, create: false, edit: false, delete: false },
    },
    isSystemRole: true,
  },
  {
    name: 'employee',
    description: 'Regular employee with basic permissions',
    permissions: {
      vendors: { view: true, create: false, edit: false, delete: false },
      products: { view: true, create: false, edit: false, delete: false },
      inventory: { view: true, create: false, edit: false, delete: false },
      purchaseOrders: { view: true, create: true, edit: false, delete: false, approve: false },
      salesOrders: { view: true, create: true, edit: false, delete: false, approve: false },
      employees: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, export: false },
      settings: { view: false, edit: false },
      users: { view: false, create: false, edit: false, delete: false },
      roles: { view: false, create: false, edit: false, delete: false },
    },
    isSystemRole: true,
  },
];

async function seedControlPlane() {
  console.log('🌱 Seeding control-plane database...\n');

  try {
    // 1. Create organization
    console.log('1️⃣  Creating organization...');
    const orgRepo = await getControlRepo(Organization);
    
    let organization = await orgRepo.findOne({ where: { slug: ORG_SLUG } });
    
    if (!organization) {
      organization = orgRepo.create({
        slug: ORG_SLUG,
        name: ORG_NAME,
        dbConnectionString: ORG_DB_URL,
        settings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        },
        isActive: true,
      });
      
      await orgRepo.save(organization);
      console.log(`   ✅ Created organization: ${ORG_NAME} (${ORG_SLUG})`);
    } else {
      console.log(`   ⏭️  Organization already exists: ${ORG_NAME}`);
    }

    // 2. Create system roles
    console.log('\n2️⃣  Creating system roles...');
    const roleRepo = await getControlRepo(Role);
    const createdRoles = {};

    for (const roleData of SYSTEM_ROLES) {
      let role = await roleRepo.findOne({
        where: {
          organizationId: organization.id,
          name: roleData.name,
        },
      });

      if (!role) {
        role = roleRepo.create({
          organizationId: organization.id,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          isSystemRole: roleData.isSystemRole,
        });
        
        await roleRepo.save(role);
        console.log(`   ✅ Created role: ${roleData.name}`);
      } else {
        console.log(`   ⏭️  Role already exists: ${roleData.name}`);
      }

      createdRoles[roleData.name] = role;
    }

    // 3. Create admin user
    console.log('\n3️⃣  Creating admin user...');
    const userRepo = await getControlRepo(User);
    
    let adminUser = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
    
    if (!adminUser) {
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      
      adminUser = userRepo.create({
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: ADMIN_NAME,
        isActive: true,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });
      
      await userRepo.save(adminUser);
      console.log(`   ✅ Created admin user: ${ADMIN_EMAIL}`);
      console.log(`   🔐 Password: ${ADMIN_PASSWORD}`);
      console.log(`   ⚠️  IMPORTANT: Change this password in production!`);
    } else {
      console.log(`   ⏭️  Admin user already exists: ${ADMIN_EMAIL}`);
    }

    // 4. Assign admin role to user
    console.log('\n4️⃣  Assigning admin role...');
    const userRoleRepo = await getControlRepo(UserRole);
    
    let userRole = await userRoleRepo.findOne({
      where: {
        userId: adminUser.id,
        roleId: createdRoles['admin'].id,
        organizationId: organization.id,
      },
    });

    if (!userRole) {
      userRole = userRoleRepo.create({
        userId: adminUser.id,
        roleId: createdRoles['admin'].id,
        organizationId: organization.id,
        assignedBy: adminUser.id, // Self-assigned
      });
      
      await userRoleRepo.save(userRole);
      console.log('   ✅ Assigned admin role to user');
    } else {
      console.log('   ⏭️  Admin role already assigned');
    }

    // 5. Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed completed successfully!\n');
    console.log('📋 SUMMARY:');
    console.log(`   Organization: ${ORG_NAME}`);
    console.log(`   Org Slug: ${ORG_SLUG}`);
    console.log(`   Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`   Roles Created: ${Object.keys(createdRoles).join(', ')}`);
    console.log('\n🚀 You can now login with these credentials!');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedControlPlane();
