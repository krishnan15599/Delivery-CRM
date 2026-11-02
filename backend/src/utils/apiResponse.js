/**
 * Standardized API Response Utilities
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, meta = null) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, data = [], pagination = {}) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || data.length,
      total: pagination.total !== undefined ? pagination.total : data.length,
      totalPages: pagination.pageSize ? Math.ceil((pagination.total || 0) / pagination.pageSize) : 1,
    },
  });
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};

