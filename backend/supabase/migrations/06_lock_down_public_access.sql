-- ====================================================================
-- Delivery CRM - Remove public (anon key) access to all tables
-- (06_lock_down_public_access.sql)
--
-- The backend talks to the database with the SERVICE ROLE key, which
-- bypasses Row Level Security. The browser never talks to the database
-- directly. So no table needs any RLS policy: with RLS ON and NO policies,
-- the public "anon" key can read and write nothing.
--
-- Older databases still had "public full access" policies, which let anyone
-- holding the anon key read and change every business's data.
--
-- !! Run this ONLY AFTER the backend (Render) has SUPABASE_SERVICE_ROLE_KEY set.
--    A backend still using the anon key would see empty tables after this.
--
-- Safe to run more than once.
-- ====================================================================

BEGIN;

-- Drop every policy on the app's tables, whatever it is called
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'organizations', 'teams', 'team_managers',
        'profiles', 'customers', 'agents', 'deliveries',
        'collections', 'conversations', 'chat_messages'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Make sure Row Level Security is ON for every table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

COMMIT;
