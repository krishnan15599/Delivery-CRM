import { describe, it, expect, beforeEach } from 'vitest';
import { deliveryService } from '../services/deliveryService';
import { collectionService } from '../services/collectionService';
import { mockStorage } from '../services/mockStorage';

describe('Data Consistency & Business Rules', () => {
  beforeEach(() => {
    // Reset mockStorage to initial seeded state
    mockStorage.resetAll();
  });

  it('automatically creates collection and increases agent unsettled cash when delivery is marked Delivered with COD', async () => {
    const agentsBefore = mockStorage.getAgents();
    const testAgent = agentsBefore[0];
    const initialAgentPendingCash = testAgent.pendingCashAmount || 0;
    const initialCompletedCount = testAgent.completedDeliveriesCount || 0;
    const codAmount = 2500;

    // 1. Create a delivery assigned to testAgent with COD
    const newDelivery = await deliveryService.createDelivery({
      customerName: 'Test Recipient',
      pickupAddress: 'Hub A',
      deliveryAddress: 'Street 1, Bangalore',
      packageType: 'Electronics',
      amount: codAmount,
      codAmount: codAmount,
      agentId: testAgent.id,
      paymentStatus: 'pending',
    });

    expect(newDelivery.id).toBeDefined();

    // 2. Mark delivery as Delivered
    const deliveredItem = await deliveryService.updateDeliveryStatus(
      newDelivery.id,
      'Delivered',
      'Delivered to recipient. Cash collected.'
    );

    expect(deliveredItem.status).toBe('Delivered');
    expect(deliveredItem.paymentStatus).toBe('paid');

    // 3. Verify that the collection record was updated/created and marked as Collected
    const collections = mockStorage.getCollections();
    const matchingCollection = collections.find(
      (c) => c.deliveryId === newDelivery.id || c.trackingNumber === newDelivery.trackingNumber
    );

    expect(matchingCollection).toBeDefined();
    expect(matchingCollection?.status).toBe('Collected');
    expect(matchingCollection?.amount).toBe(codAmount);

    // 4. Verify that the assigned agent's unsettled pending cash increased and completed deliveries count incremented
    const agentsAfter = mockStorage.getAgents();
    const updatedAgent = agentsAfter.find((a) => a.id === testAgent.id);

    expect(updatedAgent?.pendingCashAmount).toBe(initialAgentPendingCash + codAmount);
    expect(updatedAgent?.completedDeliveriesCount).toBe(initialCompletedCount + 1);

    // 5. Settle the collection and verify agent pending cash decreases and settled cash increases
    if (matchingCollection) {
      const settled = await collectionService.settleCollections({
        collectionIds: [matchingCollection.id],
        settledBy: 'Admin Krishnan',
        notes: 'Cash collected by cashier',
      });

      expect(settled.length).toBe(1);
      expect(settled[0].status).toBe('Settled');

      const agentsAfterSettle = mockStorage.getAgents();
      const finalAgent = agentsAfterSettle.find((a) => a.id === testAgent.id);

      expect(finalAgent?.pendingCashAmount).toBe(initialAgentPendingCash);
      expect(finalAgent?.settledCashAmount).toBe((testAgent.settledCashAmount || 0) + codAmount);
    }
  });
});
