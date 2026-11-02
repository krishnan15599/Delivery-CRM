const deliveryService = require('../services/deliveryService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');

const getDeliveries = async (req, res) => {
  const result = await deliveryService.listDeliveries(req.query);
  if (result.isPaginated) {
    return sendPaginated(res, result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.count,
    });
  }
  return sendSuccess(res, 200, 'Deliveries retrieved successfully', result.data, {
    total: result.count,
  });
};

const getDeliveryById = async (req, res) => {
  const delivery = await deliveryService.getDeliveryById(req.params.id);
  if (!delivery) {
    return sendError(res, 404, `Delivery with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Delivery retrieved successfully', delivery);
};

const getDeliveryByTracking = async (req, res) => {
  const delivery = await deliveryService.getDeliveryByTrackingNumber(req.params.trackingNumber);
  if (!delivery) {
    return sendError(
      res,
      404,
      `Delivery with tracking number '${req.params.trackingNumber}' not found`
    );
  }
  return sendSuccess(res, 200, 'Delivery tracking info retrieved successfully', delivery);
};

const createDelivery = async (req, res) => {
  const delivery = await deliveryService.createDelivery(req.body, req.user);
  return sendSuccess(res, 201, 'Delivery created successfully', delivery);
};

const updateDelivery = async (req, res) => {
  const delivery = await deliveryService.updateDelivery(req.params.id, req.body);
  if (!delivery) {
    return sendError(res, 404, `Delivery with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Delivery updated successfully', delivery);
};

const updateDeliveryStatus = async (req, res) => {
  const { status, note } = req.body;
  const updatedBy = req.user?.name || req.user?.role || 'System';

  const delivery = await deliveryService.updateDeliveryStatus(
    req.params.id,
    status,
    note,
    updatedBy
  );

  if (!delivery) {
    return sendError(res, 404, `Delivery with ID '${req.params.id}' not found`);
  }

  return sendSuccess(
    res,
    200,
    `Delivery status transitioned to '${status}' successfully`,
    delivery
  );
};

const bulkAssignDeliveries = async (req, res) => {
  const { deliveryIds, agentId } = req.body;
  const updatedBy = req.user?.name || req.user?.role || 'Dispatcher';

  const result = await deliveryService.bulkAssignDeliveries(deliveryIds, agentId, updatedBy);
  return sendSuccess(
    res,
    200,
    `Successfully assigned ${result.assignedCount || 0} deliveries to agent '${result.agentName || agentId}'.`,
    result
  );
};

const deleteDelivery = async (req, res) => {
  const success = await deliveryService.deleteDelivery(req.params.id);
  if (!success) {
    return sendError(res, 404, `Delivery with ID '${req.params.id}' not found or already deleted.`);
  }
  return sendSuccess(res, 200, 'Delivery deleted successfully', { id: req.params.id });
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  getDeliveryByTracking,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  bulkAssignDeliveries,
  deleteDelivery,
};

