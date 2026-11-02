const { supabase } = require('../config/supabase');
const { signJWT } = require('../middlewares/auth');

const login = async ({ email, password }) => {
  const lowerEmail = email.toLowerCase().trim();
  const isDev = process.env.NODE_ENV !== 'production';

  // 1. When Supabase is configured, verify credentials using Supabase Auth signInWithPassword
  if (supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: lowerEmail,
        password: password || '',
      });

      if (authError) {
        // Handle database connectivity errors
        if (
          authError.message?.includes('fetch failed') ||
          authError.message?.includes('ENOTFOUND') ||
          authError.message?.includes('network')
        ) {
          if (!isDev) {
            const err = new Error('Database service is temporarily unreachable. Please try again later.');
            err.status = 503;
            throw err;
          }
        } else if (!isDev) {
          // In production, reject wrong credentials immediately — never fall back to demo accounts
          const err = new Error('Invalid email or password.');
          err.status = 401;
          throw err;
        }
      } else if (authData?.user) {
        // Authenticated successfully via Supabase Auth. Retrieve user profile for role details.
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userProfile = profile || {
          id: authData.user.id,
          name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
          email: authData.user.email,
          role: 'Agent',
        };

        const token = authData.session?.access_token || signJWT(userProfile);

        return {
          user: userProfile,
          token,
          expiresIn: authData.session?.expires_in || 86400,
        };
      }
    } catch (err) {
      if (err.status) throw err;
      if (!isDev) {
        const connErr = new Error('Database service is temporarily unreachable. Please try again later.');
        connErr.status = 503;
        throw connErr;
      }
    }
  }

  // 2. Demo accounts: ONLY allowed in non-production environments (development / test)
  if (isDev) {
    const knownDemoEmails = {
      'admin@deliverycrm.in':   { id: 'USR-001', name: 'Krishnan K.',     email: 'admin@deliverycrm.in',   role: 'Admin' },
      'manager@deliverycrm.in': { id: 'USR-002', name: 'Sarah Jenkins',   email: 'manager@deliverycrm.in', role: 'Manager' },
      'agent@deliverycrm.in':   { id: 'USR-003', name: 'Rahul Sharma',    email: 'agent@deliverycrm.in',   role: 'Agent' },
    };

    const demoUser = knownDemoEmails[lowerEmail];
    if (demoUser) {
      const token = signJWT(demoUser);
      return {
        user: demoUser,
        token,
        expiresIn: 86400,
      };
    }
  }

  const err = new Error('Invalid email or password. No account found with these credentials.');
  err.status = 401;
  throw err;
};

module.exports = {
  login,
};
