import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  Modal,
  FormField,
  Input,
  Select,
  Button,
} from '../../components/common';
import type { Agent, CreateAgentInput, AgentStatus, VehicleType } from '../../types/agent';

export interface AddEditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAgentInput) => Promise<void>;
  agentToEdit?: Agent | null;
}

export const AddEditAgentModal: React.FC<AddEditAgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agentToEdit,
}) => {
  const [formData, setFormData] = useState<CreateAgentInput>({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    hubLocation: 'Indiranagar Hub',
    status: 'Active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (agentToEdit) {
      setFormData({
        name: agentToEdit.name,
        phone: agentToEdit.phone,
        email: agentToEdit.email,
        vehicleType: agentToEdit.vehicleType,
        vehicleNumber: agentToEdit.vehicleNumber,
        hubLocation: agentToEdit.hubLocation,
        status: agentToEdit.status,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        vehicleType: 'Bike',
        vehicleNumber: '',
        hubLocation: 'Indiranagar Hub',
        status: 'Active',
      });
    }
    setErrors({});
  }, [agentToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = 'Agent name is required';
    if (!formData.phone.trim()) errs.phone = 'Contact phone number is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!formData.vehicleNumber.trim()) errs.vehicleNumber = 'Vehicle plate number is required';
    if (!formData.hubLocation.trim()) errs.hubLocation = 'Assigned hub location is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSave(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agentToEdit ? `Edit Agent: ${agentToEdit.name}` : 'Add New Delivery Agent'}
      description="Register delivery field staff, vehicle details, and operational hub."
      footer={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            onClick={handleSubmit}
          >
            {agentToEdit ? 'Save Changes' : 'Create Agent'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Full Name" required error={errors.name}>
            <Input
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              error={Boolean(errors.name)}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          <FormField label="Phone Number" required error={errors.phone}>
            <Input
              type="tel"
              placeholder="+91 98765 11001"
              value={formData.phone}
              error={Boolean(errors.phone)}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Email Address" required error={errors.email}>
          <Input
            type="email"
            placeholder="agent@deliverycrm.in"
            value={formData.email}
            error={Boolean(errors.email)}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Vehicle Type" required>
            <Select
              value={formData.vehicleType}
              onChange={(e) =>
                setFormData({ ...formData, vehicleType: e.target.value as VehicleType })
              }
              options={[
                { value: 'Bike', label: 'Motorbike' },
                { value: 'Scooter', label: 'Scooter' },
                { value: 'Van', label: 'Delivery Van' },
                { value: 'Truck', label: 'Mini Truck' },
              ]}
            />
          </FormField>

          <FormField label="Vehicle Number" required error={errors.vehicleNumber}>
            <Input
              placeholder="e.g. KA-01-EQ-4421"
              value={formData.vehicleNumber}
              error={Boolean(errors.vehicleNumber)}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Assigned Hub / Depot" required error={errors.hubLocation}>
            <Select
              value={formData.hubLocation}
              onChange={(e) => setFormData({ ...formData, hubLocation: e.target.value })}
              options={[
                { value: 'Indiranagar Hub', label: 'Indiranagar Hub' },
                { value: 'Koramangala Hub', label: 'Koramangala Hub' },
                { value: 'Whitefield Hub', label: 'Whitefield Hub' },
                { value: 'Banjara Hub', label: 'Banjara Hub' },
              ]}
            />
          </FormField>

          <FormField label="Staff Status">
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as AgentStatus })
              }
              options={[
                { value: 'Active', label: 'Active (Available)' },
                { value: 'On Delivery', label: 'On Delivery' },
                { value: 'Off Duty', label: 'Off Duty' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};
