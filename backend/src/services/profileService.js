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

const createProfile = async (input) => {
  // Check if profile with email already exists
  const existing = await getProfileByEmail(input.email);
  if (existing) {
    const err = new Error(`A profile with email '${input.email}' already exists.`);
    err.status = 409;
    throw err;
  }

  const profileId = input.id || generateId('USR');
  const now = new Date().toISOString();

  const record = {
    id: profileId,
    name: input.name,
    email: input.email.toLowerCase(),
    // Default to lowest role 'Agent'
    role: input.role || 'Agent',
    phone: input.phone || null,
    avatar_url: input.avatarUrl || null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([record])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateProfile = async (id, input) => {
  const existing = await getProfileById(id);
  if (!existing) return null;

  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.email !== undefined) updatePayload.email = input.email;
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
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
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

