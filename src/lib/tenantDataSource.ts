import 'reflect-metadata';
import { DataSource, EntityTarget, Repository, ObjectLiteral, DataSourceOptions } from 'typeorm';
import { TenantMetadata } from './entities/control/TenantMetadata';

// ? Connection pool cache with TTL and health checks
interface CachedDataSource {
  dataSource: DataSource;
  lastAccessed: number;
  orgSlug: string;
}

const dsCache = new Map<string, CachedDataSource>();
const MAX_CACHE_SIZE = parseInt(process.env.TENANT_DS_CACHE_MAX || '50');
const CACHE_TTL = parseInt(process.env.TENANT_DS_CACHE_TTL || '3600000'); // 1 hour default

/**
 * ? Evict stale connections from cache
 */
function evictStaleConnections(): void {
  const now = Date.now();
  const toEvict: string[] = [];
  
  dsCache.forEach((cached, orgSlug) => {
    if (now - cached.lastAccessed > CACHE_TTL) {
      toEvict.push(orgSlug);
    }
  });
  
  toEvict.forEach(async (orgSlug) => {
    const cached = dsCache.get(orgSlug);
    if (cached?.dataSource.isInitialized) {
      await cached.dataSource.destroy();
    }
    dsCache.delete(orgSlug);
    console.log(`??? Evicted stale tenant connection: ${orgSlug}`);
  });
  
  // Also evict least recently used if cache is too large
  if (dsCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(dsCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = entries.slice(0, dsCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(async ([orgSlug, cached]) => {
      if (cached.dataSource.isInitialized) {
        await cached.dataSource.destroy();
      }
      dsCache.delete(orgSlug);
      console.log(`??? Evicted LRU tenant connection: ${orgSlug}`);
    });
  }
}

// Run eviction every 5 minutes
setInterval(evictStaleConnections, 300000);

/**
 * ? Get optimized tenant-specific DataSource with connection pooling
 */
export async function getTenantDataSource(orgSlug: string, connectionString?: string): Promise<DataSource> {
  // Check cache and update last accessed time
  const cached = dsCache.get(orgSlug);
  if (cached) {
    cached.lastAccessed = Date.now();
    
    // Verify connection is still alive
    if (cached.dataSource.isInitialized) {
      try {
        await cached.dataSource.query('SELECT 1');
        return cached.dataSource;
      } catch (error) {
        console.warn(`?? Cached connection for ${orgSlug} is dead, recreating...`);
        await cached.dataSource.destroy();
        dsCache.delete(orgSlug);
      }
    }
  }
  
  if (!connectionString) {
    // load connection string from control-plane TenantMetadata
    // this requires the control DataSource to be initialized and available.
    throw new Error('Connection string required for tenant data source initialization');
  }
  
  // ? Optimized DataSource configuration with connection pooling
  const dsOptions: DataSourceOptions = {
    type: 'postgres',
    url: connectionString,
    synchronize: false,
    logging: process.env.LOG_LEVEL === 'debug',
    entities: [], // Entities loaded dynamically per query
    
    // ? Connection Pool Configuration
    extra: {
      max: parseInt(process.env.TENANT_DB_POOL_MAX || '10'),
      min: parseInt(process.env.TENANT_DB_POOL_MIN || '1'),
      idleTimeoutMillis: parseInt(process.env.TENANT_DB_IDLE_TIMEOUT || '20000'),
      connectionTimeoutMillis: parseInt(process.env.TENANT_DB_CONNECTION_TIMEOUT || '3000'),
      evictionRunIntervalMillis: 10000,
      numTestsPerEvictionRun: 2,
      softIdleTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    },
    
    // ? Query Performance
    cache: {
      type: 'database',
      duration: parseInt(process.env.TENANT_DB_CACHE_DURATION || '15000'), // 15 seconds
    },
    
    maxQueryExecutionTime: process.env.LOG_LEVEL === 'debug' ? 500 : undefined,
    
    // ? SSL for production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
  
  const ds = new DataSource(dsOptions);
  await ds.initialize();
  
  // Cache the connection
  dsCache.set(orgSlug, {
    dataSource: ds,
    lastAccessed: Date.now(),
    orgSlug,
  });
  
  console.log(`? Created tenant connection: ${orgSlug} (cache size: ${dsCache.size})`);
  
  return ds;
}

/**
 * ? Get repository for tenant-specific entity
 */
export async function getTenantRepo<T extends ObjectLiteral>(
  orgSlug: string,
  entity: EntityTarget<T>,
  connectionString?: string
): Promise<Repository<T>> {
  const ds = await getTenantDataSource(orgSlug, connectionString);
  return ds.getRepository(entity as any) as Repository<T>;
}

/**
 * ? Gracefully close all tenant connections (for app shutdown)
 */
export async function closeAllTenantConnections(): Promise<void> {
  console.log(`?? Closing ${dsCache.size} tenant connections...`);
  
  const closePromises = Array.from(dsCache.values()).map(async (cached) => {
    if (cached.dataSource.isInitialized) {
      await cached.dataSource.destroy();
    }
  });
  
  await Promise.all(closePromises);
  dsCache.clear();
  
  console.log('? All tenant connections closed');
}

/**
 * ? Get cache statistics (for monitoring)
 */
export function getTenantCacheStats(): {
  size: number;
  maxSize: number;
  connections: Array<{ orgSlug: string; lastAccessed: Date; age: number }>;
} {
  const now = Date.now();
  return {
    size: dsCache.size,
    maxSize: MAX_CACHE_SIZE,
    connections: Array.from(dsCache.entries()).map(([orgSlug, cached]) => ({
      orgSlug,
      lastAccessed: new Date(cached.lastAccessed),
      age: now - cached.lastAccessed,
    })),
  };
}

