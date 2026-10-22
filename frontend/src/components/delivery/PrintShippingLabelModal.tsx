import React from 'react';
import { Printer, Truck } from 'lucide-react';
import { Modal, Button } from '../common';
import type { Delivery } from '../../types/delivery';

export interface PrintShippingLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
}

export const PrintShippingLabelModal: React.FC<PrintShippingLabelModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const handlePrint = () => {
    window.print();
  };

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
          className="border-2 border-dashed border-gray-400 bg-white p-6 rounded-xl space-y-4 font-mono text-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-gray-900">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-gray-900" />
              <div>
                <h2 className="text-base font-bold tracking-tight">DELIVERY CRM EXPRESS</h2>
                <span className="text-[10px] text-gray-600 block">Next-Day Hub Logistics Network</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold block uppercase">{delivery.packageType}</span>
              <span className="text-[10px] text-gray-600">Standard Surface</span>
            </div>
          </div>

          {/* Barcode & Tracking Number */}
          <div className="py-2 text-center bg-gray-50 rounded border border-gray-200">
            {/* Visual simulated Barcode */}
            <div className="h-12 w-64 mx-auto flex items-stretch justify-center gap-1 overflow-hidden py-1">
              {[...Array(38)].map((_, i) => (
                <div
                  key={i}
                  className={`bg-black ${i % 3 === 0 ? 'w-1.5' : i % 2 === 0 ? 'w-1' : 'w-0.5'}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold tracking-widest block mt-1">
              {delivery.trackingNumber}
            </span>
          </div>

          {/* Sender & Receiver Address Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-y-2 border-gray-900 py-3">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                FROM (SHIPPER):
              </span>
              <p className="font-bold text-gray-900">Express Logistics Dispatch Hub</p>
              <p className="text-gray-700 leading-tight">{delivery.pickupAddress}</p>
              <p className="text-gray-600 mt-1">Contact: 1800-419-8900</p>
            </div>

            <div className="border-l border-gray-300 pl-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                TO (CONSIGNEE):
              </span>
              <p className="font-bold text-gray-900">{delivery.customerName}</p>
              <p className="text-gray-700 leading-tight">{delivery.deliveryAddress}</p>
              <p className="text-gray-900 font-bold mt-1">
                {delivery.city || 'Bengaluru'} - {delivery.pincode || '560001'}
              </p>
              <p className="text-gray-600 mt-1">Phone: {delivery.customerPhone || 'N/A'}</p>
            </div>
          </div>

          {/* Package Details & COD Notice */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div>
              <span className="text-[10px] text-gray-500 block">DESCRIPTION:</span>
              <span className="font-semibold text-gray-800">
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
                <div className="p-1.5 border border-gray-400 rounded text-center">
                  <span className="text-[9px] font-bold block text-emerald-800">PREPAID ORDER</span>
                  <span className="text-xs font-bold font-mono">NO CASH DUE</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Routing Code */}
          <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-[10px] text-gray-500">
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
