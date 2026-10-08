import { mockStorage, delay } from './mockStorage';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from '../types/customer';
import type { Delivery } from '../types/delivery';
import type { PaginatedResponse } from '../types/common';

export const customerService = {
  async getCustomers(filter: CustomerFilter = {}): Promise<PaginatedResponse<Customer>> {
    await delay(250);
    let items = mockStorage.getCustomers();

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }

    if (filter.status) {
      items = items.filter((c) => c.status === filter.status);
    }

    if (filter.city) {
      items = items.filter((c) => c.city?.toLowerCase() === filter.city?.toLowerCase());
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

  async getCustomerById(id: string): Promise<Customer | null> {
    await delay(200);
    const customers = mockStorage.getCustomers();
    const customer = customers.find((c) => c.id === id);
    return customer || null;
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    await delay(350);
    const customers = mockStorage.getCustomers();
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().split('T')[0];

    const newCustomer: Customer = {
      id: newId,
      ...input,
      totalOrders: 0,
      totalSpent: 0,
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    mockStorage.setCustomers([newCustomer, ...customers]);
    return newCustomer;
  },

  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    await delay(300);
    const customers = mockStorage.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    const updatedCustomer: Customer = {
      ...customers[index],
      ...input,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    customers[index] = updatedCustomer;
    mockStorage.setCustomers(customers);
    return updatedCustomer;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    await delay(300);
    const customers = mockStorage.getCustomers();
    const filtered = customers.filter((c) => c.id !== id);
    if (filtered.length === customers.length) {
      return false;
    }
    mockStorage.setCustomers(filtered);
    return true;
  },

  async getCustomerDeliveries(customerId: string): Promise<Delivery[]> {
    await delay(250);
    const deliveries = mockStorage.getDeliveries();
    return deliveries.filter((d) => d.customerId === customerId);
  },
};
