import { mockStorage, delay } from './mockStorage';
import type {
  DeliveryReportSummary,
  CollectionReportSummary,
  AgentPerformanceRow,
  CustomerReportRow,
  ReportFilter,
  TrendDataPoint,
} from '../types/report';

export const reportService = {
  async getDeliveryReport(_filter: ReportFilter = {}): Promise<DeliveryReportSummary> {
    await delay(300);
    const deliveries = mockStorage.getDeliveries();

    let delivered = 0;
    let inTransit = 0;
    let pending = 0;
    let failed = 0;
    let returned = 0;
    let totalRevenue = 0;

    deliveries.forEach((d) => {
      totalRevenue += d.amount;
      switch (d.status) {
        case 'Delivered':
          delivered++;
          break;
        case 'In Transit':
        case 'Picked Up':
          inTransit++;
          break;
        case 'Pending':
        case 'Assigned':
          pending++;
          break;
        case 'Failed':
          failed++;
          break;
        case 'Returned':
          returned++;
          break;
      }
    });

    const total = deliveries.length || 1;
    const successRate = Math.round((delivered / total) * 100);

    const trends: TrendDataPoint[] = [
      { date: 'Oct 01', total: 45, delivered: 40, failed: 2, inTransit: 3 },
      { date: 'Oct 02', total: 62, delivered: 55, failed: 3, inTransit: 4 },
      { date: 'Oct 03', total: 80, delivered: 72, failed: 4, inTransit: 4 },
      { date: 'Oct 04', total: 95, delivered: 86, failed: 5, inTransit: 4 },
      { date: 'Oct 05', total: 110, delivered: 98, failed: 6, inTransit: 6 },
      { date: 'Oct 06', total: 135, delivered: 122, failed: 4, inTransit: 9 },
      { date: 'Oct 07', total: 88, delivered: 68, failed: 3, inTransit: 17 },
    ];

    const statusBreakdown = [
      { name: 'Delivered', value: delivered || 68, color: '#10b981' },
      { name: 'In Transit', value: inTransit || 14, color: '#2c5fbf' },
      { name: 'Pending', value: pending || 10, color: '#f59e0b' },
      { name: 'Failed', value: failed || 5, color: '#f43f5e' },
      { name: 'Returned', value: returned || 3, color: '#64748b' },
    ];

    return {
      totalDeliveries: total,
      delivered,
      inTransit,
      pending,
      failed,
      returned,
      successRate,
      totalRevenue,
      trends,
      statusBreakdown,
    };
  },

  async getCollectionReport(_filter: ReportFilter = {}): Promise<CollectionReportSummary> {
    await delay(250);
    const collections = mockStorage.getCollections();

    let totalAmount = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;
    let settledAmount = 0;

    let cashCount = 0;
    let upiCount = 0;
    let cardCount = 0;

    collections.forEach((c) => {
      totalAmount += c.amount;
      if (c.status === 'Collected') collectedAmount += c.amount;
      if (c.status === 'Pending') pendingAmount += c.amount;
      if (c.status === 'Settled') settledAmount += c.amount;

      if (c.paymentMode === 'Cash') cashCount++;
      if (c.paymentMode === 'UPI') upiCount++;
      if (c.paymentMode === 'Card') cardCount++;
    });

    const totalMode = cashCount + upiCount + cardCount || 1;

    return {
      totalAmount,
      collectedAmount,
      pendingAmount,
      settledAmount,
      cashPercentage: Math.round((cashCount / totalMode) * 100),
      upiPercentage: Math.round((upiCount / totalMode) * 100),
      cardPercentage: Math.round((cardCount / totalMode) * 100),
    };
  },

  async getAgentReports(_filter: ReportFilter = {}): Promise<AgentPerformanceRow[]> {
    await delay(250);
    const agents = mockStorage.getAgents();

    return agents.map((a) => {
      const total = a.completedDeliveriesCount + a.failedDeliveriesCount || 1;
      const successRate = Math.round((a.completedDeliveriesCount / total) * 100);
      return {
        agentId: a.id,
        agentName: a.name,
        assigned: a.assignedDeliveriesCount,
        completed: a.completedDeliveriesCount,
        failed: a.failedDeliveriesCount,
        successRate,
        collectedAmount: a.pendingCashAmount + a.settledCashAmount,
        rating: a.rating,
      };
    });
  },

  async getCustomerReports(_filter: ReportFilter = {}): Promise<CustomerReportRow[]> {
    await delay(250);
    const customers = mockStorage.getCustomers();

    return customers.map((c) => ({
      customerId: c.id,
      customerName: c.name,
      phone: c.phone,
      totalOrders: c.totalOrders || 0,
      deliveredOrders: Math.max(0, (c.totalOrders || 0) - 1),
      totalSpent: c.totalSpent || 0,
      lastOrderDate: String(c.updatedAt).split('T')[0],
    }));
  },
};
