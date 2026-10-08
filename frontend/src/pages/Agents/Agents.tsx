import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  Star,
  Users,
  IndianRupee,
  Phone,
  Navigation,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PageHeader,
  StatCard,
  DataTable,
  SearchBar,
  FilterBar,
  Button,
  Select,
  StatusBadge,
  ConfirmDialog,
  useToast,
  type Column,
} from '../../components/common';
import { agentService } from '../../services/agentService';
import { AddEditAgentModal } from './AddEditAgentModal';
import type { Agent, AgentStatus, VehicleType, CreateAgentInput } from '../../types/agent';

export const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [hubFilter, setHubFilter] = useState<string>('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setAgentToEdit(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Delete dialog state
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await agentService.getAgents({
        search: search.trim(),
        status: statusFilter !== 'all' ? (statusFilter as AgentStatus) : undefined,
        vehicleType: vehicleFilter !== 'all' ? (vehicleFilter as VehicleType) : undefined,
        hubLocation: hubFilter || undefined,
        page,
        pageSize,
      });

      setAgents(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch {
      toast.error('Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, vehicleFilter, hubFilter, page, pageSize, toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSaveAgent = async (formData: CreateAgentInput) => {
    try {
      if (agentToEdit) {
        await agentService.updateAgent(agentToEdit.id, formData);
        toast.success(`Agent "${formData.name}" updated successfully!`);
      } else {
        const created = await agentService.createAgent(formData);
        toast.success(`Agent "${created.name}" created successfully!`);
      }
      setAgentToEdit(null);
      fetchAgents();
    } catch {
      toast.error('Failed to save agent profile');
    }
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    try {
      await agentService.deleteAgent(agentToDelete.id);
      toast.success(`Agent "${agentToDelete.name}" deleted.`);
      setAgentToDelete(null);
      fetchAgents();
    } catch {
      toast.error('Failed to delete agent');
    }
  };

  const onDeliveryCount = agents.filter((a) => a.status === 'On Delivery').length;
  const activeCount = agents.filter((a) => a.status === 'Active' || a.status === 'On Delivery').length;
  const totalPendingCash = agents.reduce((acc, curr) => acc + (curr.pendingCashAmount || 0), 0);

  const columns: Column<Agent>[] = [
    {
      key: 'name',
      header: 'Agent',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2c5fbf] font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-xs">{row.name}</div>
            <div className="text-[11px] text-gray-400 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact & Hub',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{row.phone}</span>
          </div>
          <div className="text-[11px] text-gray-400">{row.hubLocation}</div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => (
        <div className="text-xs">
          <span className="font-medium text-gray-900">{row.vehicleType}</span>
          <div className="text-[11px] font-mono text-gray-400">{row.vehicleNumber}</div>
        </div>
      ),
    },
    {
      key: 'assignedDeliveriesCount',
      header: 'Assigned',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-gray-900 text-xs">
          {row.assignedDeliveriesCount}
        </span>
      ),
    },
    {
      key: 'completedDeliveriesCount',
      header: 'Delivered',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-emerald-600 text-xs">
          {row.completedDeliveriesCount}
        </span>
      ),
    },
    {
      key: 'pendingCashAmount',
      header: 'Cash Due',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          ₹{row.pendingCashAmount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'center',
      sortable: true,
      render: (row) => (
        <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-500">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{row.rating}</span>
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
            onClick={() => navigate(`/agents/${row.id}`)}
            className="p-1 text-gray-400 hover:text-[#2c5fbf] hover:bg-blue-50 rounded transition-colors"
            title="View Agent Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setAgentToEdit(row);
              setIsModalOpen(true);
            }}
            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Edit Agent"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAgentToDelete(row)}
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete Agent"
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
        title="Delivery Agents"
        subtitle="Manage field fleet, vehicle assignments, cash settlements, and operational status."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Agents' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setAgentToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Add Agent
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Agents"
          value={agents.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active On Duty"
          value={activeCount}
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Out On Delivery"
          value={onDeliveryCount}
          icon={Navigation}
          color="indigo"
        />
        <StatCard
          title="Pending Cash Settlement"
          value={`₹${totalPendingCash.toLocaleString()}`}
          icon={IndianRupee}
          color="amber"
          onClick={() => navigate('/collections')}
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <FilterBar
          totalResults={totalItems}
          onClearAll={() => {
            setSearch('');
            setStatusFilter('all');
            setVehicleFilter('all');
            setHubFilter('');
            setPage(1);
          }}
          activeFilters={[
            ...(search ? [{ id: 'search', label: 'Search', value: search }] : []),
            ...(statusFilter !== 'all'
              ? [{ id: 'status', label: 'Status', value: statusFilter }]
              : []),
            ...(vehicleFilter !== 'all'
              ? [{ id: 'vehicle', label: 'Vehicle', value: vehicleFilter }]
              : []),
            ...(hubFilter ? [{ id: 'hub', label: 'Hub', value: hubFilter }] : []),
          ]}
          onRemoveFilter={(id) => {
            if (id === 'search') setSearch('');
            if (id === 'status') setStatusFilter('all');
            if (id === 'vehicle') setVehicleFilter('all');
            if (id === 'hub') setHubFilter('');
          }}
        >
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search name, phone, plate #..."
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
              { value: 'Active', label: 'Active' },
              { value: 'On Delivery', label: 'On Delivery' },
              { value: 'Off Duty', label: 'Off Duty' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />

          <Select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: 'all', label: 'All Vehicles' },
              { value: 'Bike', label: 'Motorbike' },
              { value: 'Scooter', label: 'Scooter' },
              { value: 'Van', label: 'Van' },
              { value: 'Truck', label: 'Truck' },
            ]}
          />

          <Select
            value={hubFilter}
            onChange={(e) => {
              setHubFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: '', label: 'All Hubs' },
              { value: 'Indiranagar Hub', label: 'Indiranagar' },
              { value: 'Koramangala Hub', label: 'Koramangala' },
              { value: 'Whitefield Hub', label: 'Whitefield' },
              { value: 'Banjara Hub', label: 'Banjara' },
            ]}
          />
        </FilterBar>

        <DataTable
          data={agents}
          columns={columns}
          loading={loading}
          emptyText="No delivery agents found matching criteria."
          onRowClick={(row) => navigate(`/agents/${row.id}`)}
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

      {/* Add / Edit Modal */}
      <AddEditAgentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAgentToEdit(null);
          if (searchParams.get('action') === 'add') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('action');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        onSave={async (data) => {
          await handleSaveAgent(data);
          if (searchParams.get('action') === 'add') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('action');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        agentToEdit={agentToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(agentToDelete)}
        onCancel={() => setAgentToDelete(null)}
        onConfirm={handleDeleteAgent}
        title="Delete Agent?"
        message={`Are you sure you want to delete "${agentToDelete?.name}"? Historical delivery and collection audit logs will be retained.`}
        confirmText="Delete Agent"
        variant="danger"
      />
    </div>
  );
};

export default Agents;
