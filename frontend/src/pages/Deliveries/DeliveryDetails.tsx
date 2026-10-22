import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  User,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  StatusBadge,
  StatusTimeline,
  Button,
  Modal,
  FormField,
  Select,
  Input,
  Skeleton,
  useToast,
  type TimelineEvent,
} from '../../components/common';
import { DeliveryTrackingMap } from '../../components/delivery/DeliveryTrackingMap';
import { ProofOfDeliveryModal } from '../../components/delivery/ProofOfDeliveryModal';
import { PrintShippingLabelModal } from '../../components/delivery/PrintShippingLabelModal';
import { deliveryService } from '../../services/deliveryService';
import { agentService } from '../../services/agentService';
import type { Delivery, DeliveryStatus } from '../../types/delivery';
import type { Agent } from '../../types/agent';

export const DeliveryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Status update modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DeliveryStatus>('In Transit');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Agent reassignment modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // POD & Print modal state
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleConfirmPOD = async (podData: {
    otp: string;
    signatureUrl?: string;
    photoUrl?: string;
    notes?: string;
  }) => {
    if (!id) return;
    const updated = await deliveryService.updateDeliveryStatus(id, 'Delivered', podData.notes);
    setDelivery(updated);
  };

  const loadDelivery = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [delRes, agRes] = await Promise.all([
        deliveryService.getDeliveryById(id),
        agentService.getAgents({ pageSize: 50 }),
      ]);

      if (!delRes) {
        toast.error(`Delivery ${id} not found.`);
        navigate('/deliveries');
        return;
      }

      setDelivery(delRes);
      setAgents(agRes.data);
      setNewStatus(delRes.status);
      setSelectedAgentId(delRes.agentId || '');
    } catch {
      toast.error('Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    loadDelivery();
  }, [loadDelivery]);

  const handleUpdateStatus = async () => {
    if (!id || !delivery) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await deliveryService.updateDeliveryStatus(id, newStatus, statusNote);
      setDelivery(updated);
      toast.success(`Status updated to "${newStatus}"!`);
      setIsStatusModalOpen(false);
      setStatusNote('');
    } catch {
      toast.error('Failed to update delivery status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReassignAgent = async () => {
    if (!id || !selectedAgentId) return;
    try {
      setIsReassigning(true);
      const [updated] = await deliveryService.bulkAssignDeliveries([id], selectedAgentId);
      if (updated) setDelivery(updated);
      toast.success('Agent reassigned successfully!');
      setIsAssignModalOpen(false);
    } catch {
      toast.error('Failed to reassign agent');
    } finally {
      setIsReassigning(false);
    }
  };

  if (loading || !delivery) {
    return (
      <div className="space-y-6 max-w-5xl pb-16">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Convert timeline to StatusTimeline format
  const timelineEvents: TimelineEvent[] = delivery.timeline.map((item, idx) => {
    const isCurrent = idx === delivery.timeline.length - 1;
    let eventStatus: 'completed' | 'current' | 'upcoming' | 'failed' = 'completed';

    if (item.status === 'Failed' || item.status === 'Returned') {
      eventStatus = 'failed';
    } else if (isCurrent) {
      eventStatus = 'current';
    }

    return {
      id: idx,
      title: item.status,
      description: item.note || `Status milestone: ${item.status}`,
      timestamp: item.timestamp,
      status: eventStatus,
      actor: item.updatedBy,
    };
  });

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      <PageHeader
        title={`Delivery #${delivery.trackingNumber}`}
        subtitle={`Scheduled Delivery • Created on ${String(delivery.date)}`}
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Deliveries', path: '/deliveries' },
          { label: delivery.trackingNumber },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => setIsPrintModalOpen(true)}
            >
              Print Label
            </Button>
            {delivery.status !== 'Delivered' && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() => setIsPodModalOpen(true)}
              >
                Record e-POD
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
              onClick={() => setIsAssignModalOpen(true)}
            >
              Assign Agent
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => setIsStatusModalOpen(true)}
            >
              Update Status
            </Button>
          </div>
        }
      />

      {/* Status banner */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-[#2c5fbf] rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold">Current Lifecycle Status</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
              <span>{delivery.status}</span>
              <StatusBadge status={delivery.status} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-6 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block text-[11px]">Payment Mode</span>
            <span className="font-semibold text-gray-900 uppercase">{delivery.paymentStatus}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[11px]">COD Amount</span>
            <span className="font-semibold text-gray-900 text-sm">₹{delivery.codAmount || delivery.amount}</span>
          </div>
        </div>
      </div>

      {/* Live Route Tracking Map */}
      <DeliveryTrackingMap delivery={delivery} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timeline & Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <Card title="Delivery Timeline & Audit Trail">
            <StatusTimeline events={timelineEvents} />
          </Card>

          {/* Locations & Route Card */}
          <Card title="Pickup & Destination Route">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[#2c5fbf] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  A
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Pickup Hub / Warehouse
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {delivery.pickupAddress}
                  </p>
                </div>
              </div>

              <div className="ml-3.5 border-l-2 border-dashed border-gray-200 h-6"></div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  B
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Final Delivery Destination
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {delivery.deliveryAddress}
                  </p>
                  {(delivery.city || delivery.pincode) && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      {delivery.city} {delivery.pincode && `- ${delivery.pincode}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Customer, Agent, Item details */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card title="Recipient Customer">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2c5fbf] font-bold text-xs flex items-center justify-center shrink-0">
                  {delivery.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{delivery.customerName}</h4>
                  {delivery.customerId && (
                    <span className="text-[11px] text-gray-400 font-mono">{delivery.customerId}</span>
                  )}
                </div>
              </div>

              {delivery.customerPhone && (
                <div className="flex items-center gap-2 text-gray-700 pt-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{delivery.customerPhone}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span className="text-gray-500">{delivery.deliveryAddress}</span>
              </div>
            </div>
          </Card>

          {/* Assigned Agent Card */}
          <Card title="Field Delivery Agent">
            {delivery.agentName ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{delivery.agentName}</h4>
                    <span className="text-[11px] text-gray-400 font-mono">{delivery.agentId}</span>
                  </div>
                </div>

                {delivery.agentPhone && (
                  <div className="flex items-center gap-2 text-gray-700 pt-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{delivery.agentPhone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400 mb-3">No agent assigned yet</p>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  Assign Agent Now
                </Button>
              </div>
            )}
          </Card>

          {/* Item & Package Details */}
          <Card title="Package Summary">
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Category:</span>
                <span className="font-semibold text-gray-900">{delivery.packageType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Item Description:</span>
                <span className="font-medium text-gray-900 truncate max-w-[140px]">
                  {delivery.itemDescription || 'Standard Package'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Order Value:</span>
                <span className="font-bold text-gray-900">₹{delivery.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">COD Due:</span>
                <span className="font-bold text-emerald-600">
                  ₹{(delivery.codAmount || delivery.amount).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Delivery Status"
        description={`Record next operational milestone for #${delivery.trackingNumber}.`}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUpdatingStatus}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={handleUpdateStatus}
            >
              Confirm Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Target Status" required>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)}
              options={[
                { value: 'Pending', label: 'Pending' },
                { value: 'Assigned', label: 'Assigned' },
                { value: 'Picked Up', label: 'Picked Up' },
                { value: 'In Transit', label: 'In Transit' },
                { value: 'Delivered', label: 'Delivered (Complete & Collect)' },
                { value: 'Failed', label: 'Failed (Customer Unavailable / Reject)' },
                { value: 'Returned', label: 'Returned (Sent Back to Hub)' },
              ]}
            />
          </FormField>

          <FormField
            label="Audit Log Note (Optional)"
            helperText="Reason, dispatcher remark or OTP reference"
          >
            <Input
              placeholder="e.g. Package handed over to recipient. Cash collected."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* Agent Reassignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Delivery Agent"
        description={`Assign or transfer shipment #${delivery.trackingNumber} to a field agent.`}
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isReassigning}
              disabled={!selectedAgentId}
              onClick={handleReassignAgent}
            >
              Save Assignment
            </Button>
          </div>
        }
      >
        <FormField label="Select Agent" required>
          <Select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            placeholder="-- Choose a field agent --"
            options={agents.map((a) => ({
              value: a.id,
              label: `${a.name} (${a.vehicleType} - ${a.hubLocation})`,
            }))}
          />
        </FormField>
      </Modal>

      {/* Electronic Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        isOpen={isPodModalOpen}
        onClose={() => setIsPodModalOpen(false)}
        delivery={delivery}
        onConfirmDelivery={handleConfirmPOD}
      />

      {/* Print Shipping Waybill / Label Modal */}
      <PrintShippingLabelModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        delivery={delivery}
      />
    </div>
  );
};

export default DeliveryDetails;
