const { safeTrim } = require('../utils/sanitize');

const VALID_ROLES = ['Admin', 'Manager', 'Agent'];

const validateCreateProfile = (body = {}) => {
  const name = safeTrim(body.name);
  const email = safeTrim(body.email);
  // Default to lowest role 'Agent' instead of 'Admin'
  const role = safeTrim(body.role) || 'Agent';
  const phone = safeTrim(body.phone);
  const avatarUrl = safeTrim(body.avatarUrl || body.avatar_url);

  if (!name || !email) {
    return {
      error: {
        message: 'name and email are required fields for creating a profile.',
      },
    };
  }

  if (!VALID_ROLES.includes(role)) {
    return {
      error: {
        message: `Invalid role '${role}'. Must be one of: ${VALID_ROLES.join(', ')}`,
      },
    };
  }

  return {
    value: {
      id: safeTrim(body.id),
      name,
      email: email.toLowerCase(),
      role,
      phone,
      avatarUrl,
    },
  };
};

const validateUpdateProfile = (body = {}) => {
  const updates = {};

  if (body.name !== undefined) {
    const name = safeTrim(body.name);
    if (!name) return { error: { message: 'name cannot be empty.' } };
    updates.name = name;
  }
  if (body.email !== undefined) {
    const email = safeTrim(body.email);
    updates.email = email ? email.toLowerCase() : null;
  }
  if (body.role !== undefined) {
    const role = safeTrim(body.role);
    if (role && !VALID_ROLES.includes(role)) {
      return {
        error: {
          message: `Invalid role '${role}'. Must be one of: ${VALID_ROLES.join(', ')}`,
        },
      };
    }
    updates.role = role;
  }
  if (body.phone !== undefined) updates.phone = safeTrim(body.phone);
  if (body.avatarUrl !== undefined || body.avatar_url !== undefined) {
    updates.avatarUrl = safeTrim(body.avatarUrl || body.avatar_url);
  }

  return { value: updates };
};

module.exports = {
  VALID_ROLES,
  validateCreateProfile,
  validateUpdateProfile,
};

