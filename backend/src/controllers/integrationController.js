const integrationService = require('../services/integrationService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const createOrder = async (req, res) => {
  const result = await integrationService.createOrderFromMerchant(req.integration, req.body);
  const statusCode = result.deduplicated ? 200 : 201;
  const message = result.deduplicated
    ? 'Existing order returned for externalOrderId'
    : 'Delivery order created successfully';
  return sendSuccess(res, statusCode, message, result);
};

const getOrderStatus = async (req, res) => {
  const order = await integrationService.getOrderByTrackingNumber(
    req.integration,
    req.params.trackingNumber
  );
  if (!order) {
    return sendError(res, 404, `Order '${req.params.trackingNumber}' not found.`);
  }
  return sendSuccess(res, 200, 'Order status retrieved', order);
};

const createDemoOrder = async (req, res) => {
  const result = await integrationService.createDemoShopOrder(req.body);
  return sendSuccess(res, 201, 'Order placed successfully', result);
};

module.exports = {
  createOrder,
  getOrderStatus,
  createDemoOrder,
};
