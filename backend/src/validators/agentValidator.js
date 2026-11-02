const { safeTrim } = require('../utils/sanitize');

const VALID_VEHICLE_TYPES = ['Bike', 'Scooter', 'Van', 'Truck'];
const VALID_AGENT_STATUSES = ['Active', 'On Delivery', 'Off Duty', 'Inactive'];

const validateCreateAgent = (body = {}) => {
  const name = safeTrim(body.name);
  const phone = safeTrim(body.phone);
  const email = safeTrim(body.email);
  const vehicleType = safeTrim(body.vehicleType || body.vehicle_type) || 'Bike';
  const vehicleNumber = safeTrim(body.vehicleNumber || body.vehicle_number) || '';
  const status = safeTrim(body.status) || 'Active';
  const hubLocation = safeTrim(body.hubLocation || body.hub_location) || 'Chennai Central Hub';
  let rating = 5.0;
  if (body.rating !== undefined) {
    const val = Number(body.rating);
    if (!Number.isFinite(val) || val < 0 || val > 5) {
      return { error: { message: 'rating must be a number between 0 and 5.' } };
    }
    rating = val;
  }
  const joiningDate = safeTrim(body.joiningDate || body.joining_date) || new Date().toISOString().split('T')[0];
  const avatarUrl = safeTrim(body.avatarUrl || body.avatar_url);

  if (!name || !phone) {
    return {
      error: { message: 'name and phone are required fields for creating an agent.' },
    };
  }

  if (vehicleType && !VALID_VEHICLE_TYPES.includes(vehicleType)) {
    return {
      error: {
        message: `Invalid vehicleType '${vehicleType}'. Must be one of: ${VALID_VEHICLE_TYPES.join(', ')}`,
      },
    };
  }

  if (status && !VALID_AGENT_STATUSES.includes(status)) {
    return {
      error: {
        message: `Invalid status '${status}'. Must be one of: ${VALID_AGENT_STATUSES.join(', ')}`,
      },
    };
  }

  return {
    value: {
      id: safeTrim(body.id),
      name,
      phone,
      email: email ? email.toLowerCase() : null,
      vehicleType,
      vehicleNumber,
      status,
      hubLocation,
      rating,
      joiningDate,
      avatarUrl,
    },
  };
};

const validateUpdateAgent = (body = {}) => {
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
  if (body.email !== undefined) {
    const email = safeTrim(body.email);
    updates.email = email ? email.toLowerCase() : null;
  }
  const vType = body.vehicleType || body.vehicle_type;
  if (vType !== undefined) {
    const trimmed = safeTrim(vType);
    if (trimmed && !VALID_VEHICLE_TYPES.includes(trimmed)) {
      return {
        error: { message: `Invalid vehicleType. Must be: ${VALID_VEHICLE_TYPES.join(', ')}` },
      };
    }
    updates.vehicleType = trimmed;
  }
  const vNum = body.vehicleNumber || body.vehicle_number;
  if (vNum !== undefined) updates.vehicleNumber = safeTrim(vNum);

  const hub = body.hubLocation || body.hub_location;
  if (hub !== undefined) updates.hubLocation = safeTrim(hub);

  const status = body.status;
  if (status !== undefined) {
    const trimmedStatus = safeTrim(status);
    if (trimmedStatus && !VALID_AGENT_STATUSES.includes(trimmedStatus)) {
      return {
        error: { message: `Invalid status. Must be: ${VALID_AGENT_STATUSES.join(', ')}` },
      };
    }
    updates.status = trimmedStatus;
  }

  if (body.rating !== undefined) {
    const val = Number(body.rating);
    if (!Number.isFinite(val) || val < 0 || val > 5) {
      return { error: { message: 'rating must be a number between 0 and 5.' } };
    }
    updates.rating = val;
  }
  if (body.avatarUrl !== undefined || body.avatar_url !== undefined) {
    updates.avatarUrl = safeTrim(body.avatarUrl || body.avatar_url);
  }

  return { value: updates };
};

const validateUpdateAgentStatus = (body = {}) => {
  const status = safeTrim(body.status);
  if (!status || !VALID_AGENT_STATUSES.includes(status)) {
    return {
      error: {
        message: `Invalid status. Must be one of: ${VALID_AGENT_STATUSES.join(', ')}`,
      },
    };
  }
  return { value: { status } };
};

module.exports = {
  VALID_VEHICLE_TYPES,
  VALID_AGENT_STATUSES,
  validateCreateAgent,
  validateUpdateAgent,
  validateUpdateAgentStatus,
};

