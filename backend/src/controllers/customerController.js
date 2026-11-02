const customerService = require('../services/customerService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');

const getCustomers = async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  if (result.isPaginated) {
    return sendPaginated(res, result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.count,
    });
  }
  return sendSuccess(res, 200, 'Customers fetched successfully', result.data, {
    total: result.count,
  });
};

const getCustomerById = async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  if (!customer) {
    return sendError(res, 404, `Customer with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Customer details retrieved successfully', customer);
};

const createCustomer = async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  return sendSuccess(res, 201, 'Customer created successfully', customer);
};

const updateCustomer = async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  if (!customer) {
    return sendError(res, 404, `Customer with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Customer updated successfully', customer);
};

const deleteCustomer = async (req, res) => {
  const success = await customerService.deleteCustomer(req.params.id);
  if (!success) {
    return sendError(res, 404, `Customer with ID '${req.params.id}' not found or already deleted.`);
  }
  return sendSuccess(res, 200, 'Customer deleted successfully', { id: req.params.id });
};

const getCustomerDeliveries = async (req, res) => {
  const deliveries = await customerService.getCustomerDeliveries(req.params.id);
  return sendSuccess(res, 200, 'Customer deliveries retrieved successfully', deliveries);
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerDeliveries,
};

