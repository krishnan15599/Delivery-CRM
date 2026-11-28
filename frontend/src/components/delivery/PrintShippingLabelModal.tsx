import React from 'react';
import { Printer, Truck } from 'lucide-react';
import { Modal, Button } from '../common';
import type { Delivery } from '../../types/delivery';

export interface PrintShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
}

const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', 'A': 'wnnnnwnnw', 'B': 'nnwnnwnnw',
  'C': 'wnwnnwnnn', 'D': 'nnnnwwnnw', 'E': 'wnnnwwnnn', 'F': 'nnwnwwnnn',
  'G': 'nnnnnwwnw', 'H': 'wnnnnwwnn', 'I': 'nnwnnwwnn', 'J': 'nnnnwwwnn',
  'K': 'wnnnnnnww', 'L': 'nnwnnnnww', 'M': 'wnwnnnnwn', 'N': 'nnnnwnnww',
  'O': 'wnnnwnnwn', 'P': 'nnwnwnnwn', 'Q': 'nnnnnnwww', 'R': 'wnnnnnwwn',
  'S': 'nnwnnnwwn', 'T': 'nnnnwnwwn', 'U': 'wwnnnnnnw', 'V': 'nwwnnnnnw',
  'W': 'wwwnnnnnn', 'X': 'nwnnwnnnw', 'Y': 'wwnnwnnnn', 'Z': 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
};

const renderCode39Bars = (text: string) => {
  const clean = `*${text.toUpperCase().replace(/[^0-9A-Z\-. ]/g, '-')}*`;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (const ch of clean) {
    const pattern = CODE39[ch] || CODE39['-'];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === 'w' ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += 1; // inter-character gap
  }
  return { bars, totalWidth: Math.max(x, 1) };
};

export const PrintShippingLabelModal: React.FC<PrintShippingLabelModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const { bars, totalWidth } = renderCode39Bars(delivery.trackingNumber || 'TRK');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shipping Manifest & Courier Waybill"
      description={`Printable standard logistics label for tracking #${delivery.trackingNumber}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Printable Label Paper Card */}
        <div
          id="shipping-label-printable"
          className="border-2 border-dashed border-slate-400 bg-white p-6 rounded-xl space-y-4 font-mono text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-slate-900" />
              <div>
                <h2 className="text-base font-bold tracking-tight">DELIVERY CRM EXPRESS</h2>
                <span className="text-[10px] text-slate-600 block">Next-Day Hub Logistics Network</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold block uppercase">{delivery.packageType}</span>
              <span className="text-[10px] text-slate-600">Standard Surface</span>
            </div>
          </div>

          {/* Barcode & Tracking Number */}
          <div className="py-2.5 px-4 text-center bg-slate-50 rounded border border-slate-200">
            <svg
              viewBox={`0 0 ${totalWidth} 44`}
              className="h-12 w-full max-w-[300px] mx-auto"
              preserveAspectRatio="none"
              aria-label={`Barcode for ${delivery.trackingNumber}`}
            >
              {bars.map((b, i) => (
                <rect key={i} x={b.x} y={0} width={b.w} height={44} fill="#000000" />
              ))}
            </svg>
            <span className="text-sm font-bold tracking-widest block mt-1.5">
              {delivery.trackingNumber}
            </span>
          </div>

          {/* Sender & Receiver Address Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-y-2 border-slate-900 py-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                FROM (SHIPPER):
              </span>
              <p className="font-bold text-slate-900">Express Logistics Dispatch Hub</p>
              <p className="text-slate-700 leading-tight">{delivery.pickupAddress}</p>
              <p className="text-slate-600 mt-1">Contact: 1800-419-8900</p>
            </div>

            <div className="border-l border-slate-300 pl-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                TO (CONSIGNEE):
              </span>
              <p className="font-bold text-slate-900">{delivery.customerName}</p>
              <p className="text-slate-700 leading-tight">{delivery.deliveryAddress}</p>
              <p className="text-slate-900 font-bold mt-1">
                {delivery.city || 'Bengaluru'} - {delivery.pincode || '560001'}
              </p>
              <p className="text-slate-600 mt-1">Phone: {delivery.customerPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Package Details & COD Notice */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="text-[10px] text-slate-500 block">DESCRIPTION:</span>
              <span className="font-semibold text-slate-800">
                {delivery.itemDescription || delivery.packageType}
              </span>
            </div>

            <div className="text-right">
              {delivery.codAmount && delivery.codAmount > 0 ? (
                <div className="p-2 bg-black text-white rounded text-center">
                  <span className="text-[9px] font-bold tracking-wider block">COLLECT COD AMOUNT:</span>
                  <span className="text-base font-extrabold font-mono">
                    ₹{delivery.codAmount?.toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="p-1.5 border border-slate-400 rounded text-center">
                  <span className="text-[9px] font-bold block text-emerald-800">PREPAID ORDER</span>
                  <span className="text-xs font-bold font-mono">NO CASH DUE</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Routing Code */}
          <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
            <span>ROUTING: BLR-HUB-01 &gt; SEC-4</span>
            <span>DATE: {String(delivery.date)}</span>
            <span>AGENT: {delivery.agentName || 'UNASSIGNED'}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print Waybill Label
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PrintShippingLabelModal;
