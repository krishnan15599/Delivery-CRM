export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  totalOrders?: number;
  totalSpent?: number;
  status?: CustomerStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Raw customer schema as returned by the Backend API / Database
 */
export interface BackendCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  total_orders?: number;
  total_spent?: number;
  status?: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  status?: CustomerStatus;
}

export interface CustomerFilter {
  search?: string;
  city?: string;
  status?: CustomerStatus;
  page?: number;
  pageSize?: number;
}