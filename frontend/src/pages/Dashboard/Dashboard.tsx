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
  Badge,
  Card,
  Button,
  EmptyState,
  Skeleton,
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

const getChartStatusColor = (name: string): string => {
  const normalized = name.toLowerCase();
  if (normalized.includes('delivered') || normalized.includes('completed')) {
    return '#16a34a'; // green-600
  }
  if (normalized.includes('transit') || normalized.includes('picked up')) {
    return '#2563eb'; // blue-600
  }
  if (normalized.includes('pending') || normalized.includes('assigned')) {
    return '#f59e0b'; // amber-500
  }
  if (normalized.includes('fail') || normalized.includes('return') || normalized.includes('cancel')) {
    return '#dc2626'; // red-600
  }
  return '#4f46e5'; // indigo-600
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
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
      setError('Failed to load dashboard data. Please try again.');
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
        <span className="font-semibold text-slate-900 font-mono text-xs">
          {row.trackingNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900 text-xs">{row.customerName}</div>
          <div className="text-[11px] text-slate-500">{row.deliveryAddress}</div>
        </div>
      ),
    },
    {
      key: 'agentName',
      header: 'Agent',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.agentName ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
              {row.agentName}
            </span>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-slate-900 text-xs">
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
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
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
              isLoading={loading}
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

      {/* In-page Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={loadDashboardData}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Orders"
          value={totalCount}
          icon={Package}
          color="indigo"
          loading={loading}
          trend={{ value: '14.2%', isPositive: true }}
          onClick={() => navigate('/deliveries')}
        />
        <StatCard
          title="In Transit"
          value={inTransitCount}
          icon={Truck}
          color="blue"
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
          color="indigo"
          loading={loading}
          trend={{ value: '18% vs last wk', isPositive: true }}
          onClick={() => navigate('/collections')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliveries Over Time Area/Line Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Deliveries Over Time</h2>
              <p className="text-sm text-slate-500">Weekly delivery volume and completion trend</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Total
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span> Delivered
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {loading ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 pb-2">
                <div className="flex items-end justify-between gap-4 h-48 px-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="flex-1 rounded-t-md"
                      style={{ height: `${35 + ((i * 13) % 50)}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between px-2 pt-2 border-t border-slate-200">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-3 w-10" />
                  ))}
                </div>
              </div>
            ) : reportData && reportData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reportData.trends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDelivered)"
                    name="Delivered"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="No delivery trends available"
                description="Delivery history will appear here once orders are processed."
              />
            )}
          </div>
        </Card>

        {/* Status Distribution Donut Chart */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-slate-900">Status Breakdown</h2>
              <Badge variant="success" size="sm">
                {reportData?.successRate || 92}% Success
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mb-4">Current order disposition</p>

            <div className="h-44 w-full flex items-center justify-center relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center">
                  <Skeleton circle className="w-28 h-28" />
                </div>
              ) : reportData && reportData.statusBreakdown && reportData.statusBreakdown.length > 0 ? (
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
                          <Cell key={`cell-${index}`} fill={getChartStatusColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '12px',
                          border: 'none',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-slate-900">{totalCount}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Orders</span>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="No status data"
                  description="Order disposition status is unavailable."
                />
              )}
            </div>

            {/* Legend breakdown */}
            <div className="space-y-2 pt-2">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                reportData?.statusBreakdown.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getChartStatusColor(item.name) }}
                      ></span>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Recent Deliveries & Top Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Deliveries Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Deliveries</h2>
              <p className="text-sm text-slate-500">Live feed of packages dispatched and out for delivery</p>
            </div>
            <Link
              to="/deliveries"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <DataTable
            data={deliveries}
            columns={recentColumns}
            loading={loading}
            emptyState={
              <EmptyState
                title="No recent deliveries found"
                description="Dispatched packages will appear in this live feed."
              />
            }
            onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
          />
        </div>

        {/* Top Field Agents */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-slate-900">Top Field Agents</h2>
              <Link
                to="/agents"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                All Agents <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-sm text-slate-500 mb-4">Ranked by completed delivery rating</p>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Skeleton circle className="w-8 h-8" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-2.5 w-32" />
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <Skeleton className="h-3 w-10 ml-auto" />
                      <Skeleton className="h-2.5 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : agents.length === 0 ? (
              <EmptyState
                title="No field agents found"
                description="Active agent performance will be tracked here."
              />
            ) : (
              <div className="divide-y divide-slate-200">
                {agents.slice(0, 4).map((agent, i) => (
                  <div
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{agent.name}</span>
                          {i === 0 && (
                            <span className="p-0.5 rounded bg-amber-50 text-amber-500" title="Top Agent">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {agent.vehicleType} • {agent.hubLocation}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{agent.rating}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {agent.completedDeliveriesCount} delivered
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Active Agents On Shift:</span>
            <strong className="text-slate-900">
              {agents.filter((a) => a.status === 'On Delivery' || a.status === 'Active').length} Active
            </strong>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
