/**
 * Product Entity
 * Represents products/SKUs in the catalog
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
} from 'typeorm';

@Entity('products')
@Index(['tenant_id'])
@Index(['sku'], { unique: true })
@Index(['category'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string; // Multi-tenant support

  @Column({ type: 'varchar', length: 100 })
  sku!: string; // Stock Keeping Unit (unique identifier)

  @Column({ type: 'varchar', length: 255 })
  name!: string; // Product name

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string; // Product category

  @Column({ type: 'varchar', length: 100, nullable: true })
  sub_category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string; // pieces, kg, liters, etc.

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unit_price!: number; // Cost price

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  selling_price?: number; // MRP

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  tax_rate?: number; // Tax percentage (GST)

  @Column({ type: 'varchar', length: 50, nullable: true })
  hsn_code?: string; // Harmonized System of Nomenclature

  @Column({ type: 'varchar', length: 50, nullable: true })
  barcode?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'integer', nullable: true })
  warranty_months?: number;

  @Column({ type: 'date', nullable: true })
  expiry_date?: Date; // For perishable products

  @Column({ type: 'integer', default: 0 })
  reorder_level?: number; // Min stock level

  @Column({ type: 'integer', default: 0 })
  reorder_quantity?: number; // Standard order qty

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'discontinued' | 'draft';

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any>; // Dynamic attributes (color, size, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string; // User ID

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

