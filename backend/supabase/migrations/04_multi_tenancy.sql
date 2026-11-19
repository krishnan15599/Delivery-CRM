-- ====================================================================
-- Delivery CRM - Multi-company (multi-tenant) schema (04_multi_tenancy.sql)
--
-- Adds:
--   * organizations  - one row per business using the CRM
--   * teams          - hubs/zones inside a business (each business has one default team)
--   * team_managers  - which Managers manage which teams (many-to-many)
--   * organization_id on every business-data table, plus composite foreign keys
--     (organization_id, x_id) so a row in one business can never point at a
--     row in another business.
--
-- Existing data is moved into the business 'ORG-DEFAULT' and its team
-- 'TEAM-DEFAULT' ("Main Team"). Rename it later from the app or with SQL.
--
-- Run AFTER 01, 02 and 03. Safe to run more than once.
-- Requires Postgres 15+ (for ON DELETE SET NULL (column)).
--
-- How to create the platform owner (SuperAdmin) - it has NO organization:
--   1. Supabase dashboard -> Authentication -> Users -> Add user (auto-confirm).
--   2. SQL editor:
--        INSERT INTO profiles (name, email, role, organization_id, auth_user_id)
--        SELECT 'Platform Owner', email, 'SuperAdmin', NULL, id
--        FROM auth.users WHERE email = 'owner@example.com';
--   A SuperAdmin needs its own email: one email = one person = one business.
-- ====================================================================

DO $$
BEGIN
  IF current_setting('server_version_num')::int < 150000 THEN
    RAISE EXCEPTION 'Postgres 15 or newer is required (found %).', current_setting('server_version');
  END IF;
END $$;

BEGIN;

-- --------------------------------------------------------------------
-- 1. New tables
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  hub_address TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teams_org_name_key UNIQUE (organization_id, name),
  CONSTRAINT teams_org_id_key UNIQUE (organization_id, id)
);

-- At most one default team per business
CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_one_default_per_org
  ON teams (organization_id) WHERE is_default;

-- --------------------------------------------------------------------
-- 2. Default business + team for all existing data
-- --------------------------------------------------------------------
INSERT INTO organizations (id, name, code)
VALUES ('ORG-DEFAULT', 'Default Company', 'DEFAULT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, organization_id, name, is_default)
VALUES ('TEAM-DEFAULT', 'ORG-DEFAULT', 'Main Team', true)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------
-- 3. New columns (nullable first, so existing rows can be backfilled)
-- --------------------------------------------------------------------
ALTER TABLE profiles      ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE profiles      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'Active';
ALTER TABLE agents        ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE agents        ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE customers     ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE deliveries    ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE deliveries    ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE deliveries    ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE collections   ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE collections   ADD COLUMN IF NOT EXISTS team_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- --------------------------------------------------------------------
-- 4. Backfill existing rows into the default business / team
-- --------------------------------------------------------------------
UPDATE profiles   SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL AND role <> 'SuperAdmin';
UPDATE agents     SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;
UPDATE agents     SET team_id = 'TEAM-DEFAULT'        WHERE team_id IS NULL;
UPDATE customers  SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;
UPDATE deliveries SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;
UPDATE deliveries SET team_id = 'TEAM-DEFAULT'        WHERE team_id IS NULL;

UPDATE collections c
SET organization_id = d.organization_id,
    team_id = COALESCE(c.team_id, d.team_id)
FROM deliveries d
WHERE c.delivery_id = d.id AND c.organization_id IS NULL;
UPDATE collections SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;
UPDATE collections SET team_id = 'TEAM-DEFAULT'        WHERE team_id IS NULL;

UPDATE conversations SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;
UPDATE chat_messages m
SET organization_id = c.organization_id
FROM conversations c
WHERE m.conversation_id = c.id AND m.organization_id IS NULL;
UPDATE chat_messages SET organization_id = 'ORG-DEFAULT' WHERE organization_id IS NULL;

-- --------------------------------------------------------------------
-- 5. NOT NULL (profiles.organization_id stays nullable: NULL = SuperAdmin)
-- --------------------------------------------------------------------
ALTER TABLE agents        ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE agents        ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE customers     ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE deliveries    ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE deliveries    ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE collections   ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE collections   ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE chat_messages ALTER COLUMN organization_id SET NOT NULL;

-- --------------------------------------------------------------------
-- 6. Drop the old single-column foreign keys that the composite ones replace
--    (looked up by column, so it works whatever Postgres named them)
-- --------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT con.conrelid::regclass AS tbl, con.conname
    FROM pg_constraint con
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND array_length(con.conkey, 1) = 1
      AND (con.conrelid::regclass::text, att.attname::text) IN (
        ('deliveries', 'agent_id'),
        ('deliveries', 'customer_id'),
        ('agents', 'user_id'),
        ('collections', 'delivery_id'),
        ('collections', 'agent_id'),
        ('chat_messages', 'conversation_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
  END LOOP;
END $$;

-- Replace CHECK constraints whose allowed values change
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;

-- --------------------------------------------------------------------
-- 7. Add constraints (each one only if it does not exist yet)
--    Order matters: UNIQUE targets before the foreign keys that use them.
-- --------------------------------------------------------------------
DO $$
DECLARE
  c text[];
BEGIN
  FOREACH c SLICE 1 IN ARRAY ARRAY[
    -- unique (organization_id, id) = targets for composite foreign keys
    ['profiles',      'profiles_org_id_key',      'UNIQUE (organization_id, id)'],
    ['agents',        'agents_org_id_key',        'UNIQUE (organization_id, id)'],
    ['customers',     'customers_org_id_key',     'UNIQUE (organization_id, id)'],
    ['deliveries',    'deliveries_org_id_key',    'UNIQUE (organization_id, id)'],
    ['conversations', 'conversations_org_id_key', 'UNIQUE (organization_id, id)'],

    -- checks
    ['profiles',      'profiles_role_check',               $c$CHECK (role IN ('SuperAdmin', 'Admin', 'Manager', 'Agent'))$c$],
    ['profiles',      'profiles_status_check',             $c$CHECK (status IN ('Active', 'Inactive'))$c$],
    ['profiles',      'profiles_superadmin_org_check',     $c$CHECK ((role = 'SuperAdmin') = (organization_id IS NULL))$c$],
    ['chat_messages', 'chat_messages_sender_role_check',   $c$CHECK (sender_role IN ('admin', 'manager', 'customer', 'agent'))$c$],

    -- every business row belongs to an existing business
    ['profiles',      'profiles_org_fk',      'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['agents',        'agents_org_fk',        'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['customers',     'customers_org_fk',     'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['deliveries',    'deliveries_org_fk',    'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['collections',   'collections_org_fk',   'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['conversations', 'conversations_org_fk', 'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],
    ['chat_messages', 'chat_messages_org_fk', 'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'],

    -- composite foreign keys: references can never cross businesses
    -- (team FKs use the default NO ACTION so deleting a whole business cascades cleanly,
    --  while deleting a single team that still has agents/deliveries is refused)
    ['agents',        'agents_team_fk',          'FOREIGN KEY (organization_id, team_id) REFERENCES teams (organization_id, id)'],
    ['agents',        'agents_user_fk',          'FOREIGN KEY (organization_id, user_id) REFERENCES profiles (organization_id, id) ON DELETE SET NULL (user_id)'],
    ['deliveries',    'deliveries_team_fk',      'FOREIGN KEY (organization_id, team_id) REFERENCES teams (organization_id, id)'],
    ['deliveries',    'deliveries_agent_fk',     'FOREIGN KEY (organization_id, agent_id) REFERENCES agents (organization_id, id) ON DELETE SET NULL (agent_id)'],
    ['deliveries',    'deliveries_customer_fk',  'FOREIGN KEY (organization_id, customer_id) REFERENCES customers (organization_id, id) ON DELETE SET NULL (customer_id)'],
    ['deliveries',    'deliveries_created_by_fk','FOREIGN KEY (organization_id, created_by) REFERENCES profiles (organization_id, id) ON DELETE SET NULL (created_by)'],
    ['collections',   'collections_team_fk',     'FOREIGN KEY (organization_id, team_id) REFERENCES teams (organization_id, id)'],
    ['collections',   'collections_delivery_fk', 'FOREIGN KEY (organization_id, delivery_id) REFERENCES deliveries (organization_id, id) ON DELETE CASCADE'],
    ['collections',   'collections_agent_fk',    'FOREIGN KEY (organization_id, agent_id) REFERENCES agents (organization_id, id) ON DELETE SET NULL (agent_id)'],
    ['chat_messages', 'chat_messages_conversation_fk', 'FOREIGN KEY (organization_id, conversation_id) REFERENCES conversations (organization_id, id) ON DELETE CASCADE']
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = c[2] AND conrelid = c[1]::regclass
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I %s', c[1], c[2], c[3]);
    END IF;
  END LOOP;
END $$;

-- --------------------------------------------------------------------
-- 8. Managers <-> teams
-- --------------------------------------------------------------------
-- Created (and backfilled) only on the first run, so re-running this file
-- never changes which teams a Manager manages.
DO $$
BEGIN
  IF to_regclass('public.team_managers') IS NULL THEN
    CREATE TABLE team_managers (
      organization_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      manager_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (team_id, manager_id),
      CONSTRAINT team_managers_team_fk    FOREIGN KEY (organization_id, team_id)    REFERENCES teams (organization_id, id)    ON DELETE CASCADE,
      CONSTRAINT team_managers_manager_fk FOREIGN KEY (organization_id, manager_id) REFERENCES profiles (organization_id, id) ON DELETE CASCADE
    );

    -- Existing Managers keep seeing everything they see today (all existing data is in Main Team)
    INSERT INTO team_managers (organization_id, team_id, manager_id)
    SELECT p.organization_id, 'TEAM-DEFAULT', p.id
    FROM profiles p
    WHERE p.role = 'Manager' AND p.organization_id = 'ORG-DEFAULT';
  END IF;
END $$;

-- --------------------------------------------------------------------
-- 8b. A business must always keep at least one active Admin.
--     The backend checks this too; this trigger also covers two Admins
--     deactivating/deleting each other at the same moment. It locks the
--     business row so such changes run one after the other.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ensure_business_keeps_an_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining INT;
BEGIN
  -- Only relevant when an active Admin stops being one
  IF OLD.role <> 'Admin' OR OLD.status <> 'Active' OR OLD.organization_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.role = 'Admin' AND NEW.status = 'Active'
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id THEN
    RETURN NEW;
  END IF;

  -- Business row gone = the whole business is being deleted: allow
  PERFORM 1 FROM organizations WHERE id = OLD.organization_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT count(*) INTO v_remaining
  FROM profiles
  WHERE organization_id = OLD.organization_id
    AND role = 'Admin' AND status = 'Active' AND id <> OLD.id;

  IF v_remaining = 0 THEN
    RAISE EXCEPTION 'A business must keep at least one active Admin.' USING ERRCODE = '23514';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_keep_an_admin ON profiles;
CREATE TRIGGER trg_profiles_keep_an_admin
  BEFORE UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION ensure_business_keeps_an_admin();

-- --------------------------------------------------------------------
-- 9. Indexes for business-scoped queries
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_deliveries_org_status   ON deliveries (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_team     ON deliveries (organization_id, team_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_date     ON deliveries (organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_org_agent    ON deliveries (organization_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agents_org_team         ON agents (organization_id, team_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id          ON agents (user_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_phone     ON customers (organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_profiles_org_role       ON profiles (organization_id, role);
CREATE INDEX IF NOT EXISTS idx_collections_org_status  ON collections (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_team_managers_manager   ON team_managers (manager_id);

-- --------------------------------------------------------------------
-- 10. Row Level Security: same as other tables (backend uses the service-role key)
-- --------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;

COMMIT;
