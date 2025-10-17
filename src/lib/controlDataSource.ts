import 'reflect-metadata';
import { DataSource, EntityTarget, Repository, ObjectLiteral } from 'typeorm';
import { UserMapping } from './entities/control/UserMapping';
import { Session } from './entities/control/Session';

const CONTROL_DB_URL = process.env.CONTROL_DATABASE_URL || '';

export const ControlDataSource = new DataSource({
  type: 'postgres',
  url: CONTROL_DB_URL,
  synchronize: false,
  logging: false,
  entities: [UserMapping, Session],
});

export async function getControlRepo<T extends ObjectLiteral>(entity: EntityTarget<T>): Promise<Repository<T>> {
  if (!ControlDataSource.isInitialized) await ControlDataSource.initialize();
  return ControlDataSource.getRepository<T>(entity as any) as Repository<T>;
}
