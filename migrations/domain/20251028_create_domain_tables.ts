/**
 * Domain Entity Migrations
 * Creates tables for Vendor, Product, PO, SO, Inventory, Employee
 */

export const createDomainTables = `
-- ============ VENDORS TABLE ============
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(255),
  description TEXT,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(100),
  tax_id VARCHAR(50),
  bank_details JSONB,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  rating INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);


-- ============ PRODUCTS TABLE ============
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  sub_category VARCHAR(100),
  unit VARCHAR(50),
  unit_price DECIMAL(12,2) NOT NULL,
  selling_price DECIMAL(12,2),
  tax_rate DECIMAL(5,2) DEFAULT 0,
  hsn_code VARCHAR(50),
  barcode VARCHAR(255),
  manufacturer VARCHAR(255),
  brand VARCHAR(100),
  warranty_months INTEGER,
  expiry_date DATE,
  reorder_level INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'draft')),
  attributes JSONB,
  image_url VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);


-- ============ PURCHASE ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  po_number VARCHAR(50) NOT NULL UNIQUE,
  vendor_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'delivered', 'cancelled')),
  po_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_pincode VARCHAR(50),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_terms VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  special_instructions TEXT,
  reference_number VARCHAR(255),
  line_items JSONB,
  created_by VARCHAR(255),
  approved_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_po_tenant_id ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_po_po_number ON purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);


-- ============ SALES ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  so_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  so_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_pincode VARCHAR(50),
  shipment_mode VARCHAR(50),
  tracking_number VARCHAR(100),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_terms VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  special_instructions TEXT,
  po_reference VARCHAR(255),
  line_items JSONB,
  created_by VARCHAR(255),
  confirmed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_so_tenant_id ON sales_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_so_so_number ON sales_orders(so_number);
CREATE INDEX IF NOT EXISTS idx_so_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_so_status ON sales_orders(status);


-- ============ INVENTORY TABLE ============
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  warehouse_location VARCHAR(100) NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_in_transit INTEGER DEFAULT 0,
  quantity_damaged INTEGER DEFAULT 0,
  avg_cost_per_unit DECIMAL(12,2) DEFAULT 0,
  valuation DECIMAL(12,2) DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  last_stock_count_date DATE,
  last_received_date DATE,
  last_issued_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, product_id, warehouse_location)
);

CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_location);


-- ============ EMPLOYEES TABLE ============
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  auth_user_id UUID NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(100),
  designation VARCHAR(100),
  manager_id VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  role VARCHAR(50) DEFAULT 'employee',
  roles TEXT[],
  permissions TEXT[],
  date_of_joining DATE,
  date_of_birth DATE,
  address TEXT,
  mobile_primary VARCHAR(50),
  mobile_secondary VARCHAR(50),
  aadhar_number VARCHAR(50),
  pan_number VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disabled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);


-- ============ GRANTS FOR RLS ============
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant isolation)
CREATE POLICY IF NOT EXISTS vendors_tenant_policy ON vendors
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS products_tenant_policy ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS po_tenant_policy ON purchase_orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS so_tenant_policy ON sales_orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS inventory_tenant_policy ON inventory
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY IF NOT EXISTS employees_tenant_policy ON employees
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
`;

export default createDomainTables;
