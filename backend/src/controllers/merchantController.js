const merchantService = require('../services/merchantService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getMerchants = async (req, res) => {
  const result = await merchantService.listMerchants(req.user, req.query);
  return sendSuccess(res, 200, 'Merchants fetched successfully', result.data, {
    total: result.count,
  });
};

const getMerchantById = async (req, res) => {
  const merchant = await merchantService.getMerchantById(req.user, req.params.id);
  if (!merchant) {
    return sendError(res, 404, `Merchant with ID '${req.params.id}' not found.`);
  }
  return sendSuccess(res, 200, 'Merchant details retrieved', merchant);
};

const createMerchant = async (req, res) => {
  const merchant = await merchantService.createMerchant(req.user, req.body);
  return sendSuccess(res, 201, 'Merchant created successfully', merchant);
};

const updateMerchant = async (req, res) => {
  const merchant = await merchantService.updateMerchant(req.user, req.params.id, req.body);
  if (!merchant) {
    return sendError(res, 404, `Merchant with ID '${req.params.id}' not found.`);
  }
  return sendSuccess(res, 200, 'Merchant updated successfully', merchant);
};

const deleteMerchant = async (req, res) => {
  const deleted = await merchantService.deleteMerchant(req.user, req.params.id);
  if (!deleted) {
    return sendError(res, 404, `Merchant with ID '${req.params.id}' not found.`);
  }
  return sendSuccess(res, 200, 'Merchant deleted successfully', { id: req.params.id });
};

const listApiKeys = async (req, res) => {
  const keys = await merchantService.listApiKeys(req.user, req.params.id);
  if (keys === null) {
    return sendError(res, 404, `Merchant with ID '${req.params.id}' not found.`);
  }
  return sendSuccess(res, 200, 'API keys fetched successfully', keys);
};

const createApiKey = async (req, res) => {
  const created = await merchantService.createApiKey(req.user, req.params.id, req.body.name);
  if (!created) {
    return sendError(res, 404, `Merchant with ID '${req.params.id}' not found.`);
  }
  return sendSuccess(
    res,
    201,
    'API key generated. Copy it now — it will not be shown again.',
    created
  );
};

const revokeApiKey = async (req, res) => {
  const revoked = await merchantService.revokeApiKey(req.user, req.params.id, req.params.keyId);
  if (!revoked) {
    return sendError(res, 404, 'API key not found.');
  }
  return sendSuccess(res, 200, 'API key revoked successfully', revoked);
};

module.exports = {
  getMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  listApiKeys,
  createApiKey,
  revokeApiKey,
};
