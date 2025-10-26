-- ========================================================================
-- ARCUS V1 - COMPLETE DATABASE SCHEMA
-- ========================================================================
-- This SQL file creates the complete database schema for the Arcus v1 SaaS
-- platform including:
--   1. Control-Plane DB: Sessions, user mappings, tenant metadata
--   2. Tenant DB: Users, roles, vendors, products, orders, inventory
--
-- Generated: October 26, 2025
-- Author: Development Team
-- Version: 1.0
-- ========================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================================
-- PART 1: CONTROL-PLANE SCHEMA
-- Run this in your CONTROL_DATABASE_URL (central database)
-- ========================================================================

-- Sessions table - for storing JWT sessions and revocation tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  jti TEXT UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  device_info JSONB NULL,
  last_seen TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions (jti);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

-- User mappings table - links Firebase/Legacy UID to Supabase user ID
CREATE TABLE IF NOT EXISTS user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_uid TEXT UNIQUE NOT NULL,
  supabase_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_mappings_legacy_uid ON user_mappings (legacy_uid);
CREATE INDEX IF NOT EXISTS idx_user_mappings_supabase_user_id ON user_mappings (supabase_user_id);

-- Tenant metadata table - maps organizations to their databases
CREATE TABLE IF NOT EXISTS tenant_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_slug TEXT UNIQUE NOT NULL,
  org_name TEXT NOT NULL,
  db_connection_string TEXT NOT NULL,
  plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_metadata_org_slug ON tenant_metadata (org_slug);

-- Policy changes table - tracks permission/policy updates
CREATE TABLE IF NOT EXISTS policy_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  delta JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_policy_changes_author ON policy_changes (author);

-- Migration jobs table - tracks data migration from Firebase to Postgres
CREATE TABLE IF NOT EXISTS migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  last_processed_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_migration_jobs_status ON migration_jobs (status);
CREATE INDEX IF NOT EXISTS idx_migration_jobs_name ON migration_jobs (name);

-- ========================================================================
-- PART 2: TENANT DATABASE SCHEMA
-- Run this in each tenant's DATABASE_URL (per-tenant database)
-- ========================================================================

-- Users table - stores tenant users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NULL,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_legacy_id ON users (legacy_id);

-- Roles table - stores roles and permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles (name);

-- User roles table - maps users to roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

-- Vendors table - stores vendor/supplier information
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NULL,
  address TEXT NULL,
  city TEXT NULL,
  state TEXT NULL,
  country TEXT NULL,
  zip_code TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  rating DECIMAL(3, 2) DEFAULT 0.0,
  payment_terms TEXT DEFAULT 'Net 30',
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON vendors (code);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors (email);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors (status);
CREATE INDEX IF NOT EXISTS idx_vendors_legacy_id ON vendors (legacy_id);

-- Products table - stores product catalog
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'active',
  reorder_level INTEGER DEFAULT 0,
  stock_qty INTEGER DEFAULT 0,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_legacy_id ON products (legacy_id);

-- Purchase Orders table - stores purchase order records
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  po_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_delivery TIMESTAMP WITH TIME ZONE NULL,
  status TEXT NOT NULL DEFAULT 'created',
  total_amount DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0.0,
  grand_total DECIMAL(15, 2) NOT NULL,
  notes TEXT NULL,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders (po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders (status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_date ON purchase_orders (po_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_legacy_id ON purchase_orders (legacy_id);

-- Purchase Order Items table - line items for purchase orders
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0.0,
  line_total DECIMAL(15, 2) NOT NULL,
  received_qty INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_items_purchase_order_id ON purchase_order_items (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product_id ON purchase_order_items (product_id);

-- Sales Orders table - stores customer orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NULL,
  customer_phone TEXT NULL,
  so_date TIMESTAMP WITH TIME ZONE NOT NULL,
  promised_delivery TIMESTAMP WITH TIME ZONE NULL,
  status TEXT NOT NULL DEFAULT 'created',
  total_amount DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0.0,
  grand_total DECIMAL(15, 2) NOT NULL,
  notes TEXT NULL,
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_so_number ON sales_orders (so_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders (status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_so_date ON sales_orders (so_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_email ON sales_orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_sales_orders_legacy_id ON sales_orders (legacy_id);

-- Sales Order Items table - line items for sales orders
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0.0,
  line_total DECIMAL(15, 2) NOT NULL,
  shipped_qty INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_so_items_sales_order_id ON sales_order_items (sales_order_id);
CREATE INDEX IF NOT EXISTS idx_so_items_product_id ON sales_order_items (product_id);

-- Inventory table - tracks product stock levels
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL,
  qty_on_hand INTEGER DEFAULT 0,
  qty_reserved INTEGER DEFAULT 0,
  qty_available INTEGER DEFAULT 0,
  last_count_date TIMESTAMP WITH TIME ZONE NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory (warehouse_id);

-- Inventory Transactions table - audit trail for inventory changes
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id TEXT NULL,
  notes TEXT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_trans_inventory_id ON inventory_transactions (inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_inv_trans_created_at ON inventory_transactions (created_at);

-- Employees table - stores employee records
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NULL,
  salary DECIMAL(12, 2) DEFAULT 0.0,
  date_of_joining DATE NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NULL,
  legacy_id TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees (email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS idx_employees_legacy_id ON employees (legacy_id);

-- Events table - audit trail for domain events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_type ON events (aggregate_type);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events (aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at);

-- Audit Log table - comprehensive audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NULL,
  old_values JSONB NULL,
  new_values JSONB NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- ========================================================================
-- PART 3: SEED DATA (OPTIONAL)
-- Uncomment these to populate with initial test data
-- ========================================================================

-- Insert seed data for users
-- INSERT INTO users (email, name) VALUES
-- ('admin@arcus.local', 'Administrator'),
-- ('user@arcus.local', 'Standard User');

-- Insert seed data for roles
-- INSERT INTO roles (name, description, permissions) VALUES
-- ('admin', 'Full system access', '{"all": true}'::jsonb),
-- ('manager', 'Management access', '{"read": true, "write": true}'::jsonb),
-- ('user', 'Standard user', '{"read": true}'::jsonb);

-- Insert seed data for vendors
-- INSERT INTO vendors (code, name, email, phone, city, status, rating)
-- VALUES
-- ('ACE-IND', 'Ace Industries', 'contact@ace-ind.com', '+91-9876543210', 'Bangalore', 'active', 4.5),
-- ('TECH-SUPP', 'Tech Supplies Co', 'orders@techsupp.com', '+91-8765432109', 'Delhi', 'active', 4.8);

-- Insert seed data for products
-- INSERT INTO products (sku, name, category, unit_price, tax_rate, status, stock_qty)
-- VALUES
-- ('PROD-001', 'Industrial Motor 3HP', 'Motors', 25000.00, 18.00, 'active', 50),
-- ('PROD-002', 'Stainless Steel Bearings', 'Components', 500.00, 12.00, 'active', 500),
-- ('PROD-003', 'Hydraulic Pump', 'Hydraulics', 45000.00, 18.00, 'active', 15);

-- ========================================================================
-- PART 4: IMPORTANT NOTES
-- ========================================================================
-- 1. CONTROL-PLANE DATABASE:
--    - Run this section in your CONTROL_DATABASE_URL
--    - This is the central metadata database
--    - Tables: sessions, user_mappings, tenant_metadata, policy_changes, migration_jobs
--    - Used for: JWT validation, tenant routing, session management

-- 2. TENANT DATABASES:
--    - Run the remaining sections in each tenant's DATABASE_URL
--    - Each organization gets its own database with these tables
--    - All references between tables within tenant DB use foreign keys
--    - JSONB columns for flexible metadata storage
--    - Indexes on commonly queried fields for performance

-- 3. SETUP INSTRUCTIONS:
--    a. Create control-plane database
--    b. Run the first section (CONTROL-PLANE SCHEMA)
--    c. For each tenant:
--       - Create a new database: CREATE DATABASE tenant_org_slug;
--       - Run the TENANT DATABASE SCHEMA section
--       - Insert into tenant_metadata in control DB to register

-- 4. CONNECTION STRINGS:
--    CONTROL_DATABASE_URL: postgresql://user:pass@host/control_db
--    TENANT_DATABASE_URL: postgresql://user:pass@host/tenant_org_slug
--    Store tenant connection in tenant_metadata.db_connection_string

-- 5. ENVIRONMENTS:
--    In .env.local:
--    CONTROL_DATABASE_URL=your_control_db_connection
--    TENANT_DATABASE_URL=your_default_tenant_connection (if needed)
--    Per-tenant URLs stored in database (tenant_metadata table)

-- 6. RUNNING IN SUPABASE:
--    a. Go to https://supabase.co and create project
--    b. Go to SQL Editor
--    c. Create a new query
--    d. Copy this entire file into SQL Editor
--    e. Click "Run" to execute all tables
--    f. Verify in the "Tables" section that all tables appear
--    g. Get your connection string from Settings → Database

-- 7. SECURITY NOTES:
--    - Use Row Level Security (RLS) in production on tenant tables
--    - Implement proper user/role authentication in Supabase Auth
--    - Encrypt sensitive data in metadata JSONB columns
--    - Regular backups for control-plane database
--    - Separate database users per environment (dev/staging/prod)

-- 8. NEXT STEPS:
--    - Run migration scripts to populate tenant_metadata
--    - Configure environment variables (.env.local)
--    - Test connection from Node.js application
--    - Run seed scripts for initial data
--    - Verify indexes were created: \d table_name

-- ========================================================================
-- END OF SCHEMA
-- ========================================================================
