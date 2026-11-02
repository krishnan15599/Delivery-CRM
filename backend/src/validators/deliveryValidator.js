const { safeTrim } = require('../utils/sanitize');

const VALID_DELIVERY_STATUSES = [
  'Pending',
  'Assigned',
  'Picked Up',
  'In Transit',
  'Delivered',
  'Failed',
  'Returned',
];

const VALID_PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed'];

const normalizePaymentStatus = (val) => {
  if (!val) return 'Pending';
  const s = String(val).trim().toLowerCase();
  if (s === 'paid') return 'Paid';
  if (s === 'failed') return 'Failed';
  return 'Pending';
};

const validateCreateDelivery = (body = {}) => {
  const customerName = safeTrim(body.customerName || body.customer_name);
  const pickupAddress = safeTrim(body.pickupAddress || body.pickup_address);
  const deliveryAddress = safeTrim(body.deliveryAddress || body.delivery_address);

  if (!customerName || !pickupAddress || !deliveryAddress) {
    return {
      error: {
        message: 'customerName, pickupAddress, and deliveryAddress are required fields.',
      },
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
      id: safeTrim(body.id),
      trackingNumber: safeTrim(body.trackingNumber || body.tracking_number),
      customerId: safeTrim(body.customerId || body.customer_id),
      customerName,
      customerPhone: safeTrim(body.customerPhone || body.customer_phone),
      pickupAddress,
      deliveryAddress,
      city: safeTrim(body.city) || 'Chennai',
      pincode: safeTrim(body.pincode),
      packageType: safeTrim(body.packageType || body.package_type) || 'Standard',
      itemDescription: safeTrim(body.itemDescription || body.item_description),
      amount,
      codAmount,
      agentId: safeTrim(body.agentId || body.agent_id),
      paymentStatus,
      notes: safeTrim(body.notes),
      scheduledDate: safeTrim(body.scheduledDate || body.scheduled_date),
    },
  };
};

/**
 * Validates generic delivery update.
 * Note: Status cannot be updated via generic update to protect business rules.
 */
const validateUpdateDelivery = (body = {}) => {
  const updates = {};

  if (body.customerName !== undefined || body.customer_name !== undefined) {
    const name = safeTrim(body.customerName || body.customer_name);
    if (!name) return { error: { message: 'customerName cannot be empty.' } };
    updates.customerName = name;
  }
  if (body.customerPhone !== undefined || body.customer_phone !== undefined) {
    updates.customerPhone = safeTrim(body.customerPhone || body.customer_phone);
  }
  if (body.pickupAddress !== undefined || body.pickup_address !== undefined) {
    const addr = safeTrim(body.pickupAddress || body.pickup_address);
    if (!addr) return { error: { message: 'pickupAddress cannot be empty.' } };
    updates.pickupAddress = addr;
  }
  if (body.deliveryAddress !== undefined || body.delivery_address !== undefined) {
    const addr = safeTrim(body.deliveryAddress || body.delivery_address);
    if (!addr) return { error: { message: 'deliveryAddress cannot be empty.' } };
    updates.deliveryAddress = addr;
  }
  if (body.city !== undefined) updates.city = safeTrim(body.city);
  if (body.pincode !== undefined) updates.pincode = safeTrim(body.pincode);
  if (body.packageType !== undefined || body.package_type !== undefined) {
    updates.packageType = safeTrim(body.packageType || body.package_type);
  }
  if (body.itemDescription !== undefined || body.item_description !== undefined) {
    updates.itemDescription = safeTrim(body.itemDescription || body.item_description);
  }
  if (body.amount !== undefined) {
    const val = Number(body.amount);
    if (!Number.isFinite(val) || val < 0) {
      return { error: { message: 'amount must be a valid non-negative number.' } };
    }
    updates.amount = val;
  }
  if (body.codAmount !== undefined || body.cod_amount !== undefined) {
    const raw = body.codAmount ?? body.cod_amount;
    const val = Number(raw);
    if (!Number.isFinite(val) || val < 0) {
      return { error: { message: 'codAmount must be a valid non-negative number.' } };
    }
    updates.codAmount = val;
  }
  if (body.paymentStatus !== undefined || body.payment_status !== undefined) {
    updates.paymentStatus = normalizePaymentStatus(body.paymentStatus || body.payment_status);
  }
  if (body.notes !== undefined) updates.notes = safeTrim(body.notes);
  if (body.scheduledDate !== undefined || body.scheduled_date !== undefined) {
    updates.scheduledDate = safeTrim(body.scheduledDate || body.scheduled_date);
  }
  if (body.agentId !== undefined || body.agent_id !== undefined) {
    updates.agentId = safeTrim(body.agentId || body.agent_id);
  }

  // Reject direct status updates in generic update endpoint
  if (body.status !== undefined) {
    return {
      error: {
        message:
          "Changing delivery status directly via generic update is disabled. Please use PATCH /api/deliveries/:id/status to execute validated business state transitions.",
      },
    };
  }

  return { value: updates };
};

const validateDeliveryStatusTransition = (body = {}) => {
  const status = safeTrim(body.status);
  const note = safeTrim(body.note);

  if (!status || !VALID_DELIVERY_STATUSES.includes(status)) {
    return {
      error: {
        message: `Invalid status '${status}'. Must be one of: ${VALID_DELIVERY_STATUSES.join(', ')}`,
      },
    };
  }

  return {
    value: {
      status,
      note,
    },
  };
};

const validateBulkAssign = (body = {}) => {
  const deliveryIds = body.deliveryIds || body.delivery_ids;
  const agentId = safeTrim(body.agentId || body.agent_id);

  if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
    return {
      error: {
        message: 'deliveryIds must be a non-empty array of delivery IDs.',
      },
    };
  }

  if (!agentId) {
    return {
      error: {
        message: 'agentId is required for bulk assignment.',
      },
    };
  }

  return {
    value: {
      deliveryIds: deliveryIds.map((id) => String(id).trim()).filter(Boolean),
      agentId,
    },
  };
};

module.exports = {
  VALID_DELIVERY_STATUSES,
  VALID_PAYMENT_STATUSES,
  validateCreateDelivery,
  validateUpdateDelivery,
  validateDeliveryStatusTransition,
  validateBulkAssign,
};

