import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import {
  PageHeader,
  Card,
  FormField,
  Input,
  Select,
  Button,
  useToast,
  Skeleton,
} from '../../components/common';
import { customerService } from '../../services/customerService';
import type { Customer, CustomerStatus } from '../../types/customer';

export const EditCustomer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'Active' as CustomerStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;

    customerService
      .getCustomerById(id)
      .then((data) => {
        if (!data) {
          toast.error(`Customer with ID ${id} not found.`);
          navigate('/customers');
          return;
        }
        setCustomer(data);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          status: data.status || 'Active',
        });
      })
      .catch(() => {
        toast.error('Failed to load customer profile');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate, toast]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = 'Customer name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.address.trim()) errs.address = 'Street address is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !validate()) return;

    try {
      setIsSubmitting(true);
      await customerService.updateCustomer(id, formData);
      toast.success('Customer profile updated successfully!');
      navigate(`/customers/${id}`);
    } catch {
      toast.error('Failed to update customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl pb-16">
        <Skeleton className="h-8 w-64" />
        <Card>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title={`Edit Customer: ${customer?.name || ''}`}
        subtitle={`Editing account profile and delivery address for ${id}`}
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Customers', path: '/customers' },
          { label: customer?.name || 'Customer', path: `/customers/${id}` },
          { label: 'Edit' },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Profile Details
              </h3>
              <p className="text-xs text-gray-500">Update basic customer contact records</p>
            </div>
            <div className="w-36">
              <FormField label="Account Status">
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as CustomerStatus })
                  }
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                  ]}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.name}>
              <Input
                value={formData.name}
                error={Boolean(errors.name)}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <Input
                type="email"
                value={formData.email}
                error={Boolean(errors.email)}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </FormField>

            <FormField label="Phone Number" required error={errors.phone}>
              <Input
                type="tel"
                value={formData.phone}
                error={Boolean(errors.phone)}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </FormField>
          </div>

          <div className="border-b border-gray-100 pt-4 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Address Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label="Street Address" required error={errors.address}>
                <Input
                  value={formData.address}
                  error={Boolean(errors.address)}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="City">
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </FormField>

            <FormField label="State">
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </FormField>

            <FormField label="Pincode">
              <Input
                value={formData.pincode}
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
              Update Customer
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditCustomer;
