-- ====================================================================
-- Delivery CRM - Database Schema & Seed Data for Supabase (PostgreSQL)
-- Fully aligned with frontend/src/types and frontend/src/services/mockStorage.ts
-- ====================================================================

-- 1. DROP EXISTING TABLES (Clean Slate)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. ENABLE UUID EXTENSION (for automatic ID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. PROFILES / USERS TABLE (matches frontend/src/types/auth.ts)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'Admin' CHECK (role IN ('Admin', 'Manager', 'Agent')),
  phone VARCHAR(50),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS TABLE (matches frontend/src/types/customer.ts)
CREATE TABLE customers (
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

-- 5. AGENTS TABLE (matches frontend/src/types/agent.ts)
CREATE TABLE agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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

-- 6. DELIVERIES TABLE (matches frontend/src/types/delivery.ts)
CREATE TABLE deliveries (
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
  payment_status VARCHAR(50) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending', 'Failed', 'paid', 'pending', 'failed')),
  timeline JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COLLECTIONS (CASH ON DELIVERY & PAYMENTS) (matches frontend/src/types/collection.ts)
CREATE TABLE collections (
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

-- 8. CONVERSATIONS & CHAT (matches frontend/src/types/chat.ts)
CREATE TABLE conversations (
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

CREATE TABLE chat_messages (
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

-- ====================================================================
-- 9. SEED DATA DIRECTLY FROM FRONTEND mockStorage.ts
-- ====================================================================

-- Customers
INSERT INTO customers (id, name, email, phone, address, city, state, pincode, total_orders, total_spent, status)
VALUES
  ('CUST-001', 'Krishnan K.', 'krishnan@example.com', '+91 98450 12345', '42, 100ft Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 14, 18450.00, 'Active'),
  ('CUST-002', 'Ananya Sharma', 'ananya.sharma@example.com', '+91 98201 45678', 'Flat 402, Green Glen Layout, Bellandur', 'Bengaluru', 'Karnataka', '560103', 8, 9200.00, 'Active'),
  ('CUST-003', 'Rajesh Patel', 'rajesh.patel@example.com', '+91 97123 78901', '15, Nariman Point, Marine Drive', 'Mumbai', 'Maharashtra', '400021', 22, 42100.00, 'Active'),
  ('CUST-004', 'Pooja Verma', 'pooja.verma@example.com', '+91 99887 65432', '88, Connaught Place, Block B', 'New Delhi', 'Delhi', '110001', 5, 4850.00, 'Active'),
  ('CUST-005', 'Vikram Singh', 'vikram.singh@example.com', '+91 94140 11223', 'Plot 7, Banjara Hills Road No. 12', 'Hyderabad', 'Telangana', '500034', 11, 16700.00, 'Active')
ON CONFLICT (id) DO NOTHING;

-- Agents
INSERT INTO agents (id, name, phone, email, vehicle_type, vehicle_number, status, hub_location, assigned_deliveries_count, completed_deliveries_count, failed_deliveries_count, pending_cash_amount, settled_cash_amount, rating, joining_date)
VALUES
  ('AG-101', 'Ramesh Kumar', '+91 98765 11001', 'ramesh.k@deliverycrm.in', 'Bike', 'KA-01-EQ-4421', 'On Delivery', 'Indiranagar Hub', 4, 182, 6, 4350.00, 189000.00, 4.80, '2025-11-10'),
  ('AG-102', 'Arun Thomas', '+91 98765 11002', 'arun.t@deliverycrm.in', 'Scooter', 'KA-03-MR-9820', 'On Delivery', 'Indiranagar Hub', 3, 145, 4, 2600.00, 142000.00, 4.90, '2026-01-15'),
  ('AG-103', 'David Wilson', '+91 98765 11003', 'david.w@deliverycrm.in', 'Van', 'KA-05-AB-1299', 'Active', 'Koramangala Hub', 2, 210, 9, 1800.00, 245000.00, 4.70, '2025-08-01')
ON CONFLICT (id) DO NOTHING;

-- Deliveries
INSERT INTO deliveries (id, tracking_number, customer_id, customer_name, customer_phone, pickup_address, delivery_address, city, pincode, package_type, item_description, amount, cod_amount, agent_id, agent_name, agent_phone, status, payment_status, date, scheduled_date, timeline, notes)
VALUES
  (
    'DEL-9001',
    'TRK-9001',
    'CUST-001',
    'Krishnan K.',
    '+91 98450 12345',
    'Warehouse A, Electronic City, Bengaluru',
    '42, 100ft Road, Indiranagar, Bengaluru',
    'Bengaluru',
    '560038',
    'Electronics',
    'Wireless Noise Cancelling Headphones',
    1450.00,
    1450.00,
    'AG-101',
    'Ramesh Kumar',
    '+91 98765 11001',
    'In Transit',
    'pending',
    '2026-10-07T08:30:00Z',
    '2026-10-07',
    '[{"status": "Pending", "timestamp": "2026-10-07 08:30 AM", "note": "Order placed by customer"}, {"status": "Assigned", "timestamp": "2026-10-07 09:15 AM", "note": "Assigned to Ramesh Kumar"}, {"status": "Picked Up", "timestamp": "2026-10-07 10:30 AM", "note": "Picked up from Warehouse A"}, {"status": "In Transit", "timestamp": "2026-10-07 11:45 AM", "note": "Out for delivery"}]'::jsonb,
    'Call customer before arrival'
  ),
  (
    'DEL-9002',
    'TRK-9002',
    'CUST-002',
    'Ananya Sharma',
    '+91 98201 45678',
    'Hub B, Outer Ring Road, Bengaluru',
    'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    'Bengaluru',
    '560103',
    'Apparel',
    'Cotton Designer Kurti & Dupatta Set',
    820.00,
    820.00,
    'AG-102',
    'Arun Thomas',
    '+91 98765 11002',
    'Delivered',
    'paid',
    '2026-10-06T09:00:00Z',
    '2026-10-06',
    '[{"status": "Pending", "timestamp": "2026-10-06 09:00 AM", "note": "Created"}, {"status": "Assigned", "timestamp": "2026-10-06 10:00 AM", "note": "Assigned to Arun"}, {"status": "Picked Up", "timestamp": "2026-10-06 11:30 AM", "note": "Picked up"}, {"status": "In Transit", "timestamp": "2026-10-06 01:10 PM", "note": "Out for delivery"}, {"status": "Delivered", "timestamp": "2026-10-06 03:20 PM", "note": "Delivered and cash collected"}]'::jsonb,
    NULL
  ),
  (
    'DEL-9003',
    'TRK-9003',
    'CUST-003',
    'Rajesh Patel',
    '+91 97123 78901',
    'Central Hub, Kurla West, Mumbai',
    '15, Nariman Point, Marine Drive, Mumbai',
    'Mumbai',
    '400021',
    'Documents',
    'Confidential Legal Documents Folder',
    3200.00,
    0.00,
    'AG-103',
    'David Wilson',
    '+91 98765 11003',
    'Picked Up',
    'paid',
    '2026-10-07T07:15:00Z',
    '2026-10-07',
    '[{"status": "Pending", "timestamp": "2026-10-07 07:15 AM", "note": "Created"}, {"status": "Assigned", "timestamp": "2026-10-07 08:30 AM", "note": "Assigned to David"}, {"status": "Picked Up", "timestamp": "2026-10-07 10:00 AM", "note": "Picked up from Kurla Hub"}]'::jsonb,
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- Collections
INSERT INTO collections (id, delivery_id, tracking_number, customer_name, agent_id, agent_name, amount, payment_mode, status, collected_at, notes)
VALUES
  ('COL-101', 'DEL-9001', 'TRK-9001', 'Krishnan K.', 'AG-101', 'Ramesh Kumar', 1450.00, 'Cash', 'Pending', NULL, 'Cash collection pending on delivery'),
  ('COL-102', 'DEL-9002', 'TRK-9002', 'Ananya Sharma', 'AG-102', 'Arun Thomas', 820.00, 'Cash', 'Collected', '2026-10-06T15:20:00Z', 'Collected by Arun at door step')
ON CONFLICT (id) DO NOTHING;

-- Conversations
INSERT INTO conversations (id, participant_id, participant_name, participant_type, participant_phone, last_message, last_message_time, unread_count, is_online, related_delivery_tracking)
VALUES
  ('CONV-001', 'CUST-001', 'Krishnan K.', 'customer', '+91 98450 12345', 'Will the package arrive before 2 PM?', NOW(), 1, true, 'TRK-9001'),
  ('CONV-002', 'AG-101', 'Ramesh Kumar (Agent)', 'agent', '+91 98765 11001', 'Reached Indiranagar 100ft road. Customer notified.', NOW(), 0, true, 'TRK-9001')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 10. ROW LEVEL SECURITY (RLS) & FULL PERMISSIONS
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to deliveries" ON deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to collections" ON collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
