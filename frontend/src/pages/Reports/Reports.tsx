import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  IndianRupee,
  RefreshCw,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  PageHeader,
  Tabs,
  StatCard,
  DataTable,
  Button,
  DateRangePicker,
  StatusBadge,
  useToast,
  type Column,
  type DateRange,
} from '../../components/common';
import { reportService } from '../../services/reportService';
import { deliveryService } from '../../services/deliveryService';
import { collectionService } from '../../services/collectionService';
import type {
  DeliveryReportSummary,
  CollectionReportSummary,
  AgentPerformanceRow,
  CustomerReportRow,
} from '../../types/report';
import type { Delivery } from '../../types/delivery';
import type { Collection } from '../../types/collection';

const VALID_REPORT_TABS = ['delivery', 'collection', 'agent', 'customer'];

export const Reports: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab')?.toLowerCase();
  const [activeTab, setActiveTab] = useState<string>(
    tabParam && VALID_REPORT_TABS.includes(tabParam) ? tabParam : 'delivery'
  );

  useEffect(() => {
    const currentTab = searchParams.get('tab')?.toLowerCase();
    if (currentTab && VALID_REPORT_TABS.includes(currentTab)) {
      setActiveTab(currentTab);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    preset: 'Last 7 Days',
  });

  // Report Data
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReportSummary | null>(null);
  const [collectionReport, setCollectionReport] = useState<CollectionReportSummary | null>(null);
  const [agentReports, setAgentReports] = useState<AgentPerformanceRow[]>([]);
  const [customerReports, setCustomerReports] = useState<CustomerReportRow[]>([]);

  // Detailed rows for table
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [delRep, colRep, agRep, custRep, delList, colList] = await Promise.all([
        reportService.getDeliveryReport(dateRange),
        reportService.getCollectionReport(dateRange),
        reportService.getAgentReports(dateRange),
        reportService.getCustomerReports(dateRange),
        deliveryService.getDeliveries({ pageSize: 50 }),
        collectionService.getCollections({ pageSize: 50 }),
      ]);

      setDeliveryReport(delRep);
      setCollectionReport(colRep);
      setAgentReports(agRep);
      setCustomerReports(custRep);
      setDeliveries(delList.data);
      setCollections(colList.data);
    } catch {
      toast.error('Failed to generate operational reports');
    } finally {
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Export CSV Helper
  const exportCSV = () => {
    let filename = `report_${activeTab}_${Date.now()}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === 'delivery') {
      headers = ['Tracking No', 'Customer', 'Agent', 'Package Type', 'Amount', 'Status', 'Date'];
      rows = deliveries.map((d) => [
        d.trackingNumber,
        `"${d.customerName}"`,
        `"${d.agentName || 'Unassigned'}"`,
        d.packageType,
        d.amount,
        d.status,
        String(d.date),
      ]);
    } else if (activeTab === 'collection') {
      headers = ['Tracking No', 'Customer', 'Agent', 'Amount', 'Payment Mode', 'Status', 'Date'];
      rows = collections.map((c) => [
        c.trackingNumber,
        `"${c.customerName}"`,
        `"${c.agentName}"`,
        c.amount,
        c.paymentMode,
        c.status,
        String(c.createdAt).split('T')[0],
      ]);
    } else if (activeTab === 'agent') {
      headers = ['Agent ID', 'Agent Name', 'Assigned', 'Delivered', 'Failed', 'Success %', 'Collected ₹', 'Rating'];
      rows = agentReports.map((a) => [
        a.agentId,
        `"${a.agentName}"`,
        a.assigned,
        a.completed,
        a.failed,
        `${a.successRate}%`,
        a.collectedAmount,
        a.rating,
      ]);
    } else if (activeTab === 'customer') {
      headers = ['Customer ID', 'Customer Name', 'Phone', 'Total Orders', 'Delivered Orders', 'Total Spent ₹', 'Last Order Date'];
      rows = customerReports.map((c) => [
        c.customerId,
        `"${c.customerName}"`,
        c.phone,
        c.totalOrders,
        c.deliveredOrders,
        c.totalSpent,
        c.lastOrderDate,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filename} successfully!`);
  };

  // Columns for Delivery Report
  const deliveryCols: Column<Delivery>[] = [
    { key: 'trackingNumber', header: 'Tracking #', render: (r) => <span className="font-mono font-semibold text-xs text-gray-900">{r.trackingNumber}</span> },
    { key: 'customerName', header: 'Customer', render: (r) => <span className="text-xs text-gray-800">{r.customerName}</span> },
    { key: 'agentName', header: 'Agent', render: (r) => <span className="text-xs text-gray-600">{r.agentName || 'Unassigned'}</span> },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <span className="font-semibold text-xs text-gray-900">₹{r.amount}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: 'date', header: 'Date', render: (r) => <span className="text-xs text-gray-500">{String(r.date)}</span> },
  ];

  // Columns for Collection Report
  const collectionCols: Column<Collection>[] = [
    { key: 'trackingNumber', header: 'Tracking #', render: (r) => <span className="font-mono font-semibold text-xs text-gray-900">{r.trackingNumber}</span> },
    { key: 'customerName', header: 'Customer', render: (r) => <span className="text-xs text-gray-800">{r.customerName}</span> },
    { key: 'agentName', header: 'Agent', render: (r) => <span className="text-xs text-gray-600">{r.agentName}</span> },
    { key: 'amount', header: 'Collected', align: 'right', render: (r) => <span className="font-semibold text-xs text-gray-900">₹{r.amount}</span> },
    { key: 'paymentMode', header: 'Mode', render: (r) => <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{r.paymentMode}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="sm" /> },
  ];

  // Columns for Agent Report
  const agentCols: Column<AgentPerformanceRow>[] = [
    { key: 'agentName', header: 'Agent Name', render: (r) => <span className="font-semibold text-xs text-gray-900">{r.agentName}</span> },
    { key: 'assigned', header: 'Assigned', align: 'center', render: (r) => <span className="text-xs font-medium">{r.assigned}</span> },
    { key: 'completed', header: 'Delivered', align: 'center', render: (r) => <span className="text-xs font-bold text-emerald-600">{r.completed}</span> },
    { key: 'failed', header: 'Failed', align: 'center', render: (r) => <span className="text-xs font-medium text-rose-600">{r.failed}</span> },
    { key: 'successRate', header: 'Success %', align: 'center', render: (r) => <span className="text-xs font-bold text-blue-700">{r.successRate}%</span> },
    { key: 'collectedAmount', header: 'Collected Cash', align: 'right', render: (r) => <span className="font-bold text-xs text-gray-900">₹{r.collectedAmount.toLocaleString()}</span> },
    {
      key: 'rating',
      header: 'Rating',
      align: 'center',
      render: (r) => (
        <span className="flex items-center justify-center gap-1 text-xs font-bold text-amber-500">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {r.rating}
        </span>
      ),
    },
  ];

  // Columns for Customer Report
  const customerCols: Column<CustomerReportRow>[] = [
    { key: 'customerName', header: 'Customer', render: (r) => <span className="font-semibold text-xs text-gray-900">{r.customerName}</span> },
    { key: 'phone', header: 'Phone', render: (r) => <span className="text-xs text-gray-500">{r.phone}</span> },
    { key: 'totalOrders', header: 'Orders Placed', align: 'center', render: (r) => <span className="text-xs font-bold">{r.totalOrders}</span> },
    { key: 'deliveredOrders', header: 'Delivered', align: 'center', render: (r) => <span className="text-xs font-medium text-emerald-600">{r.deliveredOrders}</span> },
    { key: 'totalSpent', header: 'Total Spent', align: 'right', render: (r) => <span className="font-bold text-xs text-gray-900">₹{r.totalSpent.toLocaleString()}</span> },
    { key: 'lastOrderDate', header: 'Last Order', render: (r) => <span className="text-xs text-gray-500">{r.lastOrderDate}</span> },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Analytics & Operational Reports"
        subtitle="Exportable business intelligence covering shipments, revenue collections, and staff performance."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Reports' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadReportData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={exportCSV}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-6">
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSearchParams({ tab });
          }}
          items={[
            { id: 'delivery', label: 'Delivery Report' },
            { id: 'collection', label: 'Collection Report' },
            { id: 'agent', label: 'Agent Report' },
            { id: 'customer', label: 'Customer Report' },
          ]}
        />

        {/* 1. DELIVERY REPORT TAB */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Shipments"
                value={deliveryReport?.totalDeliveries || deliveries.length}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Delivered Successfully"
                value={deliveryReport?.delivered || 0}
                icon={CheckCircle2}
                color="emerald"
                trend={{ value: `${deliveryReport?.successRate || 92}% rate`, isPositive: true }}
              />
              <StatCard
                title="In Transit / Picked Up"
                value={deliveryReport?.inTransit || 0}
                icon={Clock}
                color="indigo"
              />
              <StatCard
                title="Failed / Returned"
                value={deliveryReport?.failed || 0}
                icon={AlertTriangle}
                color="rose"
              />
            </div>

            {/* Delivery Volume Chart */}
            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Daily Delivery Volume & Completion Trend
              </h3>
              <p className="text-xs text-gray-500 mb-4">Total packages vs successfully delivered</p>
              <div className="h-64 w-full">
                {deliveryReport?.trends ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={deliveryReport.trends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#2c5fbf"
                        fill="#2c5fbf"
                        fillOpacity={0.15}
                        name="Total Orders"
                      />
                      <Area
                        type="monotone"
                        dataKey="delivered"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.25}
                        name="Delivered"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Delivery Transactions</h4>
              <DataTable data={deliveries} columns={deliveryCols} loading={loading} />
            </div>
          </div>
        )}

        {/* 2. COLLECTION REPORT TAB */}
        {activeTab === 'collection' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard
                title="Total Expected COD"
                value={`₹${(collectionReport?.totalAmount || 0).toLocaleString()}`}
                icon={IndianRupee}
                color="blue"
              />
              <StatCard
                title="Collected Amount"
                value={`₹${(collectionReport?.collectedAmount || 0).toLocaleString()}`}
                icon={CheckCircle2}
                color="indigo"
              />
              <StatCard
                title="Pending at Hub"
                value={`₹${(collectionReport?.pendingAmount || 0).toLocaleString()}`}
                icon={Clock}
                color="amber"
              />
              <StatCard
                title="Reconciled & Settled"
                value={`₹${(collectionReport?.settledAmount || 0).toLocaleString()}`}
                icon={IndianRupee}
                color="emerald"
              />
            </div>

            {/* Payment Method Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Cash', value: collectionReport?.cashPercentage || 60, color: '#f59e0b' },
                        { name: 'UPI', value: collectionReport?.upiPercentage || 30, color: '#2c5fbf' },
                        { name: 'Card', value: collectionReport?.cardPercentage || 10, color: '#10b981' },
                      ]}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#2c5fbf" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 flex flex-col justify-center space-y-3">
                <h4 className="text-sm font-bold text-gray-900">Payment Channel Breakdown</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cash Payments
                    </span>
                    <span className="font-bold text-gray-900">{collectionReport?.cashPercentage || 60}%</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> UPI / Digital Wallets
                    </span>
                    <span className="font-bold text-gray-900">{collectionReport?.upiPercentage || 30}%</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Card on Delivery
                    </span>
                    <span className="font-bold text-gray-900">{collectionReport?.cardPercentage || 10}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collections List */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Reconciled Collections</h4>
              <DataTable data={collections} columns={collectionCols} loading={loading} />
            </div>
          </div>
        )}

        {/* 3. AGENT PERFORMANCE TAB */}
        {activeTab === 'agent' && (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Completed Deliveries by Field Agent
              </h3>
              <p className="text-xs text-gray-500 mb-4">Volume dispatched per delivery executive</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentReports} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="agentName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#2c5fbf" radius={[4, 4, 0, 0]} name="Completed Deliveries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agent Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Agent Performance Scorecard</h4>
              <DataTable data={agentReports} columns={agentCols} loading={loading} />
            </div>
          </div>
        )}

        {/* 4. CUSTOMER REPORT TAB */}
        {activeTab === 'customer' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Customer Order History & Lifetime Value</h4>
              <DataTable data={customerReports} columns={customerCols} loading={loading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
