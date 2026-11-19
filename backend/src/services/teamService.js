const { supabase } = require('../config/supabase');
const { isAdmin } = require('../utils/access');

const TEAM_COLUMNS = 'id, organization_id, name, city, hub_address, is_default, status, created_at';

/** All teams of one business (internal use). */
const listOrgTeams = async (organizationId) => {
  const { data, error } = await supabase
    .from('teams')
    .select(TEAM_COLUMNS)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

/** Teams the user may see: Admin all, Manager/Agent their own. */
const listTeamsForUser = async (user) => {
  const teams = await listOrgTeams(user.organizationId);
  if (isAdmin(user)) return teams;
  const mine = new Set(user.teamIds || []);
  return teams.filter((team) => mine.has(team.id));
};

/** Create a business's first team (used when a new business is created). */
const createDefaultTeam = async (organizationId, id) => {
  const { data, error } = await supabase
    .from('teams')
    .insert([{ id, organization_id: organizationId, name: 'Main Team', is_default: true }])
    .select(TEAM_COLUMNS)
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  listOrgTeams,
  listTeamsForUser,
  createDefaultTeam,
};
