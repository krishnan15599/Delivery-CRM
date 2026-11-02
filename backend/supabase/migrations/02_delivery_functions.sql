-- ====================================================================
-- Delivery CRM - Database Functions for Atomic Transitions & Counters
-- (02_delivery_functions.sql)
--
-- Restricted to backend service_role only (no public/anon execution).
-- ====================================================================

-- 1. ATOMIC CREATE DELIVERY FUNCTION
CREATE OR REPLACE FUNCTION create_delivery(
  p_delivery JSONB,
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
  v_agent_name TEXT := NULL;
  v_agent_phone TEXT := NULL;
  v_amount NUMERIC(12, 2);
  v_cod_amount NUMERIC(12, 2);
  v_initial_status VARCHAR(50);
  v_payment_status VARCHAR(50);
  v_timeline JSONB;
BEGIN
  v_delivery_id := COALESCE(p_delivery->>'id', gen_random_uuid()::text);
  v_tracking_number := COALESCE(p_delivery->>'trackingNumber', p_delivery->>'tracking_number');
  v_customer_id := p_delivery->>'customerId';
  v_agent_id := p_delivery->>'agentId';
  v_amount := COALESCE((p_delivery->>'amount')::NUMERIC, 0.00);
  v_cod_amount := COALESCE((p_delivery->>'codAmount')::NUMERIC, v_amount);

  -- Verify agent if provided
  IF v_agent_id IS NOT NULL THEN
    SELECT name, phone INTO v_agent_name, v_agent_phone
    FROM agents
    WHERE id = v_agent_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Agent with ID % not found', v_agent_id USING ERRCODE = 'P0002';
    END IF;
  END IF;

  v_initial_status := CASE WHEN v_agent_id IS NOT NULL THEN 'Assigned' ELSE 'Pending' END;
  v_payment_status := COALESCE(p_delivery->>'paymentStatus', CASE WHEN v_cod_amount > 0 THEN 'Pending' ELSE 'Paid' END);

  -- Build initial timeline
  v_timeline := jsonb_build_array(
    jsonb_build_object(
      'status', 'Pending',
      'timestamp', v_now_iso,
      'note', 'Delivery order created',
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

  -- 1. Insert Delivery record
  INSERT INTO deliveries (
    id,
    tracking_number,
    customer_id,
    customer_name,
    customer_phone,
    pickup_address,
    delivery_address,
    city,
    pincode,
    package_type,
    item_description,
    amount,
    cod_amount,
    agent_id,
    agent_name,
    agent_phone,
    status,
    payment_status,
    timeline,
    notes,
    date,
    scheduled_date,
    created_at,
    updated_at
  ) VALUES (
    v_delivery_id,
    v_tracking_number,
    v_customer_id,
    p_delivery->>'customerName',
    p_delivery->>'customerPhone',
    p_delivery->>'pickupAddress',
    p_delivery->>'deliveryAddress',
    COALESCE(p_delivery->>'city', 'Chennai'),
    p_delivery->>'pincode',
    COALESCE(p_delivery->>'packageType', 'Standard'),
    p_delivery->>'itemDescription',
    v_amount,
    v_cod_amount,
    v_agent_id,
    v_agent_name,
    v_agent_phone,
    v_initial_status,
    v_payment_status,
    v_timeline,
    p_delivery->>'notes',
    v_now,
    COALESCE((p_delivery->>'scheduledDate')::DATE, v_now::DATE),
    v_now,
    v_now
  ) RETURNING * INTO v_delivery;

  -- 2. Insert COD Collection if applicable (atomic rollback if fails)
  IF v_cod_amount > 0 THEN
    INSERT INTO collections (
      id,
      delivery_id,
      tracking_number,
      customer_name,
      agent_id,
      agent_name,
      amount,
      payment_mode,
      status,
      created_at
    ) VALUES (
      gen_random_uuid()::text,
      v_delivery_id,
      v_tracking_number,
      p_delivery->>'customerName',
      v_agent_id,
      v_agent_name,
      v_cod_amount,
      'Cash',
      'Pending',
      v_now
    );
  END IF;

  -- 3. Atomic counter updates
  IF v_agent_id IS NOT NULL THEN
    UPDATE agents
    SET assigned_deliveries_count = assigned_deliveries_count + 1,
        updated_at = v_now
    WHERE id = v_agent_id;
  END IF;

  IF v_customer_id IS NOT NULL THEN
    UPDATE customers
    SET total_orders = total_orders + 1,
        updated_at = v_now
    WHERE id = v_customer_id;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;


-- 2. ATOMIC STATUS TRANSITION & COUNTER UPDATE FUNCTION
CREATE OR REPLACE FUNCTION update_delivery_status(
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
  -- 1. Fetch and row-lock the delivery
  SELECT * INTO v_delivery
  FROM deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery with ID % not found', p_delivery_id USING ERRCODE = 'P0002';
  END IF;

  -- Capture old status BEFORE any update (to avoid reading mutated row state)
  v_old_status := v_delivery.status;

  -- 2. Idempotency: no-op if status is unchanged
  IF v_old_status = p_new_status THEN
    RETURN to_jsonb(v_delivery);
  END IF;

  -- 3. Explicit state transition validation table
  -- Terminal statuses (Delivered, Returned) cannot transition to any other status
  IF v_old_status IN ('Delivered', 'Returned') THEN
    RAISE EXCEPTION 'Cannot modify status of a delivery that is already % (ID %)', v_old_status, p_delivery_id
      USING ERRCODE = '22000';
  END IF;

  -- A delivery cannot transition to active/terminal fulfillment statuses without an assigned agent
  IF p_new_status IN ('Assigned', 'Picked Up', 'In Transit', 'Delivered') AND v_delivery.agent_id IS NULL THEN
    RAISE EXCEPTION 'Cannot transition delivery % to % without an assigned agent', p_delivery_id, p_new_status
      USING ERRCODE = '22023';
  END IF;

  v_valid_transition := CASE
    WHEN v_old_status = 'Pending' AND p_new_status IN ('Assigned', 'Failed') THEN TRUE
    WHEN v_old_status = 'Assigned' AND p_new_status IN ('Picked Up', 'Pending', 'Failed') THEN TRUE
    WHEN v_old_status = 'Picked Up' AND p_new_status IN ('In Transit', 'Failed', 'Returned') THEN TRUE
    WHEN v_old_status = 'In Transit' AND p_new_status IN ('Delivered', 'Failed', 'Returned') THEN TRUE
    WHEN v_old_status = 'Failed' AND p_new_status IN ('Assigned', 'Returned') THEN TRUE
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

  -- 4. Append to timeline
  v_timeline_entry := jsonb_build_object(
    'status', p_new_status,
    'timestamp', v_now_iso,
    'note', COALESCE(p_note, 'Status changed to ' || p_new_status),
    'updatedBy', COALESCE(p_updated_by, 'System')
  );
  v_new_timeline := COALESCE(v_delivery.timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry);

  -- 5. Update delivery record
  UPDATE deliveries
  SET status = p_new_status,
      payment_status = v_new_payment_status,
      timeline = v_new_timeline,
      updated_at = v_now
  WHERE id = p_delivery_id
  RETURNING * INTO v_delivery;

  -- 6. Counter management per transition (using v_old_status)
  IF p_new_status = 'Delivered' THEN
    -- A. Update Collection if COD
    IF v_cod_amount > 0 THEN
      UPDATE collections
      SET status = 'Collected',
          collected_at = v_now
      WHERE delivery_id = p_delivery_id;
    END IF;

    -- B. Update Agent counters & pending cash
    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET completed_deliveries_count = completed_deliveries_count + 1,
          assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          pending_cash_amount = pending_cash_amount + v_cod_amount,
          updated_at = v_now
      WHERE id = v_delivery.agent_id;
    END IF;

    -- C. Update Customer total spent
    IF v_delivery.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_spent = total_spent + v_amount,
          updated_at = v_now
      WHERE id = v_delivery.customer_id;
    END IF;

  ELSIF p_new_status IN ('Failed', 'Returned') THEN
    -- Only update counters if transitioning from an active state (Assigned, Picked Up, In Transit)
    -- If already Failed -> Returned, counts were ALREADY adjusted; do not double count!
    IF v_old_status <> 'Failed' AND v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET failed_deliveries_count = failed_deliveries_count + 1,
          assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          updated_at = v_now
      WHERE id = v_delivery.agent_id;
    END IF;

  ELSIF v_old_status = 'Failed' AND p_new_status = 'Assigned' THEN
    -- Re-attempt assignment from Failed status
    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
          assigned_deliveries_count = assigned_deliveries_count + 1,
          updated_at = v_now
      WHERE id = v_delivery.agent_id;
    END IF;

  ELSIF v_old_status = 'Assigned' AND p_new_status = 'Pending' THEN
    -- Unassign delivery
    IF v_delivery.agent_id IS NOT NULL THEN
      UPDATE agents
      SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
          updated_at = v_now
      WHERE id = v_delivery.agent_id;
    END IF;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;


-- 3. ATOMIC BULK ASSIGN FUNCTION
CREATE OR REPLACE FUNCTION bulk_assign_deliveries(
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
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  -- Verify target agent exists
  SELECT * INTO v_agent
  FROM agents
  WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent with ID % not found', p_agent_id USING ERRCODE = 'P0002';
  END IF;

  FOREACH v_del_id IN ARRAY p_delivery_ids
  LOOP
    SELECT * INTO v_del
    FROM deliveries
    WHERE id = v_del_id
    FOR UPDATE;

    IF FOUND THEN
      -- Only assignable/reassignable statuses can be bulk assigned: 'Pending', 'Assigned', 'Failed'
      -- Cannot revert in-flight ('Picked Up', 'In Transit') or terminal ('Delivered', 'Returned') deliveries
      IF v_del.status IN ('Pending', 'Assigned', 'Failed') THEN
        -- If already assigned to the exact same agent and in Assigned status, skip (no-op)
        IF v_del.agent_id = p_agent_id AND v_del.status = 'Assigned' THEN
          CONTINUE;
        END IF;

        -- Adjust old agent's counters if changing agent
        IF v_del.agent_id IS NOT NULL AND v_del.agent_id <> p_agent_id THEN
          IF v_del.status = 'Assigned' THEN
            UPDATE agents
            SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
                updated_at = v_now
            WHERE id = v_del.agent_id;
          ELSIF v_del.status = 'Failed' THEN
            UPDATE agents
            SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
                updated_at = v_now
            WHERE id = v_del.agent_id;
          END IF;
        END IF;

        v_assigned_count := v_assigned_count + 1;

        -- Create timeline entry
        v_timeline_entry := jsonb_build_object(
          'status', 'Assigned',
          'timestamp', v_now_iso,
          'note', 'Assigned to ' || v_agent.name,
          'updatedBy', p_updated_by
        );

        -- Update delivery
        UPDATE deliveries
        SET agent_id = v_agent.id,
            agent_name = v_agent.name,
            agent_phone = v_agent.phone,
            status = 'Assigned',
            timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
            updated_at = v_now
        WHERE id = v_del_id;

        -- Update corresponding collection
        UPDATE collections
        SET agent_id = v_agent.id,
            agent_name = v_agent.name
        WHERE delivery_id = v_del_id;
      END IF;
    END IF;
  END LOOP;

  -- Atomically bump target agent's count by the number of newly assigned deliveries
  IF v_assigned_count > 0 THEN
    UPDATE agents
    SET assigned_deliveries_count = assigned_deliveries_count + v_assigned_count,
        updated_at = v_now
    WHERE id = p_agent_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'assignedCount', v_assigned_count,
    'agentId', p_agent_id,
    'agentName', v_agent.name
  );
END;
$$;


-- 4. ATOMIC SINGLE DELIVERY AGENT REASSIGNMENT FUNCTION
CREATE OR REPLACE FUNCTION reassign_delivery_agent(
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
  v_timeline_entry JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_now_iso TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
  -- 1. Lock and inspect delivery
  SELECT * INTO v_delivery
  FROM deliveries
  WHERE id = p_delivery_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery with ID % not found', p_delivery_id USING ERRCODE = 'P0002';
  END IF;

  -- Terminal deliveries cannot have their agent modified
  IF v_delivery.status IN ('Delivered', 'Returned') THEN
    RAISE EXCEPTION 'Cannot reassign a delivery that is already % (ID %)', v_delivery.status, p_delivery_id
      USING ERRCODE = '22000';
  END IF;

  v_old_agent_id := v_delivery.agent_id;

  -- Case A: Assigning or reassigning to an agent
  IF p_new_agent_id IS NOT NULL THEN
    -- If already assigned to this agent, no-op
    IF v_old_agent_id = p_new_agent_id THEN
      RETURN to_jsonb(v_delivery);
    END IF;

    -- Verify target agent exists and lock
    SELECT * INTO v_new_agent
    FROM agents
    WHERE id = p_new_agent_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Agent with ID % not found', p_new_agent_id USING ERRCODE = 'P0002';
    END IF;

    -- Decrement old agent counter if applicable
    IF v_old_agent_id IS NOT NULL THEN
      IF v_delivery.status IN ('Assigned', 'Picked Up', 'In Transit') THEN
        UPDATE agents
        SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id;
      ELSIF v_delivery.status = 'Failed' THEN
        UPDATE agents
        SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id;
      END IF;
    END IF;

    -- Increment new agent counter if delivery is active or being assigned
    IF v_delivery.status IN ('Pending', 'Assigned', 'Picked Up', 'In Transit') THEN
      UPDATE agents
      SET assigned_deliveries_count = assigned_deliveries_count + 1,
          updated_at = v_now
      WHERE id = p_new_agent_id;
    END IF;

    -- Create timeline note
    v_timeline_entry := jsonb_build_object(
      'status', CASE WHEN v_delivery.status = 'Pending' THEN 'Assigned' ELSE v_delivery.status END,
      'timestamp', v_now_iso,
      'note', 'Reassigned to ' || v_new_agent.name,
      'updatedBy', p_updated_by
    );

    -- Update delivery
    UPDATE deliveries
    SET agent_id = v_new_agent.id,
        agent_name = v_new_agent.name,
        agent_phone = v_new_agent.phone,
        status = CASE WHEN status = 'Pending' THEN 'Assigned' ELSE status END,
        timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
        updated_at = v_now
    WHERE id = p_delivery_id
    RETURNING * INTO v_delivery;

    -- Sync collection
    UPDATE collections
    SET agent_id = v_new_agent.id,
        agent_name = v_new_agent.name
    WHERE delivery_id = p_delivery_id;

  ELSE
    -- Case B: Unassigning agent
    -- Cannot unassign in-flight delivery (must be returned or failed first)
    IF v_delivery.status IN ('Picked Up', 'In Transit') THEN
      RAISE EXCEPTION 'Cannot unassign an in-flight delivery in % status (ID %)', v_delivery.status, p_delivery_id
        USING ERRCODE = '22023';
    END IF;

    IF v_old_agent_id IS NOT NULL THEN
      IF v_delivery.status = 'Assigned' THEN
        UPDATE agents
        SET assigned_deliveries_count = GREATEST(0, assigned_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id;
      ELSIF v_delivery.status = 'Failed' THEN
        UPDATE agents
        SET failed_deliveries_count = GREATEST(0, failed_deliveries_count - 1),
            updated_at = v_now
        WHERE id = v_old_agent_id;
      END IF;
    END IF;

    v_timeline_entry := jsonb_build_object(
      'status', 'Pending',
      'timestamp', v_now_iso,
      'note', 'Agent unassigned; reverted to Pending',
      'updatedBy', p_updated_by
    );

    UPDATE deliveries
    SET agent_id = NULL,
        agent_name = NULL,
        agent_phone = NULL,
        status = CASE WHEN status = 'Assigned' THEN 'Pending' ELSE status END,
        timeline = COALESCE(timeline, '[]'::jsonb) || jsonb_build_array(v_timeline_entry),
        updated_at = v_now
    WHERE id = p_delivery_id
    RETURNING * INTO v_delivery;

    UPDATE collections
    SET agent_id = NULL,
        agent_name = NULL
    WHERE delivery_id = p_delivery_id;
  END IF;

  RETURN to_jsonb(v_delivery);
END;
$$;


-- 5. STRICT PERMISSIONS: REVOKE ACCESS FROM PUBLIC / ANON / AUTHENTICATED
-- The backend uses the service-role key, which bypasses RLS and retains execution rights.
REVOKE ALL ON FUNCTION create_delivery(JSONB, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION update_delivery_status(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION bulk_assign_deliveries(TEXT[], TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION reassign_delivery_agent(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION create_delivery(JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION update_delivery_status(TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION bulk_assign_deliveries(TEXT[], TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION reassign_delivery_agent(TEXT, TEXT, TEXT) TO service_role;
