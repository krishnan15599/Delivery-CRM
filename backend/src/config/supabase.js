const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

const supabaseUrl = env.SUPABASE_URL;
// Prioritize service-role key for backend operations so database can block anon key access
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  console.log('✅ Supabase Client initialized successfully with ' +
    (env.SUPABASE_SERVICE_ROLE_KEY ? 'Service-Role Key (RLS Bypass).' : 'Anon Key.'));
} else {
  console.warn('⚠️ Supabase URL or Key is missing in environment. Database queries will return 503.');
}

/**
 * Creates an isolated client specifically for user authentication calls (e.g. signInWithPassword).
 * Ensures that authenticating a user does NOT hijack or replace credentials on the shared service-role client.
 */
const createAuthClient = () => {
  if (!supabaseUrl) return null;
  const authKey = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!authKey) return null;

  return createClient(supabaseUrl, authKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

module.exports = {
  supabase,
  createAuthClient,
  isDbConfigured: () => Boolean(supabase),
};

