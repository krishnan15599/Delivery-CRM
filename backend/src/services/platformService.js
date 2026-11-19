const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { httpError } = require('../utils/access');
const profileService = require('./profileService');
const teamService = require('./teamService');

// Platform owner (SuperAdmin) only — enforced by the routes.

const ORG_COLUMNS = 'id, name, code, status, created_at, updated_at';

const countRows = async (table, organizationId, extra) => {
  let query = supabase.from(table).select('id', { count: 'exact', head: true }).eq('organization_id', organizationId);
  if (extra) query = extra(query);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

/** All businesses with a few headline numbers. */
const listOrganizations = async () => {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORG_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (org) => {
      const [users, agents, deliveries, admins] = await Promise.all([
        countRows('profiles', org.id),
        countRows('agents', org.id),
        countRows('deliveries', org.id),
        supabase
          .from('profiles')
          .select('name, email')
          .eq('organization_id', org.id)
          .eq('role', 'Admin')
          .order('created_at', { ascending: true })
          .limit(1),
      ]);
      if (admins.error) throw admins.error;
      return {
        ...org,
        counts: { users, agents, deliveries },
        primaryAdmin: admins.data && admins.data[0] ? admins.data[0] : null,
      };
    })
  );
};

/**
 * Create a business with its default team ("Main Team") and its first Admin.
 * All-or-nothing: if any step fails, everything created so far is removed.
 */
const createOrganization = async ({ name, code, admin }) => {
  const { data: codeTaken, error: codeErr } = await supabase
    .from('organizations')
    .select('id')
    .eq('code', code)
    .maybeSingle();
  if (codeErr) throw codeErr;
  if (codeTaken) throw httpError(409, `A business with code '${code}' already exists.`);

  const emailTaken = await profileService.getProfileByEmail(admin.email);
  if (emailTaken) throw httpError(409, `A user with email '${admin.email}' already exists.`);

  const now = new Date().toISOString();
  const { data: organization, error: orgErr } = await supabase
    .from('organizations')
    .insert([{ id: generateId('ORG'), name, code, status: 'Active', created_at: now, updated_at: now }])
    .select(ORG_COLUMNS)
    .single();
  if (orgErr) throw orgErr;

  try {
    const team = await teamService.createDefaultTeam(organization.id, generateId('TEAM'));
    const adminProfile = await profileService.createUserAccount({
      organizationId: organization.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: 'Admin',
      temporaryPassword: admin.temporaryPassword,
    });

    return {
      organization,
      team,
      admin: { id: adminProfile.id, name: adminProfile.name, email: adminProfile.email, role: adminProfile.role },
    };
  } catch (err) {
    // Deleting the business cascades to its team and any profile created above.
    // createUserAccount already removed its own login if it failed.
    const { error: cleanupErr } = await supabase.from('organizations').delete().eq('id', organization.id);
    if (cleanupErr) console.warn('Failed to clean up business after create failure:', cleanupErr.message);
    throw err;
  }
};

/** Suspend or re-activate a business. Suspended businesses cannot sign in. */
const setOrganizationStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('organizations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ORG_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data;
};

module.exports = {
  listOrganizations,
  createOrganization,
  setOrganizationStatus,
};
