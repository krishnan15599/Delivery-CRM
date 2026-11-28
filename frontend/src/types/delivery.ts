export type DeliveryStatus =
  | 'Order Created'
  | 'Received at Hub'
  | 'Ready for Dispatch'
  | 'Assigned'
  | 'Picked Up'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Failed'
  | 'Returned to Hub'
  | 'Returned to Merchant';

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
  trackingToken?: string;
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

/**
 * Raw delivery schema returned from backend DB
 */
export interface BackendDelivery {
  id: string;
  tracking_number: string;
  tracking_token?: string | null;
  customer_id?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  pickup_address: string;
  delivery_address: string;
  city?: string | null;
  pincode?: string | null;
  package_type?: string;
  item_description?: string | null;
  amount?: number;
  cod_amount?: number;
  agent_id?: string | null;
  agent_name?: string | null;
  agent_phone?: string | null;
  status: DeliveryStatus;
  payment_status: PaymentStatus;
  timeline?: DeliveryTimelineEvent[];
  notes?: string | null;
  date?: string;
  scheduled_date?: string | null;
  created_at?: string;
  updated_at?: string;
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
