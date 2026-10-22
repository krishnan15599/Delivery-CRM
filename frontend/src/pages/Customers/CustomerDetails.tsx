import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  Edit2,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  StatCard,
  DataTable,
  StatusBadge,
  Button,
  Skeleton,
  useToast,
  type Column,
} from '../../components/common';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types/customer';
import type { Delivery } from '../../types/delivery';

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [cust, delivs] = await Promise.all([
          customerService.getCustomerById(id),
          customerService.getCustomerDeliveries(id),
        ]);

        if (!cust) {
          toast.error(`Customer with ID ${id} not found.`);
          navigate('/customers');
          return;
        }

        setCustomer(cust);
        setDeliveries(delivs);
      } catch {
        toast.error('Failed to load customer profile');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  if (loading || !customer) {
    return (
      <div className="space-y-6 pb-16">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const deliveryColumns: Column<Delivery>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking No',
      render: (row) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {row.trackingNumber}
        </span>
      ),
    },
    {
      key: 'packageType',
      header: 'Item Type',
      render: (row) => (
        <div>
          <span className="text-xs font-medium text-gray-800">{row.packageType}</span>
          {row.itemDescription && (
            <p className="text-[11px] text-gray-400 truncate max-w-xs">
              {row.itemDescription}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'agentName',
      header: 'Agent',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.agentName || <span className="italic text-gray-400">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="text-xs text-gray-500">{String(row.date)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          ₹{row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="xs"
          rightIcon={<ArrowRight className="w-3 h-3" />}
          onClick={() => navigate(`/deliveries/${row.id}`)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={customer.name}
        subtitle={`Customer Account ID: ${customer.id}`}
        showBack
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Customers', path: '/customers' },
          { label: customer.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/customers/edit/${customer.id}`)}
            >
              Edit Profile
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/deliveries/new?customerId=${customer.id}`)}
            >
              Create Delivery
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={customer.totalOrders || deliveries.length}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Spent"
          value={`₹${(customer.totalSpent || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Active Deliveries"
          value={
            deliveries.filter((d) => d.status === 'In Transit' || d.status === 'Picked Up').length
          }
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Account Status"
          value={customer.status || 'Active'}
          icon={ShieldCheck}
          color={customer.status === 'Inactive' ? 'rose' : 'emerald'}
        />
      </div>

      {/* Profile Overview & Address Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card title="Contact Information" className="md:col-span-1">
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-4 h-4 text-[#2c5fbf] shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block">Email Address</span>
                <span className="font-medium text-gray-900">{customer.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-4 h-4 text-[#2c5fbf] shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block">Phone Number</span>
                <span className="font-medium text-gray-900">{customer.phone}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-4 h-4 text-[#2c5fbf] shrink-0" />
              <div>
                <span className="text-[11px] text-gray-400 block">Member Since</span>
                <span className="font-medium text-gray-900">{String(customer.createdAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Address Card */}
        <Card title="Default Delivery Address" className="md:col-span-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#2c5fbf] shrink-0 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-900">
                {customer.city || 'Bengaluru'}, {customer.state || 'Karnataka'}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed max-w-lg">
                {customer.address}
              </p>
              {customer.pincode && (
                <span className="inline-block text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-2">
                  PIN: {customer.pincode}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Delivery History</h3>
            <p className="text-xs text-gray-500">
              All package dispatches and shipments associated with this customer
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Total Deliveries: {deliveries.length}
          </span>
        </div>

        <DataTable
          data={deliveries}
          columns={deliveryColumns}
          emptyText="No shipments found for this customer."
          onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
        />
      </div>
    </div>
  );
};

export default CustomerDetails;
