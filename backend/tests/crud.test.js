const assert = require('assert');
const http = require('http');
const { Socket } = require('net');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret';

const app = require('../src/app');
const { signJWT } = require('../src/middlewares/auth');

// ─── In-process HTTP dispatcher (no network sockets needed) ─────────────────
function dispatchRequest(appFn, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    try {
      const socket = new Socket();
      const req = new http.IncomingMessage(socket);
      req.method = method.toUpperCase();
      req.url = url;
      req.headers = {};

      for (const [k, v] of Object.entries(headers)) {
        req.headers[k.toLowerCase()] = String(v);
      }

      let payload = null;
      if (body !== null && body !== undefined) {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        req.headers['content-type']   = req.headers['content-type'] || 'application/json';
        req.headers['content-length'] = String(Buffer.byteLength(payload));
      }

      const res = new http.ServerResponse(req);
      const chunks = [];

      res.write = (chunk) => { if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)); return true; };
      res.end   = (chunk) => {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const rawBody = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(rawBody); } catch {}
        resolve({ status: res.statusCode, body: rawBody, json });
        return res;
      };

      appFn(req, res);
      if (payload) req.push(payload);
      req.push(null);
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Test scaffolding ────────────────────────────────────────────────────────
let failures = 0;
const created = []; // { resource: '/api/customers', id } – cleaned up at end

async function test(label, fn) {
  try {
    await fn();
    console.log(`   ✅ ${label}`);
  } catch (err) {
    console.error(`   ❌ ${label}\n      ${err.message}`);
    failures++;
  }
}

// ─── Run suite ───────────────────────────────────────────────────────────────
const runTests = async () => {
  console.log('\n==================================================');
  console.log('🧪 Running Backend Integration Test Suite (In-Process)');
  console.log('==================================================\n');

  // Tokens
  const adminToken   = signJWT({ id: 'USR-001', name: 'Krishnan K.', email: 'admin@deliverycrm.in',   role: 'Admin' });
  const agentToken   = signJWT({ id: 'USR-003', name: 'Rahul Sharma', email: 'agent@deliverycrm.in', role: 'Agent' });
  const managerToken = signJWT({ id: 'USR-002', name: 'Sarah Jenkins', email: 'manager@deliverycrm.in', role: 'Manager' });

  const adminHdr   = { Authorization: `Bearer ${adminToken}` };
  const agentHdr   = { Authorization: `Bearer ${agentToken}` };
  const managerHdr = { Authorization: `Bearer ${managerToken}` };

  // ── 1. Health check ────────────────────────────────────────────────────────
  console.log('1. Health check:');
  await test('GET /api/health returns 200', async () => {
    const r = await dispatchRequest(app, { url: '/api/health' });
    assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}`);
    assert.ok(r.json.database, 'No database field in health response');
  });

  // ── 2. Auth protection ─────────────────────────────────────────────────────
  console.log('\n2. Authentication protection:');
  await test('GET /api/customers without token → 401', async () => {
    const r = await dispatchRequest(app, { url: '/api/customers' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
    assert.strictEqual(r.json.success, false);
  });

  await test('Mock tokens (jwt_mock_*) are rejected → 401', async () => {
    const r = await dispatchRequest(app, {
      url: '/api/customers',
      headers: { Authorization: 'Bearer jwt_mock_admin_1' },
    });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status} – mock tokens must not be accepted`);
  });

  // ── 3. Login ───────────────────────────────────────────────────────────────
  console.log('\n3. Auth login:');
  await test('POST /api/auth/login with known demo email → 200 or 503 (DB unreachable in sandbox)', async () => {
    const r = await dispatchRequest(app, {
      method: 'POST', url: '/api/auth/login',
      body: { email: 'admin@deliverycrm.in', password: 'any' },
    });
    // 200 = DB found profile and issued JWT (live environment)
    // 503 = DB unreachable (sandbox / CI without Supabase), correct propagation
    assert.ok([200, 503].includes(r.status), `Expected 200 or 503, got ${r.status}`);
    if (r.status === 200) {
      assert.ok(r.json.data.token, 'No token returned on 200');
    }
  });

  await test('POST /api/auth/login with unknown email → 401 or 503', async () => {
    const r = await dispatchRequest(app, {
      method: 'POST', url: '/api/auth/login',
      body: { email: 'hacker@evil.com', password: 'any' },
    });
    assert.ok([401, 503].includes(r.status), `Expected 401 or 503, got ${r.status}`);
  });

  await test('GET /api/auth/me without token → 401', async () => {
    const r = await dispatchRequest(app, { url: '/api/auth/me' });
    assert.strictEqual(r.status, 401, `Expected 401, got ${r.status}`);
  });

  // ── 4. /profiles/me identity resolution ───────────────────────────────────
  console.log('\n4. Profile /me identity resolution:');
  await test('/profiles/me with Agent token resolves to Agent role', async () => {
    const r = await dispatchRequest(app, { url: '/api/profiles/me', headers: agentHdr });
    assert.strictEqual(r.status, 200, `Expected 200, got ${r.status}`);
    assert.strictEqual(r.json.data.role, 'Agent', 'Role must reflect token, not hardcoded Admin');
  });

  // ── 5. Role-Based Access Control ──────────────────────────────────────────
  console.log('\n5. Role-Based Access Control:');
  await test('Agent cannot create a customer → 403', async () => {
    const r = await dispatchRequest(app, {
      method: 'POST', url: '/api/customers', headers: agentHdr,
      body: { name: 'Rbac Test', phone: '+91 91111 00001', address: '1 Test St' },
    });
    assert.strictEqual(r.status, 403, `Expected 403, got ${r.status}`);
  });

  await test('Agent cannot delete a customer → 403', async () => {
    const r = await dispatchRequest(app, {
      method: 'DELETE', url: '/api/customers/CUST-001', headers: agentHdr,
    });
    assert.strictEqual(r.status, 403, `Expected 403, got ${r.status}`);
  });

  await test('Agent cannot change profile role via PUT /profiles/:id → 403', async () => {
    const r = await dispatchRequest(app, {
      method: 'PUT', url: '/api/profiles/USR-003', headers: agentHdr,
      body: { role: 'Admin' },
    });
    assert.strictEqual(r.status, 403, `Expected 403, got ${r.status}`);
  });

  await test('Manager cannot delete a customer (Admin-only) → 403', async () => {
    const r = await dispatchRequest(app, {
      method: 'DELETE', url: '/api/customers/CUST-001', headers: managerHdr,
    });
    assert.strictEqual(r.status, 403, `Expected 403, got ${r.status}`);
  });

  // ── 6. Search sanitisation ─────────────────────────────────────────────────
  console.log('\n6. Search sanitisation:');
  await test('Comma + parenthesis in search does not cause 400', async () => {
    const r = await dispatchRequest(app, {
      url: '/api/customers?search=Flat%20402,%20Green%20(Bellandur)', headers: adminHdr,
    });
    assert.notStrictEqual(r.status, 400, `Search with commas must not produce 400 (got ${r.status})`);
  });

  // ── 7. Input validation error handling ────────────────────────────────────
  console.log('\n7. Input validation error handling:');
  await test('Empty name in PUT /customers/:id → 400 (not 500)', async () => {
    const r = await dispatchRequest(app, {
      method: 'PUT', url: '/api/customers/CUST-001', headers: adminHdr,
      body: { name: '   ' },
    });
    assert.strictEqual(r.status, 400, `Expected 400 for empty name, got ${r.status}`);
  });

  await test('Array of query parameters (?status=a&status=b) does not crash server', async () => {
    const r = await dispatchRequest(app, {
      url: '/api/deliveries?status=Pending&status=Delivered', headers: adminHdr,
    });
    assert.notStrictEqual(r.status, 500, `Server crashed on array query params (got ${r.status})`);
  });

  // ── 8. Generic update blocks status change ─────────────────────────────────
  console.log('\n8. Delivery update business-rule protection:');
  await test('PUT /deliveries/:id with status field → 400', async () => {
    const r = await dispatchRequest(app, {
      method: 'PUT', url: '/api/deliveries/DEL-9001', headers: adminHdr,
      body: { status: 'Delivered' },
    });
    assert.strictEqual(r.status, 400, `Expected 400, got ${r.status}`);
    assert.ok(r.json.message.includes('status'), 'Error must explain status route');
  });

  await test('PUT /deliveries/:id with non-numeric amount ("abc") → 400', async () => {
    const r = await dispatchRequest(app, {
      method: 'PUT', url: '/api/deliveries/DEL-9001', headers: adminHdr,
      body: { amount: 'abc' },
    });
    assert.strictEqual(r.status, 400, `Expected 400 for non-numeric amount, got ${r.status}`);
  });

  // ── 9. Agent status access control & 404 ──────────────────────────────────
  console.log('\n9. Agent status access control:');
  await test('Agent cannot update another agent status → 403 or 404', async () => {
    const r = await dispatchRequest(app, {
      method: 'PATCH', url: '/api/agents/OTHER-AGENT-ID/status', headers: agentHdr,
      body: { status: 'Active' },
    });
    // If agent not found: 404 (or 503 if DB offline). If found and not owner: 403.
    assert.ok([403, 404, 503].includes(r.status), `Expected 403, 404, or 503, got ${r.status}`);
  });

  await test('PATCH /agents/NON-EXISTENT/status by Admin → 404 or 503 (not 400)', async () => {
    const r = await dispatchRequest(app, {
      method: 'PATCH', url: '/api/agents/NON-EXISTENT-ID/status', headers: adminHdr,
      body: { status: 'Active' },
    });
    assert.ok([404, 503].includes(r.status), `Expected 404 or 503, got ${r.status}`);
    assert.notStrictEqual(r.status, 400, 'Must not return 400 for a missing agent');
  });

  // ── 10. End-of-suite cleanup ──────────────────────────────────────────────
  if (created.length > 0 && app) {
    console.log('\n10. Cleanup:');
    for (const { resource, id } of created) {
      const r = await dispatchRequest(app, {
        method: 'DELETE', url: `${resource}/${id}`, headers: adminHdr,
      });
      const ok = [200, 404].includes(r.status);
      console.log(`   ${ok ? '✅' : '⚠️ '} DELETE ${resource}/${id} → ${r.status}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n==================================================');
  if (failures > 0) {
    console.error(`❌ ${failures} test(s) FAILED.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL INTEGRATION TESTS COMPLETED AND ASSERTIONS PASSED!');
    console.log('==================================================\n');
  }
};

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
