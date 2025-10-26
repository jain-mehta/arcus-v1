/**
 * Inventory Entity
 * Tracks stock levels across warehouses/locations
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity('inventory')
@Index(['tenant_id'])
@Index(['product_id'])
@Index(['warehouse_location'])
@Unique(['tenant_id', 'product_id', 'warehouse_location'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenant_id!: string;

  @Column({ type: 'uuid' })
  product_id!: string;

  @Column({ type: 'varchar', length: 100 })
  warehouse_location!: string; // e.g., "Main Warehouse", "Branch A"

  @Column({ type: 'integer', default: 0 })
  quantity_on_hand!: number; // Current stock

  @Column({ type: 'integer', default: 0 })
  quantity_reserved?: number; // Allocated to orders

  @Column({ type: 'integer', default: 0 })
  quantity_in_transit?: number; // Goods in transit

  @Column({ type: 'integer', default: 0 })
  quantity_damaged?: number; // Non-saleable stock

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  avg_cost_per_unit?: number; // FIFO/Weighted avg cost

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valuation!: number; // quantity_on_hand * avg_cost

  @Column({ type: 'integer', default: 0 })
  reorder_level?: number; // Min stock threshold

  @Column({ type: 'date', nullable: true })
  last_stock_count_date?: Date;

  @Column({ type: 'date', nullable: true })
  last_received_date?: Date; // Last PO receipt

  @Column({ type: 'date', nullable: true })
  last_issued_date?: Date; // Last SO shipment

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'inactive' | 'discontinued';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
