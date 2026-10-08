import React, { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  Truck,
  Star,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  StatCard,
  DataTable,
  StatusBadge,
  Button,
  DateRangePicker,
  useToast,
  type Column,
  type DateRange,
} from '../../components/common';
import { deliveryService } from '../../services/deliveryService';
import { agentService } from '../../services/agentService';
import { collectionService } from '../../services/collectionService';
import { reportService } from '../../services/reportService';
import type { Delivery } from '../../types/delivery';
import type { Agent } from '../../types/agent';
import type { DeliveryReportSummary } from '../../types/report';
import type { CollectionSummary } from '../../types/collection';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reportData, setReportData] = useState<DeliveryReportSummary | null>(null);
  const [collectionSummary, setCollectionSummary] = useState<CollectionSummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    preset: 'Last 7 Days',
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [delRes, agRes, repRes, colRes] = await Promise.all([
        deliveryService.getDeliveries({ pageSize: 5 }),
        agentService.getAgents({ pageSize: 5 }),
        reportService.getDeliveryReport(),
        collectionService.getCollectionSummary(),
      ]);

      setDeliveries(delRes.data);
      setAgents(agRes.data);
      setReportData(repRes);
      setCollectionSummary(colRes);
    } catch {
      toast.error('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const totalCount = reportData?.totalDeliveries || deliveries.length;
  const inTransitCount = deliveries.filter((d) => d.status === 'In Transit' || d.status === 'Picked Up').length;
  const pendingCount = deliveries.filter((d) => d.status === 'Pending' || d.status === 'Assigned').length;
  const deliveredCount = reportData?.delivered || deliveries.filter((d) => d.status === 'Delivered').length;
  const failedCount = reportData?.failed || deliveries.filter((d) => d.status === 'Failed' || d.status === 'Returned').length;
  const collectedAmount = collectionSummary?.totalCollectedAmount || 0;

  const recentColumns: Column<Delivery>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking No',
      render: (row) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {row.trackingNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 text-xs">{row.customerName}</div>
          <div className="text-[11px] text-gray-400">{row.deliveryAddress}</div>
        </div>
      ),
    },
    {
      key: 'agentName',
      header: 'Agent',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.agentName ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {row.agentName}
            </span>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          ₹{row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Link
          to={`/deliveries/${row.id}`}
          className="text-xs font-semibold text-[#2c5fbf] hover:text-[#1a3d82] inline-flex items-center gap-0.5"
        >
          View <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time delivery progress, field agent dispatch, and cash collection tracking."
        actions={
          <div className="flex items-center gap-2.5">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadDashboardData}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Truck className="w-3.5 h-3.5" />}
              onClick={() => navigate('/deliveries/new')}
            >
              Dispatch Delivery
            </Button>
          </div>
        }
      />

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Orders"
          value={totalCount}
          icon={Package}
          color="blue"
          loading={loading}
          trend={{ value: '14.2%', isPositive: true }}
          onClick={() => navigate('/deliveries')}
        />
        <StatCard
          title="In Transit"
          value={inTransitCount}
          icon={Truck}
          color="indigo"
          loading={loading}
          trend={{ value: 'Active now', isPositive: null }}
          onClick={() => navigate('/deliveries?status=In Transit')}
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          color="amber"
          loading={loading}
          trend={{ value: 'Needs assign', isPositive: false }}
          onClick={() => navigate('/deliveries?status=Pending')}
        />
        <StatCard
          title="Delivered"
          value={deliveredCount}
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
          trend={{ value: '94% rate', isPositive: true }}
          onClick={() => navigate('/deliveries?status=Delivered')}
        />
        <StatCard
          title="Failed / Return"
          value={failedCount}
          icon={AlertTriangle}
          color="rose"
          loading={loading}
          trend={{ value: '2.8%', isPositive: false }}
          onClick={() => navigate('/deliveries?status=Failed')}
        />
        <StatCard
          title="Collected Cash"
          value={`₹${collectedAmount.toLocaleString()}`}
          icon={IndianRupee}
          color="cyan"
          loading={loading}
          trend={{ value: '18% vs last wk', isPositive: true }}
          onClick={() => navigate('/collections')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries Over Time Area/Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Deliveries Over Time</h2>
              <p className="text-xs text-gray-500">Weekly delivery volume and completion trend</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2c5fbf]"></span> Total
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Delivered
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {reportData && reportData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reportData.trends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2c5fbf" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2c5fbf" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#2c5fbf"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDelivered)"
                    name="Delivered"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Loading chart data...
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-gray-900">Status Breakdown</h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {reportData?.successRate || 92}% Success
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Current order disposition</p>

            <div className="h-44 w-full flex items-center justify-center relative">
              {reportData && reportData.statusBreakdown ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.statusBreakdown}
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {reportData.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-gray-900">{totalCount}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">Orders</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Legend breakdown */}
            <div className="space-y-2 pt-2">
              {reportData?.statusBreakdown.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Deliveries & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deliveries Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Deliveries</h2>
              <p className="text-xs text-gray-500">Live feed of packages dispatched and out for delivery</p>
            </div>
            <Link
              to="/deliveries"
              className="text-xs font-semibold text-[#2c5fbf] hover:text-[#1a3d82] flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            data={deliveries}
            columns={recentColumns}
            loading={loading}
            emptyText="No recent deliveries found."
            onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
          />
        </div>

        {/* Top Field Agents */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900">Top Field Agents</h2>
              <Link
                to="/agents"
                className="text-xs font-semibold text-[#2c5fbf] hover:text-[#1a3d82] flex items-center gap-1"
              >
                All Agents <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-gray-500 mb-4">Ranked by completed delivery rating</p>

            <div className="divide-y divide-gray-100">
              {agents.slice(0, 4).map((agent, i) => (
                <div
                  key={agent.id}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50/70 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2c5fbf] flex items-center justify-center font-bold text-xs shrink-0">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        <span>{agent.name}</span>
                        {i === 0 && (
                          <span className="p-0.5 rounded bg-amber-50 text-amber-600" title="Top Agent">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {agent.vehicleType} • {agent.hubLocation}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{agent.rating}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      {agent.completedDeliveriesCount} delivered
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Active Agents On Shift:</span>
            <strong className="text-gray-900">{agents.filter((a) => a.status === 'On Delivery' || a.status === 'Active').length} Active</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
