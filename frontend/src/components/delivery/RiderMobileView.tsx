import React, { useState, useMemo } from 'react';
import {
  Bike,
  Package,
  CheckCircle2,
  RefreshCw,
  Search,
  IndianRupee,
} from 'lucide-react';
import { RiderDeliveryCard } from './RiderDeliveryCard';
import { ProofOfDeliveryModal } from './ProofOfDeliveryModal';
import { Modal, FormField, Select, Button, EmptyState, Skeleton, useToast } from '../common';
import type { Delivery, DeliveryStatus } from '../../types/delivery';

export interface RiderMobileViewProps {
  deliveries: Delivery[];
  loading: boolean;
  onRefresh: () => void;
  onStatusUpdate: (deliveryId: string, newStatus: DeliveryStatus, note?: string) => Promise<void>;
}

const FAILURE_REASONS = [
  'Customer unavailable / Phone not reachable',
  'Customer requested reschedule to another day',
  'Incorrect / incomplete delivery address',
  'Customer refused package / cancelled order',
  'Premises locked / entry denied',
  'Cash on Delivery payment not ready',
  'Other issue',
];

export const RiderMobileView: React.FC<RiderMobileViewProps> = ({
  deliveries,
  loading,
  onRefresh,
  onStatusUpdate,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'to_deliver' | 'completed' | 'all'>('to_deliver');
  const [search, setSearch] = useState('');

  // Modals state
  const [podDelivery, setPodDelivery] = useState<Delivery | null>(null);
  const [failureDelivery, setFailureDelivery] = useState<Delivery | null>(null);
  const [failureReason, setFailureReason] = useState(FAILURE_REASONS[0]);
  const [failureCustomNote, setFailureCustomNote] = useState('');
  const [submittingFailure, setSubmittingFailure] = useState(false);

  // Compute metrics for the rider
  const metrics = useMemo(() => {
    let toDeliver = 0;
    let completed = 0;
    let failed = 0;
    let pendingCOD = 0;

    deliveries.forEach((d) => {
      if (['Order Created', 'Received at Hub', 'Ready for Dispatch', 'Assigned', 'Picked Up', 'Out for Delivery'].includes(d.status)) {
        toDeliver += 1;
        if (d.paymentStatus !== 'Paid') {
          pendingCOD += d.codAmount || d.amount || 0;
        }
      } else if (d.status === 'Delivered') {
        completed += 1;
      } else if (['Failed', 'Returned to Hub', 'Returned to Merchant'].includes(d.status)) {
        failed += 1;
      }
    });

    return { toDeliver, completed, failed, pendingCOD };
  }, [deliveries]);

  // Filtered deliveries based on Tab and Search
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      // Tab check
      if (activeTab === 'to_deliver') {
        if (!['Order Created', 'Received at Hub', 'Ready for Dispatch', 'Assigned', 'Picked Up', 'Out for Delivery'].includes(d.status)) {
          return false;
        }
      } else if (activeTab === 'completed') {
        if (d.status !== 'Delivered') return false;
      }

      // Search check
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      const matchTracking = d.trackingNumber?.toLowerCase().includes(query);
      const matchCustomer = d.customerName?.toLowerCase().includes(query);
      const matchAddress = d.deliveryAddress?.toLowerCase().includes(query);
      const matchPhone = d.customerPhone?.toLowerCase().includes(query);
      return matchTracking || matchCustomer || matchAddress || matchPhone;
    });
  }, [deliveries, activeTab, search]);

  const handleConfirmPOD = async (podData: {
    otp: string;
    signatureUrl?: string;
    photoUrl?: string;
    notes?: string;
  }) => {
    if (!podDelivery) return;
    try {
      await onStatusUpdate(
        podDelivery.id,
        'Delivered',
        podData.notes || `Delivered with OTP verification. Recipient confirmed.`
      );
      toast.success(`Order #${podDelivery.trackingNumber} marked as Delivered!`);
      setPodDelivery(null);
    } catch {
      toast.error('Failed to confirm delivery proof');
    }
  };

  const handleConfirmFailure = async () => {
    if (!failureDelivery) return;
    try {
      setSubmittingFailure(true);
      const fullNote = failureCustomNote.trim()
        ? `${failureReason} - ${failureCustomNote.trim()}`
        : failureReason;
      await onStatusUpdate(failureDelivery.id, 'Failed', fullNote);
      toast.success(`Order #${failureDelivery.trackingNumber} marked as Failed.`);
      setFailureDelivery(null);
      setFailureCustomNote('');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSubmittingFailure(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* 1. Header & Summary Bar */}
      <div className="bg-linear-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Rider Deliveries</h1>
              <p className="text-xs text-blue-100 font-medium">Your assigned route for today</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh deliveries"
            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white border border-white/20 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
            <div className="text-[11px] font-semibold text-blue-100 flex items-center justify-center gap-1">
              <Package className="w-3 h-3" />
              <span>To Deliver</span>
            </div>
            <div className="text-xl font-extrabold mt-0.5">{metrics.toDeliver}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
            <div className="text-[11px] font-semibold text-emerald-200 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              <span>Delivered</span>
            </div>
            <div className="text-xl font-extrabold mt-0.5">{metrics.completed}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
            <div className="text-[11px] font-semibold text-amber-200 flex items-center justify-center gap-1">
              <IndianRupee className="w-3 h-3 text-amber-300" />
              <span>Collect COD</span>
            </div>
            <div className="text-xl font-extrabold mt-0.5 truncate">
              ₹{metrics.pendingCOD.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Segmented Filter Tabs */}
      <div className="space-y-3">
        {/* Quick Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking #, customer name, street..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Segmented Filter Control */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('to_deliver')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'to_deliver'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>To Deliver</span>
            {metrics.toDeliver > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === 'to_deliver'
                    ? 'bg-blue-100 text-[#1d68f2]'
                    : 'bg-slate-300/80 text-slate-700'
                }`}
              >
                {metrics.toDeliver}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Completed</span>
            {metrics.completed > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-300/80 text-slate-700'
                }`}
              >
                {metrics.completed}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All ({deliveries.length})</span>
          </button>
        </div>
      </div>

      {/* 3. Deliveries Card List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
          <EmptyState
            title={
              activeTab === 'to_deliver'
                ? 'No Pending Deliveries'
                : activeTab === 'completed'
                ? 'No Deliveries Completed Yet'
                : 'No Deliveries Found'
            }
            description={
              activeTab === 'to_deliver'
                ? 'You are all caught up! No active parcels waiting to be delivered.'
                : 'Deliveries will appear here as you mark them completed.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDeliveries.map((delivery) => (
            <RiderDeliveryCard
              key={delivery.id}
              delivery={delivery}
              onStatusUpdate={onStatusUpdate}
              onOpenPOD={(d) => setPodDelivery(d)}
              onOpenFailureModal={(d) => setFailureDelivery(d)}
            />
          ))}
        </div>
      )}

      {/* 4. Proof of Delivery (POD) Modal */}
      {podDelivery && (
        <ProofOfDeliveryModal
          isOpen={Boolean(podDelivery)}
          onClose={() => setPodDelivery(null)}
          delivery={podDelivery}
          onConfirmDelivery={handleConfirmPOD}
        />
      )}

      {/* 5. Delivery Issue / Failure Modal */}
      {failureDelivery && (
        <Modal
          isOpen={Boolean(failureDelivery)}
          onClose={() => setFailureDelivery(null)}
          title="Report Delivery Issue"
          description={`Order #${failureDelivery.trackingNumber} for ${failureDelivery.customerName}`}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFailureDelivery(null)}
                disabled={submittingFailure}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmFailure}
                disabled={submittingFailure}
              >
                {submittingFailure ? 'Submitting...' : 'Confirm Delivery Failed'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <FormField label="Reason for failure" required>
              <Select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                options={FAILURE_REASONS.map((r) => ({ value: r, label: r }))}
              />
            </FormField>

            <FormField label="Additional Details / Notes (Optional)">
              <textarea
                value={failureCustomNote}
                onChange={(e) => setFailureCustomNote(e.target.value)}
                rows={3}
                placeholder="e.g. Called customer 3 times, phone switched off at gate..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};
