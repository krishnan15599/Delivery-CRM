import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import {
  PageHeader,
  Card,
  FormField,
  Input,
  Select,
  Button,
  useToast,
} from '../../components/common';
import { deliveryService } from '../../services/deliveryService';
import { customerService } from '../../services/customerService';
import { agentService } from '../../services/agentService';
import type { Customer } from '../../types/customer';
import type { Agent } from '../../types/agent';
import type { CreateDeliveryInput } from '../../types/delivery';

export const CreateDelivery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const preselectedCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateDeliveryInput>({
    customerId: preselectedCustomerId,
    customerName: '',
    customerPhone: '',
    pickupAddress: 'Indiranagar Central Fulfillment Hub, Bengaluru',
    deliveryAddress: '',
    city: 'Bengaluru',
    pincode: '',
    packageType: 'Electronics',
    itemDescription: '',
    amount: 1000,
    codAmount: 1000,
    agentId: '',
    paymentStatus: 'pending',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      customerService.getCustomers({ pageSize: 50 }),
      agentService.getAgents({ pageSize: 50 }),
    ]).then(([custRes, agentRes]) => {
      setCustomers(custRes.data);
      setAgents(agentRes.data);

      if (preselectedCustomerId) {
        const found = custRes.data.find((c) => c.id === preselectedCustomerId);
        if (found) {
          setFormData((prev) => ({
            ...prev,
            customerId: found.id,
            customerName: found.name,
            customerPhone: found.phone,
            deliveryAddress: found.address,
            city: found.city || 'Bengaluru',
            pincode: found.pincode || '',
          }));
        }
      }
    });
  }, [preselectedCustomerId]);

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        deliveryAddress: cust.address,
        city: cust.city || prev.city,
        pincode: cust.pincode || prev.pincode,
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerId: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.customerName.trim()) errs.customerName = 'Customer recipient name is required';
    if (!formData.customerPhone?.trim()) errs.customerPhone = 'Contact phone number is required';
    if (!formData.pickupAddress.trim()) errs.pickupAddress = 'Pickup hub address is required';
    if (!formData.deliveryAddress.trim()) errs.deliveryAddress = 'Destination address is required';
    if (!formData.itemDescription?.trim()) errs.itemDescription = 'Item description is required';
    if (!formData.amount || formData.amount <= 0) errs.amount = 'Valid package amount is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const created = await deliveryService.createDelivery(formData);
      toast.success(`Delivery #${created.trackingNumber} dispatched successfully!`);
      navigate(`/deliveries/${created.id}`);
    } catch {
      toast.error('Failed to create delivery order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title="Create New Delivery"
        subtitle="Schedule a package pickup and assign an agent for final delivery."
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Deliveries', path: '/deliveries' },
          { label: 'Create Delivery' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Recipient Information
            </h3>
            <p className="text-xs text-gray-500">Select an existing customer or enter details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Existing Customer (Optional Autofill)">
                <Select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  placeholder="-- Select existing customer to auto-fill --"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.phone} - ${c.city})`,
                  }))}
                />
              </FormField>
            </div>

            <FormField label="Recipient Name" required error={errors.customerName}>
              <Input
                placeholder="Customer full name"
                value={formData.customerName}
                error={Boolean(errors.customerName)}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </FormField>

            <FormField label="Recipient Phone" required error={errors.customerPhone}>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.customerPhone}
                error={Boolean(errors.customerPhone)}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </FormField>
          </div>

          {/* Addresses */}
          <div className="border-b border-gray-100 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Route & Locations
            </h3>
          </div>

          <div className="space-y-4">
            <FormField label="Pickup Warehouse / Address" required error={errors.pickupAddress}>
              <Input
                placeholder="Hub address where agent collects parcel"
                value={formData.pickupAddress}
                error={Boolean(errors.pickupAddress)}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              />
            </FormField>

            <FormField label="Drop / Delivery Address" required error={errors.deliveryAddress}>
              <Input
                placeholder="Complete street address, flat/floor, landmark"
                value={formData.deliveryAddress}
                error={Boolean(errors.deliveryAddress)}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="City">
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </FormField>
              <FormField label="Pincode">
                <Input
                  maxLength={6}
                  placeholder="560001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          {/* Package & Payment Details */}
          <div className="border-b border-gray-100 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Item Details & COD
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Package Category">
              <Select
                value={formData.packageType}
                onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                options={[
                  { value: 'Electronics', label: 'Electronics' },
                  { value: 'Apparel', label: 'Apparel & Clothing' },
                  { value: 'Documents', label: 'Documents & Papers' },
                  { value: 'Home & Kitchen', label: 'Home & Kitchen' },
                  { value: 'Cosmetics', label: 'Cosmetics & Personal Care' },
                  { value: 'Healthcare', label: 'Medicines & Healthcare' },
                ]}
              />
            </FormField>

            <FormField label="Package Value (₹)" required error={errors.amount}>
              <Input
                type="number"
                placeholder="1000"
                value={formData.amount}
                error={Boolean(errors.amount)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({ ...formData, amount: val, codAmount: val });
                }}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Item Description / SKU" required error={errors.itemDescription}>
                <Input
                  placeholder="e.g. Wireless Gaming Mouse, 2 Years Warranty"
                  value={formData.itemDescription}
                  error={Boolean(errors.itemDescription)}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="COD Collection Amount (₹)">
              <Input
                type="number"
                placeholder="Amount to collect upon delivery"
                value={formData.codAmount}
                onChange={(e) => setFormData({ ...formData, codAmount: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Assign Delivery Agent (Optional)">
              <Select
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                placeholder="-- Select an Agent (or leave unassigned) --"
                options={agents.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.vehicleType} - ${a.hubLocation})`,
                }))}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/deliveries')}
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
              Dispatch Delivery
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateDelivery;
