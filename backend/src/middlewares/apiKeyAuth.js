const { supabase } = require('../config/supabase');
const { sendError } = require('../utils/apiResponse');
const { hashApiKey } = require('../services/merchantService');

/**
 * Authenticates external e-commerce / merchant requests using `x-api-key`
 * (or `Authorization: Bearer dk_...`). Resolves organizationId and merchant
 * strictly from the hashed key in the database — never from client payload.
 */
const requireApiKey = async (req, res, next) => {
  try {
    let rawKey = req.headers['x-api-key'];
    if (!rawKey && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      rawKey = req.headers.authorization.slice(7).trim();
    }

    if (!rawKey || typeof rawKey !== 'string') {
      return sendError(res, 401, 'Missing API key. Pass it in the x-api-key header.');
    }

    const keyHash = hashApiKey(rawKey.trim());

    const { data: keyRow, error: keyError } = await supabase
      .from('api_keys')
      .select('id, organization_id, merchant_id, status')
      .eq('key_hash', keyHash)
      .maybeSingle();

    if (keyError) throw keyError;
    if (!keyRow || keyRow.status !== 'Active') {
      return sendError(res, 401, 'Invalid or revoked API key.');
    }

    const [{ data: merchant, error: mErr }, { data: org, error: oErr }] = await Promise.all([
      supabase
        .from('merchants')
        .select('*')
        .eq('id', keyRow.merchant_id)
        .eq('organization_id', keyRow.organization_id)
        .maybeSingle(),
      supabase
        .from('organizations')
        .select('id, name, status')
        .eq('id', keyRow.organization_id)
        .maybeSingle(),
    ]);

    if (mErr) throw mErr;
    if (oErr) throw oErr;

    if (!merchant || merchant.status !== 'Active') {
      return sendError(res, 403, 'Merchant account is inactive or not found.');
    }
    if (!org || org.status !== 'Active') {
      return sendError(res, 403, 'Organization is suspended or not found.');
    }

    req.integration = {
      apiKeyId: keyRow.id,
      organizationId: keyRow.organization_id,
      organization: org,
      merchant,
    };

    // Update last_used_at without blocking the request
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRow.id)
      .then(() => {})
      .catch(() => {});

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { requireApiKey };
