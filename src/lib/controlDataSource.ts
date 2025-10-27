import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
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
  
  // ? Optimized Connection Pool Configuration
  extra: {
    // Maximum number of clients in the pool
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    // Minimum number of clients in the pool
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    // Maximum time (ms) a client can be idle before being closed
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    // Maximum time (ms) to wait for connection from pool
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
    // Close idle clients after this time (ms)
    evictionRunIntervalMillis: 10000,
    // Number of resources to check per eviction run
    numTestsPerEvictionRun: 3,
    // Minimum time a client must be idle before being eligible for eviction
    softIdleTimeoutMillis: 15000,
    // Enable keep-alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },
  
  // ? Query Performance Options
  cache: {
    // Enable query result caching
    type: 'database',
    duration: parseInt(process.env.DB_CACHE_DURATION || '30000'), // 30 seconds default
  },
  
  // ? Maximum query execution time
  maxQueryExecutionTime: process.env.LOG_LEVEL === 'debug' ? 1000 : undefined, // Log slow queries > 1s in debug mode
};

export const controlDataSource = new DataSource(controlDataSourceOptions);

/**
 * Get repository for control-plane entities
 */
export async function getControlRepo<T extends Record<string, unknown>>(entity: any): Promise<any> {
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
      console.log('? Control-plane DB connected');

      // Run migrations in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Running migrations...');
        await controlDataSource.runMigrations();
        console.log('? Migrations completed');
      }

      // Seed test data in dev
      if (process.env.AUTO_SEED_DEV_DATA === 'true' && process.env.NODE_ENV === 'development') {
        console.log('Seeding dev data...');
        await seedControlPlaneDevData();
        console.log('? Dev data seeded');
      }
    }
  } catch (error) {
    console.error('? Failed to initialize control DB:', error);
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
    console.log('? Dev data already exists, skipping seed');
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

