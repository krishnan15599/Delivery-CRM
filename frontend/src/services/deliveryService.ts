import { mockStorage, delay } from './mockStorage';
import type {
  Delivery,
  BackendDelivery,
  CreateDeliveryInput,
  UpdateDeliveryInput,
  DeliveryFilter,
  DeliveryStatus,
} from '../types/delivery';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';

/**
 * Maps DB raw delivery payload to frontend Delivery model
 */
export const mapBackendDelivery = (d: BackendDelivery | any): Delivery => ({
  id: d.id,
  trackingNumber: d.tracking_number || d.trackingNumber || '',
  customerName: d.customer_name || d.customerName || '',
  customerId: d.customer_id || d.customerId || undefined,
  customerPhone: d.customer_phone || d.customerPhone || undefined,
  pickupAddress: d.pickup_address || d.pickupAddress || '',
  deliveryAddress: d.delivery_address || d.deliveryAddress || '',
  city: d.city ?? undefined,
  pincode: d.pincode ?? undefined,
  packageType: d.package_type || d.packageType || 'Standard',
  itemDescription: d.item_description || d.itemDescription || undefined,
  amount: Number(d.amount ?? 0),
  codAmount: Number(d.cod_amount ?? d.codAmount ?? d.amount ?? 0),
  agentId: d.agent_id || d.agentId || undefined,
  agentName: d.agent_name || d.agentName || undefined,
  agentPhone: d.agent_phone || d.agentPhone || undefined,
  status: d.status || 'Pending',
  paymentStatus: d.payment_status || d.paymentStatus || 'Pending',
  timeline: Array.isArray(d.timeline)
    ? d.timeline.map((evt: any) => ({
        status: evt.status,
        timestamp: evt.timestamp || new Date().toISOString(),
        note: evt.note,
        updatedBy: evt.updatedBy || evt.updated_by,
      }))
    : [],
  notes: d.notes ?? undefined,
  date: d.date || d.created_at || new Date().toISOString(),
  scheduledDate: d.scheduled_date || d.scheduledDate || undefined,
  createdAt: d.created_at ?? undefined,
  updatedAt: d.updated_at ?? undefined,
});

export const deliveryService = {
  /**
   * Fetch paginated and filtered deliveries
   */
  async getDeliveries(filter: DeliveryFilter = {}): Promise<PaginatedResponse<Delivery>> {
    try {
      const response = await api.get<ApiResponse<BackendDelivery[]>>(
        API_ENDPOINTS.DELIVERIES.BASE,
        { params: filter }
      );
      const list = (response.data.data || []).map(mapBackendDelivery);
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
      console.warn('Backend API unavailable, falling back to mock storage for getDeliveries:', error);
      await delay(300);
      let items = mockStorage.getDeliveries();

      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        items = items.filter(
          (d) =>
            d.trackingNumber.toLowerCase().includes(q) ||
            d.customerName.toLowerCase().includes(q) ||
            (d.agentName && d.agentName.toLowerCase().includes(q)) ||
            d.deliveryAddress.toLowerCase().includes(q) ||
            (d.city && d.city.toLowerCase().includes(q))
        );
      }

      if (filter.status && filter.status !== 'all') {
        if (filter.status.toLowerCase() === 'unassigned') {
          items = items.filter((d) => !d.agentId || d.status === 'Pending');
        } else {
          items = items.filter((d) => d.status.toLowerCase() === filter.status?.toLowerCase());
        }
      }

      if (filter.agentId) {
        items = items.filter((d) => d.agentId === filter.agentId);
      }

      if (filter.customerId) {
        items = items.filter((d) => d.customerId === filter.customerId);
      }

      if (filter.startDate) {
        items = items.filter((d) => String(d.date) >= (filter.startDate as string));
      }

      if (filter.endDate) {
        items = items.filter((d) => String(d.date) <= (filter.endDate as string));
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
   * Fetch single delivery by ID
   */
  async getDeliveryById(id: string): Promise<Delivery | null> {
    try {
      const response = await api.get<ApiResponse<BackendDelivery>>(
        API_ENDPOINTS.DELIVERIES.BY_ID(id)
      );
      return response.data.data ? mapBackendDelivery(response.data.data) : null;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getDeliveryById(${id}):`, error);
      await delay(200);
      const deliveries = mockStorage.getDeliveries();
      const item = deliveries.find((d) => d.id === id || d.trackingNumber === id);
      return item || null;
    }
  },

  /**
   * Fetch single delivery by tracking number
   */
  async getDeliveryByTracking(trackingNumber: string): Promise<Delivery | null> {
    try {
      const response = await api.get<ApiResponse<BackendDelivery>>(
        API_ENDPOINTS.DELIVERIES.TRACKING(trackingNumber)
      );
      return response.data.data ? mapBackendDelivery(response.data.data) : null;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getDeliveryByTracking(${trackingNumber}):`, error);
      await delay(200);
      const deliveries = mockStorage.getDeliveries();
      const item = deliveries.find((d) => d.trackingNumber === trackingNumber);
      return item || null;
    }
  },

  /**
   * Create new delivery
   */
  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
    try {
      const response = await api.post<ApiResponse<BackendDelivery>>(
        API_ENDPOINTS.DELIVERIES.BASE,
        input
      );
      return mapBackendDelivery(response.data.data);
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for createDelivery:', error);
      await delay(350);
      const deliveries = mockStorage.getDeliveries();
      const agents = mockStorage.getAgents();

      const newId = `DEL-${9000 + deliveries.length + 1}`;
      const trackingNumber = `TRK-${9000 + deliveries.length + 1}`;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let agentName: string | undefined;
      let agentPhone: string | undefined;
      if (input.agentId) {
        const agent = agents.find((a) => a.id === input.agentId);
        if (agent) {
          agentName = agent.name;
          agentPhone = agent.phone;
        }
      }

      const initialStatus: DeliveryStatus = input.agentId ? 'Assigned' : 'Pending';

      const newDelivery: Delivery = {
        id: newId,
        trackingNumber,
        customerName: input.customerName,
        customerId: input.customerId,
        customerPhone: input.customerPhone,
        pickupAddress: input.pickupAddress,
        deliveryAddress: input.deliveryAddress,
        city: input.city || 'Bengaluru',
        pincode: input.pincode,
        packageType: input.packageType,
        itemDescription: input.itemDescription,
        amount: input.amount,
        codAmount: input.codAmount ?? input.amount,
        agentId: input.agentId,
        agentName,
        agentPhone,
        status: initialStatus,
        paymentStatus: input.paymentStatus || (input.codAmount ? 'pending' : 'paid'),
        timeline: [
          {
            status: 'Pending',
            timestamp: `${dateStr} ${timeStr}`,
            note: 'Delivery order created',
          },
          ...(input.agentId
            ? [
                {
                  status: 'Assigned' as DeliveryStatus,
                  timestamp: `${dateStr} ${timeStr}`,
                  note: `Assigned to ${agentName}`,
                },
              ]
            : []),
        ],
        notes: input.notes,
        date: dateStr,
      };

      mockStorage.setDeliveries([newDelivery, ...deliveries]);

      if ((newDelivery.paymentStatus === 'Pending' || newDelivery.paymentStatus === 'pending') && (newDelivery.codAmount || 0) > 0) {
        const collections = mockStorage.getCollections();
        collections.unshift({
          id: `COL-${3000 + collections.length + 1}`,
          deliveryId: newDelivery.id,
          trackingNumber: newDelivery.trackingNumber,
          customerName: newDelivery.customerName,
          agentId: newDelivery.agentId || '',
          agentName: newDelivery.agentName || '',
          amount: newDelivery.codAmount || 0,
          paymentMode: 'Cash',
          status: 'Pending',
          createdAt: dateStr,
        });
        mockStorage.setCollections(collections);
      }

      if (input.agentId) {
        const allAgents = mockStorage.getAgents();
        const agIdx = allAgents.findIndex((a) => a.id === input.agentId);
        if (agIdx !== -1) {
          allAgents[agIdx].assignedDeliveriesCount += 1;
          mockStorage.setAgents(allAgents);
        }
      }

      if (input.customerId) {
        const allCustomers = mockStorage.getCustomers();
        const cIdx = allCustomers.findIndex((c) => c.id === input.customerId);
        if (cIdx !== -1) {
          allCustomers[cIdx].totalOrders = (allCustomers[cIdx].totalOrders || 0) + 1;
          mockStorage.setCustomers(allCustomers);
        }
      }

      return newDelivery;
    }
  },

  /**
   * Update delivery metadata
   */
  async updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Delivery> {
    try {
      const response = await api.put<ApiResponse<BackendDelivery>>(
        API_ENDPOINTS.DELIVERIES.BY_ID(id),
        input
      );
      return mapBackendDelivery(response.data.data);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for updateDelivery(${id}):`, error);
      await delay(300);
      const deliveries = mockStorage.getDeliveries();
      const index = deliveries.findIndex((d) => d.id === id);
      if (index === -1) {
        throw new Error(`Delivery with ID ${id} not found`);
      }

      const updatedDelivery: Delivery = {
        ...deliveries[index],
        ...input,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      deliveries[index] = updatedDelivery;
      mockStorage.setDeliveries(deliveries);
      return updatedDelivery;
    }
  },

  /**
   * Update delivery status (transitions state and records timeline)
   */
  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    note?: string
  ): Promise<Delivery> {
    try {
      const response = await api.patch<ApiResponse<BackendDelivery>>(
        API_ENDPOINTS.DELIVERIES.STATUS(id),
        { status, note }
      );
      return mapBackendDelivery(response.data.data);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for updateDeliveryStatus(${id}):`, error);
      await delay(300);
      const deliveries = mockStorage.getDeliveries();
      const index = deliveries.findIndex((d) => d.id === id);
      if (index === -1) {
        throw new Error(`Delivery with ID ${id} not found`);
      }

      const current = deliveries[index];
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const newTimeline = [
        ...current.timeline,
        {
          status,
          timestamp: `${dateStr} ${timeStr}`,
          note: note || `Status updated to ${status}`,
        },
      ];

      const updatedDelivery: Delivery = {
        ...current,
        status,
        timeline: newTimeline,
        updatedAt: dateStr,
      };

      if (status === 'Delivered' && (updatedDelivery.codAmount || 0) > 0) {
        updatedDelivery.paymentStatus = 'paid';
      }

      deliveries[index] = updatedDelivery;
      mockStorage.setDeliveries(deliveries);

      if (status === 'Delivered' && (updatedDelivery.codAmount || 0) > 0) {
        const collections = mockStorage.getCollections();
        const colIdx = collections.findIndex((c) => c.deliveryId === id);
        if (colIdx !== -1) {
          collections[colIdx].status = 'Collected';
          collections[colIdx].collectedAt = `${dateStr} ${timeStr}`;
        } else {
          collections.unshift({
            id: `COL-${3000 + collections.length + 1}`,
            deliveryId: updatedDelivery.id,
            trackingNumber: updatedDelivery.trackingNumber,
            customerName: updatedDelivery.customerName,
            agentId: updatedDelivery.agentId || '',
            agentName: updatedDelivery.agentName || '',
            amount: updatedDelivery.codAmount || 0,
            paymentMode: 'Cash',
            status: 'Collected',
            createdAt: dateStr,
            collectedAt: `${dateStr} ${timeStr}`,
          });
        }
        mockStorage.setCollections(collections);

        if (updatedDelivery.agentId) {
          const allAgents = mockStorage.getAgents();
          const agIdx = allAgents.findIndex((a) => a.id === updatedDelivery.agentId);
          if (agIdx !== -1) {
            allAgents[agIdx].completedDeliveriesCount += 1;
            allAgents[agIdx].pendingCashAmount += updatedDelivery.codAmount || 0;
            mockStorage.setAgents(allAgents);
          }
        }

        if (updatedDelivery.customerId) {
          const allCustomers = mockStorage.getCustomers();
          const cIdx = allCustomers.findIndex((c) => c.id === updatedDelivery.customerId);
          if (cIdx !== -1) {
            allCustomers[cIdx].totalSpent =
              (allCustomers[cIdx].totalSpent || 0) + (updatedDelivery.amount || 0);
            mockStorage.setCustomers(allCustomers);
          }
        }
      } else if (status === 'Failed' && updatedDelivery.agentId) {
        const allAgents = mockStorage.getAgents();
        const agIdx = allAgents.findIndex((a) => a.id === updatedDelivery.agentId);
        if (agIdx !== -1) {
          allAgents[agIdx].failedDeliveriesCount += 1;
          mockStorage.setAgents(allAgents);
        }
      }

      return updatedDelivery;
    }
  },

  /**
   * Bulk assign deliveries to an agent
   */
  async bulkAssignDeliveries(
    deliveryIds: string[],
    agentId: string
  ): Promise<{ assignedCount: number; agentName?: string }> {
    try {
      const response = await api.post<ApiResponse<{ assignedCount: number; agentName?: string }>>(
        API_ENDPOINTS.DELIVERIES.BULK_ASSIGN,
        { deliveryIds, agentId }
      );
      return response.data.data;
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for bulkAssignDeliveries:', error);
      await delay(350);
      const deliveries = mockStorage.getDeliveries();
      const agents = mockStorage.getAgents();
      const targetAgent = agents.find((a) => a.id === agentId);

      if (!targetAgent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      let count = 0;
      const newDeliveries = deliveries.map((d) => {
        if (deliveryIds.includes(d.id)) {
          count++;
          return {
            ...d,
            agentId: targetAgent.id,
            agentName: targetAgent.name,
            agentPhone: targetAgent.phone,
            status: 'Assigned' as DeliveryStatus,
            timeline: [
              ...d.timeline,
              {
                status: 'Assigned' as DeliveryStatus,
                timestamp: `${dateStr} ${timeStr}`,
                note: `Bulk assigned to ${targetAgent.name}`,
              },
            ],
            updatedAt: dateStr,
          };
        }
        return d;
      });

      mockStorage.setDeliveries(newDeliveries);

      const agIdx = agents.findIndex((a) => a.id === agentId);
      if (agIdx !== -1) {
        agents[agIdx].assignedDeliveriesCount += count;
        mockStorage.setAgents(agents);
      }

      return { assignedCount: count, agentName: targetAgent.name };
    }
  },

  /**
   * Delete delivery
   */
  async deleteDelivery(id: string): Promise<boolean> {
    try {
      await api.delete(API_ENDPOINTS.DELIVERIES.BY_ID(id));
      return true;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for deleteDelivery(${id}):`, error);
      await delay(300);
      const deliveries = mockStorage.getDeliveries();
      const filtered = deliveries.filter((d) => d.id !== id);
      if (filtered.length === deliveries.length) {
        return false;
      }
      mockStorage.setDeliveries(filtered);
      return true;
    }
  },
};
