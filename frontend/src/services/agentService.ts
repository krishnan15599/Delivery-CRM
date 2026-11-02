import { mockStorage, delay } from './mockStorage';
import type {
  Agent,
  BackendAgent,
  CreateAgentInput,
  UpdateAgentInput,
  AgentFilter,
  AgentStatus,
} from '../types/agent';
import type { Delivery } from '../types/delivery';
import type { Collection } from '../types/collection';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { mapBackendDelivery } from './deliveryService';

/**
 * Maps DB raw agent payload to frontend Agent model
 */
export const mapBackendAgent = (a: BackendAgent | any): Agent => ({
  id: a.id,
  name: a.name,
  phone: a.phone || '',
  email: a.email || '',
  vehicleType: a.vehicle_type || a.vehicleType || 'Bike',
  vehicleNumber: a.vehicle_number || a.vehicleNumber || '',
  status: a.status || 'Active',
  hubLocation: a.hub_location || a.hubLocation || '',
  assignedDeliveriesCount: Number(a.assigned_deliveries_count ?? a.assignedDeliveriesCount ?? 0),
  completedDeliveriesCount: Number(a.completed_deliveries_count ?? a.completedDeliveriesCount ?? 0),
  failedDeliveriesCount: Number(a.failed_deliveries_count ?? a.failedDeliveriesCount ?? 0),
  pendingCashAmount: Number(a.pending_cash_amount ?? a.pendingCashAmount ?? 0),
  settledCashAmount: Number(a.settled_cash_amount ?? a.settledCashAmount ?? 0),
  rating: Number(a.rating ?? 5.0),
  joiningDate:
    a.joining_date ||
    a.joiningDate ||
    (a.created_at ? a.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
  avatarUrl: a.avatar_url || a.avatarUrl || undefined,
});

export const agentService = {
  /**
   * Fetch paginated and filtered agents
   */
  async getAgents(filter: AgentFilter = {}): Promise<PaginatedResponse<Agent>> {
    try {
      const response = await api.get<ApiResponse<BackendAgent[]>>(
        API_ENDPOINTS.AGENTS.BASE,
        { params: filter }
      );
      const list = (response.data.data || []).map(mapBackendAgent);
      const pagination = response.data.pagination;

      return {
        data: list,
        pagination: {
          currentPage: pagination?.page || filter.page || 1,
          totalPages: pagination?.totalPages || 1,
          totalItems: pagination?.total ?? response.data.meta?.total ?? list.length,
          pageSize: pagination?.pageSize || filter.pageSize || list.length,
        },
      };
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for getAgents:', error);
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
    }
  },

  /**
   * Fetch single agent by ID
   */
  async getAgentById(id: string): Promise<Agent | null> {
    try {
      const response = await api.get<ApiResponse<BackendAgent>>(
        API_ENDPOINTS.AGENTS.BY_ID(id)
      );
      return response.data.data ? mapBackendAgent(response.data.data) : null;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getAgentById(${id}):`, error);
      await delay(200);
      const agents = mockStorage.getAgents();
      const agent = agents.find((a) => a.id === id);
      return agent || null;
    }
  },

  /**
   * Create new agent
   */
  async createAgent(input: CreateAgentInput): Promise<Agent> {
    try {
      const response = await api.post<ApiResponse<BackendAgent>>(
        API_ENDPOINTS.AGENTS.BASE,
        input
      );
      return mapBackendAgent(response.data.data);
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for createAgent:', error);
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
    }
  },

  /**
   * Update existing agent
   */
  async updateAgent(id: string, input: UpdateAgentInput): Promise<Agent> {
    try {
      const response = await api.put<ApiResponse<BackendAgent>>(
        API_ENDPOINTS.AGENTS.BY_ID(id),
        input
      );
      return mapBackendAgent(response.data.data);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for updateAgent(${id}):`, error);
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
    }
  },

  /**
   * Update agent status specifically
   */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<Agent> {
    try {
      const response = await api.patch<ApiResponse<BackendAgent>>(
        API_ENDPOINTS.AGENTS.STATUS(id),
        { status }
      );
      return mapBackendAgent(response.data.data);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for updateAgentStatus(${id}):`, error);
      await delay(250);
      const agents = mockStorage.getAgents();
      const index = agents.findIndex((a) => a.id === id);
      if (index === -1) {
        throw new Error(`Agent with ID ${id} not found`);
      }

      const updatedAgent: Agent = {
        ...agents[index],
        status,
      };
      agents[index] = updatedAgent;
      mockStorage.setAgents(agents);
      return updatedAgent;
    }
  },

  /**
   * Delete agent
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      await api.delete(API_ENDPOINTS.AGENTS.BY_ID(id));
      return true;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for deleteAgent(${id}):`, error);
      await delay(300);
      const agents = mockStorage.getAgents();
      const filtered = agents.filter((a) => a.id !== id);
      if (filtered.length === agents.length) {
        return false;
      }
      mockStorage.setAgents(filtered);
      return true;
    }
  },

  /**
   * Fetch deliveries assigned to an agent
   */
  async getAgentDeliveries(agentId: string): Promise<Delivery[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>(
        API_ENDPOINTS.DELIVERIES.BASE,
        { params: { agentId, pageSize: 100 } }
      );
      return (response.data.data || []).map(mapBackendDelivery);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getAgentDeliveries(${agentId}):`, error);
      await delay(200);
      const deliveries = mockStorage.getDeliveries();
      return deliveries.filter((d) => d.agentId === agentId);
    }
  },

  /**
   * Fetch cash collections handled by an agent
   */
  async getAgentCollections(agentId: string): Promise<Collection[]> {
    await delay(200);
    const collections = mockStorage.getCollections();
    return collections.filter((c) => c.agentId === agentId);
  },
};
