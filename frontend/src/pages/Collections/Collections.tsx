import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  Check,
  UserCheck,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DataTable,
  Tabs,
  FilterBar,
  SearchBar,
  Select,
  Button,
  StatusBadge,
  Modal,
  FormField,
  Input,
  ConfirmDialog,
  DateRangePicker,
  useToast,
  type Column,
  type DateRange,
} from '../../components/common';
import { collectionService } from '../../services/collectionService';
import { agentService } from '../../services/agentService';
import type {
  Collection,
  CollectionStatus,
  CollectionSummary,
  PaymentMode,
} from '../../types/collection';
import type { Agent } from '../../types/agent';

export const Collections: React.FC = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Tabs & filters
  const initialTab = searchParams.get('tab')?.toLowerCase();
  const [activeTab, setActiveTab] = useState<string>(
    initialTab === 'pending'
      ? 'Pending'
      : initialTab === 'settled'
      ? 'Settled'
      : initialTab === 'collected'
      ? 'Collected'
      : 'all'
  );
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'All Time',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selection & Settlement modal
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleAgentId, setSettleAgentId] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Single item settlement
  const [collectionToSettle, setCollectionToSettle] = useState<Collection | null>(null);

  const fetchCollections = useCallback(async () => {
    try {
      setLoading(true);
      const [colRes, sumRes] = await Promise.all([
        collectionService.getCollections({
          search: search.trim(),
          status: activeTab !== 'all' ? (activeTab as CollectionStatus) : undefined,
          agentId: agentFilter || undefined,
          paymentMode: modeFilter !== 'all' ? (modeFilter as PaymentMode) : undefined,
          startDate: dateRange.startDate || undefined,
          endDate: dateRange.endDate || undefined,
          page,
          pageSize,
        }),
        collectionService.getCollectionSummary(),
      ]);

      setCollections(colRes.data);
      setTotalPages(colRes.pagination.totalPages);
      setTotalItems(colRes.pagination.totalItems);
      setSummary(sumRes);
    } catch {
      toast.error('Failed to load collections data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, agentFilter, modeFilter, dateRange, page, pageSize, toast]);

  useEffect(() => {
    agentService.getAgents().then((res) => setAgents(res.data));
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'pending') setActiveTab('Pending');
    else if (tabParam === 'settled') setActiveTab('Settled');
    else if (tabParam === 'collected') setActiveTab('Collected');
    else if (!tabParam) setActiveTab('all');
  }, [searchParams]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Bulk / Selected settlement
  const handleSettleSelected = async () => {
    if (selectedKeys.length === 0) return;
    try {
      setIsSettling(true);
      const ids = selectedKeys.map(String);
      await collectionService.settleCollections({
        collectionIds: ids,
        settledBy: 'Admin Krishnan',
        notes: settleNotes || 'Bulk cashier settlement',
      });

      toast.success(`Settled ${ids.length} collections successfully!`);
      setSelectedKeys([]);
      setIsSettleModalOpen(false);
      setSettleNotes('');
      fetchCollections();
    } catch {
      toast.error('Failed to settle collections');
    } finally {
      setIsSettling(false);
    }
  };

  // Agent quick settle
  const handleSettleAgentAll = async () => {
    if (!settleAgentId) return;
    const agentCols = collections.filter(
      (c) => c.agentId === settleAgentId && c.status !== 'Settled'
    );
    if (agentCols.length === 0) {
      toast.info('No pending collections found for this agent in current view.');
      return;
    }

    try {
      setIsSettling(true);
      const ids = agentCols.map((c) => c.id);
      await collectionService.settleCollections({
        collectionIds: ids,
        settledBy: 'Admin Krishnan',
        notes: settleNotes || `Cashier desk settlement with agent`,
      });

      toast.success(`Settled ${ids.length} collections for agent!`);
      setIsSettleModalOpen(false);
      setSettleAgentId('');
      setSettleNotes('');
      fetchCollections();
    } catch {
      toast.error('Failed to settle agent collections');
    } finally {
      setIsSettling(false);
    }
  };

  const columns: Column<Collection>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking No',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {row.trackingNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => <span className="text-xs text-gray-800 font-medium">{row.customerName}</span>,
    },
    {
      key: 'agentName',
      header: 'Field Agent',
      render: (row) => (
        <span className="text-xs text-gray-700 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          {row.agentName}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'COD Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 text-xs">
          ₹{row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {row.paymentMode}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => (
        <span className="text-xs text-gray-500">
          {String(row.collectedAt || row.createdAt).split('T')[0]}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) =>
        row.status !== 'Settled' ? (
          <Button
            variant="ghost"
            size="xs"
            className="text-[#2c5fbf] hover:text-[#1a3d82]"
            onClick={(e) => {
              e.stopPropagation();
              setCollectionToSettle(row);
            }}
          >
            Settle
          </Button>
        ) : (
          <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-end gap-1">
            <Check className="w-3 h-3" /> Settled
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Collections & Cash Settlement"
        subtitle="Track Cash-on-Delivery collections, reconcile field agent cash, and manage settlements."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Collections' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            onClick={() => setIsSettleModalOpen(true)}
          >
            Settle with Agent
          </Button>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Collection (In Field)"
          value={`₹${(summary?.totalPendingAmount || 0).toLocaleString()}`}
          icon={Clock}
          color="amber"
          subtitle={`${summary?.pendingCount || 0} packages out for delivery`}
        />
        <StatCard
          title="Collected (Handover Pending)"
          value={`₹${(summary?.totalCollectedAmount || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="indigo"
          subtitle={`${summary?.collectedCount || 0} delivered, cash with agents`}
        />
        <StatCard
          title="Reconciled & Settled"
          value={`₹${(summary?.totalSettledAmount || 0).toLocaleString()}`}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${summary?.settledCount || 0} collections closed`}
        />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* Navigation Tabs */}
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setPage(1);
            setSearchParams(tab === 'all' ? {} : { tab: tab.toLowerCase() });
          }}
          items={[
            { id: 'all', label: 'All Collections' },
            { id: 'Pending', label: 'Pending Collections', count: summary?.pendingCount },
            { id: 'Collected', label: 'Collected (With Agent)', count: summary?.collectedCount },
            { id: 'Settled', label: 'Settled', count: summary?.settledCount },
          ]}
        />

        {/* Filters */}
        <FilterBar
          totalResults={totalItems}
          onClearAll={() => {
            setSearch('');
            setAgentFilter('');
            setModeFilter('all');
            setDateRange({ startDate: '', endDate: '', preset: 'All Time' });
            setPage(1);
          }}
          activeFilters={[
            ...(search ? [{ id: 'search', label: 'Search', value: search }] : []),
            ...(agentFilter
              ? [
                  {
                    id: 'agent',
                    label: 'Agent',
                    value: agents.find((a) => a.id === agentFilter)?.name || agentFilter,
                  },
                ]
              : []),
            ...(modeFilter !== 'all'
              ? [{ id: 'mode', label: 'Payment Mode', value: modeFilter }]
              : []),
          ]}
          onRemoveFilter={(id) => {
            if (id === 'search') setSearch('');
            if (id === 'agent') setAgentFilter('');
            if (id === 'mode') setModeFilter('all');
          }}
        >
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search tracking #, customer..."
            className="max-w-xs"
          />

          <Select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setPage(1);
            }}
            className="w-40 text-xs"
            options={[
              { value: '', label: 'All Agents' },
              ...agents.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />

          <Select
            value={modeFilter}
            onChange={(e) => {
              setModeFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: 'all', label: 'All Modes' },
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Card', label: 'Card' },
            ]}
          />

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </FilterBar>

        {/* Collections Table */}
        <DataTable
          data={collections}
          columns={columns}
          loading={loading}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys)}
          emptyText="No collection records found."
          bulkActions={
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Check className="w-3 h-3" />}
              onClick={handleSettleSelected}
              isLoading={isSettling}
            >
              Settle Selected ({selectedKeys.length})
            </Button>
          }
          pagination={{
            currentPage: page,
            totalPages,
            totalItems,
            pageSize,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (s) => {
              setPageSize(s);
              setPage(1);
            },
          }}
        />
      </div>

      {/* Settle With Agent Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title="Settle Cash with Delivery Agent"
        description="Reconcile and close pending cash-on-delivery collections received from an agent."
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSettling}
              disabled={!settleAgentId}
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={handleSettleAgentAll}
            >
              Reconcile & Settle
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Choose Agent to Settle" required>
            <Select
              value={settleAgentId}
              onChange={(e) => setSettleAgentId(e.target.value)}
              placeholder="-- Select field agent --"
              options={agents.map((a) => ({
                value: a.id,
                label: `${a.name} — Pending Cash: ₹${a.pendingCashAmount.toLocaleString()}`,
              }))}
            />
          </FormField>

          {settleAgentId && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
              Agent <strong>{agents.find((a) => a.id === settleAgentId)?.name}</strong> currently
              has an outstanding cash balance of{' '}
              <strong className="text-base text-gray-900 block mt-1">
                ₹{agents.find((a) => a.id === settleAgentId)?.pendingCashAmount.toLocaleString()}
              </strong>
            </div>
          )}

          <FormField label="Cashier Desk / Settlement Remarks">
            <Input
              placeholder="e.g. Verified and counted at Indiranagar counter"
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* Single Item Settle Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(collectionToSettle)}
        onCancel={() => setCollectionToSettle(null)}
        onConfirm={async () => {
          if (!collectionToSettle) return;
          await collectionService.settleCollections({
            collectionIds: [collectionToSettle.id],
            settledBy: 'Admin Krishnan',
          });
          toast.success(`Settled #${collectionToSettle.trackingNumber}!`);
          setCollectionToSettle(null);
          fetchCollections();
        }}
        title="Settle Single Collection?"
        message={`Mark collection of ₹${collectionToSettle?.amount.toLocaleString()} for #${collectionToSettle?.trackingNumber} as Settled?`}
        confirmText="Confirm Settlement"
        variant="primary"
      />
    </div>
  );
};

export default Collections;
