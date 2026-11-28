const { safeTrim } = require('../utils/sanitize');
const { normalizePaymentStatus } = require('./deliveryValidator');

const validateIntegrationOrder = (body = {}) => {
  const customerName = safeTrim(body.customerName || body.customer_name);
  const deliveryAddress = safeTrim(body.deliveryAddress || body.delivery_address);

  if (!customerName || !deliveryAddress) {
    return {
      error: { message: 'customerName and deliveryAddress are required fields.' },
    };
  }

  let amount = 0.0;
  if (body.amount !== undefined) {
    const val = Number(body.amount);
    if (!Number.isFinite(val) || val < 0) {
      return { error: { message: 'amount must be a valid non-negative number.' } };
    }
    amount = val;
  }

  const rawCod = body.codAmount ?? body.cod_amount;
  let codAmount = amount;
  if (rawCod !== undefined) {
    const val = Number(rawCod);
    if (!Number.isFinite(val) || val < 0) {
      return { error: { message: 'codAmount must be a valid non-negative number.' } };
    }
    codAmount = val;
  }

  const rawPaymentStatus = body.paymentStatus || body.payment_status;
  const paymentStatus = rawPaymentStatus
    ? normalizePaymentStatus(rawPaymentStatus)
    : (codAmount > 0 ? 'Pending' : 'Paid');

  return {
    value: {
      externalOrderId: safeTrim(body.externalOrderId || body.external_order_id),
      customerName,
      customerPhone: safeTrim(body.customerPhone || body.customer_phone),
      pickupAddress: safeTrim(body.pickupAddress || body.pickup_address),
      deliveryAddress,
      city: safeTrim(body.city) || 'Chennai',
      pincode: safeTrim(body.pincode),
      packageType: safeTrim(body.packageType || body.package_type) || 'Standard',
      itemDescription: safeTrim(body.itemDescription || body.item_description),
      amount,
      codAmount,
      paymentStatus,
      notes: safeTrim(body.notes),
      scheduledDate: safeTrim(body.scheduledDate || body.scheduled_date),
      teamId: safeTrim(body.teamId || body.team_id),
    },
  };
};

module.exports = {
  validateIntegrationOrder,
};
