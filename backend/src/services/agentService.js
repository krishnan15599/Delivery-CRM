const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeSearchQuery } = require('../utils/sanitize');
const { applyPagination } = require('../utils/pagination');

const listAgents = async (filters = {}) => {
  const { search, status, hubLocation, vehicleType, page, pageSize, limit } = filters;

  let query = supabase.from('agents').select('*', { count: 'exact' });

  const statusStr = typeof status === 'string' ? status : (Array.isArray(status) ? String(status[status.length - 1]) : '');
  if (statusStr && statusStr !== 'all') {
    query = query.eq('status', statusStr);
  }

  const hubStr = typeof hubLocation === 'string' ? hubLocation : (Array.isArray(hubLocation) ? String(hubLocation[hubLocation.length - 1]) : '');
  if (hubStr) {
    const cleanHub = sanitizeSearchQuery(hubStr);
    if (cleanHub) {
      query = query.ilike('hub_location', `%${cleanHub}%`);
    }
  }

  const vehicleStr = typeof vehicleType === 'string' ? vehicleType : (Array.isArray(vehicleType) ? String(vehicleType[vehicleType.length - 1]) : '');
  if (vehicleStr && vehicleStr !== 'all') {
    query = query.eq('vehicle_type', vehicleStr);
  }

  const cleanSearch = sanitizeSearchQuery(search);
  if (cleanSearch) {
    query = query.or(
      `name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,vehicle_number.ilike.%${cleanSearch}%,hub_location.ilike.%${cleanSearch}%`
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
    isPaginated,
    page: curPage,
    pageSize: curSize,
  };
};

const getAgentById = async (id) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const createAgent = async (input) => {
  const agentId = input.id || generateId('AG');
  const now = new Date().toISOString();

  const record = {
    id: agentId,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    vehicle_type: input.vehicleType || 'Bike',
    vehicle_number: input.vehicleNumber || '',
    status: input.status || 'Active',
    hub_location: input.hubLocation || 'Chennai Central Hub',
    assigned_deliveries_count: 0,
    completed_deliveries_count: 0,
    failed_deliveries_count: 0,
    pending_cash_amount: 0.0,
    settled_cash_amount: 0.0,
    rating: input.rating || 5.0,
    joining_date: input.joiningDate || now.split('T')[0],
    avatar_url: input.avatarUrl || null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('agents')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateAgent = async (id, input) => {
  const existing = await getAgentById(id);
  if (!existing) return null;

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.email !== undefined) updatePayload.email = input.email;
  if (input.vehicleType !== undefined) updatePayload.vehicle_type = input.vehicleType;
  if (input.vehicleNumber !== undefined) updatePayload.vehicle_number = input.vehicleNumber;
  if (input.hubLocation !== undefined) updatePayload.hub_location = input.hubLocation;
  if (input.status !== undefined) updatePayload.status = input.status;
  if (input.rating !== undefined) updatePayload.rating = input.rating;
  if (input.avatarUrl !== undefined) updatePayload.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from('agents')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update agent status specifically
 * Fixes: Uses maybeSingle() and verifies existence so 404 is returned if agent does not exist
 */
const updateAgentStatus = async (id, status) => {
  const existing = await getAgentById(id);
  if (!existing) return null;

  const { data, error } = await supabase
    .from('agents')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

const deleteAgent = async (id) => {
  const { data, error } = await supabase
    .from('agents')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data.length > 0;
};

module.exports = {
  listAgents,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
};

