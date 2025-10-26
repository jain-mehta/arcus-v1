import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Policy Sync Log Entity - Control-plane audit table for Permify policy syncs
 * Tracks every time roles/permissions are pushed to Permify for debugging
 */
@Entity('policy_sync_logs')
@Index(['tenant_id', 'created_at'])
@Index(['sync_status'])
export class PolicySyncLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string; // Which tenant this sync affects

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  sync_status: 'pending' | 'in_progress' | 'success' | 'failed' = 'pending'; // Sync result

  @Column({ type: 'json' })
  payload!: Record<string, any>; // What was sent to Permify (roles, permissions, etc.)

  @Column({ type: 'json', nullable: true })
  response?: Record<string, any>; // Permify's response

  @Column({ type: 'text', nullable: true })
  error_message?: string; // If failed, why

  @Column({ type: 'integer', nullable: true })
  http_status_code?: number; // HTTP status from Permify API

  @Column({ type: 'integer', nullable: true })
  duration_ms?: number; // How long the request took

  @Column({ type: 'varchar', length: 255, nullable: true })
  triggered_by?: string; // Who triggered (system, user_id, cli, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  sync_type?: string; // What was synced (roles, permissions, full_schema, etc.)

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;
}
