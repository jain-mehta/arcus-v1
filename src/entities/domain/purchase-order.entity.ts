/**
 * Purchase Order (PO) Entity
 * Represents purchase orders sent to vendors
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

@Entity('purchase_orders')
@Index(['tenant_id'])
@Index(['po_number'], { unique: true })
@Index(['vendor_id'])
@Index(['status'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'varchar', length: 50 })
  po_number!: string; // e.g., PO-2024-001

  @Column({ type: 'uuid' })
  vendor_id!: string; // Reference to Vendor

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: 'draft' | 'sent' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';

  @Column({ type: 'date' })
  po_date!: Date; // When PO was created

  @Column({ type: 'date', nullable: true })
  expected_delivery_date?: Date;

  @Column({ type: 'date', nullable: true })
  actual_delivery_date?: Date;

  @Column({ type: 'text', nullable: true })
  delivery_address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  delivery_pincode?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number; // Before tax

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shipping_cost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount!: number; // Final amount

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_terms?: string; // Net 30, COD, etc.

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  payment_status!: 'pending' | 'partial' | 'paid' | 'overdue';

  @Column({ type: 'text', nullable: true })
  special_instructions?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference_number?: string; // Customer ref

  @Column({ type: 'jsonb', nullable: true })
  line_items?: Array<{
    id: string;
    product_id: string;
    sku: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
  }>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approved_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  approved_at?: Date;
}

