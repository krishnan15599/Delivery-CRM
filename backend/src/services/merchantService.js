const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { generateId } = require('../utils/idGenerator');
const { sanitizeSearchQuery } = require('../utils/sanitize');
const { httpError } = require('../utils/access');

const hashApiKey = (rawKey) =>
  crypto.createHash('sha256').update(String(rawKey)).digest('hex');

const listMerchants = async (user, filters = {}) => {
  let query = supabase
    .from('merchants')
    .select('*', { count: 'exact' })
    .eq('organization_id', user.organizationId)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const cleanSearch = sanitizeSearchQuery(filters.search);
  if (cleanSearch) {
    query = query.or(
      `name.ilike.%${cleanSearch}%,contact_name.ilike.%${cleanSearch}%,phone.ilike.%${cleanSearch}%,city.ilike.%${cleanSearch}%`
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

const getMerchantById = async (user, id) => {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const assertTeamInOrg = async (organizationId, teamId) => {
  if (!teamId) return;
  const { data, error } = await supabase
    .from('teams')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('id', teamId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(400, `Hub/Team with ID '${teamId}' not found in your business.`);
};

const createMerchant = async (user, input) => {
  await assertTeamInOrg(user.organizationId, input.defaultTeamId);

  const now = new Date().toISOString();
  const payload = {
    id: generateId('MER'),
    organization_id: user.organizationId,
    name: input.name,
    contact_name: input.contactName || null,
    email: input.email || null,
    phone: input.phone,
    pickup_address: input.pickupAddress,
    city: input.city || 'Chennai',
    pincode: input.pincode || null,
    default_team_id: input.defaultTeamId || null,
    webhook_url: input.webhookUrl || null,
    status: input.status || 'Active',
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('merchants')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const updateMerchant = async (user, id, input) => {
  const existing = await getMerchantById(user, id);
  if (!existing) return null;

  if (input.defaultTeamId !== undefined) {
    await assertTeamInOrg(user.organizationId, input.defaultTeamId);
  }

  const updatePayload = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.contactName !== undefined) updatePayload.contact_name = input.contactName;
  if (input.email !== undefined) updatePayload.email = input.email;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.pickupAddress !== undefined) updatePayload.pickup_address = input.pickupAddress;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.pincode !== undefined) updatePayload.pincode = input.pincode;
  if (input.defaultTeamId !== undefined) updatePayload.default_team_id = input.defaultTeamId;
  if (input.webhookUrl !== undefined) updatePayload.webhook_url = input.webhookUrl;
  if (input.status !== undefined) updatePayload.status = input.status;

  const { data, error } = await supabase
    .from('merchants')
    .update(updatePayload)
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

const deleteMerchant = async (user, id) => {
  const { data, error } = await supabase
    .from('merchants')
    .delete()
    .eq('organization_id', user.organizationId)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

const listApiKeys = async (user, merchantId) => {
  const merchant = await getMerchantById(user, merchantId);
  if (!merchant) return null;

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, organization_id, merchant_id, name, key_prefix, status, last_used_at, created_at')
    .eq('organization_id', user.organizationId)
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

const createApiKey = async (user, merchantId, name = 'Default Key') => {
  const merchant = await getMerchantById(user, merchantId);
  if (!merchant) return null;

  const rawKey = `dk_live_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawKey.slice(0, 14);
  const keyHash = hashApiKey(rawKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      id: generateId('KEY'),
      organization_id: user.organizationId,
      merchant_id: merchantId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      status: 'Active',
      created_at: new Date().toISOString(),
    })
    .select('id, organization_id, merchant_id, name, key_prefix, status, last_used_at, created_at')
    .single();

  if (error) throw error;
  return { ...data, apiKey: rawKey };
};

const revokeApiKey = async (user, merchantId, keyId) => {
  const { data, error } = await supabase
    .from('api_keys')
    .update({ status: 'Revoked' })
    .eq('organization_id', user.organizationId)
    .eq('merchant_id', merchantId)
    .eq('id', keyId)
    .select('id, name, key_prefix, status')
    .maybeSingle();
  if (error) throw error;
  return data;
};

module.exports = {
  hashApiKey,
  listMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  listApiKeys,
  createApiKey,
  revokeApiKey,
};
