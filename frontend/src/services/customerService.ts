import { mockStorage, delay } from './mockStorage';
import type {
  Customer,
  BackendCustomer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from '../types/customer';
import type { Delivery } from '../types/delivery';
import type { PaginatedResponse, ApiResponse } from '../types/common';
import api from './api';
import { API_ENDPOINTS } from '../constants/endpoints';

/**
 * Type-safe mapper from Backend DB schema to Frontend Customer model
 */
const mapBackendCustomer = (c: BackendCustomer): Customer => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address,
  city: c.city ?? undefined,
  state: c.state ?? undefined,
  pincode: c.pincode ?? undefined,
  totalOrders: c.total_orders ?? 0,
  totalSpent: c.total_spent ?? 0,
  status: c.status ?? 'Active',
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

export const customerService = {
  async getAllCustomers(): Promise<Customer[]> {
    const response = await api.get<ApiResponse<BackendCustomer[]>>(
      API_ENDPOINTS.CUSTOMERS.BASE
    );
    const list = response.data.data || [];
    return list.map(mapBackendCustomer);
  },
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
    const response = await api.post<ApiResponse<BackendCustomer>>(
      API_ENDPOINTS.CUSTOMERS.BASE,
      input
    );
    return mapBackendCustomer(response.data.data);
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
