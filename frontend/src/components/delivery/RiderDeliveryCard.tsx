import React, { useState } from 'react';
import {
  Phone,
  Navigation,
  MapPin,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Bike,
  ShieldCheck,
  Check,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, Button } from '../common';
import type { Delivery, DeliveryStatus } from '../../types/delivery';

export interface RiderDeliveryCardProps {
  delivery: Delivery;
  onStatusUpdate: (deliveryId: string, newStatus: DeliveryStatus, note?: string) => Promise<void>;
  onOpenPOD: (delivery: Delivery) => void;
  onOpenFailureModal: (delivery: Delivery) => void;
}

export const RiderDeliveryCard: React.FC<RiderDeliveryCardProps> = ({
  delivery,
  onStatusUpdate,
  onOpenPOD,
  onOpenFailureModal,
}) => {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  const isCOD = ((delivery.codAmount ?? 0) > 0 || (delivery.amount ?? 0) > 0) && delivery.paymentStatus !== 'Paid';
  const codAmount = delivery.codAmount ?? delivery.amount ?? 0;

  const fullAddress = [
    delivery.deliveryAddress,
    delivery.city,
    delivery.pincode,
  ].filter(Boolean).join(', ');

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || delivery.deliveryAddress)}`;

  const handleQuickStatus = async (status: DeliveryStatus, note?: string) => {
    try {
      setUpdating(true);
      await onStatusUpdate(delivery.id, status, note);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* 1. Header: Tracking number & Status badge */}
      <div className="p-4 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-900 text-sm tracking-tight">
              #{delivery.trackingNumber}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {delivery.packageType || 'Standard'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Scheduled: {String(delivery.scheduledDate || delivery.date || 'Today')}</span>
          </div>
        </div>
        <StatusBadge status={delivery.status} size="sm" />
      </div>

      {/* 2. Customer & Address Details */}
      <div className="p-4 space-y-3 flex-1">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-0.5">
            Deliver To
          </div>
          <h3 className="font-bold text-slate-900 text-base leading-snug">
            {delivery.customerName}
          </h3>
          <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">
              {delivery.deliveryAddress}
              {(delivery.city || delivery.pincode) && (
                <span className="text-slate-500 block text-[11px]">
                  {[delivery.city, delivery.pincode].filter(Boolean).join(' - ')}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Customer instruction note if present */}
        {(delivery.notes || delivery.itemDescription) && (
          <div className="text-xs bg-amber-50/80 border border-amber-200/80 text-amber-900 p-2.5 rounded-xl flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold">Instructions: </span>
              {delivery.notes || delivery.itemDescription}
            </div>
          </div>
        )}

        {/* 3. Call & Map Quick Navigation Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {delivery.customerPhone ? (
            <a
              href={`tel:${delivery.customerPhone}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1d68f2] font-bold text-xs transition-colors border border-blue-200/60 active:scale-[0.98]"
            >
              <Phone className="w-4 h-4 text-[#1d68f2]" />
              <span>Call Customer</span>
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
              <span>No Phone</span>
            </button>
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors border border-emerald-200/60 active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4 text-emerald-600" />
            <span>Open Maps</span>
          </a>
        </div>

        {/* 4. Payment / COD Badge */}
        <div className="pt-1">
          {isCOD ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  COD
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-700">Collect Cash</div>
                  <div className="text-sm font-extrabold text-amber-950">
                    ₹{codAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900">
                Pending Payment
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span className="text-xs font-bold text-emerald-900">Prepaid Online</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700">₹0 To Collect</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Rider Action Flow Buttons */}
      <div className="p-4 pt-2 bg-slate-50/80 border-t border-slate-100 mt-auto space-y-2">
        {delivery.status === 'Assigned' && (
          <Button
            variant="primary"
            className="w-full py-3 text-sm font-bold shadow-md shadow-blue-500/20"
            disabled={updating}
            leftIcon={<Package className="w-4 h-4" />}
            onClick={() => handleQuickStatus('Picked Up', 'Package picked up by rider from hub')}
          >
            {updating ? 'Updating...' : 'Pick Up Package'}
          </Button>
        )}

        {delivery.status === 'Picked Up' && (
          <Button
            variant="primary"
            className="w-full py-3 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-500/20"
            disabled={updating}
            leftIcon={<Bike className="w-4 h-4" />}
            onClick={() => handleQuickStatus('Out for Delivery', 'Rider is out for delivery')}
          >
            {updating ? 'Updating...' : 'Start Delivery (Out for Delivery)'}
          </Button>
        )}

        {delivery.status === 'Out for Delivery' && (
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full py-3.5 text-sm font-extrabold bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25 border-none text-white flex items-center justify-center gap-2"
              disabled={updating}
              leftIcon={<ShieldCheck className="w-5 h-5 text-white" />}
              onClick={() => onOpenPOD(delivery)}
            >
              Complete Delivery (OTP / Sign)
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
              disabled={updating}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() => onOpenFailureModal(delivery)}
            >
              Unable to Deliver / Issue
            </Button>
          </div>
        )}

        {delivery.status === 'Delivered' && (
          <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-100/70 text-emerald-800 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Delivered Successfully</span>
          </div>
        )}

        {delivery.status === 'Failed' && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Delivery Failed</span>
            </div>
            <Button
              variant="outline"
              size="xs"
              className="w-full text-xs font-semibold"
              disabled={updating}
              onClick={() => handleQuickStatus('Out for Delivery', 'Rider retrying delivery')}
            >
              Retry Delivery
            </Button>
          </div>
        )}

        {/* View full details link */}
        <button
          type="button"
          onClick={() => navigate(`/deliveries/${delivery.id}`)}
          className="w-full pt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#1d68f2] transition-colors cursor-pointer"
        >
          <span>View order timeline & details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
