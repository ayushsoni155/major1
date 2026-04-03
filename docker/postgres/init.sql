-- ============================================
-- RapidBase BaaS — Database Bootstrap Script
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255),
    avatar_url      TEXT,
    role            VARCHAR(50) DEFAULT 'user',
    -- Email verification status (OTP codes are stored in Redis)
    is_verified     BOOLEAN DEFAULT false,
    -- Account state
    is_active       BOOLEAN DEFAULT true,
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    project_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_name        VARCHAR(255) NOT NULL,
    project_description TEXT,
    schema_name         VARCHAR(255) UNIQUE NOT NULL,
    project_status      VARCHAR(50) DEFAULT 'active',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Project Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(50) NOT NULL DEFAULT 'viewer',
    invited_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id),
    CHECK (role IN ('admin', 'editor', 'viewer'))
);

-- ============================================
-- API Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    key_name    VARCHAR(255) NOT NULL,
    api_key     VARCHAR(512) UNIQUE NOT NULL,
    key_prefix  VARCHAR(12) NOT NULL,
    origin_url  TEXT,
    permissions JSONB DEFAULT '["read"]'::jsonb,
    is_active   BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

-- ============================================
-- Query History Table
-- ============================================
CREATE TABLE IF NOT EXISTS query_history (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id        UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query_text        TEXT NOT NULL,
    query_status      VARCHAR(20) DEFAULT 'success',
    execution_time_ms INTEGER,
    rows_affected     INTEGER DEFAULT 0,
    error_message     TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    CHECK (query_status IN ('success', 'failed'))
);

-- ============================================
-- Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID REFERENCES projects(project_id) ON DELETE SET NULL,
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    details     JSONB DEFAULT '{}',
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_owner        ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_proj  ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user  ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_project      ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key          ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_query_history_project ON query_history(project_id);
CREATE INDEX IF NOT EXISTS idx_query_history_user    ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created ON query_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_project     ON audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor       ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created     ON audit_log(created_at DESC);

-- ============================================
-- Row-Level Security: Multi-Tenancy
-- ============================================
-- Enable RLS on projects (users can only see their own projects)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_owner_isolation ON projects
    USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Enable RLS on project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_members_isolation ON project_members
    USING (
        project_id IN (
            SELECT project_id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::uuid
        )
        OR user_id = current_setting('app.current_user_id', true)::uuid
    );

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY api_keys_isolation ON api_keys
    USING (
        project_id IN (
            SELECT project_id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::uuid
        )
    );

-- Enable RLS on query_history
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY query_history_isolation ON query_history
    USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_isolation ON audit_log
    USING (
        project_id IN (
            SELECT project_id FROM projects
            WHERE owner_id = current_setting('app.current_user_id', true)::uuid
        )
    );

-- ============================================
-- BUG-1 FIX: Bypass RLS for the backend service role
-- Node.js services enforce multi-tenancy at the application layer
-- (JWT + owner_id checks). Enabling RLS without setting the session
-- variable app.current_user_id causes every backend query to return
-- 0 rows silently. BYPASSRLS ensures backend can read/write normally.
-- ============================================
ALTER ROLE rapidbase BYPASSRLS;

-- ============================================
-- PostgREST Role Setup
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'rb_db_v9xK2mP7qL4wN1jR8tF5cH3bZ6';
    END IF;
END
$$;

GRANT web_anon TO authenticator;
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO web_anon;

-- ============================================
-- PostgREST Dynamic Schema Configuration
-- ============================================
-- Creates a pre_config function that PostgREST calls at startup
-- and on every config reload. It dynamically builds the schema
-- list from all project schemas so API key holders can query them.
-- ============================================
CREATE SCHEMA IF NOT EXISTS postgrest;

CREATE OR REPLACE FUNCTION postgrest.pre_config()
RETURNS void AS $$
DECLARE
    schemas text;
BEGIN
    -- Build comma-separated list: "public,proj_abc123,proj_def456,..."
    SELECT string_agg(schema_name, ',')
    INTO schemas
    FROM projects;

    IF schemas IS NOT NULL AND schemas != '' THEN
        PERFORM set_config('pgrst.db_schemas', 'public,' || schemas, true);
    ELSE
        PERFORM set_config('pgrst.db_schemas', 'public', true);
    END IF;
END;
$$ LANGUAGE plpgsql;

GRANT USAGE ON SCHEMA postgrest TO authenticator;
GRANT EXECUTE ON FUNCTION postgrest.pre_config() TO authenticator;

-- ============================================
-- Migration: Grant web_anon on ALL existing project schemas
-- ============================================
-- Run this once to fix existing schemas that were created
-- before the web_anon grants were added to createProject.
-- ============================================
CREATE OR REPLACE FUNCTION grant_web_anon_on_all_project_schemas()
RETURNS void AS $$
DECLARE
    s text;
BEGIN
    FOR s IN SELECT schema_name FROM projects
    LOOP
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO web_anon', s);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO web_anon', s);
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA %I TO web_anon', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_anon', s);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT USAGE, SELECT ON SEQUENCES TO web_anon', s);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute once during bootstrap
SELECT grant_web_anon_on_all_project_schemas();

-- ============================================
-- Event Trigger: auto-grant web_anon on new tables
-- ============================================
-- When any CREATE TABLE runs in a project schema,
-- automatically grant web_anon CRUD on it.
-- ============================================
CREATE OR REPLACE FUNCTION auto_grant_web_anon_on_new_table()
RETURNS event_trigger AS $$
DECLARE
    obj record;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
                WHERE command_tag = 'CREATE TABLE'
    LOOP
        -- Only grant on project schemas (they exist in the projects table)
        IF EXISTS (SELECT 1 FROM projects WHERE schema_name = obj.schema_name) THEN
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %s TO web_anon', obj.object_identity);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Drop + recreate to avoid "already exists" on re-init
DROP EVENT TRIGGER IF EXISTS auto_grant_web_anon;
CREATE EVENT TRIGGER auto_grant_web_anon
    ON ddl_command_end
    WHEN TAG IN ('CREATE TABLE')
    EXECUTE FUNCTION auto_grant_web_anon_on_new_table();

-- ============================================
-- Triggers: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    data       JSONB DEFAULT '{}',
    is_read    BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- Project Invitations Table
-- ============================================
CREATE TABLE IF NOT EXISTS project_invitations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    inviter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email  VARCHAR(255) NOT NULL,
    invitee_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    role           VARCHAR(20) NOT NULL DEFAULT 'viewer',
    token          VARCHAR(64) UNIQUE NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_invitations_token   ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee ON project_invitations(invitee_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_project ON project_invitations(project_id);

-- ============================================
-- Analytics Dashboards Table
-- Persists per-project dashboard widget layouts and configurations
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_dashboards (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    layout     JSONB NOT NULL DEFAULT '[]',
    widgets    JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_dashboards_project ON analytics_dashboards(project_id);
