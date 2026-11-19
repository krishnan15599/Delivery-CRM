const { safeTrim } = require('../utils/sanitize');

const VALID_ROLES = ['Admin', 'Manager', 'Agent'];

const validateCreateProfile = (body = {}) => {
  const name = safeTrim(body.name);
  const email = safeTrim(body.email);
  const temporaryPassword = body.temporaryPassword !== undefined ? String(body.temporaryPassword) : '';
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

  if (!temporaryPassword || temporaryPassword.length < 8) {
    return {
      error: {
        message: 'temporaryPassword is required and must be at least 8 characters long.',
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

  const teamIdsResult = parseTeamIds(body.teamIds);
  if (teamIdsResult.error) return teamIdsResult;

  return {
    value: {
      name,
      email: email.toLowerCase(),
      temporaryPassword,
      role,
      phone,
      avatarUrl,
      // Agent: which team (default team if omitted) + the agents-table details
      teamId: safeTrim(body.teamId || body.team_id),
      vehicleType: safeTrim(body.vehicleType || body.vehicle_type),
      vehicleNumber: safeTrim(body.vehicleNumber || body.vehicle_number),
      hubLocation: safeTrim(body.hubLocation || body.hub_location),
      // Manager: which teams they manage (default team if omitted)
      teamIds: teamIdsResult.value,
    },
  };
};

const parseTeamIds = (raw) => {
  if (raw === undefined || raw === null) return { value: undefined };
  if (!Array.isArray(raw)) return { error: { message: 'teamIds must be an array of team IDs.' } };
  return { value: raw.map((id) => safeTrim(id)).filter(Boolean) };
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
  if (body.status !== undefined) {
    const status = safeTrim(body.status);
    if (!['Active', 'Inactive'].includes(status)) {
      return { error: { message: "status must be 'Active' or 'Inactive'." } };
    }
    updates.status = status;
  }
  if (body.teamIds !== undefined) {
    const teamIdsResult = parseTeamIds(body.teamIds);
    if (teamIdsResult.error) return teamIdsResult;
    updates.teamIds = teamIdsResult.value;
  }

  return { value: updates };
};

module.exports = {
  VALID_ROLES,
  validateCreateProfile,
  validateUpdateProfile,
};

