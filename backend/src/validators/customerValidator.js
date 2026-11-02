const { safeTrim } = require('../utils/sanitize');

const validateCreateCustomer = (body = {}) => {
  const name = safeTrim(body.name);
  const email = safeTrim(body.email);
  const phone = safeTrim(body.phone);
  const address = safeTrim(body.address);
  const city = safeTrim(body.city) || 'Chennai';
  const state = safeTrim(body.state) || 'Tamil Nadu';
  const pincode = safeTrim(body.pincode);
  const status = safeTrim(body.status) || 'Active';

  const totalOrders = parseInt(body.totalOrders ?? body.total_orders, 10);
  const totalSpent = parseFloat(body.totalSpent ?? body.total_spent);

  if (!name || !phone || !address) {
    return {
      error: {
        message: 'name, phone, and address are required fields for creating a customer.',
      },
    };
  }

  if (status && !['Active', 'Inactive'].includes(status)) {
    return {
      error: {
        message: "Status must be either 'Active' or 'Inactive'.",
      },
    };
  }

  return {
    value: {
      id: safeTrim(body.id),
      name,
      email: email ? email.toLowerCase() : null,
      phone,
      address,
      city,
      state,
      pincode,
      status,
      totalOrders: Number.isFinite(totalOrders) ? totalOrders : 0,
      totalSpent: Number.isFinite(totalSpent) ? totalSpent : 0.0,
    },
  };
};

const validateUpdateCustomer = (body = {}) => {
  const updates = {};

  if (body.name !== undefined) {
    const name = safeTrim(body.name);
    if (!name) return { error: { message: 'name cannot be empty.' } };
    updates.name = name;
  }
  if (body.email !== undefined) updates.email = safeTrim(body.email)?.toLowerCase() || null;
  if (body.phone !== undefined) {
    const phone = safeTrim(body.phone);
    if (!phone) return { error: { message: 'phone cannot be empty.' } };
    updates.phone = phone;
  }
  if (body.address !== undefined) {
    const address = safeTrim(body.address);
    if (!address) return { error: { message: 'address cannot be empty.' } };
    updates.address = address;
  }
  if (body.city !== undefined) updates.city = safeTrim(body.city);
  if (body.state !== undefined) updates.state = safeTrim(body.state);
  if (body.pincode !== undefined) updates.pincode = safeTrim(body.pincode);
  if (body.status !== undefined) {
    const status = safeTrim(body.status);
    if (status && !['Active', 'Inactive'].includes(status)) {
      return {
        error: { message: "Status must be either 'Active' or 'Inactive'." },
      };
    }
    updates.status = status;
  }

  const rawOrders = body.totalOrders ?? body.total_orders;
  if (rawOrders !== undefined) {
    const orders = parseInt(rawOrders, 10);
    if (Number.isFinite(orders)) updates.totalOrders = orders;
  }

  const rawSpent = body.totalSpent ?? body.total_spent;
  if (rawSpent !== undefined) {
    const spent = parseFloat(rawSpent);
    if (Number.isFinite(spent)) updates.totalSpent = spent;
  }

  return { value: updates };
};

module.exports = {
  validateCreateCustomer,
  validateUpdateCustomer,
};

