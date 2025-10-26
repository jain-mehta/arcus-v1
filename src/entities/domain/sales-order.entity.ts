/**
 * Sales Order (SO) Entity
 * Represents sales orders to customers
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sales_orders')
@Index(['tenant_id'])
@Index(['so_number'], { unique: true })
@Index(['customer_id'])
@Index(['status'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'varchar', length: 50 })
  so_number!: string; // e.g., SO-2024-001

  @Column({ type: 'uuid' })
  customer_id!: string; // Reference to Customer/Vendor (B2B)

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status!: 'draft' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

  @Column({ type: 'date' })
  so_date!: Date;

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  shipment_mode?: string; // Ground, Air, Express, etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shipping_cost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_terms?: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  payment_status!: 'pending' | 'partial' | 'paid';

  @Column({ type: 'text', nullable: true })
  special_instructions?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  po_reference?: string; // Customer's PO ref

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
  confirmed_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at?: Date;
}
