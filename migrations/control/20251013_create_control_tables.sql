-- Migration: create control-plane tables (sessions, user_mappings, tenant_metadata, policy_changes, migration_jobs)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  jti TEXT UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE NULL,
  device_info JSONB NULL,
  last_seen TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

-- user_mappings
CREATE TABLE IF NOT EXISTS user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_uid TEXT UNIQUE NOT NULL,
  supabase_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- tenant_metadata
CREATE TABLE IF NOT EXISTS tenant_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_slug TEXT UNIQUE NOT NULL,
  db_connection_string TEXT NOT NULL,
  plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- policy_changes
CREATE TABLE IF NOT EXISTS policy_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  delta JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- migration_jobs
CREATE TABLE IF NOT EXISTS migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_processed_key TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
