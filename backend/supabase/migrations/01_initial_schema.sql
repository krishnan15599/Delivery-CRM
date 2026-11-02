-- ====================================================================
-- Delivery CRM - Database Schema Migration (01_initial_schema.sql)
-- Safe for existing environments (IF NOT EXISTS + ALTER/UPDATE for existing tables)
-- ====================================================================

-- 1. PROFILES / USERS TABLE
-- Lowest role 'Agent' is the default instead of 'Admin'
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'Agent' CHECK (role IN ('Admin', 'Manager', 'Agent')),
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure existing table also defaults to 'Agent'
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'Agent';

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) DEFAULT 'Chennai',
  state VARCHAR(100) DEFAULT 'Tamil Nadu',
  pincode VARCHAR(20),
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(12, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  vehicle_type VARCHAR(50) DEFAULT 'Bike' CHECK (vehicle_type IN ('Bike', 'Scooter', 'Van', 'Truck')),
  vehicle_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On Delivery', 'Off Duty', 'Inactive')),
  hub_location VARCHAR(255) DEFAULT 'Chennai Central Hub',
  assigned_deliveries_count INT DEFAULT 0,
  completed_deliveries_count INT DEFAULT 0,
  failed_deliveries_count INT DEFAULT 0,
  pending_cash_amount NUMERIC(12, 2) DEFAULT 0.00,
  settled_cash_amount NUMERIC(12, 2) DEFAULT 0.00,
  rating NUMERIC(3, 2) DEFAULT 4.80,
  joining_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user_id column exists on existing agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city VARCHAR(100) DEFAULT 'Chennai',
  pincode VARCHAR(20),
  package_type VARCHAR(100) DEFAULT 'Standard',
  item_description TEXT,
  amount NUMERIC(12, 2) DEFAULT 0.00,
  cod_amount NUMERIC(12, 2) DEFAULT 0.00,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  agent_name VARCHAR(255),
  agent_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Failed', 'Returned')),
  payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending', 'Failed')),
  timeline JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix existing payment_status data in case tables already exist
UPDATE deliveries SET payment_status = 'Paid' WHERE payment_status = 'paid';
UPDATE deliveries SET payment_status = 'Pending' WHERE payment_status = 'pending';
UPDATE deliveries SET payment_status = 'Failed' WHERE payment_status = 'failed';

-- Apply strict payment_status check constraint to existing table
DO $$
BEGIN
  ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_payment_status_check;
  ALTER TABLE deliveries ADD CONSTRAINT deliveries_payment_status_check
    CHECK (payment_status IN ('Paid', 'Pending', 'Failed'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 5. COLLECTIONS TABLE
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  delivery_id TEXT REFERENCES deliveries(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100),
  customer_name VARCHAR(255),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  agent_name VARCHAR(255),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_mode VARCHAR(50) DEFAULT 'Cash' CHECK (payment_mode IN ('Cash', 'UPI', 'Card')),
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Collected', 'Settled')),
  collected_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  settled_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONVERSATIONS & CHAT
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participant_id VARCHAR(255) NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_type VARCHAR(50) DEFAULT 'customer' CHECK (participant_type IN ('customer', 'agent')),
  participant_phone VARCHAR(50),
  participant_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  unread_count INT DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  related_delivery_tracking VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) DEFAULT 'admin' CHECK (sender_role IN ('admin', 'customer', 'agent')),
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(agent_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(date);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Remove public/anon policies so anonymous callers cannot bypass the backend API
DROP POLICY IF EXISTS "Public full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Public full access to customers" ON customers;
DROP POLICY IF EXISTS "Public full access to agents" ON agents;
DROP POLICY IF EXISTS "Public full access to deliveries" ON deliveries;
DROP POLICY IF EXISTS "Public full access to collections" ON collections;
DROP POLICY IF EXISTS "Public full access to conversations" ON conversations;
DROP POLICY IF EXISTS "Public full access to chat_messages" ON chat_messages;
