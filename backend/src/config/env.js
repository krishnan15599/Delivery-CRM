const path = require('path');
const dotenv = require('dotenv');

// Load environment variables once from backend/.env or parent .env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
dotenv.config(); // Fallback for standard process.cwd()

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV !== 'test') {
  throw new Error(
    'FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is not defined. ' +
    'The server refuses to start with an insecure fallback. Set JWT_SECRET in .env or your production environment.'
  );
}

module.exports = {
  PORT: process.env.PORT || 5000,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: jwtSecret || 'test-jwt-secret-for-isolated-tests-only',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
