const { safeTrim } = require('../utils/sanitize');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Z0-9][A-Z0-9-]{1,19}$/;

/** POST /api/platform/organizations { name, code, admin: { name, email, phone?, temporaryPassword } } */
const validateCreateOrganization = (body = {}) => {
  const name = safeTrim(body.name);
  const code = (safeTrim(body.code) || '').toUpperCase();
  const admin = body.admin && typeof body.admin === 'object' ? body.admin : {};
  const adminName = safeTrim(admin.name);
  const adminEmail = (safeTrim(admin.email) || '').toLowerCase();
  const adminPhone = safeTrim(admin.phone);
  const temporaryPassword = admin.temporaryPassword !== undefined ? String(admin.temporaryPassword) : '';

  if (!name || name.length < 2 || name.length > 100) {
    return { error: { message: 'Business name is required (2-100 characters).' } };
  }
  if (!CODE_RE.test(code)) {
    return { error: { message: 'Business code must be 2-20 characters: letters, numbers or dashes (e.g. QUICKKART).' } };
  }
  if (!adminName) {
    return { error: { message: "The first Admin's name is required." } };
  }
  if (!EMAIL_RE.test(adminEmail)) {
    return { error: { message: "The first Admin's email is not valid." } };
  }
  if (temporaryPassword.length < 8) {
    return { error: { message: 'Temporary password must be at least 8 characters long.' } };
  }

  return {
    value: {
      name,
      code,
      admin: { name: adminName, email: adminEmail, phone: adminPhone, temporaryPassword },
    },
  };
};

/** PATCH /api/platform/organizations/:id { status } */
const validateOrganizationStatus = (body = {}) => {
  const status = safeTrim(body.status);
  if (!['Active', 'Suspended'].includes(status)) {
    return { error: { message: "status must be 'Active' or 'Suspended'." } };
  }
  return { value: { status } };
};

/** PUT /api/organization { name?, settings? } (Admin) */
const validateUpdateOrganization = (body = {}) => {
  const value = {};
  if (body.name !== undefined) {
    const name = safeTrim(body.name);
    if (!name || name.length < 2 || name.length > 100) {
      return { error: { message: 'Business name must be 2-100 characters.' } };
    }
    value.name = name;
  }
  if (body.settings !== undefined) {
    if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) {
      return { error: { message: 'settings must be an object.' } };
    }
    value.settings = body.settings;
  }
  if (body.code !== undefined || body.status !== undefined) {
    return { error: { message: 'Business code and status can only be changed by the platform owner.' } };
  }
  return { value };
};

module.exports = {
  validateCreateOrganization,
  validateOrganizationStatus,
  validateUpdateOrganization,
};
