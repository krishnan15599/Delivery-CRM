const { isDbConfigured } = require('../config/supabase');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to verify database connectivity before executing controller logic
 */
const ensureDb = (_req, res, next) => {
  if (!isDbConfigured()) {
    return sendError(
      res,
      503,
      'Database service is currently unavailable. Please verify SUPABASE_URL and key configuration.'
    );
  }
  next();
};

module.exports = {
  ensureDb,
};

