-- ========================================================================
-- SAMPLE QUERIES & DATA EXAMPLES
-- ========================================================================
-- This file contains sample queries and INSERT statements for reference
-- Use these to test your database after running the schema
--
-- Date: October 26, 2025
-- ========================================================================

-- ========================================================================
-- PART 1: INSERT SAMPLE DATA (Control-Plane)
-- Run these in your CONTROL_DATABASE_URL
-- ========================================================================

-- Insert sample tenant metadata
INSERT INTO tenant_metadata (org_slug, org_name, db_connection_string, plan)
VALUES 
  ('acme-corp', 'ACME Corporation', 'postgresql://user:pass@localhost:5432/tenant_acme', '{"tier": "professional", "max_users": 100}'::jsonb),
  ('global-ind', 'Global Industries', 'postgresql://user:pass@localhost:5432/tenant_global', '{"tier": "enterprise", "max_users": 500}'::jsonb),
  ('tech-startup', 'Tech Startup Inc', 'postgresql://user:pass@localhost:5432/tenant_tech', '{"tier": "starter", "max_users": 10}'::jsonb)
ON CONFLICT (org_slug) DO NOTHING;

-- Insert sample user mappings
INSERT INTO user_mappings (legacy_uid, supabase_user_id)
VALUES
  ('firebase-uid-001', 'supabase-user-1'),
  ('firebase-uid-002', 'supabase-user-2'),
  ('firebase-uid-003', 'supabase-user-3')
ON CONFLICT (legacy_uid) DO NOTHING;

-- Insert sample sessions
INSERT INTO sessions (user_id, jti, issued_at, expires_at, device_info)
VALUES
  ('supabase-user-1', 'jti-token-001', now(), now() + interval '7 days', '{"device": "Chrome", "os": "Windows"}'::jsonb),
  ('supabase-user-2', 'jti-token-002', now(), now() + interval '7 days', '{"device": "Safari", "os": "iOS"}'::jsonb);

-- ========================================================================
-- PART 2: INSERT SAMPLE DATA (Tenant Database)
-- Run these in your TENANT_DATABASE_URL (e.g., tenant_001)
-- ========================================================================

-- Insert sample users
INSERT INTO users (email, name, metadata)
VALUES
  ('john.doe@company.com', 'John Doe', '{"role": "admin", "department": "Management"}'::jsonb),
  ('jane.smith@company.com', 'Jane Smith', '{"role": "manager", "department": "Sales"}'::jsonb),
  ('bob.wilson@company.com', 'Bob Wilson', '{"role": "user", "department": "Operations"}'::jsonb),
  ('alice.johnson@company.com', 'Alice Johnson', '{"role": "user", "department": "Finance"}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- Insert sample roles
INSERT INTO roles (name, description, permissions)
VALUES
  ('admin', 'Full system access', '{"all": true}'::jsonb),
  ('manager', 'Management privileges', '{"read": true, "write": true, "approve": true}'::jsonb),
  ('user', 'Standard user access', '{"read": true, "write": true}'::jsonb),
  ('readonly', 'Read-only access', '{"read": true}'::jsonb)
ON CONFLICT DO NOTHING;

-- Link users to roles (user_roles table)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'john.doe@company.com' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'jane.smith@company.com' AND r.name = 'manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email IN ('bob.wilson@company.com', 'alice.johnson@company.com') AND r.name = 'user'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert sample vendors
INSERT INTO vendors (code, name, email, phone, address, city, state, country, zip_code, status, rating, payment_terms)
VALUES
  ('ACE-001', 'Ace Industries', 'contact@aceindustries.com', '+91-9876543210', '123 Industrial Park', 'Bangalore', 'Karnataka', 'India', '560001', 'active', 4.5, 'Net 30'),
  ('GLB-002', 'Global Imports Ltd', 'sales@globalimports.com', '+91-9123456789', '456 Trade Center', 'Mumbai', 'Maharashtra', 'India', '400001', 'active', 4.2, 'Net 45'),
  ('TECH-003', 'Tech Supplies Co', 'orders@techsupplies.com', '+91-8765432109', '789 Tech Hub', 'Delhi', 'Delhi', 'India', '110001', 'active', 4.8, 'Net 15'),
  ('METAL-004', 'Metal Works Inc', 'inquiry@metalworks.com', '+91-7654321098', '321 Manufacturing Zone', 'Chennai', 'Tamil Nadu', 'India', '600001', 'inactive', 3.9, 'Net 60')
ON CONFLICT (code) DO NOTHING;

-- Insert sample products
INSERT INTO products (sku, name, category, description, unit_price, tax_rate, status, reorder_level, stock_qty)
VALUES
  ('PROD-001', 'Industrial Motor 3HP', 'Motors', 'High-efficiency three-phase electric motor', 25000.00, 18.00, 'active', 5, 50),
  ('PROD-002', 'Stainless Steel Bearings', 'Components', 'High-precision ball bearings', 500.00, 12.00, 'active', 100, 500),
  ('PROD-003', 'Hydraulic Pump', 'Hydraulics', 'Variable displacement hydraulic pump', 45000.00, 18.00, 'active', 2, 15),
  ('PROD-004', 'Control Panel Unit', 'Controls', 'Programmable industrial control panel', 35000.00, 18.00, 'active', 3, 10),
  ('PROD-005', 'Power Supply 5KW', 'Power', 'Industrial power supply unit', 15000.00, 18.00, 'active', 5, 20)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample purchase orders
INSERT INTO purchase_orders (po_number, vendor_id, po_date, expected_delivery, status, total_amount, tax_amount, grand_total, notes)
SELECT 'PO-2025-001', v.id, '2025-10-15'::timestamp, '2025-10-30'::timestamp, 'pending_approval', 500000.00, 90000.00, 590000.00, 'Urgent delivery required'
FROM vendors v WHERE v.code = 'ACE-001'
UNION ALL
SELECT 'PO-2025-002', v.id, '2025-10-16'::timestamp, '2025-11-05'::timestamp, 'confirmed', 125000.00, 15000.00, 140000.00, 'Standard delivery'
FROM vendors v WHERE v.code = 'GLB-002'
UNION ALL
SELECT 'PO-2025-003', v.id, '2025-10-18'::timestamp, '2025-10-25'::timestamp, 'delivered', 50000.00, 9000.00, 59000.00, 'Rush order'
FROM vendors v WHERE v.code = 'TECH-003'
ON CONFLICT (po_number) DO NOTHING;

-- Insert sample purchase order items
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, tax_rate, line_total, received_qty)
SELECT po.id, p.id, 2, p.unit_price, p.tax_rate, 2 * p.unit_price, 0
FROM purchase_orders po, products p
WHERE po.po_number = 'PO-2025-001' AND p.sku = 'PROD-001'
UNION ALL
SELECT po.id, p.id, 100, p.unit_price, p.tax_rate, 100 * p.unit_price, 0
FROM purchase_orders po, products p
WHERE po.po_number = 'PO-2025-001' AND p.sku = 'PROD-002'
UNION ALL
SELECT po.id, p.id, 1, p.unit_price, p.tax_rate, 1 * p.unit_price, 1
FROM purchase_orders po, products p
WHERE po.po_number = 'PO-2025-003' AND p.sku = 'PROD-003'
ON CONFLICT DO NOTHING;

-- Insert sample sales orders
INSERT INTO sales_orders (so_number, customer_name, customer_email, customer_phone, so_date, promised_delivery, status, total_amount, tax_amount, grand_total)
VALUES
  ('SO-2025-001', 'ABC Manufacturing Ltd', 'purchase@abcmfg.com', '+91-9000111222', '2025-10-18'::timestamp, '2025-10-25'::timestamp, 'pending_confirmation', 200000.00, 36000.00, 236000.00),
  ('SO-2025-002', 'XYZ Industries Inc', 'orders@xyzind.com', '+91-8000222333', '2025-10-19'::timestamp, '2025-11-10'::timestamp, 'confirmed', 450000.00, 81000.00, 531000.00),
  ('SO-2025-003', 'Beta Engineering', 'contact@betaeng.com', '+91-7000333444', '2025-10-20'::timestamp, '2025-10-28'::timestamp, 'shipped', 150000.00, 27000.00, 177000.00)
ON CONFLICT (so_number) DO NOTHING;

-- Insert sample sales order items
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, tax_rate, line_total, shipped_qty)
SELECT so.id, p.id, 4, p.unit_price, p.tax_rate, 4 * p.unit_price, 0
FROM sales_orders so, products p
WHERE so.so_number = 'SO-2025-001' AND p.sku = 'PROD-001'
UNION ALL
SELECT so.id, p.id, 2, p.unit_price, p.tax_rate, 2 * p.unit_price, 2
FROM sales_orders so, products p
WHERE so.so_number = 'SO-2025-003' AND p.sku = 'PROD-004'
ON CONFLICT DO NOTHING;

-- Insert sample inventory
INSERT INTO inventory (product_id, warehouse_id, qty_on_hand, qty_reserved, qty_available, last_count_date)
SELECT p.id, 'WH-MAIN', p.stock_qty, 0, p.stock_qty, now()
FROM products p
ON CONFLICT DO NOTHING;

-- Insert sample inventory transactions
INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity, reference_id, notes)
SELECT i.id, 'RECEIVED', 10, 'PO-2025-001', 'Purchase order receipt'
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE p.sku = 'PROD-001'
UNION ALL
SELECT i.id, 'SOLD', 2, 'SO-2025-002', 'Sales order shipment'
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE p.sku = 'PROD-001'
ON CONFLICT DO NOTHING;

-- Insert sample employees
INSERT INTO employees (email, name, department, designation, salary, date_of_joining, status)
VALUES
  ('emp001@company.com', 'Rajesh Kumar', 'Operations', 'Operations Manager', 600000.00, '2023-01-15'::date, 'active'),
  ('emp002@company.com', 'Priya Singh', 'Sales', 'Sales Executive', 450000.00, '2023-03-20'::date, 'active'),
  ('emp003@company.com', 'Amit Patel', 'Finance', 'Finance Analyst', 500000.00, '2023-06-10'::date, 'active'),
  ('emp004@company.com', 'Neha Gupta', 'HR', 'HR Specialist', 480000.00, '2023-02-28'::date, 'active')
ON CONFLICT (email) DO NOTHING;

-- ========================================================================
-- PART 3: SAMPLE QUERIES
-- ========================================================================

-- Query 1: Get all active vendors with their details
SELECT id, code, name, email, city, rating, status
FROM vendors
WHERE status = 'active'
ORDER BY rating DESC, name ASC;

-- Query 2: Get all users and their assigned roles
SELECT u.email, u.name, string_agg(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.name
ORDER BY u.email;

-- Query 3: Get purchase orders with vendor details
SELECT 
  po.po_number,
  po.po_date,
  v.name as vendor_name,
  v.code as vendor_code,
  po.status,
  po.grand_total,
  COUNT(poi.id) as item_count
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, v.id
ORDER BY po.po_date DESC;

-- Query 4: Get sales orders with customer and item details
SELECT 
  so.so_number,
  so.customer_name,
  so.promised_delivery,
  so.status,
  so.grand_total,
  COUNT(soi.id) as items,
  SUM(soi.quantity) as total_qty
FROM sales_orders so
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
GROUP BY so.id
ORDER BY so.so_date DESC;

-- Query 5: Get inventory levels with product details
SELECT 
  p.sku,
  p.name,
  p.category,
  i.warehouse_id,
  i.qty_on_hand,
  i.qty_reserved,
  i.qty_available,
  CASE 
    WHEN i.qty_available <= p.reorder_level THEN 'REORDER'
    WHEN i.qty_available <= (p.reorder_level * 1.5) THEN 'LOW'
    ELSE 'OK'
  END as stock_status
FROM inventory i
JOIN products p ON i.product_id = p.id
ORDER BY i.qty_available ASC;

-- Query 6: Get products with low stock
SELECT 
  id, sku, name, category, stock_qty, reorder_level,
  (stock_qty - reorder_level) as stock_above_reorder
FROM products
WHERE stock_qty <= reorder_level
ORDER BY stock_qty ASC;

-- Query 7: Get all active sessions for a user
SELECT 
  id,
  user_id,
  jti,
  issued_at,
  expires_at,
  last_seen,
  CASE WHEN revoked_at IS NOT NULL THEN 'REVOKED' ELSE 'ACTIVE' END as status
FROM sessions
WHERE user_id = 'supabase-user-1'
AND expires_at > now()
ORDER BY issued_at DESC;

-- Query 8: Get audit log for a specific user
SELECT 
  id,
  action,
  entity_type,
  entity_id,
  created_at,
  ip_address
FROM audit_logs
WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@company.com')
ORDER BY created_at DESC
LIMIT 50;

-- Query 9: Get purchase order status summary
SELECT 
  status,
  COUNT(*) as count,
  SUM(grand_total) as total_value
FROM purchase_orders
GROUP BY status
ORDER BY count DESC;

-- Query 10: Get sales forecast (pending and confirmed orders)
SELECT 
  EXTRACT(MONTH FROM so_date) as month,
  COUNT(*) as order_count,
  SUM(grand_total) as total_value,
  AVG(grand_total) as avg_value
FROM sales_orders
WHERE status IN ('pending_confirmation', 'confirmed', 'shipped')
GROUP BY EXTRACT(MONTH FROM so_date)
ORDER BY month;

-- Query 11: Get vendor performance metrics
SELECT 
  v.code,
  v.name,
  COUNT(po.id) as total_pos,
  AVG(v.rating) as avg_rating,
  SUM(po.grand_total) as total_spend
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
WHERE v.status = 'active'
GROUP BY v.id, v.code, v.name
ORDER BY total_spend DESC;

-- Query 12: Get employee department summary
SELECT 
  department,
  COUNT(*) as employee_count,
  SUM(salary) as total_salary,
  AVG(salary) as avg_salary
FROM employees
WHERE status = 'active'
GROUP BY department
ORDER BY total_salary DESC;

-- Query 13: Get pending approval orders
SELECT 
  'PO' as order_type,
  po.po_number as order_number,
  v.name as party,
  po.po_date as order_date,
  po.grand_total as amount
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
WHERE po.status = 'pending_approval'
UNION ALL
SELECT 
  'SO' as order_type,
  so.so_number as order_number,
  so.customer_name as party,
  so.so_date as order_date,
  so.grand_total as amount
FROM sales_orders so
WHERE so.status = 'pending_confirmation'
ORDER BY order_date DESC;

-- Query 14: Get inventory valuation
SELECT 
  p.category,
  COUNT(i.id) as product_count,
  SUM(i.qty_on_hand) as total_qty,
  SUM(i.qty_on_hand * p.unit_price) as inventory_value
FROM inventory i
JOIN products p ON i.product_id = p.id
GROUP BY p.category
ORDER BY inventory_value DESC;

-- Query 15: Get customer purchase history
SELECT 
  so.so_number,
  so.customer_name,
  so.so_date,
  p.name as product_name,
  soi.quantity,
  soi.unit_price,
  soi.line_total
FROM sales_orders so
JOIN sales_order_items soi ON so.id = soi.sales_order_id
JOIN products p ON soi.product_id = p.id
WHERE so.customer_name = 'ABC Manufacturing Ltd'
ORDER BY so.so_date DESC;

-- ========================================================================
-- PART 4: UPDATE EXAMPLES
-- ========================================================================

-- Update a vendor status
UPDATE vendors SET status = 'inactive' WHERE code = 'METAL-004';

-- Update product stock
UPDATE products SET stock_qty = stock_qty - 5 WHERE sku = 'PROD-001';

-- Update purchase order status
UPDATE purchase_orders 
SET status = 'confirmed', updated_at = now()
WHERE po_number = 'PO-2025-001';

-- Update sales order status
UPDATE sales_orders 
SET status = 'shipped', updated_at = now()
WHERE so_number = 'SO-2025-001';

-- Revoke a session
UPDATE sessions 
SET revoked_at = now()
WHERE jti = 'jti-token-001';

-- ========================================================================
-- PART 5: DELETE EXAMPLES (USE WITH CAUTION)
-- ========================================================================

-- Delete completed inventory transactions (keep last 90 days)
DELETE FROM inventory_transactions
WHERE created_at < now() - interval '90 days';

-- Delete old audit logs (keep last 1 year)
DELETE FROM audit_logs
WHERE created_at < now() - interval '1 year';

-- Delete inactive sessions (expired)
DELETE FROM sessions
WHERE expires_at < now() AND revoked_at IS NOT NULL;

-- ========================================================================
-- PART 6: MAINTENANCE QUERIES
-- ========================================================================

-- Get database size
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();

-- Get table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Analyze tables for query optimization
ANALYZE;

-- Get index usage stats
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ========================================================================
-- END OF SAMPLE QUERIES
-- ========================================================================
