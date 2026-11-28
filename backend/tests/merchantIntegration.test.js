/**
 * Unit & route-level tests for Merchants, API keys, and Integration Orders.
 * Run: node tests/merchantIntegration.test.js
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret';

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { signJWT } = require('../src/middlewares/auth');
const {
  validateCreateMerchant,
  validateUpdateMerchant,
  validateCreateApiKey,
} = require('../src/validators/merchantValidator');
const { validateIntegrationOrder } = require('../src/validators/integrationValidator');
const { hashApiKey } = require('../src/services/merchantService');

let failures = 0;
function test(label, fn) {
  try {
    fn();
    console.log(`   ✅ ${label}`);
  } catch (err) {
    console.error(`   ❌ ${label}\n      ${err.message}`);
    failures++;
  }
}

async function asyncTest(label, fn) {
  try {
    await fn();
    console.log(`   ✅ ${label}`);
  } catch (err) {
    console.error(`   ❌ ${label}\n      ${err.message}`);
    failures++;
  }
}

const request = (server, method, path, body = null, headers = {}) =>
  new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

async function main() {
  console.log('\n==================================================');
  console.log('🧪 Merchant & Integration API Tests');
  console.log('==================================================\n');

  console.log('1. Validators & API Key Hashing:');
  test('validateCreateMerchant rejects missing required fields', () => {
    assert.ok(validateCreateMerchant({ name: 'Shop A' }).error);
  });
  test('validateCreateMerchant accepts valid merchant payload', () => {
    const res = validateCreateMerchant({
      name: 'FreshKart',
      phone: '9876543210',
      pickupAddress: '12, Guindy Industrial Estate, Chennai',
    });
    assert.ok(!res.error);
    assert.strictEqual(res.value.city, 'Chennai');
    assert.strictEqual(res.value.status, 'Active');
  });
  test('validateUpdateMerchant rejects empty update', () => {
    assert.ok(validateUpdateMerchant({}).error);
  });
  test('validateCreateApiKey defaults name to Default Key', () => {
    const res = validateCreateApiKey({});
    assert.strictEqual(res.value.name, 'Default Key');
  });
  test('validateIntegrationOrder requires customerName & deliveryAddress', () => {
    assert.ok(validateIntegrationOrder({ customerName: 'Karthik' }).error);
  });
  test('validateIntegrationOrder normalizes paymentStatus & defaults COD', () => {
    const res = validateIntegrationOrder({
      customerName: 'Karthik',
      deliveryAddress: 'Anna Nagar, Chennai',
      amount: 500,
    });
    assert.ok(!res.error);
    assert.strictEqual(res.value.codAmount, 500);
    assert.strictEqual(res.value.paymentStatus, 'Pending');
  });
  test('hashApiKey produces deterministic 64-char SHA-256 hex', () => {
    const h1 = hashApiKey('dk_live_test123');
    const h2 = hashApiKey('dk_live_test123');
    assert.strictEqual(h1, h2);
    assert.strictEqual(h1.length, 64);
  });

  console.log('\n2. Route Security & Access Control:');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  try {
    const agentToken = signJWT({
      sub: 'U-AG',
      role: 'Agent',
      organizationId: 'ORG-1',
      teamIds: ['T1'],
      agentId: 'AG-1',
    });

    await asyncTest('POST /api/integrations/orders without x-api-key → 401 (or 503 if DB unconfigured)', async () => {
      const res = await request(server, 'POST', '/api/integrations/orders', {
        customerName: 'Test',
        deliveryAddress: 'Chennai',
      });
      assert.ok([401, 503].includes(res.status), `Expected 401/503, got ${res.status}`);
    });

    await asyncTest('POST /api/integrations/orders with organizationId in body → 400 (tenant field rejected)', async () => {
      const res = await request(
        server,
        'POST',
        '/api/integrations/orders',
        { organizationId: 'ORG-HACK', customerName: 'Test', deliveryAddress: 'Chennai' },
        { 'x-api-key': 'dk_live_fake' }
      );
      assert.strictEqual(res.status, 400);
    });

    await asyncTest('GET /api/merchants as Agent → 403', async () => {
      const res = await request(server, 'GET', '/api/merchants', null, {
        Authorization: `Bearer ${agentToken}`,
      });
      assert.ok([403, 503].includes(res.status), `Expected 403/503, got ${res.status}`);
    });
  } finally {
    server.close();
  }

  console.log('\n==================================================');
  if (failures > 0) {
    console.error(`❌ ${failures} merchant/integration test(s) FAILED.`);
    process.exit(1);
  }
  console.log('🎉 ALL MERCHANT & INTEGRATION TESTS PASSED!');
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
