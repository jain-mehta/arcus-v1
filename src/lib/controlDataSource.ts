import 'reflect-metadata';
import { DataSource, EntityTarget, Repository, ObjectLiteral, DataSourceOptions } from 'typeorm';
import { Session } from '@/entities/control/session.entity';
import { TenantMetadata } from '@/entities/control/tenant-metadata.entity';
import { UserMapping } from '@/entities/control/user-mapping.entity';
import { PolicySyncLog } from '@/entities/control/policy-sync-log.entity';

/**
 * Control-Plane DataSource
 * Manages the control DB (PostgreSQL) for sessions, tenant metadata, user mappings, policy logs
 * This is shared across all tenants (not replicated per tenant)
 */

const controlDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'arcus_control',
  // Use DATABASE_URL if set (takes precedence)
  url: process.env.DATABASE_URL,
  entities: [Session, TenantMetadata, UserMapping, PolicySyncLog],
  migrations: ['migrations/control/*.ts'],
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync schema in dev (disable in prod)
  logging: process.env.LOG_LEVEL === 'debug',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  // Connection pool for better performance
  poolSize: 10,
  connectTimeoutMS: 5000,
};

export const controlDataSource = new DataSource(controlDataSourceOptions);

/**
 * Get repository for control-plane entities
 */
export async function getControlRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> {
  if (!controlDataSource.isInitialized) {
    await controlDataSource.initialize();
  }
  return controlDataSource.getRepository<T>(entity);
}

/**
 * Initialize control-plane database
 * Runs migrations and validates connection
 */
export async function initializeControlDB(): Promise<void> {
  try {
    if (!controlDataSource.isInitialized) {
      await controlDataSource.initialize();
      console.log('✅ Control-plane DB connected');

      // Run migrations in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Running migrations...');
        await controlDataSource.runMigrations();
        console.log('✅ Migrations completed');
      }

      // Seed test data in dev
      if (process.env.AUTO_SEED_DEV_DATA === 'true' && process.env.NODE_ENV === 'development') {
        console.log('Seeding dev data...');
        await seedControlPlaneDevData();
        console.log('✅ Dev data seeded');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize control DB:', error);
    throw error;
  }
}

/**
 * Seed test data for local development
 */
async function seedControlPlaneDevData(): Promise<void> {
  const repo = controlDataSource.getRepository(TenantMetadata);

  // Check if already seeded
  const existing = await repo.count();
  if (existing > 0) {
    console.log('✓ Dev data already exists, skipping seed');
    return;
  }

  // Seed a demo tenant
  const demoTenant = repo.create({
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    tenant_name: 'Demo Tenant (Local Dev)',
    status: 'active',
    database_url: 'postgresql://postgres:postgres123@localhost:5432/arcus_tenant_demo',
    database_region: 'local',
    provisioning_status: 'ready',
    migrations_applied: true,
    metadata: {
      plan: 'free',
      features: ['sales', 'inventory', 'basic_reports'],
    },
  });

  await repo.save(demoTenant);
}

// Legacy export for backwards compatibility
export const ControlDataSource = controlDataSource;
