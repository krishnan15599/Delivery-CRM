import { mockStorage, delay } from './mockStorage';
import type { Agent, CreateAgentInput, UpdateAgentInput, AgentFilter } from '../types/agent';
import type { Delivery } from '../types/delivery';
import type { Collection } from '../types/collection';
import type { PaginatedResponse } from '../types/common';

export const agentService = {
  async getAgents(filter: AgentFilter = {}): Promise<PaginatedResponse<Agent>> {
    await delay(250);
    let items = mockStorage.getAgents();

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.vehicleNumber.toLowerCase().includes(q) ||
          a.hubLocation.toLowerCase().includes(q)
      );
    }

    if (filter.status && filter.status !== 'all') {
      items = items.filter((a) => a.status === filter.status);
    }

    if (filter.hubLocation) {
      items = items.filter(
        (a) => a.hubLocation.toLowerCase() === filter.hubLocation?.toLowerCase()
      );
    }

    if (filter.vehicleType && filter.vehicleType !== 'all') {
      items = items.filter((a) => a.vehicleType === filter.vehicleType);
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

  async getAgentById(id: string): Promise<Agent | null> {
    await delay(200);
    const agents = mockStorage.getAgents();
    const agent = agents.find((a) => a.id === id);
    return agent || null;
  },

  async createAgent(input: CreateAgentInput): Promise<Agent> {
    await delay(350);
    const agents = mockStorage.getAgents();
    const newId = `AG-${100 + agents.length + 1}`;
    const now = new Date().toISOString().split('T')[0];

    const newAgent: Agent = {
      id: newId,
      ...input,
      status: input.status || 'Active',
      assignedDeliveriesCount: 0,
      completedDeliveriesCount: 0,
      failedDeliveriesCount: 0,
      pendingCashAmount: 0,
      settledCashAmount: 0,
      rating: 5.0,
      joiningDate: now,
    };

    mockStorage.setAgents([newAgent, ...agents]);
    return newAgent;
  },

  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    await delay(300);
    const agents = mockStorage.getAgents();
    const index = agents.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Agent with ID ${id} not found`);
    }

    const updatedAgent: Agent = {
      ...agents[index],
      ...input,
    };

    agents[index] = updatedAgent;
    mockStorage.setAgents(agents);
    return updatedAgent;
  },

  async deleteAgent(id: string): Promise<boolean> {
    await delay(300);
    const agents = mockStorage.getAgents();
    const filtered = agents.filter((a) => a.id !== id);
    if (filtered.length === agents.length) {
      return false;
    }
    mockStorage.setAgents(filtered);
    return true;
  },

  async getAgentDeliveries(agentId: string): Promise<Delivery[]> {
    await delay(250);
    const deliveries = mockStorage.getDeliveries();
    return deliveries.filter((d) => d.agentId === agentId);
  },

  async getAgentCollections(agentId: string): Promise<Collection[]> {
    await delay(250);
    const collections = mockStorage.getCollections();
    return collections.filter((c) => c.agentId === agentId);
  },
};
