/**
 * Employee/User Entity
 * Represents team members in the SaaS platform
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('employees')
@Index(['tenant_id'])
@Index(['email'], { unique: true })
@Index(['employee_code'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'uuid' })
  auth_user_id!: string; // Reference to Supabase auth.users.id

  @Column({ type: 'varchar', length: 50 })
  employee_code!: string; // e.g., EMP001

  @Column({ type: 'varchar', length: 100 })
  first_name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string; // Sales, Procurement, Warehouse, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation?: string; // Manager, Associate, Intern, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  manager_id?: string; // Reference to reporting manager

  @Column({ type: 'text', nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'inactive' | 'on_leave' | 'terminated';

  @Column({ type: 'varchar', length: 50, default: 'employee' })
  role!: string; // Default role (admin, manager, employee, vendor)

  @Column({ type: 'simple-array', nullable: true })
  roles?: string[]; // Multi-role support

  @Column({ type: 'simple-array', nullable: true })
  permissions?: string[]; // Direct permission assignments

  @Column({ type: 'date', nullable: true })
  date_of_joining?: Date;

  @Column({ type: 'date', nullable: true })
  date_of_birth?: Date;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_primary?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_secondary?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  aadhar_number?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pan_number?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    lastLogin?: Date;
    loginCount?: number;
    preferences?: Record<string, any>;
  };

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  disabled_at?: Date;
}
