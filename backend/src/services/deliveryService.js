const { supabase } = require('../config/supabase');
const { generateId, generateTrackingNumber } = require('../utils/idGenerator');
const { sanitizeSearchQuery, normalizeEndDate } = require('../utils/sanitize');
const { applyPagination } = require('../utils/pagination');
const { emptyListResult } = require('../utils/emptyResult');
const {
  applyDeliveryScope,
  isAgent,
  canAgentSetStatus,
  resolveTeamId,
  httpError,
} = require('../utils/access');
const agentService = require('./agentService');
const teamService = require('./teamService');
const notificationService = require('./notificationService');

// Admin: all deliveries of the business. Manager: their teams. Agent: assigned to them.
// Writes go through SQL functions that also check the business (05_tenant_scoped_functions.sql).

// ────────────────────────────────────────────────────────────────────────────
// List
// ────────────────────────────────────────────────────────────────────────────
const listDeliveries = async (user, filters = {}) => {
  const {
    search, status, agentId, customerId, teamId,
    startDate, endDate, page, pageSize, limit,
  } = filters;

  let query = applyDeliveryScope(supabase.from('deliveries').select('*', { count: 'exact' }), user);
  if (!query) return emptyListResult({ page, pageSize, limit });

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
  if (typeof teamId === 'string' && teamId && teamId !== 'all') query = query.eq('team_id', teamId);
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
// Get by ID / Tracking Number (scoped)
// ────────────────────────────────────────────────────────────────────────────
const getDeliveryById = async (user, id) => {
  const query = applyDeliveryScope(supabase.from('deliveries').select('*'), user);
  if (!query) return null;
  const { data, error } = await query.eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};

const getDeliveryByTrackingNumber = async (user, trk) => {
  const query = applyDeliveryScope(supabase.from('deliveries').select('*'), user);
  if (!query) return null;
  const { data, error } = await query.eq('tracking_number', trk).maybeSingle();
  if (error) throw error;
  return data;
};

const mapRpcError = (rpcError, notFoundMessage) => {
  if (rpcError.code === 'P0002') return httpError(404, notFoundMessage || rpcError.message);
  if (rpcError.code === '22000' || rpcError.code === '22023') return httpError(400, rpcError.message);
  return rpcError;
};

// ────────────────────────────────────────────────────────────────────────────
// Create Delivery — team = the agent's team when an agent is given,
// otherwise teamId / the business's default team / the Manager's only team.
// ────────────────────────────────────────────────────────────────────────────
const createDelivery = async (user, input) => {
  const deliveryId      = input.id || generateId('DEL');
  const trackingNumber  = input.trackingNumber || generateTrackingNumber();

  let teamId;
  if (input.agentId) {
    const agent = await agentService.getAgentById(user, input.agentId);
    if (!agent) throw httpError(404, `Agent with ID '${input.agentId}' not found.`);
    if (input.teamId && input.teamId !== agent.team_id) {
      throw httpError(400, 'The selected agent is not in the selected team.');
    }
    teamId = agent.team_id;
  } else {
    const orgTeams = await teamService.listOrgTeams(user.organizationId);
    const resolved = resolveTeamId(user, input.teamId, orgTeams);
    if (resolved.error) throw httpError(resolved.error.status, resolved.error.message);
    teamId = resolved.teamId;
  }

  // Build the JSONB payload the SQL function expects
  const payload = {
    id:             deliveryId,
    trackingNumber,
    teamId,
    merchantId:     input.merchantId || null,
    externalOrderId: input.externalOrderId || null,
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
    p_organization_id: user.organizationId,
    p_delivery: payload,
    p_user_id: user.id,
    p_user_name: user.name || user.role || 'Admin',
  });

  if (rpcError) throw mapRpcError(rpcError);

  if (input.agentId && rpcData) {
    notificationService.notifyAgentOnAssignment(user.organizationId, input.agentId, {
      deliveryId: rpcData.id || deliveryId,
      trackingNumber: rpcData.tracking_number || trackingNumber,
      customerName: input.customerName,
      deliveryAddress: input.deliveryAddress,
    });
  }

  return rpcData;
};

// ────────────────────────────────────────────────────────────────────────────
// Generic Delivery Update — metadata only, never status.
// ────────────────────────────────────────────────────────────────────────────
const updateDelivery = async (user, id, input) => {
  const existing = await getDeliveryById(user, id);
  if (!existing) return null;

  if (['Delivered', 'Returned to Merchant'].includes(existing.status) && input.agentId !== undefined) {
    throw httpError(400, `Cannot reassign a delivery that is already ${existing.status}.`);
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

  // Agent (re)assignment — the new agent must be one this user may manage
  const newAgentId = input.agentId;
  if (newAgentId !== undefined && newAgentId !== existing.agent_id) {
    if (newAgentId) {
      const agent = await agentService.getAgentById(user, newAgentId);
      if (!agent) throw httpError(404, `Agent with ID '${newAgentId}' not found.`);
    }

    const { error: rpcErr } = await supabase.rpc('reassign_delivery_agent', {
      p_organization_id: user.organizationId,
      p_delivery_id: id,
      p_new_agent_id: newAgentId || null,
      p_updated_by: user.name || 'Dispatcher',
    });
    if (rpcErr) throw mapRpcError(rpcErr, `Agent with ID '${newAgentId}' not found.`);

    if (newAgentId) {
      notificationService.notifyAgentOnAssignment(user.organizationId, newAgentId, {
        deliveryId: id,
        trackingNumber: existing.tracking_number,
        customerName: input.customerName ?? existing.customer_name,
        deliveryAddress: input.deliveryAddress ?? existing.delivery_address,
      });
    }
  }

  if (Object.keys(updatePayload).length > 1) { // more than just updated_at
    const { data, error } = await supabase
      .from('deliveries')
      .update(updatePayload)
      .eq('organization_id', user.organizationId)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('deliveries')
    .select()
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

// ────────────────────────────────────────────────────────────────────────────
// Status Transition — Agents: only their own deliveries, only field statuses.
// ────────────────────────────────────────────────────────────────────────────
const updateDeliveryStatus = async (user, id, status, note = null, updatedBy = 'System') => {
  const existing = await getDeliveryById(user, id);
  if (!existing) return null;

  if (isAgent(user) && !canAgentSetStatus(status)) {
    throw httpError(403, `Agents can only set these statuses: Picked Up, Out for Delivery, Delivered, Failed.`);
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('update_delivery_status', {
    p_organization_id: user.organizationId,
    p_delivery_id: id,
    p_new_status:  status,
    p_note:        note,
    p_updated_by:  updatedBy,
  });

  if (rpcError) {
    if (rpcError.code === 'P0002') return null;
    throw mapRpcError(rpcError);
  }

  return rpcData;
};

// ────────────────────────────────────────────────────────────────────────────
// Bulk Assign — deliveries the user cannot see are skipped (returned in skippedIds)
// ────────────────────────────────────────────────────────────────────────────
const bulkAssignDeliveries = async (user, deliveryIds, agentId, updatedBy = 'Dispatcher') => {
  const agent = await agentService.getAgentById(user, agentId);
  if (!agent) throw httpError(404, `Agent with ID '${agentId}' not found.`);

  const scoped = applyDeliveryScope(supabase.from('deliveries').select('id'), user);
  let visibleIds = [];
  if (scoped) {
    const { data, error } = await scoped.in('id', deliveryIds);
    if (error) throw error;
    visibleIds = (data || []).map((row) => row.id);
  }
  const notVisible = deliveryIds.filter((id) => !visibleIds.includes(id));

  if (visibleIds.length === 0) {
    return { success: true, assignedCount: 0, skippedIds: notVisible, agentId, agentName: agent.name };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('bulk_assign_deliveries', {
    p_organization_id: user.organizationId,
    p_delivery_ids: visibleIds,
    p_agent_id:     agentId,
    p_updated_by:   updatedBy,
  });

  if (rpcError) throw mapRpcError(rpcError);

  const assignedCount = rpcData?.assignedCount ?? visibleIds.length;
  if (assignedCount > 0) {
    notificationService.notifyAgentOnAssignment(user.organizationId, agentId, {
      count: assignedCount,
      deliveryId: assignedCount === 1 ? visibleIds[0] : null,
    });
  }

  return {
    ...rpcData,
    skippedIds: [...notVisible, ...((rpcData && rpcData.skippedIds) || [])],
  };
};

// ────────────────────────────────────────────────────────────────────────────
// Delete (Admin only — enforced by the route)
// ────────────────────────────────────────────────────────────────────────────
const deleteDelivery = async (user, id) => {
  const { data, error } = await supabase
    .from('deliveries')
    .delete()
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select();
  if (error) throw error;

  if (data && data.length > 0) {
    // Clean up any in-app notifications linked to the deleted delivery
    await supabase
      .from('notifications')
      .delete()
      .eq('organization_id', user.organizationId)
      .eq('delivery_id', id);
  }

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
