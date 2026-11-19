/**
 * Unit tests for business (tenant) access rules — src/utils/access.js.
 * Pure functions, no database needed.
 */
const assert = require('assert');
const {
  canSeeDelivery,
  canSeeAgent,
  canCreateRole,
  canAgentSetStatus,
  canManageTeam,
  resolveTeamId,
  applyDeliveryScope,
  findTenantField,
} = require('../src/utils/access');

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

// ── Fixtures: two businesses, A has teams T1 + T2 ───────────────────────────
const adminA = { id: 'U-A1', role: 'Admin', organizationId: 'A', teamIds: [] };
const managerT1 = { id: 'U-M1', role: 'Manager', organizationId: 'A', teamIds: ['T1'] };
const managerNoTeams = { id: 'U-M0', role: 'Manager', organizationId: 'A', teamIds: [] };
const agentA1 = { id: 'U-AG1', role: 'Agent', organizationId: 'A', teamIds: ['T1'], agentId: 'AG1' };
const superAdmin = { id: 'SA', role: 'SuperAdmin', organizationId: null, teamIds: [] };
const adminB = { id: 'U-B1', role: 'Admin', organizationId: 'B', teamIds: [] };

const delA_T1_AG1 = { id: 'D1', organization_id: 'A', team_id: 'T1', agent_id: 'AG1' };
const delA_T1_AG2 = { id: 'D2', organization_id: 'A', team_id: 'T1', agent_id: 'AG2' };
const delA_T2 = { id: 'D3', organization_id: 'A', team_id: 'T2', agent_id: null };
const delB = { id: 'D4', organization_id: 'B', team_id: 'TB', agent_id: null };

const teamsA = [
  { id: 'T1', is_default: true, status: 'Active' },
  { id: 'T2', is_default: false, status: 'Active' },
  { id: 'T3', is_default: false, status: 'Inactive' },
];

console.log('\n==================================================');
console.log('🧪 Business access rules');
console.log('==================================================');

console.log('\n1. Who can see a delivery:');
test('Admin A sees every team of A', () => {
  assert.ok(canSeeDelivery(adminA, delA_T1_AG1));
  assert.ok(canSeeDelivery(adminA, delA_T2));
});
test('Admin A cannot see business B', () => assert.ok(!canSeeDelivery(adminA, delB)));
test('Admin B cannot see business A', () => assert.ok(!canSeeDelivery(adminB, delA_T1_AG1)));
test('Manager of T1 sees T1, not T2, not B', () => {
  assert.ok(canSeeDelivery(managerT1, delA_T1_AG2));
  assert.ok(!canSeeDelivery(managerT1, delA_T2));
  assert.ok(!canSeeDelivery(managerT1, delB));
});
test('Manager with no teams sees nothing', () => assert.ok(!canSeeDelivery(managerNoTeams, delA_T1_AG1)));
test('Agent sees own delivery only (not a teammate\'s)', () => {
  assert.ok(canSeeDelivery(agentA1, delA_T1_AG1));
  assert.ok(!canSeeDelivery(agentA1, delA_T1_AG2));
});
test('SuperAdmin sees no business data', () => {
  assert.ok(!canSeeDelivery(superAdmin, delA_T1_AG1));
  assert.ok(!canSeeDelivery(superAdmin, delB));
});

console.log('\n2. Who can see an agent:');
test('Manager of T1 sees T1 agents only', () => {
  assert.ok(canSeeAgent(managerT1, { id: 'AG1', organization_id: 'A', team_id: 'T1' }));
  assert.ok(!canSeeAgent(managerT1, { id: 'AG9', organization_id: 'A', team_id: 'T2' }));
});
test('Agent sees only their own agent row', () => {
  assert.ok(canSeeAgent(agentA1, { id: 'AG1', organization_id: 'A', team_id: 'T1' }));
  assert.ok(!canSeeAgent(agentA1, { id: 'AG2', organization_id: 'A', team_id: 'T1' }));
});

console.log('\n3. Who can create which role:');
test('Admin creates Admin / Manager / Agent', () => {
  for (const role of ['Admin', 'Manager', 'Agent']) assert.ok(canCreateRole(adminA, role), role);
});
test('Manager creates Agent only', () => {
  assert.ok(canCreateRole(managerT1, 'Agent'));
  assert.ok(!canCreateRole(managerT1, 'Manager'));
  assert.ok(!canCreateRole(managerT1, 'Admin'));
});
test('Nobody creates a SuperAdmin; Agents create nobody', () => {
  assert.ok(!canCreateRole(adminA, 'SuperAdmin'));
  assert.ok(!canCreateRole(superAdmin, 'Admin'));
  assert.ok(!canCreateRole(agentA1, 'Agent'));
});

console.log('\n4. Agent status changes & team management:');
test('Agent may only set field statuses', () => {
  assert.ok(canAgentSetStatus('Delivered'));
  assert.ok(canAgentSetStatus('Failed'));
  assert.ok(!canAgentSetStatus('Pending'));
  assert.ok(!canAgentSetStatus('Returned'));
});
test('canManageTeam: Admin any, Manager own, Agent none', () => {
  assert.ok(canManageTeam(adminA, 'T2'));
  assert.ok(canManageTeam(managerT1, 'T1'));
  assert.ok(!canManageTeam(managerT1, 'T2'));
  assert.ok(!canManageTeam(agentA1, 'T1'));
});

console.log('\n5. Picking a team for new agents / deliveries:');
test('Admin without teamId → default team', () => assert.deepStrictEqual(resolveTeamId(adminA, undefined, teamsA), { teamId: 'T1' }));
test('Admin may pick any active team', () => assert.deepStrictEqual(resolveTeamId(adminA, 'T2', teamsA), { teamId: 'T2' }));
test('Inactive team is refused', () => assert.strictEqual(resolveTeamId(adminA, 'T3', teamsA).error.status, 400));
test('Team of another business is refused', () => assert.strictEqual(resolveTeamId(adminA, 'TB', teamsA).error.status, 400));
test('Manager cannot pick a team they do not manage', () => assert.strictEqual(resolveTeamId(managerT1, 'T2', teamsA).error.status, 400));
test('Manager of a non-default team gets their only team', () => {
  const m = { ...managerT1, teamIds: ['T2'] };
  assert.deepStrictEqual(resolveTeamId(m, undefined, teamsA), { teamId: 'T2' });
});
test('Manager with no teams gets 403', () => assert.strictEqual(resolveTeamId(managerNoTeams, undefined, teamsA).error.status, 403));

console.log('\n6. Query scoping & client input:');
test('Delivery scope adds business + team / agent filters', () => {
  const calls = [];
  const fake = { eq: (c, v) => (calls.push(['eq', c, v]), fake), in: (c, v) => (calls.push(['in', c, v]), fake) };
  applyDeliveryScope(fake, managerT1);
  assert.deepStrictEqual(calls, [['eq', 'organization_id', 'A'], ['in', 'team_id', ['T1']]]);
  calls.length = 0;
  applyDeliveryScope(fake, agentA1);
  assert.deepStrictEqual(calls, [['eq', 'organization_id', 'A'], ['eq', 'agent_id', 'AG1']]);
});
test('Empty scope returns null (no query is run)', () => {
  assert.strictEqual(applyDeliveryScope({}, managerNoTeams), null);
  assert.strictEqual(applyDeliveryScope({}, superAdmin), null);
});
test('organizationId / organization_id from the client are detected', () => {
  assert.strictEqual(findTenantField({ organizationId: 'B' }), 'organizationId');
  assert.strictEqual(findTenantField({ organization_id: 'B' }), 'organization_id');
  assert.strictEqual(findTenantField({ name: 'x' }), undefined);
});

console.log('\n==================================================');
if (failures > 0) {
  console.error(`❌ ${failures} access test(s) FAILED.`);
  process.exit(1);
}
console.log('🎉 ALL ACCESS TESTS PASSED!');
console.log('==================================================\n');
