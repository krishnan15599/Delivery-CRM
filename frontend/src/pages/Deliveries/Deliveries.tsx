import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Eye,
  Trash2,
  Send,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  DataTable,
  SearchBar,
  FilterBar,
  Button,
  Select,
  StatusBadge,
  Modal,
  FormField,
  ConfirmDialog,
  DateRangePicker,
  useToast,
  type Column,
  type DateRange,
} from '../../components/common';
import { deliveryService } from '../../services/deliveryService';
import { agentService } from '../../services/agentService';
import type { Delivery, DeliveryStatus } from '../../types/delivery';
import type { Agent } from '../../types/agent';

export const Deliveries: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
    preset: 'All Time',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Multi-selection for bulk assign
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAgentId, setBulkAgentId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);

  // Delete modal state
  const [deliveryToDelete, setDeliveryToDelete] = useState<Delivery | null>(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getDeliveries({
        search: search.trim(),
        status: statusFilter !== 'all' ? (statusFilter as DeliveryStatus) : undefined,
        agentId: agentFilter || undefined,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
        page,
        pageSize,
      });

      setDeliveries(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, agentFilter, dateRange, page, pageSize, toast]);

  useEffect(() => {
    agentService.getAgents().then((res) => setAgents(res.data));
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter('all');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleBulkAssign = async () => {
    if (!bulkAgentId || selectedKeys.length === 0) return;
    try {
      setBulkAssigning(true);
      const ids = selectedKeys.map(String);
      await deliveryService.bulkAssignDeliveries(ids, bulkAgentId);
      toast.success(`Assigned ${ids.length} deliveries successfully!`);
      setIsBulkModalOpen(false);
      setSelectedKeys([]);
      setBulkAgentId('');
      fetchDeliveries();
    } catch {
      toast.error('Failed to bulk assign deliveries');
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!deliveryToDelete) return;
    try {
      await deliveryService.deleteDelivery(deliveryToDelete.id);
      toast.success(`Delivery "${deliveryToDelete.trackingNumber}" deleted.`);
      setDeliveryToDelete(null);
      fetchDeliveries();
    } catch {
      toast.error('Failed to delete delivery');
    }
  };

  const columns: Column<Delivery>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking No',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 font-mono text-xs">
            {row.trackingNumber}
          </span>
          <div className="text-[11px] text-gray-400 font-medium">{row.packageType}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer & Address',
      sortable: true,
      render: (row) => (
        <div className="max-w-xs">
          <div className="font-semibold text-gray-900 text-xs">{row.customerName}</div>
          <div className="text-[11px] text-gray-400 truncate">{row.deliveryAddress}</div>
        </div>
      ),
    },
    {
      key: 'agentName',
      header: 'Assigned Agent',
      render: (row) => (
        <div className="text-xs">
          {row.agentName ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {row.agentName}
            </span>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>{String(row.date)}</span>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount / COD',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 text-xs">
            ₹{row.amount.toLocaleString()}
          </span>
          <div className="text-[10px] text-gray-400 uppercase">{row.paymentStatus}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/deliveries/${row.id}`)}
            className="p-1 text-gray-400 hover:text-[#2c5fbf] hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeliveryToDelete(row)}
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete Delivery"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Deliveries"
        subtitle="Manage end-to-end shipment lifecycles, route dispatch, and field assignments."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Deliveries' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/deliveries/new')}
          >
            Create Delivery
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <FilterBar
          totalResults={totalItems}
          onClearAll={() => {
            setSearch('');
            setStatusFilter('all');
            setAgentFilter('');
            setDateRange({ startDate: '', endDate: '', preset: 'All Time' });
            setPage(1);
          }}
          activeFilters={[
            ...(search ? [{ id: 'search', label: 'Search', value: search }] : []),
            ...(statusFilter !== 'all'
              ? [{ id: 'status', label: 'Status', value: statusFilter }]
              : []),
            ...(agentFilter
              ? [
                  {
                    id: 'agent',
                    label: 'Agent',
                    value: agents.find((a) => a.id === agentFilter)?.name || agentFilter,
                  },
                ]
              : []),
            ...(dateRange.startDate && dateRange.endDate
              ? [
                  {
                    id: 'date',
                    label: 'Date',
                    value: `${dateRange.startDate} ~ ${dateRange.endDate}`,
                  },
                ]
              : []),
          ]}
          onRemoveFilter={(id) => {
            if (id === 'search') setSearch('');
            if (id === 'status') setStatusFilter('all');
            if (id === 'agent') setAgentFilter('');
            if (id === 'date')
              setDateRange({ startDate: '', endDate: '', preset: 'All Time' });
          }}
        >
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search tracking #, customer, address..."
            className="max-w-xs"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Assigned', label: 'Assigned' },
              { value: 'Picked Up', label: 'Picked Up' },
              { value: 'In Transit', label: 'In Transit' },
              { value: 'Delivered', label: 'Delivered' },
              { value: 'Failed', label: 'Failed' },
              { value: 'Returned', label: 'Returned' },
            ]}
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

          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </FilterBar>

        <DataTable
          data={deliveries}
          columns={columns}
          loading={loading}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys)}
          emptyText="No deliveries found matching current filters."
          onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
          bulkActions={
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Send className="w-3 h-3" />}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Bulk Assign Agent ({selectedKeys.length})
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

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Assign Delivery Agent"
        description={`Assign ${selectedKeys.length} selected orders to a field delivery agent.`}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={bulkAssigning}
              disabled={!bulkAgentId}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              onClick={handleBulkAssign}
            >
              Confirm Assignment
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Select Delivery Agent" required>
            <Select
              value={bulkAgentId}
              onChange={(e) => setBulkAgentId(e.target.value)}
              placeholder="Choose an active agent"
              options={agents.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.hubLocation} - ${a.status})`,
              }))}
            />
          </FormField>
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900 leading-relaxed">
            All {selectedKeys.length} deliveries will have their status updated to{' '}
            <strong>Assigned</strong>, and timeline logs will be appended for tracking.
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deliveryToDelete)}
        onCancel={() => setDeliveryToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Delivery Order?"
        message={`Are you sure you want to delete delivery order "${deliveryToDelete?.trackingNumber}"?`}
        confirmText="Delete Order"
        variant="danger"
      />
    </div>
  );
};

export default Deliveries;
