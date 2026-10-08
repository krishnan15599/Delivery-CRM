import React, { useState, useRef } from 'react';
import { Camera, Check, ShieldCheck, KeyRound, PenTool } from 'lucide-react';
import { Modal, FormField, Input, Button, useToast } from '../common';
import type { Delivery } from '../../types/delivery';

export interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery;
  onConfirmDelivery: (podData: {
    otp: string;
    signatureUrl?: string;
    photoUrl?: string;
    notes?: string;
  }) => Promise<void>;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onConfirmDelivery,
}) => {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [recipientName, setRecipientName] = useState(delivery.customerName || '');
  const [notes, setNotes] = useState('Recipient confirmed package received in good condition.');
  const [submitting, setSubmitting] = useState(false);

  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 4) {
      toast.error('Please enter the 4-digit customer delivery OTP (e.g. 4829)');
      return;
    }

    try {
      setSubmitting(true);
      await onConfirmDelivery({
        otp,
        signatureUrl: hasSignature ? 'data:image/svg+xml;signature' : undefined,
        photoUrl: photoSelected ? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48' : undefined,
        notes: `Delivered to ${recipientName}. Note: ${notes}`,
      });
      toast.success('Proof of delivery verified! Delivery completed successfully.');
      onClose();
    } catch {
      toast.error('Failed to submit proof of delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Electronic Proof of Delivery (e-POD)"
      description={`Record recipient confirmation and collect payment for ${delivery.trackingNumber}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* OTP Verification Pill */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2c5fbf] text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Delivery Security OTP</h4>
              <p className="text-xs text-gray-500">Sent via SMS to {delivery.customerPhone || 'customer mobile'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit PIN"
              className="w-32 text-center font-mono font-bold tracking-widest text-base"
              required
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOtp('4829');
                toast.info('Auto-filled demo OTP: 4829');
              }}
            >
              Demo OTP
            </Button>
          </div>
        </div>

        {/* COD Collection Notice */}
        {Boolean(delivery.codAmount && delivery.codAmount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
            <span className="font-semibold">Cash On Delivery (COD) To Collect:</span>
            <span className="font-mono font-bold text-sm text-amber-950">
              ₹{delivery.codAmount?.toLocaleString()}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Receiver Name" required>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Person receiving parcel"
              required
            />
          </FormField>

          <FormField label="Delivery Photo (Optional)">
            <div
              onClick={() => setPhotoSelected(!photoSelected)}
              className={`border-2 border-dashed rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition-colors ${
                photoSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {photoSelected ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Parcel photo attached</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span>Click to attach parcel photo</span>
                </>
              )}
            </div>
          </FormField>
        </div>

        {/* Signature Pad */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-gray-500" />
              Recipient Digital Signature
            </label>
            {hasSignature && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] text-rose-600 hover:underline cursor-pointer"
              >
                Clear Signature
              </button>
            )}
          </div>

          <div className="border border-gray-200 rounded-xl bg-gray-50/50 p-2 relative">
            <canvas
              ref={canvasRef}
              width={460}
              height={100}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-24 bg-white rounded-lg border border-gray-200 cursor-crosshair shadow-inner"
            />
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-gray-400 italic">
                Sign inside the box using mouse or finger touch
              </div>
            )}
          </div>
        </div>

        <FormField label="Delivery Notes / Condition">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Handed to security or family member"
          />
        </FormField>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            {submitting ? 'Verifying...' : 'Confirm Delivered & Settle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProofOfDeliveryModal;
