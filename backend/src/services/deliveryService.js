const { supabase } = require('../config/supabase');
const { generateId, generateTrackingNumber } = require('../utils/idGenerator');
const { sanitizeSearchQuery, normalizeEndDate } = require('../utils/sanitize');
const { applyPagination } = require('../utils/pagination');

// ────────────────────────────────────────────────────────────────────────────
// List
// ────────────────────────────────────────────────────────────────────────────
const listDeliveries = async (filters = {}) => {
  const {
    search, status, agentId, customerId,
    startDate, endDate, page, pageSize, limit,
  } = filters;

  let query = supabase.from('deliveries').select('*', { count: 'exact' });

  const statusStr = typeof status === 'string' ? status : (Array.isArray(status) ? String(status[status.length - 1]) : '');
  if (statusStr && statusStr !== 'all') {
    if (statusStr.toLowerCase() === 'unassigned') {
      query = query.is('agent_id', null);
    } else {
      query = query.ilike('status', statusStr);
    }
  }

  if (agentId) query = query.eq('agent_id', agentId);
  if (customerId) query = query.eq('customer_id', customerId);
  if (startDate) query = query.gte('date', startDate);
  if (endDate)   query = query.lte('date', normalizeEndDate(endDate));

  const cleanSearch = sanitizeSearchQuery(search);
  if (cleanSearch) {
    query = query.or(
      `tracking_number.ilike.%${cleanSearch}%,customer_name.ilike.%${cleanSearch}%,agent_name.ilike.%${cleanSearch}%,delivery_address.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%`
    );
  }

  query = query.order('created_at', { ascending: false });

  const { query: paginatedQuery, isPaginated, page: curPage, pageSize: curSize } =
    applyPagination(query, { page, pageSize, limit });

  const { data, count, error } = await paginatedQuery;
  if (error) throw error;

  return {
    data: data || [],
    count: count || (data ? data.length : 0),
    isPaginated, page: curPage, pageSize: curSize,
  };
};

// ────────────────────────────────────────────────────────────────────────────
// Get by ID / Tracking Number
// ────────────────────────────────────────────────────────────────────────────
const getDeliveryById = async (id) => {
  const { data, error } = await supabase
    .from('deliveries').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};

const getDeliveryByTrackingNumber = async (trk) => {
  const { data, error } = await supabase
    .from('deliveries').select('*').eq('tracking_number', trk).maybeSingle();
  if (error) throw error;
  return data;
};

// ────────────────────────────────────────────────────────────────────────────
// Create Delivery  — delegates to the create_delivery SQL function so
// the insert, collection record, and all counter updates happen in one transaction.
// ────────────────────────────────────────────────────────────────────────────
const createDelivery = async (input, user = null) => {
  const deliveryId      = input.id || generateId('DEL');
  const trackingNumber  = input.trackingNumber || generateTrackingNumber();

  // Build the JSONB payload the SQL function expects
  const payload = {
    id:             deliveryId,
    trackingNumber,
    customerId:     input.customerId || null,
    customerName:   input.customerName,
    customerPhone:  input.customerPhone || null,
    pickupAddress:  input.pickupAddress,
    deliveryAddress: input.deliveryAddress,
    city:           input.city || 'Chennai',
    pincode:        input.pincode || null,
    packageType:    input.packageType || 'Standard',
    itemDescription: input.itemDescription || null,
    amount:         input.amount || 0,
    codAmount:      input.codAmount !== undefined ? input.codAmount : (input.amount || 0),
    agentId:        input.agentId || null,
    paymentStatus:  input.paymentStatus || null,
    notes:          input.notes || null,
    scheduledDate:  input.scheduledDate || null,
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc('create_delivery', {
    p_delivery: payload,
    p_user_name: user?.name || user?.role || 'Admin',
  });

  if (rpcError) {
    // Surface explicit business errors (P0002 = not found, 22000 = constraint)
    if (rpcError.code === 'P0002') {
      const err = new Error(rpcError.message);
      err.status = 404;
      throw err;
    }
    throw rpcError;
  }

  return rpcData;
};

// ────────────────────────────────────────────────────────────────────────────
// Generic Delivery Update  — metadata only, never status.
// Fixes: blocks reassigning Delivered/Returned deliveries;
//        verifies new agent exists before adjusting any counters.
// ────────────────────────────────────────────────────────────────────────────
const updateDelivery = async (id, input) => {
  const existing = await getDeliveryById(id);
  if (!existing) return null;

  // Do not allow changing agent or metadata on terminal deliveries
  if (['Delivered', 'Returned'].includes(existing.status) && input.agentId !== undefined) {
    const err = new Error(`Cannot reassign a delivery that is already ${existing.status}.`);
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const updatePayload = { updated_at: now };

  if (input.customerName  !== undefined) updatePayload.customer_name   = input.customerName;
  if (input.customerPhone !== undefined) updatePayload.customer_phone  = input.customerPhone;
  if (input.pickupAddress !== undefined) updatePayload.pickup_address  = input.pickupAddress;
  if (input.deliveryAddress !== undefined) updatePayload.delivery_address = input.deliveryAddress;
  if (input.city          !== undefined) updatePayload.city            = input.city;
  if (input.pincode       !== undefined) updatePayload.pincode         = input.pincode;
  if (input.packageType   !== undefined) updatePayload.package_type    = input.packageType;
  if (input.itemDescription !== undefined) updatePayload.item_description = input.itemDescription;
  if (input.amount        !== undefined) updatePayload.amount          = input.amount;
  if (input.codAmount     !== undefined) updatePayload.cod_amount      = input.codAmount;
  if (input.paymentStatus !== undefined) updatePayload.payment_status  = input.paymentStatus;
  if (input.notes         !== undefined) updatePayload.notes           = input.notes;
  if (input.scheduledDate !== undefined) updatePayload.scheduled_date  = input.scheduledDate;

  // Handle agent reassignment atomically via PostgreSQL function
  const newAgentId = input.agentId;
  if (newAgentId !== undefined && newAgentId !== existing.agent_id) {
    const { error: rpcErr } = await supabase.rpc('reassign_delivery_agent', {
      p_delivery_id: id,
      p_new_agent_id: newAgentId || null,
      p_updated_by: 'Dispatcher',
    });

    if (rpcErr) {
      if (rpcErr.code === 'P0002') {
        const err = new Error(`Agent with ID '${newAgentId}' not found.`);
        err.status = 404;
        throw err;
      }
      throw rpcErr;
    }
  }

  // If other non-agent fields were updated, apply them
  if (Object.keys(updatePayload).length > 1) { // more than just updated_at
    const { data, error } = await supabase
      .from('deliveries')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('deliveries')
    .select()
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

// ────────────────────────────────────────────────────────────────────────────
// Status Transition  — SQL function only; no JS fallback.
// ────────────────────────────────────────────────────────────────────────────
const updateDeliveryStatus = async (id, status, note = null, updatedBy = 'System') => {
  const { data: rpcData, error: rpcError } = await supabase.rpc('update_delivery_status', {
    p_delivery_id: id,
    p_new_status:  status,
    p_note:        note,
    p_updated_by:  updatedBy,
  });

  if (rpcError) {
    // P0002 = delivery not found; 22000 / 22023 = business rule violation
    if (rpcError.code === 'P0002') {
      return null;
    }
    if (rpcError.code === '22000' || rpcError.code === '22023') {
      const err = new Error(rpcError.message);
      err.status = 400;
      throw err;
    }
    throw rpcError;
  }

  return rpcData;
};

// ────────────────────────────────────────────────────────────────────────────
// Bulk Assign  — SQL function only; no JS fallback.
// ────────────────────────────────────────────────────────────────────────────
const bulkAssignDeliveries = async (deliveryIds, agentId, updatedBy = 'Dispatcher') => {
  const { data: rpcData, error: rpcError } = await supabase.rpc('bulk_assign_deliveries', {
    p_delivery_ids: deliveryIds,
    p_agent_id:     agentId,
    p_updated_by:   updatedBy,
  });

  if (rpcError) {
    if (rpcError.code === 'P0002') {
      const err = new Error(rpcError.message);
      err.status = 404;
      throw err;
    }
    throw rpcError;
  }

  return rpcData;
};

// ────────────────────────────────────────────────────────────────────────────
// Delete
// ────────────────────────────────────────────────────────────────────────────
const deleteDelivery = async (id) => {
  const { data, error } = await supabase
    .from('deliveries').delete().eq('id', id).select();
  if (error) throw error;
  return data && data.length > 0;
};

module.exports = {
  listDeliveries,
  getDeliveryById,
  getDeliveryByTrackingNumber,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  bulkAssignDeliveries,
  deleteDelivery,
};
