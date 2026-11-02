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
import { mapBackendDelivery } from './deliveryService';

/**
 * Type-safe mapper from Backend DB schema to Frontend Customer model
 */
export const mapBackendCustomer = (c: BackendCustomer | any): Customer => ({
  id: c.id,
  name: c.name,
  email: c.email || '',
  phone: c.phone || '',
  address: c.address || '',
  city: c.city ?? undefined,
  state: c.state ?? undefined,
  pincode: c.pincode ?? undefined,
  totalOrders: c.total_orders ?? c.totalOrders ?? 0,
  totalSpent: Number(c.total_spent ?? c.totalSpent ?? 0),
  status: c.status ?? 'Active',
  createdAt: c.created_at || c.createdAt || new Date().toISOString(),
  updatedAt: c.updated_at || c.updatedAt || new Date().toISOString(),
});

export const customerService = {
  /**
   * Fetch all customers without pagination (convenience for dropdowns and full lists)
   */
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await api.get<ApiResponse<BackendCustomer[]>>(
        API_ENDPOINTS.CUSTOMERS.BASE
      );
      const list = response.data.data || [];
      return list.map(mapBackendCustomer);
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for getAllCustomers:', error);
      await delay(200);
      return mockStorage.getCustomers();
    }
  },

  /**
   * Fetch paginated and filtered customers
   */
  async getCustomers(filter: CustomerFilter = {}): Promise<PaginatedResponse<Customer>> {
    try {
      const response = await api.get<ApiResponse<BackendCustomer[]>>(
        API_ENDPOINTS.CUSTOMERS.BASE,
        { params: filter }
      );
      const list = (response.data.data || []).map(mapBackendCustomer);
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
      console.warn('Backend API unavailable, falling back to mock storage for getCustomers:', error);
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
    }
  },

  /**
   * Fetch single customer by ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await api.get<ApiResponse<BackendCustomer>>(
        API_ENDPOINTS.CUSTOMERS.BY_ID(id)
      );
      return response.data.data ? mapBackendCustomer(response.data.data) : null;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getCustomerById(${id}):`, error);
      await delay(200);
      const customers = mockStorage.getCustomers();
      return customers.find((c) => c.id === id) || null;
    }
  },

  /**
   * Create new customer
   */
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      const response = await api.post<ApiResponse<BackendCustomer>>(
        API_ENDPOINTS.CUSTOMERS.BASE,
        input
      );
      return mapBackendCustomer(response.data.data);
    } catch (error) {
      console.warn('Backend API unavailable, falling back to mock storage for createCustomer:', error);
      await delay(300);
      const customers = mockStorage.getCustomers();
      const newCustomer: Customer = {
        id: `CUST-${1000 + customers.length + 1}`,
        ...input,
        totalOrders: 0,
        totalSpent: 0,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      mockStorage.setCustomers([newCustomer, ...customers]);
      return newCustomer;
    }
  },

  /**
   * Update existing customer
   */
  async updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
    try {
      const response = await api.put<ApiResponse<BackendCustomer>>(
        API_ENDPOINTS.CUSTOMERS.BY_ID(id),
        input
      );
      return mapBackendCustomer(response.data.data);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for updateCustomer(${id}):`, error);
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
    }
  },

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await api.delete(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
      return true;
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for deleteCustomer(${id}):`, error);
      await delay(300);
      const customers = mockStorage.getCustomers();
      const filtered = customers.filter((c) => c.id !== id);
      if (filtered.length === customers.length) {
        return false;
      }
      mockStorage.setCustomers(filtered);
      return true;
    }
  },

  /**
   * Fetch deliveries for a customer
   */
  async getCustomerDeliveries(customerId: string): Promise<Delivery[]> {
    try {
      const response = await api.get<ApiResponse<any[]>>(
        API_ENDPOINTS.CUSTOMERS.DELIVERIES(customerId)
      );
      return (response.data.data || []).map(mapBackendDelivery);
    } catch (error) {
      console.warn(`Backend API unavailable, falling back to mock storage for getCustomerDeliveries(${customerId}):`, error);
      await delay(250);
      const deliveries = mockStorage.getDeliveries();
      return deliveries.filter((d) => d.customerId === customerId);
    }
  },
};
