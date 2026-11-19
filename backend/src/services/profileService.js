const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeSearchQuery } = require('../utils/sanitize');
const {
  ROLES,
  isAdmin,
  isManager,
  canCreateRole,
  resolveTeamId,
  httpError,
} = require('../utils/access');
const teamService = require('./teamService');

// ────────────────────────────────────────────────────────────────────────────
// Internal helpers (no permission checks — callers do that)
// ────────────────────────────────────────────────────────────────────────────

/** Global lookup: emails are unique across all businesses. */
const getProfileByEmail = async (email) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data;
};

/** supabase-js returns { error } instead of throwing, so check both. */
const deleteAuthUserQuietly = async (authUserId) => {
  if (!authUserId) return;
  try {
    const { error } = await supabase.auth.admin.deleteUser(authUserId);
    if (error) {
      console.error(`[auth] Could not delete login ${authUserId}: ${error.message}. Delete it in Supabase -> Authentication -> Users.`);
    }
  } catch (err) {
    console.error(`[auth] Could not delete login ${authUserId}: ${err.message}. Delete it in Supabase -> Authentication -> Users.`);
  }
};

/**
 * Create a login (Supabase Auth user) and its profile inside a business.
 * If the profile insert fails, the login is removed again.
 */
const createUserAccount = async ({ organizationId, name, email, phone, role, temporaryPassword, avatarUrl, id }) => {
  const cleanEmail = email.toLowerCase().trim();

  const existing = await getProfileByEmail(cleanEmail);
  if (existing) {
    throw httpError(409, `A user with email '${cleanEmail}' already exists.`);
  }

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name },
  });
  if (authErr) {
    throw httpError(authErr.status || 400, authErr.message || 'Failed to create the login.');
  }
  const authUserId = authData.user.id;

  const now = new Date().toISOString();
  const record = {
    id: id || generateId('USR'),
    organization_id: organizationId,
    auth_user_id: authUserId,
    name,
    email: cleanEmail,
    role,
    phone: phone || null,
    avatar_url: avatarUrl || null,
    status: 'Active',
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('profiles').insert([record]).select().single();
  if (error) {
    await deleteAuthUserQuietly(authUserId);
    throw error;
  }
  return data;
};

/** Remove a profile and its login. */
const removeUserAccount = async (profile) => {
  const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
  if (error) throw error;
  await deleteAuthUserQuietly(profile.auth_user_id);
};

/** Insert the agents-table row for a field agent. */
const insertAgentRecord = async ({ organizationId, teamId, userId, input }) => {
  const now = new Date().toISOString();
  const record = {
    id: input.agentId || generateId('AG'),
    organization_id: organizationId,
    team_id: teamId,
    user_id: userId || null,
    name: input.name,
    phone: input.phone || '',
    email: input.email || null,
    vehicle_type: input.vehicleType || 'Bike',
    vehicle_number: input.vehicleNumber || '',
    status: input.status || 'Active',
    hub_location: input.hubLocation || 'Indiranagar Hub',
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

  const { data, error } = await supabase.from('agents').insert([record]).select().single();
  if (error) throw error;
  return data;
};

/**
 * Replace the list of teams a Manager manages.
 * Adds the new teams first, then removes the others, so a failure half-way
 * never leaves the Manager with no teams at all.
 */
const setManagerTeams = async (organizationId, managerId, teamIds) => {
  if (teamIds.length > 0) {
    const rows = teamIds.map((teamId) => ({ organization_id: organizationId, team_id: teamId, manager_id: managerId }));
    const { error } = await supabase
      .from('team_managers')
      .upsert(rows, { onConflict: 'team_id,manager_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  let removeQuery = supabase
    .from('team_managers')
    .delete()
    .eq('organization_id', organizationId)
    .eq('manager_id', managerId);
  if (teamIds.length > 0) {
    removeQuery = removeQuery.not('team_id', 'in', `(${teamIds.map((id) => `"${id}"`).join(',')})`);
  }
  const { error: delErr } = await removeQuery;
  if (delErr) throw delErr;
};

/**
 * Validate the teams for a Manager.
 *  - not given (undefined): the business's default team
 *  - given (even an empty list): exactly those teams
 */
const pickManagerTeams = (orgTeams, requestedTeamIds) => {
  if (Array.isArray(requestedTeamIds)) {
    const activeIds = orgTeams.filter((t) => t.status !== 'Inactive').map((t) => t.id);
    const unknown = requestedTeamIds.filter((id) => !activeIds.includes(id));
    if (unknown.length > 0) {
      throw httpError(400, `Unknown or inactive team(s): ${unknown.join(', ')}`);
    }
    return [...new Set(requestedTeamIds)];
  }
  const defaultTeam = orgTeams.find((t) => t.is_default && t.status !== 'Inactive');
  return defaultTeam ? [defaultTeam.id] : [];
};

/** A business must always keep at least one active Admin. */
const assertNotLastAdmin = async (organizationId, profileId) => {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', ROLES.ADMIN)
    .eq('status', 'Active')
    .neq('id', profileId);
  if (error) throw error;
  if (!count) {
    throw httpError(409, 'A business must keep at least one active Admin.');
  }
};

/** Profile ids a Manager may see: themselves + Agents in their teams. */
const managerVisibleProfileIds = async (user) => {
  const ids = [user.id];
  const teamIds = user.teamIds || [];
  if (teamIds.length > 0) {
    const { data, error } = await supabase
      .from('agents')
      .select('user_id')
      .eq('organization_id', user.organizationId)
      .in('team_id', teamIds)
      .not('user_id', 'is', null);
    if (error) throw error;
    for (const row of data || []) ids.push(row.user_id);
  }
  return ids;
};

// ────────────────────────────────────────────────────────────────────────────
// Public, scoped to the signed-in user's business
// ────────────────────────────────────────────────────────────────────────────

const listProfiles = async (user, filters = {}) => {
  const { role, search } = filters;

  let query = supabase.from('profiles').select('*').eq('organization_id', user.organizationId);

  if (isManager(user)) {
    query = query.in('id', await managerVisibleProfileIds(user));
  } else if (!isAdmin(user)) {
    query = query.eq('id', user.id);
  }

  if (role && role !== 'all') {
    query = query.eq('role', role);
  }

  const cleanSearch = sanitizeSearchQuery(search);
  if (cleanSearch) {
    query = query.or(
      `name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%`
    );
  }

  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

const getProfileById = async (user, id) => {
  if (!isAdmin(user) && id !== user.id) {
    if (!isManager(user)) return null;
    const visible = await managerVisibleProfileIds(user);
    if (!visible.includes(id)) return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Create a user in the actor's business.
 * Admin: Admin / Manager / Agent. Manager: Agent (in one of their teams).
 * Agent  -> also creates the agents row (team: teamId, or the default team)
 * Manager-> manages teamIds (or the default team)
 */
const createProfile = async (actor, input) => {
  const role = input.role || ROLES.AGENT;
  if (!canCreateRole(actor, role)) {
    throw httpError(403, isManager(actor) ? 'Managers can only create Agent accounts.' : `You cannot create '${role}' accounts.`);
  }

  const needsTeams = role === ROLES.AGENT || role === ROLES.MANAGER;
  const orgTeams = needsTeams ? await teamService.listOrgTeams(actor.organizationId) : [];

  let agentTeamId = null;
  if (role === ROLES.AGENT) {
    const resolved = resolveTeamId(actor, input.teamId, orgTeams);
    if (resolved.error) throw httpError(resolved.error.status, resolved.error.message);
    agentTeamId = resolved.teamId;
  }
  const managerTeamIds = role === ROLES.MANAGER ? pickManagerTeams(orgTeams, input.teamIds) : [];

  const profile = await createUserAccount({
    organizationId: actor.organizationId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role,
    temporaryPassword: input.temporaryPassword,
    avatarUrl: input.avatarUrl,
    id: input.id,
  });

  try {
    if (role === ROLES.AGENT) {
      await insertAgentRecord({ organizationId: actor.organizationId, teamId: agentTeamId, userId: profile.id, input });
    } else if (role === ROLES.MANAGER) {
      await setManagerTeams(actor.organizationId, profile.id, managerTeamIds);
    }
  } catch (err) {
    try {
      await removeUserAccount(profile);
    } catch (rollbackErr) {
      console.warn('Failed to roll back user after setup error:', rollbackErr.message);
    }
    throw err;
  }

  return profile;
};

/** Admin only (enforced by the route). */
const updateProfile = async (actor, id, input) => {
  const existing = await getProfileById(actor, id);
  if (!existing) return null;

  const roleChanges = input.role !== undefined && input.role !== null && input.role !== existing.role;
  const statusChanges = input.status !== undefined && input.status !== null && input.status !== existing.status;

  const finalRole = roleChanges ? input.role : existing.role;
  const oldEmail = (existing.email || '').toLowerCase().trim();
  const newEmail = input.email ? input.email.toLowerCase().trim() : null;
  const emailChanges = Boolean(newEmail) && newEmail !== oldEmail;

  // ── 1. Validate everything before changing anything ──────────────────────
  if (roleChanges) {
    if (id === actor.id) throw httpError(403, 'You cannot change your own role.');
    if (input.role === ROLES.AGENT || existing.role === ROLES.AGENT) {
      throw httpError(400, 'Changing to or from the Agent role is not supported. Create a new account instead.');
    }
    if (existing.role === ROLES.ADMIN) await assertNotLastAdmin(actor.organizationId, id);
  }
  if (statusChanges) {
    if (id === actor.id) throw httpError(403, 'You cannot change your own status.');
    if (input.status === 'Inactive' && existing.role === ROLES.ADMIN) {
      await assertNotLastAdmin(actor.organizationId, id);
    }
  }
  if (input.teamIds !== undefined && finalRole !== ROLES.MANAGER) {
    throw httpError(400, 'teamIds can only be set for Managers.');
  }

  // Team assignments follow the (new) role
  let managerTeamIds = null; // null = leave team_managers untouched
  if (finalRole === ROLES.MANAGER && (roleChanges || input.teamIds !== undefined)) {
    const orgTeams = await teamService.listOrgTeams(actor.organizationId);
    managerTeamIds = pickManagerTeams(orgTeams, input.teamIds);
  } else if (roleChanges && existing.role === ROLES.MANAGER) {
    managerTeamIds = [];
  }

  if (emailChanges) {
    const taken = await getProfileByEmail(newEmail);
    if (taken && taken.id !== id) throw httpError(409, `A user with email '${newEmail}' already exists.`);
  }

  // ── 2. Login email first (it is the step most likely to be refused) ──────
  const canSyncLogin = emailChanges && Boolean(existing.auth_user_id);
  if (canSyncLogin) {
    const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(existing.auth_user_id, {
      email: newEmail,
      email_confirm: true,
    });
    if (authUpdateErr) {
      throw httpError(authUpdateErr.status || 400, authUpdateErr.message || 'Failed to update the login email.');
    }
  }

  // ── 3. Profile row; put the login email back if this fails ───────────────
  const updatePayload = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updatePayload.name = input.name;
  if (newEmail) updatePayload.email = newEmail;
  if (roleChanges) updatePayload.role = input.role;
  if (statusChanges) updatePayload.status = input.status;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.avatarUrl !== undefined) updatePayload.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('organization_id', actor.organizationId)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    if (canSyncLogin) {
      const { error: revertErr } = await supabase.auth.admin.updateUserById(existing.auth_user_id, {
        email: oldEmail,
        email_confirm: true,
      });
      if (revertErr) {
        console.error(`[auth] Could not restore login email for profile ${id}: ${revertErr.message}`);
      }
    }
    throw error;
  }

  // ── 4. Teams (adds before it removes, see setManagerTeams) ───────────────
  if (managerTeamIds !== null) {
    await setManagerTeams(actor.organizationId, id, managerTeamIds);
  }

  return data;
};

/** Admin only (enforced by the route). Deletes the profile and its login. */
const deleteProfile = async (actor, id) => {
  const existing = await getProfileById(actor, id);
  if (!existing) return false;

  if (id === actor.id) throw httpError(403, 'You cannot delete your own account.');
  if (existing.role === ROLES.ADMIN && existing.status === 'Active') {
    await assertNotLastAdmin(actor.organizationId, id);
  }

  await removeUserAccount(existing);
  return true;
};

module.exports = {
  // scoped
  listProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
  // internal (used by agent / platform services)
  getProfileByEmail,
  createUserAccount,
  removeUserAccount,
  insertAgentRecord,
};
