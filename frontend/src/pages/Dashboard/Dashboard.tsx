import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  UserPlus,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { deliveryService } from '../../services/deliveryService';
import { agentService } from '../../services/agentService';
import { useToast } from '../../components/common';
import type { Delivery } from '../../types/delivery';
import type { Agent } from '../../types/agent';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [delRes, agRes] = await Promise.all([
        deliveryService.getDeliveries({ pageSize: 100 }),
        agentService.getAgents({ pageSize: 50 }),
      ]);

      setDeliveries(delRes.data || []);
      setAgents(agRes.data || []);
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

  // Real delivery counts
  const totalCount = deliveries.length;
  const createdCount = deliveries.filter(
    (d) => !d.agentId || ['Order Created', 'Received at Hub', 'Ready for Dispatch'].includes(d.status)
  ).length;
  const assignedCount = deliveries.filter(
    (d) => d.agentId && d.status === 'Assigned'
  ).length;
  const inTransitCount = deliveries.filter(
    (d) => d.status === 'Out for Delivery' || d.status === 'Picked Up'
  ).length;
  const deliveredCount = deliveries.filter((d) => d.status === 'Delivered').length;

  // Real financial metrics
  const cashToCollect = deliveries
    .filter((d) => d.paymentStatus !== 'Paid' && d.paymentStatus !== 'paid')
    .reduce((sum, d) => sum + (d.codAmount || d.amount || 0), 0);

  const collectedSoFar = deliveries
    .filter((d) => d.paymentStatus === 'Paid' || d.paymentStatus === 'paid')
    .reduce((sum, d) => sum + (d.codAmount || d.amount || 0), 0);

  const unpaidCount = deliveries.filter(
    (d) => d.paymentStatus !== 'Paid' && d.paymentStatus !== 'paid'
  ).length;
  const paidCount = deliveries.filter(
    (d) => d.paymentStatus === 'Paid' || d.paymentStatus === 'paid'
  ).length;

  // Real agent metrics
  const activeAgentsCount = agents.filter(
    (a) => a.status === 'Active' || a.status === 'On Delivery'
  ).length;
  const offDutyCount = agents.filter(
    (a) => a.status === 'Off Duty' || a.status === 'Inactive'
  ).length;

  const successRate =
    totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;

  // Pipeline stage relative bar widths
  const maxStageCount = Math.max(createdCount, assignedCount, inTransitCount, deliveredCount, 1);

  // Dynamic Weekly deliveries chart data computed from real deliveries
  const chartData = useMemo(() => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const daysMap: Record<string, { day: string; delivered: number; pending: number; failed: number }> = {};
    const dayKeys: string[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const dateStr = d.toISOString().slice(0, 10);
      daysMap[dateStr] = { day: dayName, delivered: 0, pending: 0, failed: 0 };
      dayKeys.push(dateStr);
    }

    let matchedAny = false;
    deliveries.forEach((del) => {
      const dStr = String(del.date || del.createdAt || '').slice(0, 10);
      if (daysMap[dStr]) {
        matchedAny = true;
        if (del.status === 'Delivered') daysMap[dStr].delivered++;
        else if (['Failed', 'Returned to Hub', 'Returned to Merchant'].includes(del.status)) daysMap[dStr].failed++;
        else daysMap[dStr].pending++;
      }
    });

    if (!matchedAny && deliveries.length > 0) {
      const dateGroups = new Map<string, { day: string; delivered: number; pending: number; failed: number }>();
      deliveries.forEach((del) => {
        const dStr = String(del.date || del.createdAt || '').slice(0, 10) || 'Recent';
        const parsedDate = new Date(dStr);
        const dayName = isNaN(parsedDate.getTime()) ? dStr.slice(-5) : daysOfWeek[parsedDate.getDay()];
        const cur = dateGroups.get(dStr) || { day: dayName, delivered: 0, pending: 0, failed: 0 };
        if (del.status === 'Delivered') cur.delivered++;
        else if (['Failed', 'Returned to Hub', 'Returned to Merchant'].includes(del.status)) cur.failed++;
        else cur.pending++;
        dateGroups.set(dStr, cur);
      });

      return Array.from(dateGroups.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-7)
        .map(([, val]) => val);
    }

    return dayKeys.map((k) => daysMap[k]);
  }, [deliveries]);

  // Real agents list
  const displayAgents = useMemo(() => {
    return agents.slice(0, 5).map((ag) => {
      const completed = ag.completedDeliveriesCount || 0;
      const assigned = ag.assignedDeliveriesCount || 0;
      const target = completed + assigned || 1;
      const pct = target > 0 ? Math.round((completed / target) * 100) : 0;
      const initials = ag.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: ag.id,
        name: ag.name,
        initials,
        completed,
        target,
        pct,
      };
    });
  }, [agents]);

  // Real filtered deliveries
  const filteredDeliveries = useMemo(() => {
    if (statusFilter === 'all') return deliveries;

    return deliveries.filter((d) => {
      if (statusFilter === 'delivered') return d.status === 'Delivered';
      if (statusFilter === 'transit') return d.status === 'Out for Delivery' || d.status === 'Picked Up';
      if (statusFilter === 'pending') return ['Order Created', 'Received at Hub', 'Ready for Dispatch', 'Assigned'].includes(d.status);
      if (statusFilter === 'failed') return ['Failed', 'Returned to Hub', 'Returned to Merchant'].includes(d.status);
      return true;
    });
  }, [deliveries, statusFilter]);

  // Greeting helper
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  const formatInr = (num: number) => {
    return num > 0 ? `₹${num.toLocaleString('en-IN')}` : 'Prepaid';
  };

  const getStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 'bg-[#DDF3E7] text-[#1E8E5A]';
    if (s.includes('transit') || s.includes('picked')) return 'bg-[#E0EAFB] text-[#2563C9]';
    if (s.includes('pending') || s.includes('assigned')) return 'bg-[#FCEFCF] text-[#A66A00]';
    if (s.includes('fail') || s.includes('return')) return 'bg-[#FADFDF] text-[#C23B3B]';
    return 'bg-[#F2F5F4] text-[#5E716F]';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 'Delivered';
    if (s.includes('transit') || s.includes('picked')) return 'Out for delivery';
    if (s.includes('pending') || s.includes('assigned')) return 'Awaiting agent';
    if (s.includes('fail') || s.includes('return')) return 'Failed';
    return status;
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* ── 1. Hello / Header Section (.hello) ── */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] leading-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'Krishnan'}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#5E716F] mt-1">
            {todayFormatted}.{' '}
            {createdCount > 0
              ? `${createdCount} deliveries need an agent before dispatch.`
              : 'All current deliveries are assigned and on schedule.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadDashboardData}
            title="Refresh dashboard data"
            className="border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] text-[#5E716F] p-2.5 rounded-[10px] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/customers/add')}
            className="inline-flex items-center gap-2 border border-[#DDE5E3] bg-white hover:bg-[#F2F5F4] text-[#10201F] font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-4 h-4 text-[#5E716F]" />
            <span>Add customer</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/deliveries/new')}
            className="inline-flex items-center gap-2 bg-[#F2B705] hover:bg-[#e0a700] text-[#2A2000] font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#2A2000]" />
            <span>New delivery</span>
          </button>
        </div>
      </section>

      {/* In-page Error Banner */}
      {error && (
        <div className="p-3.5 bg-[#FADFDF] border border-[#C23B3B]/30 rounded-xl flex items-center justify-between text-[#C23B3B] text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 2. Signature Pipeline (.pipe) ── */}
      <section className="bg-white border border-[#DDE5E3] rounded-[14px] p-5 shadow-2xs">
        <div className="flex items-baseline justify-between mb-3.5">
          <div>
            <h2 className="text-[16px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
              Today’s delivery flow
            </h2>
            <div className="text-[13px] text-[#5E716F]">Where every order stands right now</div>
          </div>
          <div className="text-[13px] text-[#5E716F] font-medium">{totalCount} orders</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0">
          {/* Stage 1: Created */}
          <div className="lg:pr-5 lg:border-r border-[#DDE5E3] lg:border-dashed">
            <div className="text-[13px] text-[#5E716F] mb-1">Created</div>
            <div className="text-[32px] sm:text-[34px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] leading-none">
              {createdCount}
            </div>
            <div className="h-2 rounded-full bg-[#DDE5E3] overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-[#8AA3A0] transition-all duration-300"
                style={{ width: `${Math.round((createdCount / maxStageCount) * 100)}%` }}
              />
            </div>
            <div className="text-[12px] text-[#5E716F] mt-2">
              Waiting to be assigned: {createdCount}
            </div>
          </div>

          {/* Stage 2: Assigned */}
          <div className="lg:px-5 lg:border-r border-[#DDE5E3] lg:border-dashed">
            <div className="text-[13px] text-[#5E716F] mb-1">Assigned</div>
            <div className="text-[32px] sm:text-[34px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] leading-none">
              {assignedCount}
            </div>
            <div className="h-2 rounded-full bg-[#DDE5E3] overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-[#A66A00] transition-all duration-300"
                style={{ width: `${Math.round((assignedCount / maxStageCount) * 100)}%` }}
              />
            </div>
            <div className="text-[12px] text-[#5E716F] mt-2">
              Agent accepted: {assignedCount}
            </div>
          </div>

          {/* Stage 3: Out for delivery */}
          <div className="lg:px-5 lg:border-r border-[#DDE5E3] lg:border-dashed">
            <div className="text-[13px] text-[#5E716F] mb-1">Out for delivery</div>
            <div className="text-[32px] sm:text-[34px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] leading-none">
              {inTransitCount}
            </div>
            <div className="h-2 rounded-full bg-[#DDE5E3] overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-[#2563C9] transition-all duration-300"
                style={{ width: `${Math.round((inTransitCount / maxStageCount) * 100)}%` }}
              />
            </div>
            <div className="text-[12px] text-[#5E716F] mt-2">
              On the road right now: {inTransitCount}
            </div>
          </div>

          {/* Stage 4: Delivered */}
          <div className="lg:pl-5">
            <div className="text-[13px] text-[#5E716F] mb-1">Delivered</div>
            <div className="text-[32px] sm:text-[34px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] leading-none">
              {deliveredCount}
            </div>
            <div className="h-2 rounded-full bg-[#DDE5E3] overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-[#1E8E5A] transition-all duration-300"
                style={{ width: `${Math.round((deliveredCount / maxStageCount) * 100)}%` }}
              />
            </div>
            <div className="text-[12px] text-[#5E716F] mt-2">{successRate}% completed</div>
          </div>
        </div>
      </section>

      {/* ── 3. KPIs Section (.kpis) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-4.5 shadow-2xs">
          <div className="text-[13px] text-[#5E716F]">Cash to collect</div>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] my-1">
            ₹{cashToCollect.toLocaleString('en-IN')}
          </div>
          <div className="text-[12px] font-semibold text-[#A66A00]">
            {unpaidCount} orders pending payment
          </div>
        </div>

        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-4.5 shadow-2xs">
          <div className="text-[13px] text-[#5E716F]">Collected so far</div>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] my-1">
            ₹{collectedSoFar.toLocaleString('en-IN')}
          </div>
          <div className="text-[12px] font-semibold text-[#1E8E5A]">
            {paidCount} orders successfully settled
          </div>
        </div>

        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-4.5 shadow-2xs">
          <div className="text-[13px] text-[#5E716F]">Agents on duty</div>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] my-1">
            {activeAgentsCount} of {agents.length}
          </div>
          <div className="text-[12px] font-semibold text-[#5E716F]">
            {offDutyCount} off duty / inactive
          </div>
        </div>

        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-4.5 shadow-2xs">
          <div className="text-[13px] text-[#5E716F]">Completion rate</div>
          <div className="text-[22px] sm:text-[24px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif] my-1">
            {successRate}%
          </div>
          <div className="text-[12px] font-semibold text-[#1E8E5A]">
            {deliveredCount} of {totalCount} completed
          </div>
        </div>
      </section>

      {/* ── 4. Two Columns: Chart & Agents (.cols) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4.5">
        {/* Deliveries this week chart */}
        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3.5">
            <div>
              <h2 className="text-[16px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
                Deliveries this week
              </h2>
              <div className="text-[13px] text-[#5E716F]">Completed vs. not completed per day</div>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-[#5E716F]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#1E8E5A]" /> Delivered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#A66A00]" /> Pending
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-[#C23B3B]" /> Failed
              </span>
            </div>
          </div>

          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#5E716F', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{
                    backgroundColor: '#10201F',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="delivered" stackId="a" fill="#1E8E5A" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#A66A00" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#C23B3B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agents on duty */}
        <div className="bg-white border border-[#DDE5E3] rounded-[14px] p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-baseline justify-between mb-3.5">
            <div>
              <h2 className="text-[16px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
                Agents on duty
              </h2>
              <div className="text-[13px] text-[#5E716F]">Stops completed today</div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/agents')}
              className="text-[#2563C9] hover:underline font-semibold text-[13px] cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="space-y-3.5 my-auto">
            {displayAgents.length > 0 ? (
              displayAgents.map((ag) => (
                <div key={ag.id} className="grid grid-cols-[auto_1fr_auto] gap-2.5 items-center">
                  <span className="w-9 h-9 rounded-full bg-[#F2F5F4] text-[#10201F] border border-[#DDE5E3] flex items-center justify-center font-semibold text-[13px]">
                    {ag.initials}
                  </span>

                  <div className="min-w-0">
                    <div className="font-semibold text-[#10201F] text-[13px] truncate">{ag.name}</div>
                    <div className="h-1.5 rounded-full bg-[#DDE5E3] overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          ag.pct < 50 ? 'bg-[#A66A00]' : 'bg-[#1E8E5A]'
                        }`}
                        style={{ width: `${ag.pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[12px] text-[#5E716F] text-right whitespace-nowrap">
                    <b className="text-[#10201F]">{ag.completed}</b>/{ag.target}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-[#5E716F]">
                No field agents found.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Recent Deliveries Table (.card with chips & table) ── */}
      <section className="bg-white border border-[#DDE5E3] rounded-[14px] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-3.5">
          <div>
            <h2 className="text-[16px] font-bold text-[#10201F] font-['Bricolage_Grotesque',sans-serif]">
              Recent deliveries
            </h2>
            <div className="text-[13px] text-[#5E716F]">
              Showing {filteredDeliveries.slice(0, 7).length} of {deliveries.length} latest orders
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'transit', label: 'Out for delivery' },
              { id: 'pending', label: 'Awaiting agent' },
              { id: 'failed', label: 'Failed' },
            ].map((chip) => {
              const isActive = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id)}
                  className={`border rounded-full px-3 py-1 text-[13px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#10201F] text-white border-[#10201F] font-medium'
                      : 'border-[#DDE5E3] text-[#5E716F] hover:bg-[#F2F5F4]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#DDE5E3] text-[13px] font-medium text-[#5E716F]">
                <th className="py-2 px-2.5">Order</th>
                <th className="py-2 px-2.5">Customer</th>
                <th className="py-2 px-2.5">Agent</th>
                <th className="py-2 px-2.5">Status</th>
                <th className="py-2 px-2.5 text-right">To collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5E3] text-sm text-[#10201F]">
              {filteredDeliveries.length > 0 ? (
                filteredDeliveries.slice(0, 7).map((d) => (
                  <tr key={d.id} className="hover:bg-[#F2F5F4]/60 transition-colors">
                    <td className="py-3 px-2.5 font-semibold text-xs font-mono">
                      <Link
                        to={`/deliveries/${d.id}`}
                        className="hover:text-[#2563C9] transition-colors"
                      >
                        {d.trackingNumber || `DLV-${d.id.slice(-4)}`}
                      </Link>
                    </td>
                    <td className="py-3 px-2.5">
                      <div className="font-semibold text-xs leading-tight">{d.customerName}</div>
                      <span className="block text-[11px] text-[#5E716F] truncate max-w-[200px] mt-0.5">
                        {d.deliveryAddress}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-xs">
                      {d.agentName ? (
                        <span className="text-[#10201F] font-medium">{d.agentName}</span>
                      ) : (
                        <span className="text-[#5E716F] italic">Not assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${getStatusClass(
                          d.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2.5 text-right font-medium text-xs tabular-nums">
                      {formatInr(d.codAmount || d.amount || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5E716F] text-xs">
                    No deliveries match. Clear the search or pick another status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
