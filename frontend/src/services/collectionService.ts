import { mockStorage, delay } from './mockStorage';
import type {
  Collection,
  CollectionFilter,
  CollectionSummary,
  SettleCollectionInput,
} from '../types/collection';
import type { PaginatedResponse } from '../types/common';

export const collectionService = {
  async getCollections(filter: CollectionFilter = {}): Promise<PaginatedResponse<Collection>> {
    await delay(250);
    let items = mockStorage.getCollections();

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.trackingNumber.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.agentName.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'all') {
      items = items.filter((c) => c.status === filter.status);
    }

    if (filter.agentId) {
      items = items.filter((c) => c.agentId === filter.agentId);
    }

    if (filter.paymentMode && filter.paymentMode !== 'all') {
      items = items.filter((c) => c.paymentMode === filter.paymentMode);
    }

    const page = filter.page || 1;
    const pageSize = filter.pageSize || 10;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const paginatedData = items.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize,
      },
    };
  },

  async getCollectionSummary(): Promise<CollectionSummary> {
    await delay(200);
    const collections = mockStorage.getCollections();

    let totalPendingAmount = 0;
    let totalCollectedAmount = 0;
    let totalSettledAmount = 0;
    let pendingCount = 0;
    let collectedCount = 0;
    let settledCount = 0;

    for (const c of collections) {
      if (c.status === 'Pending') {
        totalPendingAmount += c.amount;
        pendingCount++;
      } else if (c.status === 'Collected') {
        totalCollectedAmount += c.amount;
        collectedCount++;
      } else if (c.status === 'Settled') {
        totalSettledAmount += c.amount;
        settledCount++;
      }
    }

    return {
      totalPendingAmount,
      totalCollectedAmount,
      totalSettledAmount,
      pendingCount,
      collectedCount,
      settledCount,
    };
  },

  async settleCollections(input: SettleCollectionInput): Promise<Collection[]> {
    await delay(350);
    const collections = mockStorage.getCollections();
    const agents = mockStorage.getAgents();
    const now = new Date().toISOString();

    const settledList: Collection[] = [];
    let settledByAgentMap: Record<string, number> = {};

    const updated = collections.map((col) => {
      if (input.collectionIds.includes(col.id)) {
        const settledItem: Collection = {
          ...col,
          status: 'Settled',
          settledAt: now,
          settledBy: input.settledBy,
          notes: input.notes || col.notes,
        };
        settledList.push(settledItem);

        settledByAgentMap[col.agentId] =
          (settledByAgentMap[col.agentId] || 0) + col.amount;

        return settledItem;
      }
      return col;
    });

    mockStorage.setCollections(updated);

    // Update agent's pending and settled cash balances
    const updatedAgents = agents.map((agent) => {
      const amountToSettle = settledByAgentMap[agent.id];
      if (amountToSettle) {
        return {
          ...agent,
          pendingCashAmount: Math.max(0, agent.pendingCashAmount - amountToSettle),
          settledCashAmount: agent.settledCashAmount + amountToSettle,
        };
      }
      return agent;
    });
    mockStorage.setAgents(updatedAgents);

    return settledList;
  },

  async getCollectionById(id: string): Promise<Collection | null> {
    await delay(150);
    const collections = mockStorage.getCollections();
    return collections.find((c) => c.id === id) || null;
  },
};
