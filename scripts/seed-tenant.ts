/**
 * Seed Tenant Database
 * Creates initial test data (vendors, products, orders) for development
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

// Initialize tenant data source (example: tenant-001)
const TENANT_ID = process.env.TENANT_ID || 'tenant-001';
const DB_NAME = `tenant_${TENANT_ID.replace('-', '_')}`;

const TenantDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TENANT_DB_HOST || 'localhost',
  port: parseInt(process.env.TENANT_DB_PORT || '5432'),
  username: process.env.TENANT_DB_USER || 'postgres',
  password: process.env.TENANT_DB_PASSWORD || 'postgres',
  database: DB_NAME,
  entities: [path.join(__dirname, '../src/lib/entities/tenant/**/*.ts')],
  synchronize: false,
  logging: true,
});

// Test data: Vendors
const TEST_VENDORS = [
  {
    id: 'v-001',
    tenant_id: TENANT_ID,
    code: 'ACE-IND',
    name: 'Ace Industries',
    email: 'contact@ace-ind.com',
    phone: '+91-9876543210',
    address: '123 Industrial Park, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zip_code: '560001',
    status: 'active',
    rating: 4.5,
    payment_terms: 'Net 30',
  },
  {
    id: 'v-002',
    tenant_id: TENANT_ID,
    code: 'GLB-IMP',
    name: 'Global Imports',
    email: 'sales@globalimp.com',
    phone: '+91-9123456789',
    address: '456 Trade Center, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    zip_code: '400001',
    status: 'active',
    rating: 4.2,
    payment_terms: 'Net 45',
  },
  {
    id: 'v-003',
    tenant_id: TENANT_ID,
    code: 'TECH-SUPP',
    name: 'Tech Supplies Co',
    email: 'orders@techsupp.com',
    phone: '+91-8765432109',
    address: '789 Tech Hub, Delhi',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    zip_code: '110001',
    status: 'active',
    rating: 4.8,
    payment_terms: 'Net 15',
  },
];

// Test data: Products
const TEST_PRODUCTS = [
  {
    id: 'p-001',
    tenant_id: TENANT_ID,
    sku: 'PROD-001',
    name: 'Industrial Motor 3HP',
    category: 'Motors',
    description: 'High-efficiency 3-phase motor',
    unit_price: 25000,
    tax_rate: 18,
    status: 'active',
    reorder_level: 5,
    stock_qty: 50,
  },
  {
    id: 'p-002',
    tenant_id: TENANT_ID,
    sku: 'PROD-002',
    name: 'Stainless Steel Bearings',
    category: 'Components',
    description: 'High-precision ball bearings',
    unit_price: 500,
    tax_rate: 12,
    status: 'active',
    reorder_level: 100,
    stock_qty: 500,
  },
  {
    id: 'p-003',
    tenant_id: TENANT_ID,
    sku: 'PROD-003',
    name: 'Hydraulic Pump',
    category: 'Hydraulics',
    description: 'Variable displacement pump',
    unit_price: 45000,
    tax_rate: 18,
    status: 'active',
    reorder_level: 2,
    stock_qty: 15,
  },
  {
    id: 'p-004',
    tenant_id: TENANT_ID,
    sku: 'PROD-004',
    name: 'Control Panel Unit',
    category: 'Controls',
    description: 'Programmable control panel',
    unit_price: 35000,
    tax_rate: 18,
    status: 'active',
    reorder_level: 3,
    stock_qty: 10,
  },
];

// Test data: Purchase Orders
const TEST_PURCHASE_ORDERS = [
  {
    id: 'po-001',
    tenant_id: TENANT_ID,
    po_number: 'PO-2025-001',
    vendor_id: 'v-001',
    po_date: new Date('2025-10-15'),
    expected_delivery: new Date('2025-10-30'),
    status: 'pending_approval',
    total_amount: 500000,
    tax_amount: 90000,
    grand_total: 590000,
    notes: 'Urgent delivery required',
  },
  {
    id: 'po-002',
    tenant_id: TENANT_ID,
    po_number: 'PO-2025-002',
    vendor_id: 'v-002',
    po_date: new Date('2025-10-16'),
    expected_delivery: new Date('2025-11-05'),
    status: 'confirmed',
    total_amount: 125000,
    tax_amount: 15000,
    grand_total: 140000,
    notes: 'Standard delivery',
  },
];

// Test data: Sales Orders
const TEST_SALES_ORDERS = [
  {
    id: 'so-001',
    tenant_id: TENANT_ID,
    so_number: 'SO-2025-001',
    customer_name: 'ABC Manufacturing',
    so_date: new Date('2025-10-18'),
    promised_delivery: new Date('2025-10-25'),
    status: 'pending_confirmation',
    total_amount: 200000,
    tax_amount: 36000,
    grand_total: 236000,
  },
  {
    id: 'so-002',
    tenant_id: TENANT_ID,
    so_number: 'SO-2025-002',
    customer_name: 'XYZ Industries',
    so_date: new Date('2025-10-19'),
    promised_delivery: new Date('2025-11-10'),
    status: 'confirmed',
    total_amount: 450000,
    tax_amount: 81000,
    grand_total: 531000,
  },
];

// Test data: Inventory
const TEST_INVENTORY = [
  {
    id: 'inv-001',
    tenant_id: TENANT_ID,
    product_id: 'p-001',
    warehouse_id: 'wh-main',
    qty_on_hand: 50,
    qty_reserved: 10,
    qty_available: 40,
    last_count_date: new Date('2025-10-15'),
  },
  {
    id: 'inv-002',
    tenant_id: TENANT_ID,
    product_id: 'p-002',
    warehouse_id: 'wh-main',
    qty_on_hand: 500,
    qty_reserved: 100,
    qty_available: 400,
    last_count_date: new Date('2025-10-15'),
  },
  {
    id: 'inv-003',
    tenant_id: TENANT_ID,
    product_id: 'p-003',
    warehouse_id: 'wh-main',
    qty_on_hand: 15,
    qty_reserved: 5,
    qty_available: 10,
    last_count_date: new Date('2025-10-14'),
  },
];

async function seedTenant() {
  try {
    await TenantDataSource.initialize();
    console.log(`✅ Connected to tenant database: ${DB_NAME}`);

    // Seed vendors
    console.log('🏢 Seeding vendors...');
    const vendorRepo = TenantDataSource.getRepository('Vendor');
    for (const vendor of TEST_VENDORS) {
      const existing = await vendorRepo.findOne({ where: { code: vendor.code } });
      if (!existing) {
        await vendorRepo.save(vendor);
        console.log(`   ✓ Created vendor: ${vendor.name}`);
      }
    }

    // Seed products
    console.log('📦 Seeding products...');
    const productRepo = TenantDataSource.getRepository('Product');
    for (const product of TEST_PRODUCTS) {
      const existing = await productRepo.findOne({ where: { sku: product.sku } });
      if (!existing) {
        await productRepo.save(product);
        console.log(`   ✓ Created product: ${product.name}`);
      }
    }

    // Seed purchase orders
    console.log('📥 Seeding purchase orders...');
    const poRepo = TenantDataSource.getRepository('PurchaseOrder');
    for (const po of TEST_PURCHASE_ORDERS) {
      const existing = await poRepo.findOne({ where: { po_number: po.po_number } });
      if (!existing) {
        await poRepo.save(po);
        console.log(`   ✓ Created PO: ${po.po_number}`);
      }
    }

    // Seed sales orders
    console.log('📤 Seeding sales orders...');
    const soRepo = TenantDataSource.getRepository('SalesOrder');
    for (const so of TEST_SALES_ORDERS) {
      const existing = await soRepo.findOne({ where: { so_number: so.so_number } });
      if (!existing) {
        await soRepo.save(so);
        console.log(`   ✓ Created SO: ${so.so_number}`);
      }
    }

    // Seed inventory
    console.log('📊 Seeding inventory...');
    const invRepo = TenantDataSource.getRepository('Inventory');
    for (const inv of TEST_INVENTORY) {
      const existing = await invRepo.findOne({ where: { product_id: inv.product_id } });
      if (!existing) {
        await invRepo.save(inv);
        console.log(`   ✓ Created inventory for: ${inv.product_id}`);
      }
    }

    console.log('✅ Tenant seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding tenant:', error);
    process.exit(1);
  } finally {
    await TenantDataSource.destroy();
  }
}

// Run seeder
seedTenant();
