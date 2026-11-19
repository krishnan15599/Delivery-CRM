-- ====================================================================
-- Delivery CRM - Database Schema Migration (03_auth_user_link.sql)
-- Add auth_user_id UUID UNIQUE (nullable) to profiles
-- ====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN auth_user_id UUID UNIQUE;
  END IF;
END $$;
