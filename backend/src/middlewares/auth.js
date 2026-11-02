const crypto = require('crypto');
const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const { supabase } = require('../config/supabase');

/**
 * Sign standard HS256 JWT
 */
const signJWT = (payload, expiresInSec = 86400) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
};

/**
 * Verify HS256 JWT
 */
const verifyJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (
      expectedBuf.length !== signatureBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, signatureBuf)
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
};

/**
 * Extract and authenticate user from Authorization header.
 * Verifies backend-signed JWTs and Supabase Auth access tokens.
 * Hand-made mock tokens are rejected.
 */
const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    req.user = null;
    return next();
  }

  const token = parts[1];

  // 1. Verify standard backend-signed JWT
  const decoded = verifyJWT(token);
  if (decoded) {
    req.user = decoded;
    return next();
  }

  // 2. Verify Supabase Auth token if database client is initialized
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) {
        // Fetch user role from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('id', data.user.id)
          .maybeSingle();

        req.user = {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.user_metadata?.name || data.user.email.split('@')[0],
          role: profile?.role || 'Agent', // Default lowest role
        };
        return next();
      }
    } catch (_authErr) {
      // Failed Supabase verification
    }
  }

  req.user = null;
  return next();
};

/**
 * Require valid authenticated user
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return sendError(
      res,
      401,
      'Authentication required. Please provide a valid Bearer token in the Authorization header.'
    );
  }
  next();
};

/**
 * Restrict route access to specific roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden: Role '${req.user.role}' does not have permission to perform this action.`
      );
    }
    next();
  };
};

module.exports = {
  signJWT,
  verifyJWT,
  authenticate,
  requireAuth,
  requireRole,
};
