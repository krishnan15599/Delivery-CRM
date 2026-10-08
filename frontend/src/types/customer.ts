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