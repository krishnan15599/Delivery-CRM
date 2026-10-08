import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Truck,
  Star,
  CheckCircle2,
  Clock,
  IndianRupee,
  Edit2,
  Check,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  StatCard,
  DataTable,
  StatusBadge,
  Button,
  Skeleton,
  ConfirmDialog,
  useToast,
  type Column,
} from '../../components/common';
import { agentService } from '../../services/agentService';
import { collectionService } from '../../services/collectionService';
import { AddEditAgentModal } from './AddEditAgentModal';
import type { Agent, CreateAgentInput } from '../../types/agent';
import type { Delivery } from '../../types/delivery';
import type { Collection } from '../../types/collection';

export const AgentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [agRes, delRes, colRes] = await Promise.all([
        agentService.getAgentById(id),
        agentService.getAgentDeliveries(id),
        agentService.getAgentCollections(id),
      ]);

      if (!agRes) {
        toast.error(`Agent ${id} not found.`);
        navigate('/agents');
        return;
      }

      setAgent(agRes);
      setDeliveries(delRes);
      setCollections(colRes);
    } catch {
      toast.error('Failed to load agent profile');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateAgent = async (formData: CreateAgentInput) => {
    if (!id) return;
    try {
      const updated = await agentService.updateAgent(id, formData);
      setAgent(updated);
      toast.success('Agent profile updated!');
    } catch {
      toast.error('Failed to update agent');
    }
  };

  const handleSettleAgentCash = async () => {
    if (!agent) return;
    const pendingCols = collections.filter((c) => c.status === 'Pending' || c.status === 'Collected');
    if (pendingCols.length === 0) {
      toast.info('No pending collections to settle for this agent.');
      setIsSettleDialogOpen(false);
      return;
    }

    try {
      setIsSettling(true);
      const ids = pendingCols.map((c) => c.id);
      await collectionService.settleCollections({
        collectionIds: ids,
        settledBy: 'Admin (Indiranagar Desk)',
        notes: `Bulk settlement of ${ids.length} collections for ${agent.name}`,
      });

      toast.success(`Successfully settled ₹${agent.pendingCashAmount.toLocaleString()} with ${agent.name}!`);
      setIsSettleDialogOpen(false);
      loadData();
    } catch {
      toast.error('Failed to settle agent collections');
    } finally {
      setIsSettling(false);
    }
  };

  if (loading || !agent) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const deliveryColumns: Column<Delivery>[] = [
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
          <span className="font-medium text-gray-900 text-xs">{row.customerName}</span>
          <p className="text-[11px] text-gray-400 truncate max-w-xs">{row.deliveryAddress}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'COD Amount',
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
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => navigate(`/deliveries/${row.id}`)}
        >
          View
        </Button>
      ),
    },
  ];

  const collectionColumns: Column<Collection>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-900">
          {row.trackingNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => <span className="text-xs text-gray-700">{row.customerName}</span>,
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
      key: 'paymentMode',
      header: 'Mode',
      render: (row) => (
        <span className="text-xs font-medium text-gray-600 px-2 py-0.5 bg-gray-100 rounded">
          {row.paymentMode}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Collection Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={agent.name}
        subtitle={`Field Agent ID: ${agent.id} • ${agent.hubLocation}`}
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Agents', path: '/agents' },
          { label: agent.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Agent
            </Button>
            {agent.pendingCashAmount > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Check className="w-3.5 h-3.5" />}
                onClick={() => setIsSettleDialogOpen(true)}
              >
                Settle Cash (₹{agent.pendingCashAmount.toLocaleString()})
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Deliveries"
          value={agent.assignedDeliveriesCount}
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Completed Orders"
          value={agent.completedDeliveriesCount}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Cash Settlement"
          value={`₹${agent.pendingCashAmount.toLocaleString()}`}
          icon={IndianRupee}
          color="amber"
        />
        <StatCard
          title="Lifetime Settled Cash"
          value={`₹${agent.settledCashAmount.toLocaleString()}`}
          icon={IndianRupee}
          color="cyan"
        />
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Agent Information" className="md:col-span-1">
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#2c5fbf]" />
              <span className="font-medium text-gray-900">{agent.phone}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#2c5fbf]" />
              <span className="font-medium text-gray-900">{agent.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#2c5fbf]" />
              <span className="font-medium text-gray-900">
                {agent.vehicleType} ({agent.vehicleNumber})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-gray-900">{agent.rating} / 5.0 Rating</span>
            </div>
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-400">Current Status:</span>
              <StatusBadge status={agent.status} size="sm" />
            </div>
          </div>
        </Card>

        {/* Assigned Deliveries */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">Assigned Active Deliveries</h3>
            <span className="text-xs text-gray-500 font-semibold">
              Total: {deliveries.length}
            </span>
          </div>
          <DataTable
            data={deliveries}
            columns={deliveryColumns}
            emptyText="No active deliveries currently assigned to this agent."
            onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
          />
        </div>
      </div>

      {/* Cash Collections Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">COD Cash Collections</h3>
            <p className="text-xs text-gray-500">
              Audit log of cash and online receipts collected by {agent.name}
            </p>
          </div>
          {agent.pendingCashAmount > 0 && (
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Check className="w-3.5 h-3.5" />}
              onClick={() => setIsSettleDialogOpen(true)}
            >
              Settle Pending Collections
            </Button>
          )}
        </div>

        <DataTable
          data={collections}
          columns={collectionColumns}
          emptyText="No collections recorded for this agent."
        />
      </div>

      {/* Edit Agent Modal */}
      <AddEditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateAgent}
        agentToEdit={agent}
      />

      {/* Settle Cash Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isSettleDialogOpen}
        onCancel={() => setIsSettleDialogOpen(false)}
        onConfirm={handleSettleAgentCash}
        isLoading={isSettling}
        title={`Settle Cash with ${agent.name}?`}
        message={`Confirm receipt of ₹${agent.pendingCashAmount.toLocaleString()} cash from ${agent.name}. All corresponding deliveries will be marked as Settled.`}
        confirmText="Confirm & Settle"
        variant="primary"
      />
    </div>
  );
};

export default AgentDetails;
