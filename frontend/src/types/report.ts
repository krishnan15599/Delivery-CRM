export type ReportType = 'delivery' | 'collection' | 'agent' | 'customer';

export interface TrendDataPoint {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  inTransit: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DeliveryReportSummary {
  totalDeliveries: number;
  delivered: number;
  inTransit: number;
  pending: number;
  failed: number;
  returned: number;
  successRate: number;
  totalRevenue: number;
  trends: TrendDataPoint[];
  statusBreakdown: StatusDistribution[];
}

export interface AgentPerformanceRow {
  agentId: string;
  agentName: string;
  assigned: number;
  completed: number;
  failed: number;
  successRate: number;
  collectedAmount: number;
  rating: number;
}

export interface CollectionReportSummary {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  settledAmount: number;
  cashPercentage: number;
  upiPercentage: number;
  cardPercentage: number;
}

export interface CustomerReportRow {
  customerId: string;
  customerName: string;
  phone: string;
  totalOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  agentId?: string;
  hubLocation?: string;
}
