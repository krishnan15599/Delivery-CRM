import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import {
  PageHeader,
  Card,
  FormField,
  Input,
  Button,
  useToast,
} from '../../components/common';
import { customerService } from '../../services/customerService';
import type { CreateCustomerInput } from '../../types/customer';

export const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^[0-9+-\s]{10,15}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      errs.address = 'Street address is required';
    }

    if (!formData.pincode?.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errs.pincode = 'Pincode must be a 6-digit numeric code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const created = await customerService.createCustomer(formData);
      toast.success(`Customer "${created.name}" created successfully!`);
      navigate('/customers');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to create customer. Please check your data.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title="Add New Customer"
        subtitle="Create a new customer profile for dispatching and delivery tracking."
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Customers', path: '/customers' },
          { label: 'Add Customer' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Basic Information
            </h3>
            <p className="text-xs text-gray-500">Contact details and identity</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name}>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                error={Boolean(errors.name)}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <Input
                type="email"
                placeholder="ramesh@example.com"
                value={formData.email}
                error={Boolean(errors.email)}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>

            <FormField
              label="Phone Number"
              required
              error={errors.phone}
              helperText="Format: +91 98765 43210"
            >
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                error={Boolean(errors.phone)}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
          </div>

          <div className="border-b border-gray-100 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Delivery Address
            </h3>
            <p className="text-xs text-gray-500">Primary delivery destination location</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Street Address / Flat / Building" required error={errors.address}>
                <Input
                  placeholder="e.g. Flat 301, Brigade Metropolis, Whitefield Main Rd"
                  value={formData.address}
                  error={Boolean(errors.address)}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="City">
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>

            <FormField label="State">
              <Input
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </FormField>

            <FormField label="Postal Pincode" required error={errors.pincode}>
              <Input
                placeholder="e.g. 560066"
                maxLength={6}
                value={formData.pincode}
                error={Boolean(errors.pincode)}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddCustomer;