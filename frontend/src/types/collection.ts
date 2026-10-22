export type CollectionStatus = 'Pending' | 'Collected' | 'Settled';

export type PaymentMode = 'Cash' | 'UPI' | 'Card';

export interface Collection {
  id: string;
  deliveryId: string;
  trackingNumber: string;
  customerName: string;
  agentId: string;
  agentName: string;
  amount: number;
  paymentMode: PaymentMode;
  status: CollectionStatus;
  collectedAt?: string;
  settledAt?: string;
  settledBy?: string;
  notes?: string;
  createdAt: string;
}

export interface SettleCollectionInput {
  collectionIds: string[];
  settledBy: string;
  notes?: string;
}

export interface CollectionFilter {
  search?: string;
  status?: CollectionStatus | 'all';
  agentId?: string;
  paymentMode?: PaymentMode | 'all';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CollectionSummary {
  totalPendingAmount: number;
  totalCollectedAmount: number;
  totalSettledAmount: number;
  pendingCount: number;
  collectedCount: number;
  settledCount: number;
}
