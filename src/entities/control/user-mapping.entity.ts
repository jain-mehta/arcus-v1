import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * User Mapping Entity - Control-plane table for Supabase Auth ↔ Tenant mapping
 * Links Supabase Auth users to their tenant memberships and roles
 */
@Entity('user_mappings')
@Index(['supabase_user_id', 'tenant_id'], { unique: true })
@Index(['tenant_id'])
@Index(['role'])
export class UserMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  supabase_user_id!: string; // Supabase Auth user ID

  @Column({ type: 'uuid' })
  tenant_id!: string; // Which tenant this user belongs to

  @Column({ type: 'varchar', length: 255 })
  email!: string; // User's email (snapshot from Supabase Auth)

  @Column({ type: 'varchar', length: 100, nullable: true })
  role?: string; // User's role in this tenant (admin, sales_manager, etc.)

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string; // Department (optional, for team scoping)

  @Column({ type: 'json', nullable: true })
  permissions_snapshot?: string[]; // Cached list of permissions (sync from Permify)

  @Column({ type: 'boolean', default: true })
  is_active: boolean = true; // Can be deactivated without deleting

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at?: Date;
}
