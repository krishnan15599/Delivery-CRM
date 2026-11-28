const { safeTrim } = require('../utils/sanitize');

const validateCreateMerchant = (body = {}) => {
  const name = safeTrim(body.name);
  const phone = safeTrim(body.phone);
  const pickupAddress = safeTrim(body.pickupAddress || body.pickup_address);

  if (!name || !phone || !pickupAddress) {
    return {
      error: { message: 'name, phone, and pickupAddress are required fields.' },
    };
  }

  const status = safeTrim(body.status) || 'Active';
  if (!['Active', 'Inactive'].includes(status)) {
    return { error: { message: 'status must be Active or Inactive.' } };
  }

  return {
    value: {
      name,
      contactName: safeTrim(body.contactName || body.contact_name),
      email: safeTrim(body.email),
      phone,
      pickupAddress,
      city: safeTrim(body.city) || 'Chennai',
      pincode: safeTrim(body.pincode),
      defaultTeamId: safeTrim(body.defaultTeamId || body.default_team_id),
      webhookUrl: safeTrim(body.webhookUrl || body.webhook_url),
      status,
    },
  };
};

const validateUpdateMerchant = (body = {}) => {
  const updates = {};

  if (body.name !== undefined) {
    const name = safeTrim(body.name);
    if (!name) return { error: { message: 'name cannot be empty.' } };
    updates.name = name;
  }
  if (body.phone !== undefined) {
    const phone = safeTrim(body.phone);
    if (!phone) return { error: { message: 'phone cannot be empty.' } };
    updates.phone = phone;
  }
  if (body.pickupAddress !== undefined || body.pickup_address !== undefined) {
    const pickupAddress = safeTrim(body.pickupAddress ?? body.pickup_address);
    if (!pickupAddress) return { error: { message: 'pickupAddress cannot be empty.' } };
    updates.pickupAddress = pickupAddress;
  }
  if (body.contactName !== undefined || body.contact_name !== undefined) {
    updates.contactName = safeTrim(body.contactName ?? body.contact_name);
  }
  if (body.email !== undefined) updates.email = safeTrim(body.email);
  if (body.city !== undefined) updates.city = safeTrim(body.city) || 'Chennai';
  if (body.pincode !== undefined) updates.pincode = safeTrim(body.pincode);
  if (body.defaultTeamId !== undefined || body.default_team_id !== undefined) {
    updates.defaultTeamId = safeTrim(body.defaultTeamId ?? body.default_team_id);
  }
  if (body.webhookUrl !== undefined || body.webhook_url !== undefined) {
    updates.webhookUrl = safeTrim(body.webhookUrl ?? body.webhook_url);
  }
  if (body.status !== undefined) {
    const status = safeTrim(body.status);
    if (!['Active', 'Inactive'].includes(status)) {
      return { error: { message: 'status must be Active or Inactive.' } };
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return { error: { message: 'No valid merchant fields provided for update.' } };
  }

  return { value: updates };
};

const validateCreateApiKey = (body = {}) => {
  const name = safeTrim(body.name) || 'Default Key';
  if (name.length > 120) {
    return { error: { message: 'API key name must be 120 characters or fewer.' } };
  }
  return { value: { name } };
};

module.exports = {
  validateCreateMerchant,
  validateUpdateMerchant,
  validateCreateApiKey,
};
