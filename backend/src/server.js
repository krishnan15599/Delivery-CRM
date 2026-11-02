const app = require('./app');
const env = require('./config/env');
const { isDbConfigured } = require('./config/supabase');

const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Delivery CRM Server running on port ${env.PORT}`);
  console.log(`📍 URL: http://localhost:${env.PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - Auth:        http://localhost:${env.PORT}/api/auth/login`);
  console.log(`   - Customers:   http://localhost:${env.PORT}/api/customers`);
  console.log(`   - Profiles:    http://localhost:${env.PORT}/api/profiles`);
  console.log(`   - Agents:      http://localhost:${env.PORT}/api/agents`);
  console.log(`   - Deliveries:  http://localhost:${env.PORT}/api/deliveries`);
  console.log(`   - Health:      http://localhost:${env.PORT}/api/health`);
  console.log(`===============================================`);
  if (!isDbConfigured()) {
    console.warn('⚠️  Note: Please configure backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
});

module.exports = server;

