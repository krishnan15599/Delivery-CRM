const crypto = require('crypto');
const { supabase, isDbConfigured } = require('../src/config/supabase');

const generateRandomPassword = (length = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let pass = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    pass += chars[bytes[i] % chars.length];
  }
  return pass;
};

async function syncAuthUsers() {
  if (!isDbConfigured()) {
    console.error('❌ Supabase client is not configured. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const isDemo = process.argv.includes('--demo');
  if (isDemo) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Cannot run --demo sync in production environment (NODE_ENV=production).');
      process.exit(1);
    }
    if (!process.env.DEMO_USER_PASSWORD) {
      console.error('❌ DEMO_USER_PASSWORD environment variable is not set. Please set it in your environment or .env.');
      process.exit(1);
    }
  }
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  console.log(`\n==================================================`);
  console.log(`🔄 Syncing Auth Users with Profiles (Mode: ${isDemo ? 'Demo' : 'Production'})`);
  console.log(`==================================================\n`);

  // 1. Fetch profiles where auth_user_id IS NULL
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .is('auth_user_id', null);

  if (profileErr) {
    console.error('❌ Failed to fetch profiles:', profileErr.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('✅ All profiles already have linked auth_user_id. Nothing to sync.');
    process.exit(0);
  }

  console.log(`Found ${profiles.length} profile(s) needing auth accounts.\n`);

  // 2. Fetch existing auth users to avoid duplicate creation
  // supabase.auth.admin.listUsers()
  let existingAuthUsers = [];
  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data: userData, error: listErr } = await supabase.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      if (listErr) throw listErr;
      const users = userData?.users || [];
      existingAuthUsers.push(...users);
      if (users.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not list existing auth users (will attempt direct lookup/creation):', err.message);
  }

  const authUserByEmail = new Map();
  for (const u of existingAuthUsers) {
    if (u.email) {
      authUserByEmail.set(u.email.toLowerCase().trim(), u);
    }
  }

  const generatedCredentials = [];

  for (const profile of profiles) {
    const email = (profile.email || '').toLowerCase().trim();
    if (!email) {
      console.warn(`⚠️ Profile ID ${profile.id} has no email. Skipping.`);
      continue;
    }

    let authUserId = null;
    let existingUser = authUserByEmail.get(email);

    if (existingUser) {
      authUserId = existingUser.id;
      console.log(`🔗 Found existing Auth User for '${email}' -> Linking (ID: ${authUserId})`);
    } else {
      const passwordToUse = isDemo ? demoPassword : generateRandomPassword(12);

      const { data: newAuth, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: passwordToUse,
        email_confirm: true,
        user_metadata: { name: profile.name },
      });

      if (createErr) {
        // If error says email already exists, retrieve by listing or retry lookup
        if (createErr.message?.includes('already been registered') || createErr.message?.includes('already registered')) {
          console.log(`ℹ️ Auth user '${email}' already registered in Supabase Auth.`);
        } else {
          console.error(`❌ Failed to create auth user for '${email}':`, createErr.message);
          continue;
        }
      } else if (newAuth?.user) {
        authUserId = newAuth.user.id;
        authUserByEmail.set(email, newAuth.user);
        if (!isDemo) {
          generatedCredentials.push({ email, tempPassword: passwordToUse });
        }
        console.log(`✨ Created new Auth User for '${email}' (ID: ${authUserId})`);
      }
    }

    if (authUserId) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateErr) {
        console.error(`❌ Failed to update profile '${profile.id}' with auth_user_id:`, updateErr.message);
      } else {
        console.log(`   ✅ Profile '${profile.id}' linked successfully.`);
      }
    }
  }

  if (generatedCredentials.length > 0) {
    console.log(`\n==================================================`);
    console.log(`📋 Generated Temporary Passwords (One-time Display)`);
    console.log(`==================================================`);
    console.table(generatedCredentials);
  }

  console.log('\n🎉 Sync auth users completed successfully.\n');
}

syncAuthUsers().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
