/**
 * Business (tenant) access rules.
 *
 * Pure functions only — no database calls — so every rule can be unit-tested.
 * `user` is the request context built by services/userContextService.js:
 *   { id, role, organizationId, teamIds: string[], agentId: string|null, ... }
 *
 * Who sees what:
 *   SuperAdmin : no business data at all (platform pages only)
 *   Admin      : everything in their own business
 *   Manager    : only the teams they manage
 *   Agent      : only themselves and the deliveries assigned to them
 */

const ROLES = Object.freeze({
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
});

const BUSINESS_ROLES = Object.freeze([ROLES.ADMIN, ROLES.MANAGER, ROLES.AGENT]);

// Field statuses an Agent may set on their own deliveries
const AGENT_ALLOWED_DELIVERY_STATUSES = Object.freeze(['Picked Up', 'Out for Delivery', 'Delivered', 'Failed']);

const hasBusiness = (user) => Boolean(user && user.organizationId);
const isSuperAdmin = (user) => user?.role === ROLES.SUPER_ADMIN;
const isAdmin = (user) => user?.role === ROLES.ADMIN && hasBusiness(user);
const isManager = (user) => user?.role === ROLES.MANAGER && hasBusiness(user);
const isAgent = (user) => user?.role === ROLES.AGENT && hasBusiness(user);

const teamIdsOf = (user) => (Array.isArray(user?.teamIds) ? user.teamIds : []);

/** Can this user manage things (agents, deliveries) in this team? */
const canManageTeam = (user, teamId) =>
  Boolean(teamId) && (isAdmin(user) || (isManager(user) && teamIdsOf(user).includes(teamId)));

/** Which roles may `actor` create? Admin: Admin/Manager/Agent. Manager: Agent. Nobody: SuperAdmin. */
const canCreateRole = (actor, targetRole) => {
  if (isAdmin(actor)) return BUSINESS_ROLES.includes(targetRole);
  if (isManager(actor)) return targetRole === ROLES.AGENT;
  return false;
};

const canAgentSetStatus = (status) => AGENT_ALLOWED_DELIVERY_STATUSES.includes(status);

// ── Scopes ─────────────────────────────────────────────────────────────────
// A scope says which rows a user may see. `none: true` means "nothing".

const deliveryScope = (user) => {
  if (isAdmin(user)) return { none: false, organizationId: user.organizationId, teamIds: null, agentId: null };
  if (isManager(user)) {
    const teamIds = teamIdsOf(user);
    return { none: teamIds.length === 0, organizationId: user.organizationId, teamIds, agentId: null };
  }
  if (isAgent(user)) {
    return { none: !user.agentId, organizationId: user.organizationId, teamIds: null, agentId: user.agentId || null };
  }
  return { none: true };
};

const agentScope = (user) => {
  if (isAdmin(user)) return { none: false, organizationId: user.organizationId, teamIds: null, selfAgentId: null };
  if (isManager(user)) {
    const teamIds = teamIdsOf(user);
    return { none: teamIds.length === 0, organizationId: user.organizationId, teamIds, selfAgentId: null };
  }
  if (isAgent(user)) {
    return { none: !user.agentId, organizationId: user.organizationId, teamIds: null, selfAgentId: user.agentId || null };
  }
  return { none: true };
};

/**
 * Add the delivery scope to a Supabase query.
 * Returns null when the user may see nothing (callers return an empty result).
 */
const applyDeliveryScope = (query, user) => {
  const scope = deliveryScope(user);
  if (scope.none) return null;
  let q = query.eq('organization_id', scope.organizationId);
  if (scope.teamIds) q = q.in('team_id', scope.teamIds);
  if (scope.agentId) q = q.eq('agent_id', scope.agentId);
  return q;
};

const applyAgentScope = (query, user) => {
  const scope = agentScope(user);
  if (scope.none) return null;
  let q = query.eq('organization_id', scope.organizationId);
  if (scope.teamIds) q = q.in('team_id', scope.teamIds);
  if (scope.selfAgentId) q = q.eq('id', scope.selfAgentId);
  return q;
};

/** Row checks — same rules as the scopes, for a row already in memory. */
const canSeeDelivery = (user, delivery) => {
  const scope = deliveryScope(user);
  if (scope.none || !delivery) return false;
  if (delivery.organization_id !== scope.organizationId) return false;
  if (scope.teamIds && !scope.teamIds.includes(delivery.team_id)) return false;
  if (scope.agentId && delivery.agent_id !== scope.agentId) return false;
  return true;
};

const canSeeAgent = (user, agent) => {
  const scope = agentScope(user);
  if (scope.none || !agent) return false;
  if (agent.organization_id !== scope.organizationId) return false;
  if (scope.teamIds && !scope.teamIds.includes(agent.team_id)) return false;
  if (scope.selfAgentId && agent.id !== scope.selfAgentId) return false;
  return true;
};

/**
 * Pick the team for a new agent or delivery.
 *  - requestedTeamId given: it must be an active team the user may manage
 *  - otherwise: the business's default team if the user may use it,
 *    else the user's only team, else ask the user to choose
 * @param orgTeams all teams of the user's business: [{ id, is_default, status }]
 * @returns {{ teamId: string } | { error: { status: number, message: string } }}
 */
const resolveTeamId = (user, requestedTeamId, orgTeams = []) => {
  const activeIds = orgTeams.filter((t) => t.status !== 'Inactive').map((t) => t.id);
  let candidates = [];
  if (isAdmin(user)) candidates = activeIds;
  else if (isManager(user)) candidates = activeIds.filter((id) => teamIdsOf(user).includes(id));

  if (requestedTeamId) {
    return candidates.includes(requestedTeamId)
      ? { teamId: requestedTeamId }
      : { error: { status: 400, message: 'Team not found, inactive, or not one of your teams.' } };
  }

  const defaultTeam = orgTeams.find((t) => t.is_default && t.status !== 'Inactive');
  if (defaultTeam && candidates.includes(defaultTeam.id)) return { teamId: defaultTeam.id };
  if (candidates.length === 1) return { teamId: candidates[0] };
  if (candidates.length === 0) {
    return { error: { status: 403, message: 'You are not assigned to any team. Ask your Admin to add you to a team.' } };
  }
  return { error: { status: 400, message: 'Please choose a team (teamId).' } };
};

// Request fields that must never come from the client
const TENANT_FIELDS = Object.freeze(['organizationId', 'organization_id']);
const findTenantField = (obj) =>
  obj && typeof obj === 'object' ? TENANT_FIELDS.find((f) => Object.prototype.hasOwnProperty.call(obj, f)) : undefined;

/** Error with an HTTP status, picked up by the global error handler. */
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = {
  ROLES,
  BUSINESS_ROLES,
  AGENT_ALLOWED_DELIVERY_STATUSES,
  isSuperAdmin,
  isAdmin,
  isManager,
  isAgent,
  canManageTeam,
  canCreateRole,
  canAgentSetStatus,
  deliveryScope,
  agentScope,
  applyDeliveryScope,
  applyAgentScope,
  canSeeDelivery,
  canSeeAgent,
  resolveTeamId,
  findTenantField,
  httpError,
};
