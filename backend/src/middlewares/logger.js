/**
 * HTTP Request Logging Middleware
 * Logs method, URL, status code, duration (ms), and client IP
 */
const requestLogger = (req, res, next) => {
  const start = process.hrtime();
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);
    const status = res.statusCode;
    console.log(`[${timestamp}] ${method} ${url} ${status} - ${durationMs}ms - IP: ${ip}`);
  });

  next();
};

module.exports = {
  requestLogger,
};
