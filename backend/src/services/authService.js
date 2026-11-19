const { createAuthClient, isDbConfigured } = require('../config/supabase');
const { signJWT } = require('../middlewares/auth');
const { loadUserContext, getProfileForContext } = require('./userContextService');

const TOKEN_TTL_SECONDS = 24 * 60 * 60;

const login = async ({ email, password }) => {
  const lowerEmail = email ? email.toLowerCase().trim() : '';

  if (!isDbConfigured()) {
    const err = new Error('Database service is temporarily unreachable. Please try again later.');
    err.status = 503;
    throw err;
  }

  const authClient = createAuthClient();
  if (!authClient) {
    const err = new Error('Database service is temporarily unreachable. Please try again later.');
    err.status = 503;
    throw err;
  }

  // Login uses only Supabase signInWithPassword on an isolated auth client
  try {
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: lowerEmail,
      password: password || '',
    });

    if (authError) {
      // Check for real network / connectivity errors
      const msg = authError.message || '';
      if (
        msg.includes('fetch failed') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('network')
      ) {
        const err = new Error('Database service is temporarily unreachable. Please try again later.');
        err.status = 503;
        throw err;
      }

      // Invalid credentials or any auth error returns 401
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (!authData?.user) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // Load profile with auth_user_id = <auth user id>
    const profile = await getProfileForContext('auth_user_id', authData.user.id);
    if (!profile) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    // Business, teams and blocks (inactive user / suspended business)
    const ctx = await loadUserContext(profile);
    if (ctx.error) {
      const err = new Error(ctx.error.message);
      err.status = ctx.error.status;
      throw err;
    }

    // Our own token carries only the profile id; everything else is
    // re-loaded on each request. (Supabase access tokens expire after 1 hour.)
    return {
      user: ctx.user,
      token: signJWT({ sub: profile.id }, TOKEN_TTL_SECONDS),
      expiresIn: TOKEN_TTL_SECONDS,
    };
  } catch (err) {
    if (err.status) throw err;
    const msg = err.message || '';
    if (
      msg.includes('fetch failed') ||
      msg.includes('ENOTFOUND') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('network')
    ) {
      const connErr = new Error('Database service is temporarily unreachable. Please try again later.');
      connErr.status = 503;
      throw connErr;
    }
    throw err;
  }
};

module.exports = {
  login,
};
