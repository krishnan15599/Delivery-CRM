const { supabase } = require('../config/supabase');
const { generateId, generateTrackingNumber } = require('../utils/idGenerator');
const { httpError } = require('../utils/access');

const resolveIntegrationTeamId = async (organizationId, requestedTeamId, merchantDefaultTeamId) => {
  const candidate = requestedTeamId || merchantDefaultTeamId;
  if (candidate) {
    const { data, error } = await supabase
      .from('teams')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('id', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.status !== 'Active') {
      throw httpError(400, `Hub/Team '${candidate}' is not available or inactive.`);
    }
    return data.id;
  }

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, is_default')
    .eq('organization_id', organizationId)
    .eq('status', 'Active')
    .order('is_default', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!teams || teams.length === 0) {
    throw httpError(400, 'No active Hub/Team found for this organization.');
  }
  return teams[0].id;
};

const formatOrderSummary = (delivery, deduplicated = false) => ({
  id: delivery.id,
  trackingNumber: delivery.tracking_number,
  trackingToken: delivery.tracking_token,
  trackingUrl: delivery.tracking_token ? `/track/${delivery.tracking_token}` : null,
  externalOrderId: delivery.external_order_id || null,
  status: delivery.status,
  paymentStatus: delivery.payment_status,
  teamId: delivery.team_id,
  createdAt: delivery.created_at,
  deduplicated,
});

const createOrderFromMerchant = async (integration, input) => {
  const { organizationId, merchant } = integration;

  // Idempotency: return existing delivery if externalOrderId already exists for this merchant
  if (input.externalOrderId) {
    const { data: existing, error: exErr } = await supabase
      .from('deliveries')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('merchant_id', merchant.id)
      .eq('external_order_id', input.externalOrderId)
      .maybeSingle();

    if (exErr) throw exErr;
    if (existing) {
      return formatOrderSummary(existing, true);
    }
  }

  const teamId = await resolveIntegrationTeamId(
    organizationId,
    input.teamId,
    merchant.default_team_id
  );

  const deliveryId = generateId('DEL');
  const trackingNumber = generateTrackingNumber();

  const payload = {
    id: deliveryId,
    trackingNumber,
    teamId,
    merchantId: merchant.id,
    externalOrderId: input.externalOrderId || null,
    customerId: null,
    customerName: input.customerName,
    customerPhone: input.customerPhone || null,
    pickupAddress: input.pickupAddress || merchant.pickup_address,
    deliveryAddress: input.deliveryAddress,
    city: input.city || merchant.city || 'Chennai',
    pincode: input.pincode || null,
    packageType: input.packageType || 'Standard',
    itemDescription: input.itemDescription || null,
    amount: input.amount || 0,
    codAmount: input.codAmount !== undefined ? input.codAmount : (input.amount || 0),
    agentId: null,
    paymentStatus: input.paymentStatus || null,
    notes: input.notes || null,
    scheduledDate: input.scheduledDate || null,
  };

  const { data: rpcData, error: rpcError } = await supabase.rpc('create_delivery', {
    p_organization_id: organizationId,
    p_delivery: payload,
    p_user_id: null,
    p_user_name: merchant.name,
  });

  if (rpcError) throw rpcError;
  return formatOrderSummary(rpcData, false);
};

const getOrderByTrackingNumber = async (integration, trackingNumber) => {
  const { organizationId, merchant } = integration;
  const { data, error } = await supabase
    .from('deliveries')
    .select('id, tracking_number, tracking_token, external_order_id, status, payment_status, timeline, scheduled_date, team_id, created_at, updated_at')
    .eq('organization_id', organizationId)
    .eq('merchant_id', merchant.id)
    .eq('tracking_number', trackingNumber)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...formatOrderSummary(data, false),
    scheduledDate: data.scheduled_date,
    timeline: data.timeline || [],
    updatedAt: data.updated_at,
  };
};

module.exports = {
  createOrderFromMerchant,
  getOrderByTrackingNumber,
};
