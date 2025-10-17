import 'reflect-metadata';
import { DataSource, EntityTarget, Repository, ObjectLiteral } from 'typeorm';
import { TenantMetadata } from './entities/control/TenantMetadata';

const dsCache = new Map<string, DataSource>();

export async function getTenantDataSource(orgSlug: string, connectionString?: string): Promise<DataSource> {
  if (dsCache.has(orgSlug)) return dsCache.get(orgSlug)!;
  if (!connectionString) {
    // load connection string from control-plane TenantMetadata
    // this requires the control DataSource to be initialized and available.
    throw new Error('Connection string required for tenant data source initialization');
  }
  const ds = new DataSource({ type: 'postgres', url: connectionString, synchronize: false, logging: false, entities: [] });
  await ds.initialize();
  dsCache.set(orgSlug, ds);
  return ds;
}

export async function getTenantRepo<T extends ObjectLiteral>(orgSlug: string, entity: EntityTarget<T>, connectionString?: string): Promise<Repository<T>> {
  const ds = await getTenantDataSource(orgSlug, connectionString);
  return ds.getRepository(entity as any) as Repository<T>;
}
