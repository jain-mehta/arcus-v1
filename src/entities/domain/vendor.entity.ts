/**
 * Vendor Entity
 * Represents suppliers/vendors for the SaaS platform
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('vendors')
@Index(['tenant_id'])
@Index(['email'], { unique: true })
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string; // Multi-tenant support

  @Column({ type: 'varchar', length: 255 })
  name!: string; // Vendor name

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor_code?: string; // Internal vendor ID

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'text', nullable: true })
  address?: string; // Full address

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  postal_code?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id?: string; // GST/TAX ID

  @Column({ type: 'jsonb', nullable: true })
  bank_details?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
    upiId?: string;
  };

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'inactive' | 'suspended';

  @Column({ type: 'integer', default: 0 })
  rating?: number; // 0-5 star rating

  @Column({ type: 'integer', default: 0 })
  total_orders?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_spent?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string; // User ID who created

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

