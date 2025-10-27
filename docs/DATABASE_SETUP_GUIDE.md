# 📊 DATABASE SCHEMA SETUP GUIDE

**Date:** October 26, 2025  
**Project:** Arcus v1 SaaS  
**File:** `COMPLETE_DATABASE_SCHEMA.sql`

---

## 🎯 OVERVIEW

The `COMPLETE_DATABASE_SCHEMA.sql` file contains the complete database schema for your Arcus v1 SaaS platform. It includes:

### ✅ What's Included

**Control-Plane Tables (Central Database)**
- `sessions` - JWT session management and revocation tracking
- `user_mappings` - Links Firebase/legacy UIDs to Supabase user IDs
- `tenant_metadata` - Stores tenant information and database connection strings
- `policy_changes` - Audit trail for permission changes
- `migration_jobs` - Tracks data migration progress

**Tenant Tables (Per-Organization Database)**
- `users` - User accounts
- `roles` - User roles
- `user_roles` - Maps users to roles
- `vendors` - Vendor/supplier information
- `products` - Product catalog
- `purchase_orders` - Purchase orders from vendors
- `purchase_order_items` - Line items in purchase orders
- `sales_orders` - Sales orders to customers
- `sales_order_items` - Line items in sales orders
- `inventory` - Product stock levels by warehouse
- `inventory_transactions` - Audit trail for inventory changes
- `employees` - Employee records
- `events` - Domain events audit trail
- `audit_logs` - Comprehensive action audit logs

---

## 🚀 QUICK START (5 Minutes)

### Option 1: Supabase (Recommended for Beginners)

1. **Create Supabase Project**
   - Go to https://supabase.co
   - Click "Create a new project"
   - Fill in project name, password, region
   - Click "Create"
   - Wait ~2-3 minutes for creation

2. **Access SQL Editor**
   - Go to your project dashboard
   - Click on "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run the Schema**
   - Open `COMPLETE_DATABASE_SCHEMA.sql`
   - Copy ALL content
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for completion (should see all tables listed in the left panel)

4. **Get Connection String**
   - Go to "Settings" → "Database"
   - Find "Connection string" section
   - Copy the Postgres connection string
   - Save to `.env.local` as `CONTROL_DATABASE_URL`

5. **Done!** ✅
   - All tables are created
   - Ready for application to connect

---

### Option 2: Local PostgreSQL (For Development)

1. **Ensure PostgreSQL is Running**
   ```powershell
   docker-compose -f docker-compose.dev.yml up -d postgres
   ```

2. **Connect to PostgreSQL**
   ```powershell
   psql -h localhost -U postgres -d control_db
   ```

3. **Run Schema File**
   ```powershell
   psql -h localhost -U postgres -d control_db -f COMPLETE_DATABASE_SCHEMA.sql
   ```

4. **Verify Tables**
   ```powershell
   psql -h localhost -U postgres -d control_db -c "\dt"
   ```

---

### Option 3: Using pgAdmin (GUI)

1. **Open pgAdmin**
   - Navigate to http://localhost:5050 (if using Docker)
   - Login with default credentials

2. **Create Databases**
   - Right-click "Databases"
   - Create Database → "control_db"
   - Create Database → "tenant_001"

3. **Open Query Tool**
   - Right-click on "control_db"
   - Click "Query Tool"

4. **Run Schema**
   - Copy entire SQL file
   - Paste into Query Tool
   - Click "Execute"

5. **Repeat for Tenant DB**
   - Switch to "tenant_001"
   - Paste and run again

---

## 📋 STEP-BY-STEP SETUP

### Step 1: Prepare Environment

Create a `.env.local` file (if not already present):

```env
# Control-Plane Database (central)
CONTROL_DATABASE_URL=postgresql://user:password@localhost:5432/control_db

# Default Tenant Database (for development)
TENANT_DATABASE_URL=postgresql://user:password@localhost:5432/tenant_001

# Other variables...
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Step 2: Create Databases

**If using local PostgreSQL:**

```powershell
# Connect to default postgres database
psql -h localhost -U postgres

# Create control database
CREATE DATABASE control_db;

# Create tenant database
CREATE DATABASE tenant_001;

# Exit
\q
```

**If using Supabase:**
- Skip this - Supabase creates the database automatically

### Step 3: Run Schema

**Method A: Command Line (PostgreSQL)**

```powershell
# Run entire schema on localhost
psql -h localhost -U postgres -d control_db -f COMPLETE_DATABASE_SCHEMA.sql
```

**Method B: Supabase SQL Editor**

1. Open Supabase project
2. Go to SQL Editor
3. Create new query
4. Copy and paste COMPLETE_DATABASE_SCHEMA.sql
5. Run

**Method C: DBeaver / pgAdmin GUI**

1. Open connection
2. Right-click database
3. Query Editor
4. Paste SQL
5. Execute

### Step 4: Verify Creation

```powershell
# Connect to control database
psql -h localhost -U postgres -d control_db

# List all tables
\dt

# You should see:
# - audit_logs
# - events
# - inventory
# - inventory_transactions
# - migration_jobs
# - policy_changes
# - purchase_order_items
# - purchase_orders
# - roles
# - sales_order_items
# - sales_orders
# - sessions
# - tenant_metadata
# - user_mappings
# - user_roles
# - users
# - vendors
# - products
# - employees

# View specific table structure
\d+ sessions
\d+ vendors
\d+ products
```

---

## 🔧 DATABASE STRUCTURE

### Control-Plane Database

**Sessions Table**
```
id (UUID)              - Primary key
user_id (TEXT)         - Supabase user ID
jti (TEXT)             - JWT ID token
issued_at (TIMESTAMP)  - Token issued time
expires_at (TIMESTAMP) - Token expiration
revoked_at (TIMESTAMP) - When session was revoked
device_info (JSONB)    - Device metadata
last_seen (TIMESTAMP)  - Last activity
```

**User Mappings Table**
```
id (UUID)              - Primary key
legacy_uid (TEXT)      - Firebase UID
supabase_user_id (TEXT) - Supabase user ID
created_at (TIMESTAMP) - Creation time
```

**Tenant Metadata Table**
```
id (UUID)              - Primary key
org_slug (TEXT)        - Organization identifier
org_name (TEXT)        - Organization name
db_connection_string   - Database connection URL
plan (JSONB)           - Billing/subscription plan
created_at (TIMESTAMP) - Creation time
```

### Tenant Database

**Users Table**
```
id (UUID)              - Primary key
email (TEXT)           - Email address
name (TEXT)            - Full name
metadata (JSONB)       - Additional metadata
legacy_id (TEXT)       - Firebase/legacy ID
created_at (TIMESTAMP) - Creation time
```

**Vendors Table**
```
id (UUID)              - Primary key
code (TEXT)            - Vendor code
name (TEXT)            - Vendor name
email (TEXT)           - Email address
phone (TEXT)           - Phone number
address (TEXT)         - Physical address
city, state, country   - Location fields
zip_code (TEXT)        - Postal code
status (TEXT)          - 'active' or 'inactive'
rating (DECIMAL)       - Rating 0.0-5.0
payment_terms (TEXT)   - e.g., 'Net 30'
```

**Products Table**
```
id (UUID)              - Primary key
sku (TEXT)             - Stock keeping unit
name (TEXT)            - Product name
category (TEXT)        - Category
description (TEXT)     - Description
unit_price (DECIMAL)   - Price per unit
tax_rate (DECIMAL)     - Tax percentage
status (TEXT)          - 'active' or 'inactive'
reorder_level (INT)    - Minimum stock level
stock_qty (INT)        - Current stock
```

**Purchase Orders Table**
```
id (UUID)              - Primary key
po_number (TEXT)       - Order number
vendor_id (UUID)       - Links to vendor
po_date (TIMESTAMP)    - Order date
expected_delivery      - Expected delivery date
status (TEXT)          - Order status
total_amount (DECIMAL) - Subtotal
tax_amount (DECIMAL)   - Tax amount
grand_total (DECIMAL)  - Final total
```

**Sales Orders Table**
```
id (UUID)              - Primary key
so_number (TEXT)       - Order number
customer_name (TEXT)   - Customer name
customer_email (TEXT)  - Customer email
customer_phone (TEXT)  - Customer phone
so_date (TIMESTAMP)    - Order date
promised_delivery      - Promised delivery date
status (TEXT)          - Order status
total_amount (DECIMAL) - Subtotal
tax_amount (DECIMAL)   - Tax amount
grand_total (DECIMAL)  - Final total
```

**Inventory Table**
```
id (UUID)              - Primary key
product_id (UUID)      - Links to product
warehouse_id (TEXT)    - Warehouse identifier
qty_on_hand (INT)      - Total quantity
qty_reserved (INT)     - Reserved quantity
qty_available (INT)    - Available quantity
last_count_date        - Last physical count
```

---

## 📝 INSERTING TEST DATA

The schema file includes commented SQL for test data. To use it:

1. Open `COMPLETE_DATABASE_SCHEMA.sql`
2. Find "PART 3: SEED DATA" section
3. Uncomment the INSERT statements
4. Run again

**Or manually insert:**

```sql
-- Insert a user
INSERT INTO users (email, name) 
VALUES ('john@example.com', 'John Doe');

-- Insert a vendor
INSERT INTO vendors (code, name, email, status) 
VALUES ('ACE-001', 'Ace Industries', 'contact@ace.com', 'active');

-- Insert a product
INSERT INTO products (sku, name, category, unit_price, status) 
VALUES ('PROD-001', 'Widget', 'Tools', 99.99, 'active');
```

---

## 🔗 CONNECTING FROM APPLICATION

### TypeORM Connection Example

```typescript
import { DataSource } from 'typeorm';

// Control-plane database
export const ControlDataSource = new DataSource({
  type: 'postgres',
  url: process.env.CONTROL_DATABASE_URL,
  entities: ['src/lib/entities/control/**/*.ts'],
  migrations: ['migrations/control/**/*.ts'],
  synchronize: false,
  logging: true,
});

// Tenant database
export const TenantDataSource = new DataSource({
  type: 'postgres',
  url: process.env.TENANT_DATABASE_URL,
  entities: ['src/lib/entities/tenant/**/*.ts'],
  migrations: ['migrations/tenant/**/*.ts'],
  synchronize: false,
  logging: true,
});
```

### Environment Variables

Add to `.env.local`:

```env
CONTROL_DATABASE_URL=postgresql://user:password@localhost:5432/control_db
TENANT_DATABASE_URL=postgresql://user:password@localhost:5432/tenant_001
```

---

## ✅ VERIFICATION CHECKLIST

After running the schema, verify:

- [ ] All 18 tables were created
- [ ] All indexes were created
- [ ] Foreign key relationships are intact
- [ ] JSONB columns are functional
- [ ] Can insert test data
- [ ] Can query across tables with JOINs
- [ ] Application can connect

**Check command:**

```sql
-- Count tables
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: 18

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- View specific indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## 🆘 TROUBLESHOOTING

### Problem: "Permission denied" error

**Solution:**
```sql
-- Ensure you have superuser or proper role
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO your_user;
```

### Problem: "pgcrypto extension does not exist"

**Solution:**
```sql
-- Create extension (already in schema, but if error:)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Problem: Foreign key constraint fails

**Solution:**
- Ensure parent table records exist before inserting child records
- For vendors: Insert vendor before inserting purchase orders
- For products: Insert products before inventory records

### Problem: Connection string not working

**Solution:**
- Format: `postgresql://user:password@host:port/database`
- Check credentials in Supabase Settings
- Verify hostname is correct (localhost for local, provided for Supabase)
- Check port (5432 is default)

### Problem: Indexes not being used

**Solution:**
```sql
-- Analyze tables for query planning
ANALYZE;

-- View index usage
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## 📚 COMMON QUERIES

### Get all vendors
```sql
SELECT id, name, code, status, rating 
FROM vendors 
WHERE status = 'active' 
ORDER BY name;
```

### Get purchase orders for a vendor
```sql
SELECT po.*, v.name as vendor_name
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
WHERE po.vendor_id = 'vendor-uuid'
ORDER BY po.po_date DESC;
```

### Get inventory for a product
```sql
SELECT i.*, p.name as product_name
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.product_id = 'product-uuid';
```

### Check session validity
```sql
SELECT id, user_id, expires_at, revoked_at
FROM sessions
WHERE user_id = 'supabase-user-id'
AND expires_at > now()
AND revoked_at IS NULL;
```

### Audit user actions
```sql
SELECT al.* 
FROM audit_logs al
WHERE al.user_id = 'user-uuid'
ORDER BY al.created_at DESC
LIMIT 100;
```

---

## 🔒 SECURITY BEST PRACTICES

1. **Enable Row Level Security (RLS)**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
   ```

2. **Create restricted user role**
   ```sql
   CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   ```

3. **Restrict access to sensitive data**
   - Never store passwords in database
   - Encrypt sensitive JSONB data
   - Use Supabase Auth for authentication

4. **Regular backups**
   ```powershell
   # In production, set up automated backups
   # Supabase provides automatic daily backups
   # For local: use pg_dump regularly
   ```

---

## 📞 NEXT STEPS

1. ✅ Run the SQL schema file
2. ✅ Verify all tables are created
3. ✅ Configure `.env.local` with connection strings
4. ✅ Test application connection
5. ✅ Insert seed data
6. ✅ Run migrations if needed
7. ✅ Configure environment for production

---

## 📖 REFERENCE

**Files:**
- `COMPLETE_DATABASE_SCHEMA.sql` - Full schema (this is used with)
- `.env.template` - Environment variable template
- `src/lib/controlDataSource.ts` - TypeORM control-plane connection
- `src/lib/tenantDataSource.ts` - TypeORM tenant connection
- `scripts/seed-control-plane.ts` - Seed control-plane data
- `scripts/seed-tenant.ts` - Seed tenant data

**External Resources:**
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Supabase Docs: https://supabase.com/docs
- TypeORM Docs: https://typeorm.io

---

**Created:** October 26, 2025  
**Version:** 1.0  
**Status:** ✅ Ready to Use

**You're all set! Run the schema now! 🚀**
