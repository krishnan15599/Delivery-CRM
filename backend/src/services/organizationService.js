const { supabase } = require('../config/supabase');

const ORG_COLUMNS = 'id, name, code, status, settings, created_at, updated_at';

/** The signed-in user's own business. */
const getOrganization = async (user) => {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLUMNS)
    .eq('id', user.organizationId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Admin only (enforced by the route). Name and settings; never code or status. */
const updateOrganization = async (user, input) => {
  const payload = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.settings !== undefined) payload.settings = input.settings;

  const { data, error } = await supabase
    .from('organizations')
    .update(payload)
    .eq('id', user.organizationId)
    .select(ORG_COLUMNS)
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  getOrganization,
  updateOrganization,
};
