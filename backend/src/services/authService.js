const { supabase, createAuthClient, isDbConfigured } = require('../config/supabase');
const { signJWT } = require('../middlewares/auth');

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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      const msg = profileError.message || '';
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
      throw profileError;
    }

    if (!profile) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const userProfile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone,
      authUserId: profile.auth_user_id,
    };

    const token = authData.session?.access_token || signJWT(userProfile);

    return {
      user: userProfile,
      token,
      expiresIn: authData.session?.expires_in || 86400,
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
