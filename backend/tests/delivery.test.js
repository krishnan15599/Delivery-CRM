/**
 * Tests for business logic, utilities, and validators.
 * These are pure in-process unit tests with zero database writes.
 * Run: node tests/delivery.test.js
 */

process.env.NODE_ENV = 'test'; // Prevents JWT_SECRET startup error
process.env.JWT_SECRET = 'test-only-secret';

const assert = require('assert');
const { generateId, generateTrackingNumber, generateUUID } = require('../src/utils/idGenerator');
const { sanitizeSearchQuery, normalizeEndDate, safeTrim } = require('../src/utils/sanitize');
const { validateCreateProfile } = require('../src/validators/profileValidator');
const { validateCreateCustomer, validateUpdateCustomer } = require('../src/validators/customerValidator');
const { validateCreateDelivery, validateUpdateDelivery } = require('../src/validators/deliveryValidator');
const { validateCreateAgent, validateUpdateAgent } = require('../src/validators/agentValidator');
const { applyPagination } = require('../src/utils/pagination');

console.log('\n==================================================');
console.log('🧪 Running Business Logic & Utilities Unit Tests');
console.log('==================================================\n');

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

// 1. ID Collision resistance
console.log('1. ID Generation Collision Resistance:');
test('5000 unique IDs with zero collisions', () => {
  const ids = new Set();
  for (let i = 0; i < 5000; i++) {
    const id = generateId('TEST');
    assert(!ids.has(id), `Duplicate ID: ${id}`);
    ids.add(id);
  }
});

test('2000 unique tracking numbers with zero collisions', () => {
  const trks = new Set();
  for (let i = 0; i < 2000; i++) {
    const trk = generateTrackingNumber();
    assert(!trks.has(trk), `Duplicate tracking number: ${trk}`);
    trks.add(trk);
  }
});

test('generateUUID produces standard RFC-4122 v4 UUID', () => {
  const uuid = generateUUID();
  assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid), `Not a UUID: ${uuid}`);
});

// 2. Search Sanitization
console.log('\n2. Search Query Sanitizer:');
test('Commas, parentheses, percent, quotes stripped', () => {
  const dirty = 'Flat 402, Green Glen (Bellandur) "South" %20';
  const clean = sanitizeSearchQuery(dirty);
  assert(!clean.includes(','), 'Comma not stripped');
  assert(!clean.includes('('), 'Paren not stripped');
  assert(!clean.includes(')'), 'Paren not stripped');
  assert(!clean.includes('%'), 'Percent not stripped');
  assert(!clean.includes('"'), 'Quote not stripped');
});

test('null/undefined returns empty string', () => {
  assert.strictEqual(sanitizeSearchQuery(null), '');
  assert.strictEqual(sanitizeSearchQuery(undefined), '');
});

// 3. End-Date inclusivity
console.log('\n3. End-Date Inclusivity:');
test('YYYY-MM-DD expands to end of day', () => {
  assert.strictEqual(normalizeEndDate('2026-10-07'), '2026-10-07T23:59:59.999Z');
});

test('ISO string is returned unchanged', () => {
  assert.strictEqual(normalizeEndDate('2026-10-07T10:00:00.000Z'), '2026-10-07T10:00:00.000Z');
});

// 4. Safe Trim
console.log('\n4. Safe String Trimming:');
test('Numeric pincode coerced without TypeError', () => {
  assert.strictEqual(safeTrim(560038), '560038');
  assert.strictEqual(safeTrim(0), '0');
});

test('null and undefined return null', () => {
  assert.strictEqual(safeTrim(null), null);
  assert.strictEqual(safeTrim(undefined), null);
});

// 5. Profile role defaulting
console.log('\n5. Profile Role Defaulting:');
test('New profiles without a role default to "Agent"', () => {
  const { value } = validateCreateProfile({ name: 'New Employee', email: 'emp@deliverycrm.in' });
  assert.strictEqual(value.role, 'Agent');
});

test('Explicitly passing "Admin" is accepted', () => {
  const { value } = validateCreateProfile({ name: 'Boss', email: 'boss@deliverycrm.in', role: 'Admin' });
  assert.strictEqual(value.role, 'Admin');
});

// 6. Generic Delivery Update Protection
console.log('\n6. Generic Delivery Update Protection:');
test('Direct status in PUT /deliveries/:id is rejected', () => {
  const { error } = validateUpdateDelivery({ status: 'Delivered', notes: 'test' });
  assert(error, 'Expected validation error');
  assert(error.message.includes('status'), 'Error must mention status');
});

// 7. Payment Status Normalization
console.log('\n7. Payment Status Normalization:');
test('Lowercase "paid" normalized to "Paid"', () => {
  const { value } = validateCreateDelivery({
    customerName: 'Test', pickupAddress: 'Hub', deliveryAddress: 'Home',
    paymentStatus: 'paid',
  });
  assert.strictEqual(value.paymentStatus, 'Paid');
});

test('Lowercase "failed" normalized to "Failed"', () => {
  const { value } = validateCreateDelivery({
    customerName: 'Test', pickupAddress: 'Hub', deliveryAddress: 'Home',
    paymentStatus: 'failed',
  });
  assert.strictEqual(value.paymentStatus, 'Failed');
});

test('Missing paymentStatus with cod defaults to "Pending"', () => {
  const { value } = validateCreateDelivery({
    customerName: 'Test', pickupAddress: 'Hub', deliveryAddress: 'Home',
    amount: 500, codAmount: 500,
  });
  assert.strictEqual(value.paymentStatus, 'Pending');
});

test('Missing paymentStatus without cod defaults to "Paid"', () => {
  const { value } = validateCreateDelivery({
    customerName: 'Test', pickupAddress: 'Hub', deliveryAddress: 'Home',
    amount: 500, codAmount: 0,
  });
  assert.strictEqual(value.paymentStatus, 'Paid');
});

// 8. JWT functions (no network calls)
console.log('\n8. JWT Signing & Verification:');
const { signJWT, verifyJWT } = require('../src/middlewares/auth');
test('signJWT + verifyJWT round-trip', () => {
  const payload = { id: 'USR-001', role: 'Admin' };
  const token = signJWT(payload, 60);
  const decoded = verifyJWT(token);
  assert(decoded, 'Token did not verify');
  assert.strictEqual(decoded.role, 'Admin');
});

test('Tampered token is rejected', () => {
  const token = signJWT({ id: 'USR-001' }, 60);
  const [h, b, s] = token.split('.');
  const tampered = `${h}.${b}.AAAA${s.slice(4)}`;
  assert.strictEqual(verifyJWT(tampered), null, 'Tampered token should fail verification');
});

test('Expired token is rejected', () => {
  const token = signJWT({ id: 'USR-001' }, -1); // already expired
  assert.strictEqual(verifyJWT(token), null, 'Expired token should fail');
});

test('Mock tokens (jwt_mock_*) are rejected by verifyJWT', () => {
  assert.strictEqual(verifyJWT('jwt_mock_admin_1'), null);
  assert.strictEqual(verifyJWT('jwt_mock_manager_12345'), null);
});

// 9. Input & Number Validation Hardening
console.log('\n9. Input & Number Validation Hardening:');
test('validateUpdateDelivery rejects non-numeric amount ("abc")', () => {
  const { error } = validateUpdateDelivery({ amount: 'abc' });
  assert(error, 'Expected error for non-numeric amount');
  assert(error.message.includes('amount'), 'Error must mention amount');
});

test('validateUpdateDelivery rejects empty customerName ("")', () => {
  const { error } = validateUpdateDelivery({ customerName: '' });
  assert(error, 'Expected error for empty customerName');
  assert(error.message.includes('customerName'), 'Error must mention customerName');
});

test('validateUpdateAgent rejects invalid rating ("abc" or > 5)', () => {
  const err1 = validateUpdateAgent({ rating: 'abc' }).error;
  assert(err1, 'Expected error for NaN rating');
  const err2 = validateUpdateAgent({ rating: 6 }).error;
  assert(err2, 'Expected error for rating > 5');
});

test('validateUpdateAgent rejects empty name ("")', () => {
  const { error } = validateUpdateAgent({ name: '   ' });
  assert(error, 'Expected error for empty agent name');
  assert(error.message.includes('name'), 'Error must mention name');
});

test('validateUpdateCustomer rejects empty required fields ("")', () => {
  const { error: errName } = validateUpdateCustomer({ name: '' });
  assert(errName, 'Expected error for empty customer name');
  const { error: errAddr } = validateUpdateCustomer({ address: '  ' });
  assert(errAddr, 'Expected error for empty customer address');
});

test('sanitizeSearchQuery strips asterisks (*)', () => {
  const clean = sanitizeSearchQuery('select * from customers');
  assert(!clean.includes('*'), 'Asterisk was not stripped');
});

// 10. Pagination Safeguards
console.log('\n10. Pagination Safeguards:');
test('applyPagination caps pageSize at 100', () => {
  let capturedRange = null;
  const mockQuery = {
    range: (from, to) => {
      capturedRange = { from, to };
      return mockQuery;
    },
  };
  const res = applyPagination(mockQuery, { page: 1, pageSize: 9999 });
  assert.strictEqual(res.pageSize, 100, 'pageSize must be capped at 100');
  assert.strictEqual(capturedRange.to, 99, 'range to index must be 99');
});

test('applyPagination bounds query when ?page is omitted', () => {
  let capturedRange = null;
  const mockQuery = {
    range: (from, to) => {
      capturedRange = { from, to };
      return mockQuery;
    },
  };
  const res = applyPagination(mockQuery, {});
  assert.strictEqual(res.pageSize, 50, 'default pageSize must be 50');
  assert.strictEqual(capturedRange.from, 0);
  assert.strictEqual(capturedRange.to, 49);
});

// Summary
console.log('\n==================================================');
if (failures > 0) {
  console.error(`❌ ${failures} test(s) FAILED.`);
  process.exit(1);
} else {
  console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}
