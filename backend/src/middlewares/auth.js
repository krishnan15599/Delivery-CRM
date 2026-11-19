const crypto = require('crypto');
const env = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const { supabase } = require('../config/supabase');
const { loadUserContext, getProfileForContext } = require('../services/userContextService');
const { findTenantField } = require('../utils/access');

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
 * Tests sign tokens that already contain the full user context
 * (there are no real accounts behind them). Only honoured when NODE_ENV=test.
 */
const testUserFromPayload = (payload) => ({
  id: payload.id || payload.sub,
  name: payload.name || 'Test User',
  email: payload.email || null,
  role: payload.role,
  phone: null,
  avatarUrl: null,
  status: 'Active',
  organizationId: payload.organizationId || null,
  organization: payload.organizationId
    ? { id: payload.organizationId, name: 'Test Business', code: 'TEST', status: 'Active' }
    : null,
  teamIds: Array.isArray(payload.teamIds) ? payload.teamIds : [],
  agentId: payload.agentId || null,
});

const setContextFromProfile = async (req, profile) => {
  const ctx = await loadUserContext(profile);
  if (ctx.error) {
    req.authError = ctx.error;
  } else {
    req.user = ctx.user;
  }
};

/**
 * Extract and authenticate the user from the Authorization header.
 *  1. Backend-signed JWT ({ sub: profileId }) - issued by POST /api/auth/login
 *  2. Supabase access token - sessions issued before backend tokens were used
 * In both cases the profile, business and teams are re-loaded from the database,
 * so nothing about permissions is trusted from the token itself.
 * Sets req.user, or req.authError ({ status, message }) when the account is blocked.
 */
const authenticate = async (req, _res, next) => {
  req.user = null;
  req.authError = null;

  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return next();

  const token = parts[1];

  const decoded = verifyJWT(token);
  if (decoded) {
    if (process.env.NODE_ENV === 'test' && decoded.role) {
      req.user = testUserFromPayload(decoded);
      return next();
    }
    if (!decoded.sub || !supabase) return next();
    try {
      const profile = await getProfileForContext('id', decoded.sub);
      await setContextFromProfile(req, profile);
    } catch (_err) {
      req.authError = { status: 503, message: 'Could not verify your session right now. Please try again.' };
    }
    return next();
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) {
        const profile = await getProfileForContext('auth_user_id', data.user.id);
        await setContextFromProfile(req, profile);
      }
    } catch (_authErr) {
      // Invalid or expired Supabase token: treated as not signed in
    }
  }

  return next();
};

const rejectUnauthenticated = (req, res) => {
  if (req.authError) {
    return sendError(res, req.authError.status, req.authError.message);
  }
  return sendError(
    res,
    401,
    'Authentication required. Please provide a valid Bearer token in the Authorization header.'
  );
};

/**
 * Require valid authenticated user
 */
const requireAuth = (req, res, next) => {
  if (!req.user) return rejectUnauthenticated(req, res);
  next();
};

/**
 * Restrict route access to specific roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return rejectUnauthenticated(req, res);
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

/**
 * Business data routes: only users who belong to a business (not the SuperAdmin).
 */
const requireOrgUser = (req, res, next) => {
  if (!req.user) return rejectUnauthenticated(req, res);
  if (req.user.role === 'SuperAdmin' || !req.user.organizationId) {
    return sendError(res, 403, 'This area is only available to business users.');
  }
  next();
};

/**
 * Platform routes: only the platform owner.
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return rejectUnauthenticated(req, res);
  if (req.user.role !== 'SuperAdmin') {
    return sendError(res, 403, 'Only the platform owner can do this.');
  }
  next();
};

/**
 * organization_id always comes from the signed-in user, never from the client.
 */
const rejectTenantFields = (req, res, next) => {
  const field = findTenantField(req.body) || findTenantField(req.query);
  if (field) {
    return sendError(res, 400, `'${field}' cannot be set by the client. Your business is taken from your login.`);
  }
  next();
};

module.exports = {
  signJWT,
  verifyJWT,
  authenticate,
  requireAuth,
  requireRole,
  requireOrgUser,
  requireSuperAdmin,
  rejectTenantFields,
};
