export type DeliveryStatus =
  | 'Pending'
  | 'Assigned'
  | 'Picked Up'
  | 'In Transit'
  | 'Delivered'
  | 'Failed'
  | 'Returned';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'Paid' | 'Pending' | 'Failed';

export interface DeliveryTimelineEvent {
  status: DeliveryStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Delivery {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerId?: string;
  customerPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  city?: string;
  pincode?: string;
  packageType: string;
  itemDescription?: string;
  amount: number;
  codAmount?: number;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  status: DeliveryStatus;
  paymentStatus: PaymentStatus;
  timeline: DeliveryTimelineEvent[];
  notes?: string;
  date: string | Date;
  scheduledDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryInput {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  deliveryAddress: string;
  city?: string;
  pincode?: string;
  packageType: string;
  itemDescription?: string;
  amount: number;
  codAmount?: number;
  agentId?: string;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface UpdateDeliveryInput extends Partial<CreateDeliveryInput> {
  status?: DeliveryStatus;
}

export interface DeliveryFilter {
  search?: string;
  status?: DeliveryStatus | 'all';
  agentId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
