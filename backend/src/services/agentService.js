const { supabase } = require('../config/supabase');
const { sanitizeSearchQuery } = require('../utils/sanitize');
const { applyPagination } = require('../utils/pagination');
const { emptyListResult } = require('../utils/emptyResult');
const { applyAgentScope, canManageTeam, resolveTeamId, httpError } = require('../utils/access');
const profileService = require('./profileService');
const teamService = require('./teamService');

// Admin: every agent in the business. Manager: agents in their teams. Agent: only themselves.

const listAgents = async (user, filters = {}) => {
  const { search, status, hubLocation, vehicleType, teamId, page, pageSize, limit } = filters;

  let query = applyAgentScope(supabase.from('agents').select('*', { count: 'exact' }), user);
  if (!query) return emptyListResult({ page, pageSize, limit });

  const statusStr = typeof status === 'string' ? status : (Array.isArray(status) ? String(status[status.length - 1]) : '');
  if (statusStr && statusStr !== 'all') {
    query = query.eq('status', statusStr);
  }

  if (typeof teamId === 'string' && teamId && teamId !== 'all') {
    query = query.eq('team_id', teamId);
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

const getAgentById = async (user, id) => {
  const query = applyAgentScope(supabase.from('agents').select('*'), user);
  if (!query) return null;

  const { data, error } = await query.eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Create a field agent in a team the user may manage.
 * With an email, a login is created too (temporaryPassword required).
 */
const createAgent = async (user, input) => {
  const orgTeams = await teamService.listOrgTeams(user.organizationId);
  const resolved = resolveTeamId(user, input.teamId, orgTeams);
  if (resolved.error) throw httpError(resolved.error.status, resolved.error.message);

  let account = null;
  if (input.email) {
    account = await profileService.createUserAccount({
      organizationId: user.organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: 'Agent',
      temporaryPassword: input.temporaryPassword,
    });
  }

  try {
    return await profileService.insertAgentRecord({
      organizationId: user.organizationId,
      teamId: resolved.teamId,
      userId: account ? account.id : null,
      input: { ...input, agentId: input.id },
    });
  } catch (err) {
    if (account) {
      try {
        await profileService.removeUserAccount(account);
      } catch (rollbackErr) {
        console.warn('Failed to roll back agent login after insert failure:', rollbackErr.message);
      }
    }
    throw err;
  }
};

const updateAgent = async (user, id, input) => {
  const existing = await getAgentById(user, id);
  if (!existing) return null;

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (input.teamId !== undefined && input.teamId !== existing.team_id) {
    const orgTeams = await teamService.listOrgTeams(user.organizationId);
    const target = orgTeams.find((t) => t.id === input.teamId && t.status !== 'Inactive');
    if (!target || !canManageTeam(user, input.teamId)) {
      throw httpError(400, 'Team not found, inactive, or not one of your teams.');
    }
    updatePayload.team_id = input.teamId;
  }

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
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Availability status. Agents can only reach their own row (scope), so another
 * agent's id simply returns null -> 404.
 */
const updateAgentStatus = async (user, id, status) => {
  const existing = await getAgentById(user, id);
  if (!existing) return null;

  const { data, error } = await supabase
    .from('agents')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

/** Admin only (enforced by the route). */
const deleteAgent = async (user, id) => {
  const { data, error } = await supabase
    .from('agents')
    .delete()
    .eq('organization_id', user.organizationId)
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
