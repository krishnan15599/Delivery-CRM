const { sendError } = require('../utils/apiResponse');

/**
 * Validation middleware factory
 * @param {Function} validatorFn - Function receiving req.body and returning { error, value }
 */
const validateBody = (validatorFn) => {
  return (req, res, next) => {
    const { error, value } = validatorFn(req.body);
    if (error) {
      return sendError(res, 400, error.message || 'Validation Error', error.details || null);
    }
    req.body = value;
    next();
  };
};

module.exports = {
  validateBody,
};

