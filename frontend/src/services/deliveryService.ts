import { mockStorage, delay } from './mockStorage';
import type {
  Delivery,
  CreateDeliveryInput,
  UpdateDeliveryInput,
  DeliveryFilter,
  DeliveryStatus,
} from '../types/delivery';
import type { PaginatedResponse } from '../types/common';

export const deliveryService = {
  async getDeliveries(filter: DeliveryFilter = {}): Promise<PaginatedResponse<Delivery>> {
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
  },

  async getDeliveryById(id: string): Promise<Delivery | null> {
    await delay(200);
    const deliveries = mockStorage.getDeliveries();
    const item = deliveries.find((d) => d.id === id || d.trackingNumber === id);
    return item || null;
  },

  async createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
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
      city: input.city,
      pincode: input.pincode,
      packageType: input.packageType,
      itemDescription: input.itemDescription,
      amount: input.amount,
      codAmount: input.codAmount ?? input.amount,
      agentId: input.agentId,
      agentName,
      agentPhone,
      status: initialStatus,
      paymentStatus: input.paymentStatus || 'pending',
      date: dateStr,
      scheduledDate: dateStr,
      notes: input.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      timeline: [
        {
          status: 'Pending',
          timestamp: `${dateStr} ${timeStr}`,
          note: 'Delivery order created',
          updatedBy: 'Admin',
        },
        ...(input.agentId
          ? [
              {
                status: 'Assigned' as DeliveryStatus,
                timestamp: `${dateStr} ${timeStr}`,
                note: `Assigned to ${agentName}`,
                updatedBy: 'Dispatcher',
              },
            ]
          : []),
      ],
    };

    mockStorage.setDeliveries([newDelivery, ...deliveries]);

    // Create pending collection if COD order
    if (newDelivery.codAmount && newDelivery.codAmount > 0) {
      const collections = mockStorage.getCollections();
      collections.unshift({
        id: `COL-${Date.now()}`,
        deliveryId: newDelivery.id,
        trackingNumber: newDelivery.trackingNumber,
        customerName: newDelivery.customerName,
        agentId: newDelivery.agentId || '',
        agentName: newDelivery.agentName || 'Unassigned',
        amount: newDelivery.codAmount,
        status: 'Pending',
        paymentMode: 'Cash',
        createdAt: now.toISOString(),
        notes: `Pending COD for ${newDelivery.trackingNumber}`,
      });
      mockStorage.setCollections(collections);
    }

    // Increment agent's assigned deliveries
    if (newDelivery.agentId) {
      const allAgents = mockStorage.getAgents();
      const agIndex = allAgents.findIndex((a) => a.id === newDelivery.agentId);
      if (agIndex !== -1) {
        allAgents[agIndex].assignedDeliveriesCount =
          (allAgents[agIndex].assignedDeliveriesCount || 0) + 1;
        mockStorage.setAgents(allAgents);
      }
    }

    // Increment customer's total orders
    if (newDelivery.customerId) {
      const allCustomers = mockStorage.getCustomers();
      const cuIndex = allCustomers.findIndex((c) => c.id === newDelivery.customerId);
      if (cuIndex !== -1) {
        allCustomers[cuIndex].totalOrders = (allCustomers[cuIndex].totalOrders || 0) + 1;
        mockStorage.setCustomers(allCustomers);
      }
    }

    return newDelivery;
  },

  async updateDelivery(id: string, input: UpdateDeliveryInput): Promise<Delivery> {
    await delay(300);
    const deliveries = mockStorage.getDeliveries();
    const index = deliveries.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Delivery with ID ${id} not found`);
    }

    const current = deliveries[index];
    const updatedDelivery: Delivery = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    deliveries[index] = updatedDelivery;
    mockStorage.setDeliveries(deliveries);
    return updatedDelivery;
  },

  async updateDeliveryStatus(
    id: string,
    status: DeliveryStatus,
    note?: string
  ): Promise<Delivery> {
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

    const newTimelineEvent = {
      status,
      timestamp: `${dateStr} ${timeStr}`,
      note: note || `Status updated to ${status}`,
      updatedBy: 'System',
    };

    const isPaid = status === 'Delivered' ? ('paid' as const) : current.paymentStatus;

    const updatedDelivery: Delivery = {
      ...current,
      status,
      paymentStatus: isPaid,
      timeline: [...current.timeline, newTimelineEvent],
      updatedAt: now.toISOString(),
    };

    deliveries[index] = updatedDelivery;
    mockStorage.setDeliveries(deliveries);

    // If marked delivered and COD exists, update collections and agent pending cash
    const codAmt = updatedDelivery.codAmount || (updatedDelivery.paymentStatus === 'pending' ? updatedDelivery.amount : 0);

    if (status === 'Delivered') {
      if (codAmt > 0) {
        const collections = mockStorage.getCollections();
        const colIndex = collections.findIndex((c) => c.deliveryId === id);
        if (colIndex !== -1) {
          collections[colIndex].status = 'Collected';
          collections[colIndex].collectedAt = now.toISOString();
          if (updatedDelivery.agentId) {
            collections[colIndex].agentId = updatedDelivery.agentId;
            collections[colIndex].agentName = updatedDelivery.agentName || collections[colIndex].agentName;
          }
        } else {
          // Create collection record
          collections.unshift({
            id: `COL-${Date.now()}`,
            deliveryId: updatedDelivery.id,
            trackingNumber: updatedDelivery.trackingNumber,
            customerName: updatedDelivery.customerName,
            agentId: updatedDelivery.agentId || '',
            agentName: updatedDelivery.agentName || 'Assigned Agent',
            amount: codAmt,
            status: 'Collected',
            paymentMode: 'Cash',
            collectedAt: now.toISOString(),
            createdAt: now.toISOString(),
            notes: `COD collected on delivery (${updatedDelivery.trackingNumber})`,
          });
        }
        mockStorage.setCollections(collections);
      }

      // Update Agent performance stats & unsettled cash
      if (updatedDelivery.agentId) {
        const allAgents = mockStorage.getAgents();
        const agIndex = allAgents.findIndex((a) => a.id === updatedDelivery.agentId);
        if (agIndex !== -1) {
          allAgents[agIndex].pendingCashAmount = (allAgents[agIndex].pendingCashAmount || 0) + codAmt;
          allAgents[agIndex].completedDeliveriesCount = (allAgents[agIndex].completedDeliveriesCount || 0) + 1;
          allAgents[agIndex].assignedDeliveriesCount = Math.max(0, (allAgents[agIndex].assignedDeliveriesCount || 1) - 1);
          mockStorage.setAgents(allAgents);
        }
      }

      // Update customer total spent
      if (updatedDelivery.customerId) {
        const allCustomers = mockStorage.getCustomers();
        const cuIndex = allCustomers.findIndex((c) => c.id === updatedDelivery.customerId);
        if (cuIndex !== -1) {
          allCustomers[cuIndex].totalSpent = (allCustomers[cuIndex].totalSpent || 0) + updatedDelivery.amount;
          mockStorage.setCustomers(allCustomers);
        }
      }
    } else if (status === 'Failed' || status === 'Returned') {
      if (updatedDelivery.agentId) {
        const allAgents = mockStorage.getAgents();
        const agIndex = allAgents.findIndex((a) => a.id === updatedDelivery.agentId);
        if (agIndex !== -1) {
          allAgents[agIndex].failedDeliveriesCount = (allAgents[agIndex].failedDeliveriesCount || 0) + 1;
          allAgents[agIndex].assignedDeliveriesCount = Math.max(0, (allAgents[agIndex].assignedDeliveriesCount || 1) - 1);
          mockStorage.setAgents(allAgents);
        }
      }
    }

    return updatedDelivery;
  },

  async bulkAssignDeliveries(deliveryIds: string[], agentId: string): Promise<Delivery[]> {
    await delay(400);
    const deliveries = mockStorage.getDeliveries();
    const agents = mockStorage.getAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const updatedItems: Delivery[] = [];

    const newDeliveries = deliveries.map((d) => {
      if (deliveryIds.includes(d.id)) {
        const nextStatus: DeliveryStatus = d.status === 'Pending' ? 'Assigned' : d.status;
        const updated: Delivery = {
          ...d,
          agentId: agent.id,
          agentName: agent.name,
          agentPhone: agent.phone,
          status: nextStatus,
          timeline: [
            ...d.timeline,
            {
              status: 'Assigned',
              timestamp: `${dateStr} ${timeStr}`,
              note: `Bulk assigned to ${agent.name}`,
              updatedBy: 'Dispatcher',
            },
          ],
          updatedAt: now.toISOString(),
        };
        updatedItems.push(updated);
        return updated;
      }
      return d;
    });

    mockStorage.setDeliveries(newDeliveries);

    // Update agent's assigned deliveries count
    const agentIndex = agents.findIndex((a) => a.id === agentId);
    if (agentIndex !== -1) {
      agents[agentIndex].assignedDeliveriesCount =
        (agents[agentIndex].assignedDeliveriesCount || 0) + updatedItems.length;
      mockStorage.setAgents(agents);
    }
    return updatedItems;
  },

  async deleteDelivery(id: string): Promise<boolean> {
    await delay(300);
    const deliveries = mockStorage.getDeliveries();
    const filtered = deliveries.filter((d) => d.id !== id);
    if (filtered.length === deliveries.length) {
      return false;
    }
    mockStorage.setDeliveries(filtered);
    return true;
  },
};
