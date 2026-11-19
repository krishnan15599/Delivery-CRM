const { supabase } = require('../config/supabase');

// Columns needed to build a request user. Never include secrets here.
const PROFILE_COLUMNS = 'id, name, email, role, phone, avatar_url, status, organization_id, auth_user_id';

const toUserContext = (profile, organization, teamIds, agentId) => ({
  id: profile.id,
  name: profile.name,
  email: profile.email,
  role: profile.role,
  phone: profile.phone || null,
  avatarUrl: profile.avatar_url || null,
  status: profile.status || 'Active',
  organizationId: profile.organization_id || null,
  organization,
  teamIds,
  agentId,
});

/**
 * Build the request user (business, teams, agent row) from a profile row.
 * Loaded fresh on every request, so role changes, deactivation and
 * business suspension take effect immediately.
 * @returns {Promise<{ user: object } | { error: { status: number, message: string } }>}
 */
const loadUserContext = async (profile) => {
  if (!profile) {
    return { error: { status: 401, message: 'Account not found. Please sign in again.' } };
  }
  if (profile.status === 'Inactive') {
    return { error: { status: 403, message: 'Your account has been deactivated. Contact your Admin.' } };
  }

  // Platform owner: no business, no teams
  if (profile.role === 'SuperAdmin') {
    return { user: toUserContext(profile, null, [], null) };
  }

  if (!profile.organization_id) {
    return { error: { status: 403, message: 'Your account is not linked to a business.' } };
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, code, status')
    .eq('id', profile.organization_id)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!organization) {
    return { error: { status: 403, message: 'Your business account was not found.' } };
  }
  if (organization.status !== 'Active') {
    return { error: { status: 403, message: 'This business account is suspended. Contact the platform owner.' } };
  }

  let teamIds = [];
  let agentId = null;

  if (profile.role === 'Manager') {
    const { data, error } = await supabase
      .from('team_managers')
      .select('team_id')
      .eq('organization_id', profile.organization_id)
      .eq('manager_id', profile.id);
    if (error) throw error;
    teamIds = (data || []).map((row) => row.team_id);
  } else if (profile.role === 'Agent') {
    const { data, error } = await supabase
      .from('agents')
      .select('id, team_id')
      .eq('organization_id', profile.organization_id)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      agentId = data[0].id;
      teamIds = [data[0].team_id];
    }
  }

  return { user: toUserContext(profile, organization, teamIds, agentId) };
};

const getProfileForContext = async (column, value) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq(column, value)
    .maybeSingle();
  if (error) throw error;
  return data;
};

module.exports = {
  PROFILE_COLUMNS,
  loadUserContext,
  getProfileForContext,
};
