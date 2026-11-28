/**
 * Unit tests for chat access & business rules — src/utils/chatAccess.js.
 * Pure functions, no database needed.
 */
const assert = require('assert');
const {
  canStartDirectStaffChat,
  canSeeConversation,
  canStaffSendMessage,
  canCustomerSendMessage,
  getChatCapabilities,
  isDeliveryActiveForAgentChat,
} = require('../src/utils/chatAccess');

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

const adminA = { id: 'U-A1', role: 'Admin', organizationId: 'ORG-A', teamIds: [] };
const managerT1 = { id: 'U-M1', role: 'Manager', organizationId: 'ORG-A', teamIds: ['T1'] };
const agentA1 = { id: 'U-AG1', role: 'Agent', organizationId: 'ORG-A', teamIds: ['T1'], agentId: 'AG1' };
const agentA2 = { id: 'U-AG2', role: 'Agent', organizationId: 'ORG-A', teamIds: ['T1'], agentId: 'AG2' };
const adminB = { id: 'U-B1', role: 'Admin', organizationId: 'ORG-B', teamIds: [] };
const superAdmin = { id: 'SA', role: 'SuperAdmin', organizationId: null, teamIds: [] };

const activeDeliveryAG1 = {
  id: 'DEL-1',
  organization_id: 'ORG-A',
  team_id: 'T1',
  agent_id: 'AG1',
  status: 'In Transit',
  tracking_token: 'tok_123',
};

const deliveredDeliveryAG1 = {
  id: 'DEL-2',
  organization_id: 'ORG-A',
  team_id: 'T1',
  agent_id: 'AG1',
  status: 'Delivered',
  tracking_token: 'tok_456',
};

const convDel1 = {
  id: 'CONV-1',
  organization_id: 'ORG-A',
  team_id: 'T1',
  delivery_id: 'DEL-1',
  agent_id: 'AG1',
  customer_id: 'CUST-1',
  conversation_type: 'delivery',
  status: 'open',
};

const convDelT2 = {
  id: 'CONV-2',
  organization_id: 'ORG-A',
  team_id: 'T2',
  delivery_id: 'DEL-3',
  agent_id: 'AG9',
  customer_id: 'CUST-2',
  conversation_type: 'delivery',
  status: 'open',
};

console.log('\n==================================================');
console.log('🧪 Chat access & condition rules');
console.log('==================================================');

console.log('\n1. Direct staff chat matrix:');
test('Admin <-> Manager and Admin <-> Agent allowed in same org', () => {
  assert.ok(canStartDirectStaffChat(adminA, managerT1));
  assert.ok(canStartDirectStaffChat(adminA, agentA1));
  assert.ok(canStartDirectStaffChat(agentA1, managerT1));
});
test('Agent <-> Agent is disallowed', () => {
  assert.ok(!canStartDirectStaffChat(agentA1, agentA2));
});
test('Cross-org and SuperAdmin direct chats are disallowed', () => {
  assert.ok(!canStartDirectStaffChat(adminA, adminB));
  assert.ok(!canStartDirectStaffChat(adminA, superAdmin));
});

console.log('\n2. Delivery conversation visibility:');
test('Admin sees all org delivery conversations', () => {
  assert.ok(canSeeConversation(adminA, convDel1));
  assert.ok(canSeeConversation(adminA, convDelT2));
});
test('Manager sees only managed team conversations', () => {
  assert.ok(canSeeConversation(managerT1, convDel1));
  assert.ok(!canSeeConversation(managerT1, convDelT2));
});
test('Agent sees only their assigned delivery conversation', () => {
  assert.ok(canSeeConversation(agentA1, convDel1));
  assert.ok(!canSeeConversation(agentA2, convDel1));
});
test('Other org Admin cannot see ORG-A conversation', () => {
  assert.ok(!canSeeConversation(adminB, convDel1));
});

console.log('\n3. Agent <-> Customer active delivery condition:');
test('Active statuses are Assigned, Picked Up, In Transit', () => {
  assert.ok(isDeliveryActiveForAgentChat({ status: 'Assigned' }));
  assert.ok(isDeliveryActiveForAgentChat({ status: 'Picked Up' }));
  assert.ok(isDeliveryActiveForAgentChat({ status: 'In Transit' }));
  assert.ok(!isDeliveryActiveForAgentChat({ status: 'Pending' }));
  assert.ok(!isDeliveryActiveForAgentChat({ status: 'Delivered' }));
  assert.ok(!isDeliveryActiveForAgentChat({ status: 'Failed' }));
});
test('Assigned agent can message customer while delivery is active', () => {
  const res = canStaffSendMessage(agentA1, convDel1, activeDeliveryAG1);
  assert.strictEqual(res.allowed, true);
});
test('Agent becomes read-only once delivery is Delivered', () => {
  const res = canStaffSendMessage(agentA1, convDel1, deliveredDeliveryAG1);
  assert.strictEqual(res.allowed, false);
});
test('Admin/Manager can still message customer after Delivered for support', () => {
  assert.strictEqual(canStaffSendMessage(adminA, convDel1, deliveredDeliveryAG1).allowed, true);
  assert.strictEqual(canStaffSendMessage(managerT1, convDel1, deliveredDeliveryAG1).allowed, true);
});

console.log('\n4. Customer Option B tracking link chat:');
test('Customer can send message on open delivery conversation', () => {
  assert.strictEqual(canCustomerSendMessage(activeDeliveryAG1, convDel1).allowed, true);
  assert.strictEqual(canCustomerSendMessage(deliveredDeliveryAG1, convDel1).allowed, true);
});
test('Customer cannot send message if conversation is closed', () => {
  const closedConv = { ...convDel1, status: 'closed' };
  assert.strictEqual(canCustomerSendMessage(deliveredDeliveryAG1, closedConv).allowed, false);
});
test('Customer capabilities reflect agent chat active vs support-only', () => {
  const activeCaps = getChatCapabilities('customer', activeDeliveryAG1, convDel1);
  assert.strictEqual(activeCaps.isAgentChatActive, true);
  assert.strictEqual(activeCaps.canSend, true);

  const deliveredCaps = getChatCapabilities('customer', deliveredDeliveryAG1, convDel1);
  assert.strictEqual(deliveredCaps.isAgentChatActive, false);
  assert.strictEqual(deliveredCaps.canSend, true);
});

if (failures > 0) {
  console.error(`\n❌ ${failures} chat access test(s) failed.\n`);
  process.exit(1);
}
console.log('\n✅ All chat access tests passed!\n');
