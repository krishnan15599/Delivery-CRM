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

module.exports = {
  supabase,
  isDbConfigured: () => Boolean(supabase),
};

