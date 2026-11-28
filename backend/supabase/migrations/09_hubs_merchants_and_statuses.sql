-- ====================================================================
-- Delivery CRM - Hubs (Teams), Merchants, API Keys & Courier Statuses
-- (09_hubs_merchants_and_statuses.sql)
--
-- Design:
--   * `teams` (from 04_multi_tenancy.sql) ARE the Hubs.
--     Each Hub has Managers (`team_managers`), Agents (`agents.team_id`),
--     and Deliveries (`deliveries.team_id`).
--   * Adds `code`, `pincode`, `phone` onto `teams`.
--   * Adds `merchants` (e-commerce shops) & `api_keys` (hashed keys).
--   * Adds `merchant_id`, `external_order_id`, `received_at_hub_at` to `deliveries`.
--   * Updates delivery statuses to the full courier workflow:
--     Order Created -> Received at Hub -> Ready for Dispatch ->
--     Assigned -> Picked Up -> Out for Delivery ->
--     Delivered / Failed -> Returned to Hub -> Returned to Merchant
-- ====================================================================

BEGIN;

-- 1. EXTEND TEAMS (HUBS) -------------------------------------------------
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- 2. MERCHANTS TABLE -----------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  pickup_address TEXT NOT NULL,
  city VARCHAR(100) DEFAULT 'Chennai',
  pincode VARCHAR(20),
  default_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  webhook_url TEXT,
  status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_org_id ON merchants(organization_id);

-- 3. API KEYS TABLE (hashed keys only) -----------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL DEFAULT 'Default Key',
  key_prefix VARCHAR(16) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_merchant_id ON api_keys(merchant_id);

-- Lock down direct public/anon access (backend uses service_role key)
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 4. LINK DELIVERIES TO MERCHANTS & HUB ARRIVAL --------------------------
ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_order_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS received_at_hub_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_deliveries_merchant_id ON deliveries(merchant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_ext_order
  ON deliveries(organization_id, merchant_id, external_order_id)
  WHERE external_order_id IS NOT NULL;

-- 5. MIGRATE DELIVERY STATUSES TO COURIER WORKFLOW -----------------------
DO $$
BEGIN
  ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_status_check;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

UPDATE deliveries SET status = 'Order Created'    WHERE status = 'Pending';
UPDATE deliveries SET status = 'Out for Delivery' WHERE status = 'In Transit';
UPDATE deliveries SET status = 'Returned to Hub'  WHERE status = 'Returned';

ALTER TABLE deliveries
  ALTER COLUMN status SET DEFAULT 'Order Created';

ALTER TABLE deliveries
  ADD CONSTRAINT deliveries_status_check CHECK (
    status IN (
      'Order Created',
      'Received at Hub',
      'Ready for Dispatch',
      'Assigned',
      'Picked Up',
      'Out for Delivery',
      'Delivered',
      'Failed',
      'Returned to Hub',
      'Returned to Merchant'
    )
  );

-- 6. UPDATE TENANT-SCOPED DELIVERY FUNCTIONS -----------------------------

-- 6a. CREATE DELIVERY
CREATE OR REPLACE FUNCTION create_delivery(
  p_organization_id TEXT,
  p_delivery JSONB,
  p_user_id TEXT DEFAULT NULL,
  p_user_name TEXT DEFAULT 'Admin'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_delivery_id TEXT;
  v_tracking_number TEXT;
  v_customer_id TEXT;
  v_agent_id TEXT;
  v_team_id TEXT;
  v_merchant_id TEXT;
  v_external_order_id TEXT;
  v_agent_name TEXT := NULL;
  v_agent_phone TEXT := NULL;
  v_agent_team_id TEXT := NULL;
  v_amount NUMERIC(12, 2);
  v_cod_amount NUMERIC(12, 2);
  v_initial_status VARCHAR(50);
  v_payment_status VARCHAR(50);
  v_timeline JSONB;
BEGIN
  IF p_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization id is required' USING ERRCODE = '22023';
  END IF;

  v_delivery_id := COALESCE(p_delivery->>'id', gen_random_uuid()::text);
  v_tracking_number := COALESCE(p_delivery->>'trackingNumber', p_delivery->>'tracking_number');
  v_customer_id := NULLIF(p_delivery->>'customerId', '');
  v_agent_id := NULLIF(p_delivery->>'agentId', '');
  v_team_id := NULLIF(p_delivery->>'teamId', '');
  v_merchant_id := NULLIF(p_delivery->>'merchantId', '');
  v_external_order_id := NULLIF(p_delivery->>'externalOrderId', '');
  v_amount := COALESCE((p_delivery->>'amount')::NUMERIC, 0.00);
  v_cod_amount := COALESCE((p_delivery->>'codAmount')::NUMERIC, v_amount);

  IF v_agent_id IS NOT NULL THEN
    SELECT name, phone, team_id INTO v_agent_name, v_agent_phone, v_agent_team_id
    FROM agents
    WHERE id = v_agent_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Agent with ID % not found', v_agent_id USING ERRCODE = 'P0002';
    END IF;
    v_team_id := v_agent_team_id;
  END IF;

  IF v_team_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM teams WHERE id = v_team_id AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Team/Hub with ID % not found', COALESCE(v_team_id, '(none)') USING ERRCODE = 'P0002';
  END IF;

  IF v_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM customers WHERE id = v_customer_id AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Customer with ID % not found', v_customer_id USING ERRCODE = 'P0002';
  END IF;

  IF v_merchant_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM merchants WHERE id = v_merchant_id AND organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Merchant with ID % not found', v_merchant_id USING ERRCODE = 'P0002';
  END IF;

  v_initial_status := CASE WHEN v_agent_id IS NOT NULL THEN 'Assigned' ELSE 'Order Created' END;
  v_payment_status := COALESCE(p_delivery->>'paymentStatus', CASE WHEN v_cod_amount > 0 THEN 'Pending' ELSE 'Paid' END);

  v_timeline := jsonb_build_array(
    jsonb_build_object(
      'status', 'Order Created',
      'timestamp', v_now_iso,
      'note', CASE WHEN v_merchant_id IS NOT NULL THEN 'Order received from merchant' ELSE 'Delivery order created' END,
      'updatedBy', COALESCE(p_user_name, 'Admin')
    )
  );

  IF v_agent_id IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'status', 'Assigned',
        'timestamp', v_now_iso,
        'note', 'Assigned to ' || v_agent_name,
        'updatedBy', COALESCE(p_user_name, 'Dispatcher')
      )
    );
  END IF;

  INSERT INTO deliveries (
    id, organization_id, team_id, created_by,
    merchant_id, external_order_id,
    tracking_number, customer_id, customer_name, customer_phone,
    pickup_address, delivery_address, city, pincode,
    package_type, item_description, amount, cod_amount,
    agent_id, agent_name, agent_phone,
    status, payment_status, timeline, notes,
    date, scheduled_date, created_at, updated_at
  ) VALUES (
    v_delivery_id, p_organization_id, v_team_id, p_user_id,
    v_merchant_id, v_external_order_id,
    v_tracking_number, v_customer_id, p_delivery->>'customerName', p_delivery->>'customerPhone',
    p_delivery->>'pickupAddress', p_delivery->>'deliveryAddress', COALESCE(p_delivery->>'city', 'Chennai'), p_delivery->>'pincode',
    COALESCE(p_delivery->>'packageType', 'Standard'), p_delivery->>'itemDescription', v_amount, v_cod_amount,
    v_agent_id, v_agent_name, v_agent_phone,
    v_initial_status, v_payment_status, v_timeline, p_delivery->>'notes',
    v_now, COALESCE((p_delivery->>'scheduledDate')::DATE, v_now::DATE), v_now, v_now
  ) RETURNING * INTO v_delivery;

  IF v_cod_amount > 0 THEN
    INSERT INTO collections (
      id, organization_id, team_id, delivery_id, tracking_number, customer_name,
      agent_id, agent_name, amount, payment_mode, status, created_at
    ) VALUES (
      gen_random_uuid()::text, p_organization_id, v_team_id, v_delivery_id, v_tracking_number, p_delivery->>'customerName',
      v_agent_id, v_agent_name, v_cod_amount, 'Cash', 'Pending', v_now
    );
  END IF;

  IF v_agent_id IS NOT NULL THEN
    UPDATE agents
    SET assigned_deliveries_count = assigned_deliveries_count + 1,
        updated_at = v_now
    WHERE id = v_agent_id AND organization_id = p_organization_id;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_orders = total_orders + 1,
        updated_at = v_now
    WHERE id = v_customer_id AND organization_id = p_organization_id;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;

-- 6b. STATUS TRANSITION
CREATE OR REPLACE FUNCTION update_delivery_status(
  p_organization_id TEXT,
  p_delivery_id TEXT,
  p_new_status TEXT,
  p_note TEXT DEFAULT NULL,
  p_updated_by TEXT DEFAULT 'System'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
  v_old_status VARCHAR(50);
  v_timeline_entry JSONB;
  v_new_timeline JSONB;
  v_cod_amount NUMERIC(12, 2);
  v_amount NUMERIC(12, 2);
  v_new_payment_status VARCHAR(50);
  v_valid_transition BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT * INTO v_delivery
  FROM deliveries
  WHERE id = p_delivery_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery with ID % not found', p_delivery_id USING ERRCODE = 'P0002';
  END IF;

  v_old_status := v_delivery.status;

  IF v_old_status = p_new_status THEN
    RETURN to_jsonb(v_delivery);
  END IF;

  IF v_old_status IN ('Delivered', 'Returned to Merchant') THEN
    RAISE EXCEPTION 'Cannot modify status of a delivery that is already % (ID %)', v_old_status, p_delivery_id
      USING ERRCODE = '22000';
  END IF;

  IF p_new_status IN ('Assigned', 'Picked Up', 'Out for Delivery', 'Delivered') AND v_delivery.agent_id IS NULL THEN
    RAISE EXCEPTION 'Cannot transition delivery % to % without an assigned agent', p_delivery_id, p_new_status
      USING ERRCODE = '22023';
  END IF;

  v_valid_transition := CASE
    WHEN v_old_status = 'Order Created'      AND p_new_status IN ('Received at Hub', 'Ready for Dispatch', 'Assigned', 'Failed') THEN TRUE
    WHEN v_old_status = 'Received at Hub'    AND p_new_status IN ('Ready for Dispatch', 'Assigned', 'Returned to Merchant', 'Failed') THEN TRUE
    WHEN v_old_status = 'Ready for Dispatch' AND p_new_status IN ('Assigned', 'Received at Hub', 'Failed') THEN TRUE
    WHEN v_old_status = 'Assigned'           AND p_new_status IN ('Picked Up', 'Out for Delivery', 'Ready for Dispatch', 'Order Created', 'Failed') THEN TRUE
    WHEN v_old_status = 'Picked Up'          AND p_new_status IN ('Out for Delivery', 'Delivered', 'Failed', 'Returned to Hub') THEN TRUE
    WHEN v_old_status = 'Out for Delivery'   AND p_new_status IN ('Delivered', 'Failed', 'Returned to Hub') THEN TRUE
    WHEN v_old_status = 'Failed'             AND p_new_status IN ('Ready for Dispatch', 'Assigned', 'Returned to Hub') THEN TRUE
    WHEN v_old_status = 'Returned to Hub'    AND p_new_status IN ('Ready for Dispatch', 'Assigned', 'Returned to Merchant') THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid delivery status transition from % to % (ID %)', v_old_status, p_new_status, p_delivery_id
      USING ERRCODE = '22023';
  END IF;

  v_cod_amount := COALESCE(v_delivery.cod_amount, 0.00);
  v_amount := COALESCE(v_delivery.amount, 0.00);
  v_new_payment_status := v_delivery.payment_status;

  IF p_new_status = 'Delivered' THEN
    v_new_payment_status := 'Paid';
  END IF;

  v_timeline_entry := jsonb_build_object(
    'status', p_new_status,
    'timestamp', v_now_iso,
    'note', COALESCE(p_note, 'Status changed to ' || p_new_status),
    'updatedBy', COALESCE(p_updated_by, 'System')
  );
  v_new_timeline := COALESCE(v_delivery.timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry);

  UPDATE deliveries
  SET status = p_new_status,
      payment_status = v_new_payment_status,
      timeline = v_new_timeline,
      received_at_hub_at = CASE
        WHEN p_new_status = 'Received at Hub' AND received_at_hub_at IS NULL THEN v_now
        ELSE received_at_hub_at
      END,
      updated_at = v_now
  WHERE id = p_delivery_id AND organization_id = p_organization_id
  RETURNING * INTO v_delivery;

  IF p_new_status = 'Delivered' THEN
    IF v_cod_amount > 0 THEN
      UPDATE collections
      SET status = 'Collected',
          collected_at = v_now
      WHERE delivery_id = p_delivery_id AND organization_id = p_organization_id;
    END IF;

    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET completed_deliveries_count = completed_deliveries_count + 1,
          assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          pending_cash_amount = pending_cash_amount + v_cod_amount,
          updated_at = v_now
      WHERE id = v_delivery.agent_id AND organization_id = p_organization_id;
    END IF;

    IF v_delivery.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_spent = total_spent + v_amount,
          updated_at = v_now
      WHERE id = v_delivery.customer_id AND organization_id = p_organization_id;
    END IF;

  ELSIF p_new_status IN ('Failed', 'Returned to Hub') THEN
    IF v_old_status NOT IN ('Failed', 'Returned to Hub') AND v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET failed_deliveries_count = failed_deliveries_count + 1,
          assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          updated_at = v_now
      WHERE id = v_delivery.agent_id AND organization_id = p_organization_id;
    END IF;

  ELSIF v_old_status IN ('Failed', 'Returned to Hub') AND p_new_status = 'Assigned' THEN
    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET failed_deliveries_count = CASE
            WHEN v_old_status = 'Failed' THEN GREATEST(0, failed_deliveries_count - 1)
            ELSE failed_deliveries_count
          END,
          assigned_deliveries_count = assigned_deliveries_count + 1,
          updated_at = v_now
      WHERE id = v_delivery.agent_id AND organization_id = p_organization_id;
    END IF;

  ELSIF v_old_status = 'Assigned' AND p_new_status IN ('Order Created', 'Ready for Dispatch') THEN
    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          updated_at = v_now
      WHERE id = v_delivery.agent_id AND organization_id = p_organization_id;
    END IF;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;

-- 6c. BULK ASSIGN
CREATE OR REPLACE FUNCTION bulk_assign_deliveries(
  p_organization_id TEXT,
  p_delivery_ids TEXT[],
  p_agent_id TEXT,
  p_updated_by TEXT DEFAULT 'Dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_agent agents%ROWTYPE;
  v_del_id TEXT;
  v_del deliveries%ROWTYPE;
  v_timeline_entry JSONB;
  v_assigned_count INT := 0;
  v_skipped TEXT[] := ARRAY[]::TEXT[];
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT * INTO v_agent
  FROM agents
  WHERE id = p_agent_id AND organization_id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent with ID % not found', p_agent_id USING ERRCODE = 'P0002';
  END IF;

  FOREACH v_del_id IN ARRAY p_delivery_ids
  LOOP
    SELECT * INTO v_del
    FROM deliveries
    WHERE id = v_del_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND OR v_del.status NOT IN ('Order Created', 'Received at Hub', 'Ready for Dispatch', 'Assigned', 'Failed', 'Returned to Hub') THEN
      v_skipped := array_append(v_skipped, v_del_id);
      CONTINUE;
    END IF;

    IF v_del.agent_id = p_agent_id AND v_del.status = 'Assigned' THEN
      CONTINUE;
    END IF;

    IF v_del.agent_id IS NOT NULL AND v_del.agent_id <> p_agent_id THEN
      IF v_del.status = 'Assigned' THEN
        UPDATE agents
        SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_del.agent_id AND organization_id = p_organization_id;
      ELSIF v_del.status = 'Failed' THEN
        UPDATE agents
        SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_del.agent_id AND organization_id = p_organization_id;
      END IF;
    END IF;

    v_assigned_count := v_assigned_count + 1;

    v_timeline_entry := jsonb_build_object(
      'status', 'Assigned',
      'timestamp', v_now_iso,
      'note', 'Assigned to ' || v_agent.name,
      'updatedBy', p_updated_by
    );

    UPDATE deliveries
    SET agent_id = v_agent.id,
        agent_name = v_agent.name,
        agent_phone = v_agent.phone,
        team_id = v_agent.team_id,
        status = 'Assigned',
        timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
        updated_at = v_now
    WHERE id = v_del_id AND organization_id = p_organization_id;

    UPDATE collections
    SET agent_id = v_agent.id,
        agent_name = v_agent.name,
        team_id = v_agent.team_id
    WHERE delivery_id = v_del_id AND organization_id = p_organization_id;
  END LOOP;

  IF v_assigned_count > 0 THEN
    UPDATE agents
    SET assigned_deliveries_count = assigned_deliveries_count + v_assigned_count,
        updated_at = v_now
    WHERE id = p_agent_id AND organization_id = p_organization_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignedCount', v_assigned_count,
    'skippedIds', to_jsonb(v_skipped),
    'agentId', p_agent_id,
    'agentName', v_agent.name
  );
END;
$$;

-- 6d. SINGLE DELIVERY REASSIGNMENT
CREATE OR REPLACE FUNCTION reassign_delivery_agent(
  p_organization_id TEXT,
  p_delivery_id TEXT,
  p_new_agent_id TEXT,
  p_updated_by TEXT DEFAULT 'Dispatcher'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_delivery deliveries%ROWTYPE;
  v_new_agent agents%ROWTYPE;
  v_old_agent_id TEXT;
  v_fallback_status VARCHAR(50);
  v_timeline_entry JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  SELECT * INTO v_delivery
  FROM deliveries
  WHERE id = p_delivery_id AND organization_id = p_organization_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery with ID % not found', p_delivery_id USING ERRCODE = 'P0002';
  END IF;

  IF v_delivery.status IN ('Delivered', 'Returned to Merchant') THEN
    RAISE EXCEPTION 'Cannot reassign a delivery that is already % (ID %)', v_delivery.status, p_delivery_id
      USING ERRCODE = '22000';
  END IF;

  v_old_agent_id := v_delivery.agent_id;

  IF p_new_agent_id IS NOT NULL THEN
    IF v_old_agent_id = p_new_agent_id THEN
      RETURN to_jsonb(v_delivery);
    END IF;

    SELECT * INTO v_new_agent
    FROM agents
    WHERE id = p_new_agent_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Agent with ID % not found', p_new_agent_id USING ERRCODE = 'P0002';
    END IF;

    IF v_old_agent_id IS NOT NULL THEN
      IF v_delivery.status IN ('Assigned', 'Picked Up', 'Out for Delivery') THEN
        UPDATE agents
        SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id AND organization_id = p_organization_id;
      ELSIF v_delivery.status = 'Failed' THEN
        UPDATE agents
        SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id AND organization_id = p_organization_id;
      END IF;
    END IF;

    IF v_delivery.status IN ('Order Created', 'Received at Hub', 'Ready for Dispatch', 'Assigned', 'Picked Up', 'Out for Delivery') THEN
      UPDATE agents
      SET assigned_deliveries_count = assigned_deliveries_count + 1,
          updated_at = v_now
      WHERE id = p_new_agent_id AND organization_id = p_organization_id;
    END IF;

    v_timeline_entry := jsonb_build_object(
      'status', CASE WHEN v_delivery.status IN ('Order Created', 'Received at Hub', 'Ready for Dispatch') THEN 'Assigned' ELSE v_delivery.status END,
      'timestamp', v_now_iso,
      'note', 'Reassigned to ' || v_new_agent.name,
      'updatedBy', p_updated_by
    );

    UPDATE deliveries
    SET agent_id = v_new_agent.id,
        agent_name = v_new_agent.name,
        agent_phone = v_new_agent.phone,
        team_id = v_new_agent.team_id,
        status = CASE WHEN status IN ('Order Created', 'Received at Hub', 'Ready for Dispatch') THEN 'Assigned' ELSE status END,
        timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
        updated_at = v_now
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    RETURNING * INTO v_delivery;

    UPDATE collections
    SET agent_id = v_new_agent.id,
        agent_name = v_new_agent.name,
        team_id = v_new_agent.team_id
    WHERE delivery_id = p_delivery_id AND organization_id = p_organization_id;

  ELSE
    IF v_delivery.status IN ('Picked Up', 'Out for Delivery') THEN
      RAISE EXCEPTION 'Cannot unassign an in-flight delivery in % status (ID %)', v_delivery.status, p_delivery_id
        USING ERRCODE = '22023';
    END IF;

    IF v_old_agent_id IS NOT NULL THEN
      IF v_delivery.status = 'Assigned' THEN
        UPDATE agents
        SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id AND organization_id = p_organization_id;
      ELSIF v_delivery.status = 'Failed' THEN
        UPDATE agents
        SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id AND organization_id = p_organization_id;
      END IF;
    END IF;

    v_fallback_status := CASE
      WHEN v_delivery.received_at_hub_at IS NOT NULL THEN 'Ready for Dispatch'
      ELSE 'Order Created'
    END;

    v_timeline_entry := jsonb_build_object(
      'status', v_fallback_status,
      'timestamp', v_now_iso,
      'note', 'Agent unassigned; reverted to ' || v_fallback_status,
      'updatedBy', p_updated_by
    );

    UPDATE deliveries
    SET agent_id = NULL,
        agent_name = NULL,
        agent_phone = NULL,
        status = CASE WHEN status = 'Assigned' THEN v_fallback_status ELSE status END,
        timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
        updated_at = v_now
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    RETURNING * INTO v_delivery;

    UPDATE collections
    SET agent_id = NULL,
        agent_name = NULL
    WHERE delivery_id = p_delivery_id AND organization_id = p_organization_id;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;

-- 6e. AGENT TEAM MOVE TRIGGER
CREATE OR REPLACE FUNCTION move_active_work_with_agent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
    UPDATE deliveries
    SET team_id = NEW.team_id,
        updated_at = NOW()
    WHERE organization_id = NEW.organization_id
      AND agent_id = NEW.id
      AND status IN ('Assigned', 'Picked Up', 'Out for Delivery', 'Failed');

    UPDATE collections
    SET team_id = NEW.team_id
    WHERE organization_id = NEW.organization_id
      AND agent_id = NEW.id
      AND status IN ('Pending', 'Collected');
  END IF;
  RETURN NEW;
END;
$$;

-- Re-assert service_role permissions
REVOKE ALL ON FUNCTION create_delivery(TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION update_delivery_status(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bulk_assign_deliveries(TEXT, TEXT[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reassign_delivery_agent(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_delivery(TEXT, JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_delivery_status(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION bulk_assign_deliveries(TEXT, TEXT[], TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reassign_delivery_agent(TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;
