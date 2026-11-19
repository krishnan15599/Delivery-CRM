const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeSearchQuery } = require('../utils/sanitize');

const listProfiles = async (filters = {}) => {
  const { role, search } = filters;

  let query = supabase.from('profiles').select('*');

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

const getProfileById = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const getProfileByEmail = async (email) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data;
};

const createProfile = async (input, { createAgentRecord = true } = {}) => {
  const email = input.email.toLowerCase().trim();

  // Check if profile with email already exists
  const existing = await getProfileByEmail(email);
  if (existing) {
    const err = new Error(`A profile with email '${input.email}' already exists.`);
    err.status = 409;
    throw err;
  }

  let authUserId = null;
  if (supabase?.auth?.admin) {
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: input.temporaryPassword,
      email_confirm: true,
      user_metadata: { name: input.name },
    });

    if (authErr) {
      const err = new Error(authErr.message || 'Failed to create auth user in Supabase.');
      err.status = authErr.status || 400;
      throw err;
    }

    authUserId = authData.user.id;
  }

  const profileId = input.id || generateId('USR');
  const now = new Date().toISOString();

  const record = {
    id: profileId,
    auth_user_id: authUserId,
    name: input.name,
    email,
    // Default to lowest role 'Agent'
    role: input.role || 'Agent',
    phone: input.phone || null,
    avatar_url: input.avatarUrl || null,
    created_at: now,
    updated_at: now,
  };

  let data;
  try {
    const { data: inserted, error } = await supabase
      .from('profiles')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    data = inserted;
  } catch (insertError) {
    // If the profile insert fails, call supabase.auth.admin.deleteUser so nothing is left half-created
    if (authUserId && supabase?.auth?.admin) {
      try {
        await supabase.auth.admin.deleteUser(authUserId);
      } catch (_delErr) {
        console.warn('Failed to rollback auth user creation after profile insert failed:', _delErr.message);
      }
    }
    throw insertError;
  }

  // If role is Agent and createAgentRecord is true, ensure a corresponding agent roster record exists in Supabase agents table
  if (record.role === 'Agent' && createAgentRecord) {
    try {
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id')
        .eq('email', record.email)
        .maybeSingle();

      if (!existingAgent) {
        await supabase.from('agents').insert([
          {
            id: generateId('AG'),
            user_id: data.id,
            name: record.name,
            email: record.email,
            phone: record.phone || '',
            vehicle_type: input.vehicleType || 'Bike',
            vehicle_number: input.vehicleNumber || '',
            hub_location: input.hubLocation || 'Indiranagar Hub',
            status: 'Active',
            created_at: now,
            updated_at: now,
          },
        ]);
      }
    } catch (_agentErr) {
      console.warn('Could not auto-create linked agent record in Supabase:', _agentErr.message);
    }
  }

  return data;
};

const updateProfile = async (id, input) => {
  const existing = await getProfileById(id);
  if (!existing) return null;

  // When email changes and profile has an auth_user_id, update Supabase Auth first
  if (input.email !== undefined && input.email) {
    const newEmail = input.email.toLowerCase().trim();
    if (newEmail !== existing.email?.toLowerCase().trim() && existing.auth_user_id) {
      if (supabase?.auth?.admin) {
        const { error: authUpdateErr } = await supabase.auth.admin.updateUserById(
          existing.auth_user_id,
          { email: newEmail, email_confirm: true }
        );
        if (authUpdateErr) {
          const err = new Error(authUpdateErr.message || 'Failed to update auth user email in Supabase.');
          err.status = authUpdateErr.status || 400;
          throw err;
        }
      }
    }
  }

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.email !== undefined) updatePayload.email = input.email ? input.email.toLowerCase().trim() : null;
  if (input.role !== undefined) updatePayload.role = input.role;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.avatarUrl !== undefined) updatePayload.avatar_url = input.avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteProfile = async (id) => {
  const existing = await getProfileById(id);
  if (!existing) return false;

  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;

  // Deleting a profile also deletes its auth user
  if (existing.auth_user_id && supabase?.auth?.admin) {
    try {
      await supabase.auth.admin.deleteUser(existing.auth_user_id);
    } catch (_authDelErr) {
      console.warn('Failed to delete linked auth user in Supabase:', _authDelErr.message);
    }
  }

  return data && data.length > 0;
};

module.exports = {
  listProfiles,
  getProfileById,
  getProfileByEmail,
  createProfile,
  updateProfile,
  deleteProfile,
};

