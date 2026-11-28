-- ====================================================================
-- Delivery CRM - Delivery-Linked Chat & Option B Tracking Token (08_delivery_chat.sql)
-- ====================================================================
-- Rules:
--   1. Customers do not log in; they access delivery status & chat via
--      an unguessable tracking_token on deliveries (Option B).
--   2. Every customer chat is linked to a delivery_id + organization_id + team_id.
--   3. Agent <-> Customer chat is only active while delivery is in
--      ('Assigned', 'Picked Up', 'In Transit'). After that it is read-only for Agent.
--   4. Admin / Manager can chat with Customers (support/complaints) and staff.
--   5. Agent <-> Agent direct chat is disallowed.
-- ====================================================================

BEGIN;

-- 1. Add unguessable tracking_token to deliveries for Option B public tracking links
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS tracking_token TEXT;

UPDATE deliveries
SET tracking_token = encode(gen_random_bytes(24), 'hex')
WHERE tracking_token IS NULL;

ALTER TABLE deliveries
  ALTER COLUMN tracking_token SET DEFAULT encode(gen_random_bytes(24), 'hex');

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_tracking_token
  ON deliveries(tracking_token);

-- 2. Evolve conversations table for multi-tenancy & delivery-linked chat
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_id TEXT REFERENCES deliveries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(32) NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS staff_user_a TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS staff_user_b TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS last_message_role VARCHAR(20),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
  ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
    CHECK (conversation_type IN ('delivery', 'direct_staff'));

  ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
  ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
    CHECK (status IN ('open', 'closed'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- One delivery conversation per delivery
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_delivery_unique
  ON conversations(delivery_id)
  WHERE delivery_id IS NOT NULL AND conversation_type = 'delivery';

CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_id ON conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 3. Evolve chat_messages table for delivery context, visibility & read tracking
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS delivery_id TEXT REFERENCES deliveries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sender_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS read_by_staff BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS read_by_customer BOOLEAN DEFAULT FALSE;

UPDATE chat_messages
SET sender_type = COALESCE(sender_type, sender_role, 'admin')
WHERE sender_type IS NULL;

DO $$
BEGIN
  ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_role_check;
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_role_check
    CHECK (sender_role IN ('admin', 'manager', 'agent', 'customer'));

  ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_type_check
    CHECK (sender_type IN ('admin', 'manager', 'agent', 'customer'));

  ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_visibility_check;
  ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_visibility_check
    CHECK (visibility IN ('public', 'staff_only'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_org_id
  ON chat_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivery_id
  ON chat_messages(delivery_id);

-- 4. Keep RLS enabled (backend uses service_role key; anon key has no access)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

COMMIT;
