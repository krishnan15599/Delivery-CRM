import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanBarcode,
  CheckCircle2,
  PackageCheck,
  AlertCircle,
  ArrowRight,
  Truck,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Button,
  Input,
  StatusBadge,
  useToast,
} from '../../components/common';
import { deliveryService } from '../../services/deliveryService';
import type { Delivery } from '../../types/delivery';

interface ScanHistoryItem {
  id: string;
  trackingNumber: string;
  customerName: string;
  city?: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  ok: boolean;
  message: string;
}

export const HubScan: React.FC = () => {
  const toast = useToast();
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast[type](message);
  };
  const inputRef = useRef<HTMLInputElement>(null);

  const [trackingInput, setTrackingInput] = useState('');
  const [autoReceive, setAutoReceive] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [currentDelivery, setCurrentDelivery] = useState<Delivery | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const recordHistory = (item: ScanHistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 20));
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trk = trackingInput.trim();
    if (!trk) return;

    setScanning(true);
    try {
      const delivery = await deliveryService.getDeliveryByTracking(trk);
      if (!delivery) {
        showToast(`Tracking number "${trk}" not found`, 'error');
        recordHistory({
          id: `${Date.now()}`,
          trackingNumber: trk,
          customerName: 'Unknown',
          previousStatus: '-',
          newStatus: '-',
          timestamp: new Date().toLocaleTimeString(),
          ok: false,
          message: 'Not found in your hub/organization',
        });
        setCurrentDelivery(null);
        return;
      }

      const prevStatus = delivery.status;
      let updated = delivery;
      let msg = `Current status: ${prevStatus}`;

      if (autoReceive && prevStatus === 'Order Created') {
        updated = await deliveryService.updateDeliveryStatus(
          delivery.id,
          'Received at Hub',
          'Parcel scanned at Hub Inbound'
        );
        msg = 'Marked as Received at Hub';
        showToast(`${updated.trackingNumber} received at hub!`, 'success');
      } else if (prevStatus === 'Failed') {
        updated = await deliveryService.updateDeliveryStatus(
          delivery.id,
          'Returned to Hub',
          'Failed parcel scanned back into Hub'
        );
        msg = 'Marked as Returned to Hub';
        showToast(`${updated.trackingNumber} returned to hub`, 'info');
      } else {
        showToast(`Loaded ${delivery.trackingNumber} (${prevStatus})`, 'info');
      }

      setCurrentDelivery(updated);
      recordHistory({
        id: `${Date.now()}`,
        trackingNumber: updated.trackingNumber,
        customerName: updated.customerName,
        city: updated.city,
        previousStatus: prevStatus,
        newStatus: updated.status,
        timestamp: new Date().toLocaleTimeString(),
        ok: true,
        message: msg,
      });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Scan failed';
      showToast(errMsg, 'error');
      recordHistory({
        id: `${Date.now()}`,
        trackingNumber: trk,
        customerName: currentDelivery?.customerName || '-',
        previousStatus: '-',
        newStatus: '-',
        timestamp: new Date().toLocaleTimeString(),
        ok: false,
        message: errMsg,
      });
    } finally {
      setScanning(false);
      setTrackingInput('');
      inputRef.current?.focus();
    }
  };

  const handleQuickTransition = async (
    targetStatus: 'Received at Hub' | 'Ready for Dispatch'
  ) => {
    if (!currentDelivery) return;
    try {
      setScanning(true);
      const updated = await deliveryService.updateDeliveryStatus(
        currentDelivery.id,
        targetStatus,
        `Updated via Hub Inbound Scan to ${targetStatus}`
      );
      setCurrentDelivery(updated);
      showToast(`${updated.trackingNumber} → ${targetStatus}`, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Status update failed', 'error');
    } finally {
      setScanning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub Inbound Scan"
        subtitle="Scan parcel barcodes or enter tracking numbers as items arrive at your hub."
      />

      {/* Scanner Input Card */}
      <Card>
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Scan barcode or type Tracking Number (e.g. TRK-...) and press Enter"
                leftIcon={<ScanBarcode className="w-5 h-5 text-indigo-600" />}
                className="text-base font-mono py-3"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={scanning}
              className="sm:w-44 py-3"
            >
              Scan Parcel
            </Button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoReceive}
              onChange={(e) => setAutoReceive(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Auto-mark <strong className="text-slate-800">Order Created</strong> parcels as{' '}
            <strong className="text-slate-800">Received at Hub</strong> on scan
          </label>
        </form>
      </Card>

      {/* Active Scanned Parcel Card */}
      {currentDelivery && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-slate-900">
                  {currentDelivery.trackingNumber}
                </span>
                <StatusBadge status={currentDelivery.status} />
              </div>
              <p className="text-sm text-slate-700">
                <strong>Receiver:</strong> {currentDelivery.customerName} •{' '}
                {currentDelivery.deliveryAddress}
                {currentDelivery.city ? `, ${currentDelivery.city}` : ''}
              </p>
              <p className="text-xs text-slate-500">
                Package: {currentDelivery.itemDescription || currentDelivery.packageType} •{' '}
                {currentDelivery.codAmount && currentDelivery.codAmount > 0
                  ? `COD ₹${currentDelivery.codAmount.toLocaleString()}`
                  : 'Prepaid'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentDelivery.status === 'Order Created' && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PackageCheck className="w-4 h-4" />}
                  onClick={() => handleQuickTransition('Received at Hub')}
                  disabled={scanning}
                >
                  Mark Received at Hub
                </Button>
              )}
              {currentDelivery.status === 'Received at Hub' && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Truck className="w-4 h-4" />}
                  onClick={() => handleQuickTransition('Ready for Dispatch')}
                  disabled={scanning}
                >
                  Mark Ready for Dispatch
                </Button>
              )}
              <Link to={`/deliveries/${currentDelivery.id}`}>
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Delivery
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Scans Log */}
      <Card>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Scans ({history.length})</h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No parcels scanned in this session yet. Focus the input box above and scan a label.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  {item.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-mono font-bold text-slate-900">{item.trackingNumber}</span>{' '}
                    <span className="text-slate-500">({item.customerName})</span>
                    <div className="text-slate-600">{item.message}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {item.ok && <StatusBadge status={item.newStatus} size="sm" />}
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default HubScan;
