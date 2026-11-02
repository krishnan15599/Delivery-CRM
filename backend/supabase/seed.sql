-- ====================================================================
-- Delivery CRM - Seed Data (supabase/seed.sql)
-- Consistent capitalized Payment Status & ISO-8601 Timestamps
-- ====================================================================

-- Profiles / Admin Users
INSERT INTO profiles (id, name, email, role, phone, avatar_url)
VALUES
  ('USR-001', 'Krishnan K.', 'admin@deliverycrm.in', 'Admin', '+91 98450 12345', NULL),
  ('USR-002', 'Sarah Jenkins', 'manager@deliverycrm.in', 'Manager', '+91 98765 43210', NULL),
  ('USR-003', 'Rahul Sharma', 'agent@deliverycrm.in', 'Agent', '+91 98111 22334', NULL)
ON CONFLICT (id) DO NOTHING;

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

-- Deliveries (standardized 'Pending'/'Paid', ISO timestamps in timeline)
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
    'Pending',
    '2026-10-07T08:30:00Z',
    '2026-10-07',
    '[{"status": "Pending", "timestamp": "2026-10-07T08:30:00.000Z", "note": "Order placed by customer"}, {"status": "Assigned", "timestamp": "2026-10-07T09:15:00.000Z", "note": "Assigned to Ramesh Kumar"}, {"status": "Picked Up", "timestamp": "2026-10-07T10:30:00.000Z", "note": "Picked up from Warehouse A"}, {"status": "In Transit", "timestamp": "2026-10-07T11:45:00.000Z", "note": "Out for delivery"}]'::jsonb,
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
    'Paid',
    '2026-10-06T09:00:00Z',
    '2026-10-06',
    '[{"status": "Pending", "timestamp": "2026-10-06T09:00:00.000Z", "note": "Created"}, {"status": "Assigned", "timestamp": "2026-10-06T10:00:00.000Z", "note": "Assigned to Arun"}, {"status": "Picked Up", "timestamp": "2026-10-06T11:30:00.000Z", "note": "Picked up"}, {"status": "In Transit", "timestamp": "2026-10-06T13:10:00.000Z", "note": "Out for delivery"}, {"status": "Delivered", "timestamp": "2026-10-06T15:20:00.000Z", "note": "Delivered and cash collected"}]'::jsonb,
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
    'Paid',
    '2026-10-07T07:15:00Z',
    '2026-10-07',
    '[{"status": "Pending", "timestamp": "2026-10-07T07:15:00.000Z", "note": "Created"}, {"status": "Assigned", "timestamp": "2026-10-07T08:30:00.000Z", "note": "Assigned to David"}, {"status": "Picked Up", "timestamp": "2026-10-07T10:00:00.000Z", "note": "Picked up from Kurla Hub"}]'::jsonb,
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

