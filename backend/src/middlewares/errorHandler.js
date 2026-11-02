const { sendError } = require('../utils/apiResponse');

/**
 * 404 Not Found Handler for unmatched routes
 */
const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Route '${req.method} ${req.originalUrl}' not found on this server.`);
};

/**
 * Centralized Global Error Handler
 * Hides raw database internals while logging details for debugging.
 */
const globalErrorHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  // Log error stack internally
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    code: err.code,
    stack: isDev ? err.stack : undefined,
  });

  // Explicit status code from app errors
  let statusCode = err.status || err.statusCode || 500;
  let userMessage = err.message || 'An unexpected error occurred.';

  // PostgREST / PostgreSQL specific error mappings
  if (err.code === 'PGRST116' || err.code === 'P0002') {
    // Record not found
    statusCode = 404;
    userMessage = 'Resource not found.';
  } else if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    userMessage = 'A record with these unique details already exists.';
  } else if (err.code === '23502') {
    // Not null violation
    statusCode = 400;
    userMessage = 'A required field cannot be empty.';
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    userMessage = 'Referenced related record does not exist.';
  } else if (err.code === '23514' || err.code === '22023' || err.code === '22000') {
    // Check constraint or custom business rule violation
    statusCode = 400;
    userMessage = err.message || 'Validation constraint failed.';
  } else if (err.message && (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND') || err.message.includes('EACCES'))) {
    // Database network connectivity issue
    statusCode = 503;
    userMessage = 'Database service is temporarily unreachable.';
  } else if (statusCode === 500) {
    // Generic message for unexpected 500 errors to prevent leaking DB metadata
    userMessage = 'Internal Server Error. Please try again later or contact support.';
  }

  return sendError(
    res,
    statusCode,
    userMessage,
    err.errors || (isDev ? { internalMessage: err.message } : null)
  );
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
