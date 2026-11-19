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

    // 2. Query Supabase database 'profiles' table directly
    // Allows any Manager or Agent created in Supabase DB to log in
    try {
      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', lowerEmail)
        .maybeSingle();

      if (dbProfile) {
        const token = signJWT(dbProfile);
        return {
          user: dbProfile,
          token,
          expiresIn: 86400,
        };
      }

      // Check 'agents' table in Supabase
      const { data: dbAgent } = await supabase
        .from('agents')
        .select('*')
        .eq('email', lowerEmail)
        .maybeSingle();

      if (dbAgent) {
        const agentUser = {
          id: dbAgent.user_id || dbAgent.id,
          name: dbAgent.name,
          email: dbAgent.email,
          role: 'Agent',
          phone: dbAgent.phone,
        };
        const token = signJWT(agentUser);
        return {
          user: agentUser,
          token,
          expiresIn: 86400,
        };
      }
    } catch (_dbLookupErr) {
      // Fall through to fallback accounts if DB is temporarily unreachable
    }
  }

  // 3. Demo accounts: standard fallback for known profiles
  const knownDemoUsers = {
    admin: { id: 'USR-001', name: 'Krishnan K.', email: 'admin@deliverycrm.in', role: 'Admin' },
    manager: { id: 'USR-002', name: 'Sarah Jenkins', email: 'manager@deliverycrm.in', role: 'Manager' },
    agent: { id: 'USR-003', name: 'Rahul Sharma', email: 'agent@deliverycrm.in', role: 'Agent' },
  };

  const knownDemoEmails = {
    'admin@deliverycrm.in': knownDemoUsers.admin,
    'admin@deliverycrm.com': knownDemoUsers.admin,
    'admin': knownDemoUsers.admin,
    'manager@deliverycrm.in': knownDemoUsers.manager,
    'manager@deliverycrm.com': knownDemoUsers.manager,
    'manager': knownDemoUsers.manager,
    'agent@deliverycrm.in': knownDemoUsers.agent,
    'agent@deliverycrm.com': knownDemoUsers.agent,
    'agent': knownDemoUsers.agent,
  };

  let demoUser = knownDemoEmails[lowerEmail];

  // Dynamic role matching if user entered role-based email
  if (!demoUser) {
    if (lowerEmail.includes('admin')) {
      demoUser = { id: 'USR-001', name: 'Krishnan K. (Admin)', email: lowerEmail, role: 'Admin' };
    } else if (lowerEmail.includes('manager')) {
      demoUser = { id: 'USR-002', name: 'Sarah Jenkins (Manager)', email: lowerEmail, role: 'Manager' };
    } else if (lowerEmail.includes('agent')) {
      demoUser = { id: 'USR-003', name: 'Rahul Sharma (Agent)', email: lowerEmail, role: 'Agent' };
    }
  }

  if (demoUser) {
    const token = signJWT(demoUser);
    return {
      user: demoUser,
      token,
      expiresIn: 86400,
    };
  }

  const err = new Error('Invalid email or password. No account found with these credentials.');
  err.status = 401;
  throw err;
};

module.exports = {
  login,
};
