-- Control-Plane Database Initialization
-- Idempotent: Safe to run multiple times
-- Created: 2025-10-27 (Sprint 1)

-- ============================================================
-- SESSIONS TABLE - JWT revocation tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  role VARCHAR(100),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoke_reason TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_user_tenant ON sessions(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- TENANT_METADATA TABLE - Per-tenant DB connections
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE,
  tenant_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended, onboarding
  database_url TEXT NOT NULL,
  database_region VARCHAR(100),
  database_config JSONB,
  provisioning_status VARCHAR(100) DEFAULT 'pending', -- pending, provisioning, ready, failed
  provisioning_error TEXT,
  metadata JSONB,
  migrations_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_tenant_metadata_status ON tenant_metadata(status);
CREATE INDEX IF NOT EXISTS idx_tenant_metadata_provisioning ON tenant_metadata(provisioning_status);

-- ============================================================
-- USER_MAPPINGS TABLE - Supabase Auth ↔ Tenant mapping
-- ============================================================
CREATE TABLE IF NOT EXISTS user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  permissions_snapshot TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(supabase_user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_user_mappings_tenant ON user_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_mappings_role ON user_mappings(role);
CREATE INDEX IF NOT EXISTS idx_user_mappings_active ON user_mappings(is_active);

-- ============================================================
-- POLICY_SYNC_LOGS TABLE - Permify sync audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS policy_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, success, failed
  payload JSONB NOT NULL,
  response JSONB,
  error_message TEXT,
  http_status_code INTEGER,
  duration_ms INTEGER,
  triggered_by VARCHAR(255),
  sync_type VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_policy_sync_tenant_date ON policy_sync_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_policy_sync_status ON policy_sync_logs(sync_status);

-- ============================================================
-- SAMPLE SEED DATA (for local development)
-- ============================================================
-- Seed control-plane for local dev
INSERT INTO tenant_metadata (tenant_id, tenant_name, status, database_url, provisioning_status, migrations_applied)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'Demo Tenant (Local Dev)',
  'active',
  'postgresql://postgres:postgres123@localhost:5432/arcus_tenant_demo',
  'ready',
  TRUE
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS (if using separate user for app)
-- ============================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON tenant_metadata TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON user_mappings TO app_user;
-- GRANT SELECT, INSERT ON policy_sync_logs TO app_user;

-- ============================================================
-- ENABLE ROW SECURITY (optional, for multi-tenant safety)
-- ============================================================
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_mappings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY sessions_tenant_isolation ON sessions
--   USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
