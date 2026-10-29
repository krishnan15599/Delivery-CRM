import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Eye, Edit2, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  DataTable,
  SearchBar,
  FilterBar,
  Button,
  StatusBadge,
  ConfirmDialog,
  useToast,
  type Column,
} from '../../components/common';
import { customerService } from '../../services/customerService';
import type { Customer } from '../../types/customer';

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete modal state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // 🚀 TanStack Query: Replaces manual useEffect, useState, loading, error handling!
  const {
    data: customers = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getAllCustomers,
  });

  useEffect(() => {
    if (isError) {
      toast.error((error as Error)?.message || 'Failed to load customers from API');
    }
  }, [isError, error, toast]);

  // Search on real API data
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.trim().toLowerCase();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    });
  }, [customers, search]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      queryClient.setQueryData<Customer[]>(['customers'], (prev = []) =>
        prev.filter((c) => c.id !== customerToDelete.id)
      );
      toast.success(`Customer "${customerToDelete.name}" deleted successfully.`);
      setCustomerToDelete(null);
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2c5fbf] font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-xs">{row.name}</div>
            {/* <div className="text-[11px] text-gray-400 font-mono">{row.id}</div> */}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (row) => (
        <div className="space-y-0.5 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-gray-400" />
            <span>{row.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'City & Address',
      render: (row) => (
        <div className="text-xs text-gray-600 max-w-xs truncate">
          <div className="flex items-center gap-1 font-medium text-gray-800">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span>{row.city || 'Bengaluru'}</span>
          </div>
          <span className="text-[11px] text-gray-400">{row.address}</span>
        </div>
      ),
    },
    {
      key: 'orders',
      header: 'Total Orders',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          {row.totalOrders || 0}
        </span>
      ),
    },
    {
      key: 'spent',
      header: 'Total Spent',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 text-xs">
          ₹{(row.totalSpent || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status || 'Active'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/customers/${row.id}`)}
            className="p-1 text-gray-400 hover:text-[#2c5fbf] hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/customers/edit/${row.id}`)}
            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCustomerToDelete(row)}
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Customers"
        subtitle="Manage customer directories, delivery histories, and profiles."
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Customers' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/customers/add')}
          >
            Add Customer
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <FilterBar
          totalResults={totalItems}
          onClearAll={() => {
            setSearch('');
            setPage(1);
          }}
          activeFilters={[
            ...(search ? [{ id: 'search', label: 'Search', value: search }] : []),
          ]}
          onRemoveFilter={(id) => {
            if (id === 'search') setSearch('');
          }}
        >
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, city..."
            className="max-w-xs"
          />
        </FilterBar>

        <DataTable
          data={paginatedCustomers}
          columns={columns}
          loading={loading}
          emptyText="No customers found. Try adjusting your filters or add a new customer."
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems,
            pageSize,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (s) => {
              setPageSize(s);
              setPage(1);
            },
          }}
        />
      </div>

      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Customer?"
        message={`Are you sure you want to remove "${customerToDelete?.name}"? All associated order historical links will remain preserved.`}
        confirmText="Delete Customer"
        variant="danger"
      />
    </div>
  );
};

export default Customers;
