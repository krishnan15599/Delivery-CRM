-- ====================================================================
-- Delivery CRM - PWA Push Subscriptions & In-App Notifications (07_notifications_and_push.sql)
-- ====================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_org_id ON push_subscriptions(organization_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(64) DEFAULT 'delivery_assigned',
  delivery_id TEXT,
  tracking_number VARCHAR(100),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(organization_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
