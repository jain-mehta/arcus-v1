/**
 * Seed Control-Plane Database
 * Creates initial roles, permissions, and metadata for multi-tenant system
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

// Initialize control-plane data source
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.CONTROL_DB_HOST || 'localhost',
  port: parseInt(process.env.CONTROL_DB_PORT || '5432'),
  username: process.env.CONTROL_DB_USER || 'postgres',
  password: process.env.CONTROL_DB_PASSWORD || 'postgres',
  database: process.env.CONTROL_DB_NAME || 'arcus_control_plane',
  entities: [path.join(__dirname, '../src/lib/entities/control/**/*.ts')],
  synchronize: false,
  logging: true,
});

// Define roles that will be available to all tenants
const SYSTEM_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access, user management, configuration',
    permissions: ['*'], // Wildcard = all permissions
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'View and manage team resources',
    permissions: [
      'vendor:read',
      'vendor:create',
      'vendor:update',
      'product:read',
      'product:create',
      'product:update',
      'po:read',
      'po:create',
      'po:update',
      'po:approve',
      'so:read',
      'so:create',
      'so:update',
      'inventory:read',
      'reports:read',
    ],
  },
  {
    id: 'user',
    name: 'Standard User',
    description: 'Basic read access to assigned resources',
    permissions: [
      'vendor:read',
      'product:read',
      'po:read',
      'so:read',
      'inventory:read',
    ],
  },
  {
    id: 'readonly',
    name: 'Read-Only',
    description: 'View-only access',
    permissions: ['vendor:read', 'product:read', 'po:read', 'so:read', 'inventory:read'],
  },
];

// Define all system permissions
const SYSTEM_PERMISSIONS = [
  // Vendor permissions
  { id: 'vendor:read', name: 'Read Vendors', resource: 'vendor', action: 'read' },
  { id: 'vendor:create', name: 'Create Vendors', resource: 'vendor', action: 'create' },
  { id: 'vendor:update', name: 'Update Vendors', resource: 'vendor', action: 'update' },
  { id: 'vendor:delete', name: 'Delete Vendors', resource: 'vendor', action: 'delete' },

  // Product permissions
  { id: 'product:read', name: 'Read Products', resource: 'product', action: 'read' },
  { id: 'product:create', name: 'Create Products', resource: 'product', action: 'create' },
  { id: 'product:update', name: 'Update Products', resource: 'product', action: 'update' },
  { id: 'product:delete', name: 'Delete Products', resource: 'product', action: 'delete' },

  // PO permissions
  { id: 'po:read', name: 'Read Purchase Orders', resource: 'po', action: 'read' },
  { id: 'po:create', name: 'Create Purchase Orders', resource: 'po', action: 'create' },
  { id: 'po:update', name: 'Update Purchase Orders', resource: 'po', action: 'update' },
  { id: 'po:approve', name: 'Approve Purchase Orders', resource: 'po', action: 'approve' },
  { id: 'po:reject', name: 'Reject Purchase Orders', resource: 'po', action: 'reject' },

  // SO permissions
  { id: 'so:read', name: 'Read Sales Orders', resource: 'so', action: 'read' },
  { id: 'so:create', name: 'Create Sales Orders', resource: 'so', action: 'create' },
  { id: 'so:update', name: 'Update Sales Orders', resource: 'so', action: 'update' },
  { id: 'so:confirm', name: 'Confirm Sales Orders', resource: 'so', action: 'confirm' },

  // Inventory permissions
  { id: 'inventory:read', name: 'Read Inventory', resource: 'inventory', action: 'read' },
  { id: 'inventory:adjust', name: 'Adjust Inventory', resource: 'inventory', action: 'adjust' },

  // Report permissions
  { id: 'reports:read', name: 'Read Reports', resource: 'reports', action: 'read' },

  // Admin permissions
  { id: 'users:manage', name: 'Manage Users', resource: 'users', action: 'manage' },
  { id: 'settings:manage', name: 'Manage Settings', resource: 'settings', action: 'manage' },
];

async function seedControlPlane() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to control-plane database');

    // Seed permissions
    console.log('📝 Seeding permissions...');
    const permRepo = AppDataSource.getRepository('Permission');
    for (const perm of SYSTEM_PERMISSIONS) {
      const existing = await permRepo.findOne({ where: { id: perm.id } });
      if (!existing) {
        await permRepo.save(perm);
        console.log(`   ✓ Created permission: ${perm.name}`);
      }
    }

    // Seed roles
    console.log('👥 Seeding roles...');
    const roleRepo = AppDataSource.getRepository('Role');
    for (const role of SYSTEM_ROLES) {
      const existing = await roleRepo.findOne({ where: { id: role.id } });
      if (!existing) {
        await roleRepo.save(role);
        console.log(`   ✓ Created role: ${role.name}`);
      }
    }

    console.log('✅ Control-plane seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding control-plane:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run seeder
seedControlPlane();
