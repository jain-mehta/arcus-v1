import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Tenant Metadata Entity - Control-plane table for tenant database connections
 * Stores per-tenant Postgres connection strings (encrypted at rest recommended)
 */
@Entity('tenant_metadata')
@Index(['tenant_id'], { unique: true })
@Index(['status'])
export class TenantMetadata {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string; // Unique tenant identifier

  @Column({ type: 'varchar', length: 255 })
  tenant_name!: string; // Display name

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'inactive' | 'suspended' | 'onboarding' = 'active'; // Tenant status

  @Column({ type: 'text' })
  database_url!: string; // PostgreSQL connection string (e.g., from Supabase Admin API)

  @Column({ type: 'varchar', length: 100, nullable: true })
  database_region?: string; // Where the DB is hosted (us-east-1, eu-west-1, etc.)

  @Column({ type: 'json', nullable: true })
  database_config?: Record<string, any>; // Additional DB config (pool size, ssl, etc.)

  @Column({ type: 'varchar', length: 100, default: 'pending' })
  provisioning_status: 'pending' | 'provisioning' | 'ready' | 'failed' = 'pending'; // DB creation status

  @Column({ type: 'text', nullable: true })
  provisioning_error?: string; // Error message if provisioning failed

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Custom tenant metadata (plan, features, etc.)

  @Column({ type: 'boolean', default: false })
  migrations_applied: boolean = false; // Whether tenant DB schemas are initialized

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_accessed_at?: Date;
}
