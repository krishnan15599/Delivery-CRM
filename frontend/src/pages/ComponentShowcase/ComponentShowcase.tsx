import { useState } from 'react';
import {
  Package,
  Users,
  Clock,
  IndianRupee,
  Plus,
  Trash2,
  Send,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  DataTable,
  SearchBar,
  FilterBar,
  StatusBadge,
  Badge,
  Modal,
  ConfirmDialog,
  Drawer,
  Tabs,
  FormField,
  Input,
  Select,
  Button,
  DateRangePicker,
  StatusTimeline,
  EmptyState,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  useToast,
  type Column,
  type DateRange,
  type TimelineEvent,
} from '../../components/common';

interface MockItem {
  id: string;
  trackingNo: string;
  customer: string;
  destination: string;
  amount: number;
  status: string;
  date: string;
}

const mockData: MockItem[] = [
  {
    id: '1',
    trackingNo: 'DEL-8941',
    customer: 'Krishnan K.',
    destination: 'Bengaluru, KA',
    amount: 1450,
    status: 'In Transit',
    date: '2026-10-07',
  },
  {
    id: '2',
    trackingNo: 'DEL-8942',
    customer: 'Ananya Sharma',
    destination: 'Chennai, TN',
    amount: 820,
    status: 'Delivered',
    date: '2026-10-06',
  },
  {
    id: '3',
    trackingNo: 'DEL-8943',
    customer: 'Rajesh Patel',
    destination: 'Mumbai, MH',
    amount: 3200,
    status: 'Pending',
    date: '2026-10-07',
  },
  {
    id: '4',
    trackingNo: 'DEL-8944',
    customer: 'Pooja Verma',
    destination: 'Delhi, DL',
    amount: 540,
    status: 'Assigned',
    date: '2026-10-07',
  },
  {
    id: '5',
    trackingNo: 'DEL-8945',
    customer: 'Vikram Singh',
    destination: 'Hyderabad, TS',
    amount: 1980,
    status: 'Failed',
    date: '2026-10-05',
  },
  {
    id: '6',
    trackingNo: 'DEL-8946',
    customer: 'Deepa Menon',
    destination: 'Kochi, KL',
    amount: 1100,
    status: 'Returned',
    date: '2026-10-04',
  },
];

const timelineEvents: TimelineEvent[] = [
  {
    id: 1,
    title: 'Order Created & Confirmed',
    description: 'Order placed by Krishnan K. with COD amount ₹1,450',
    timestamp: 'Today, 09:30 AM',
    status: 'completed',
    actor: 'System Admin',
  },
  {
    id: 2,
    title: 'Assigned to Agent',
    description: 'Assigned to Arun (Agent ID: AG-102)',
    timestamp: 'Today, 10:15 AM',
    status: 'completed',
    actor: 'Dispatcher',
  },
  {
    id: 3,
    title: 'Out for Delivery / In Transit',
    description: 'Agent picked up package from Indiranagar Hub',
    timestamp: 'Today, 11:45 AM',
    status: 'current',
    actor: 'Agent: Arun',
  },
  {
    id: 4,
    title: 'Delivery Confirmation & COD Collection',
    description: 'Pending customer OTP verification',
    timestamp: 'Expected Today, 02:30 PM',
    status: 'upcoming',
  },
];

export const ComponentShowcase = () => {
  const toast = useToast();

  // State controls for interactive demos
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showEmptyTable, setShowEmptyTable] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    preset: 'Last 7 Days',
  });

  const columns: Column<MockItem>[] = [
    {
      key: 'trackingNo',
      header: 'Tracking No',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900 font-mono text-xs">
          {row.trackingNo}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer}</div>
          <div className="text-[11px] text-gray-400">{row.destination}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-gray-900">₹{row.amount.toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      align: 'right',
      render: (row) => <span className="text-xs text-gray-500">{row.date}</span>,
    },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* 1. PageHeader */}
      <section>
        <PageHeader
          title="Component Library Showcase"
          subtitle="Interactive testbed and verification for Step 1 common design system components."
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'System' },
            { label: 'Common Components' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => toast.info('Refreshed showcase states')}
              >
                Reset Demo
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsModalOpen(true)}
              >
                Open Demo Modal
              </Button>
            </div>
          }
        />
      </section>

      {/* 2. StatCards */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          1. StatCards with Trends & Colors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Deliveries"
            value="1,482"
            icon={Package}
            color="blue"
            trend={{ value: '12.4%', isPositive: true, period: 'vs last week' }}
            onClick={() => toast.info('Clicked Deliveries StatCard')}
          />
          <StatCard
            title="Active Agents"
            value="48"
            icon={Users}
            color="indigo"
            trend={{ value: '4 new', isPositive: true, period: 'this week' }}
          />
          <StatCard
            title="Pending Deliveries"
            value="124"
            icon={Clock}
            color="amber"
            trend={{ value: '3.1%', isPositive: false, period: 'vs yesterday' }}
          />
          <StatCard
            title="Collected Amount"
            value="₹1,24,650"
            icon={IndianRupee}
            color="emerald"
            trend={{ value: '18.9%', isPositive: true, period: 'vs last month' }}
          />
        </div>
      </section>

      {/* 3. Toast Notifications */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          2. Toast Notifications
        </h3>
        <p className="text-xs text-gray-500">
          Trigger rich toasts with auto-dismiss, custom titles, and icons.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="success"
            size="sm"
            onClick={() => toast.success('Delivery #DEL-8942 marked as delivered!', 'Success')}
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              toast.error('Delivery #DEL-8945 attempt failed: Customer unavailable.', 'Delivery Failed')
            }
          >
            Trigger Error Toast
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              toast.info('Agent Ramesh started his delivery shift.', 'Agent Status')
            }
          >
            Trigger Info Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              toast.warning('5 deliveries pending assignment for over 2 hours.', 'Attention Required')
            }
          >
            Trigger Warning Toast
          </Button>
        </div>
      </section>

      {/* 4. Badges & StatusBadges */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          3. Badges & StatusBadges
        </h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">Delivery & CRM StatusBadges:</div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Pending" />
              <StatusBadge status="Assigned" />
              <StatusBadge status="In Transit" />
              <StatusBadge status="Delivered" />
              <StatusBadge status="Failed" />
              <StatusBadge status="Returned" />
              <StatusBadge status="Unassigned" />
              <StatusBadge status="Paid" />
              <StatusBadge status="Active" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-2">General Semantic Badges:</div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary" dot>Primary</Badge>
              <Badge variant="success" dot>Success</Badge>
              <Badge variant="warning" dot>Warning</Badge>
              <Badge variant="danger" dot>Danger</Badge>
              <Badge variant="info" dot>Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="default">Default</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Tabs & FilterBar */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          4. Tabs & FilterBar
        </h3>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
            items={[
              { id: 'all', label: 'All Deliveries', count: 6 },
              { id: 'in_transit', label: 'In Transit', count: 1 },
              { id: 'pending', label: 'Pending', count: 1 },
              { id: 'delivered', label: 'Delivered', count: 1 },
              { id: 'failed', label: 'Failed / Returned', count: 2 },
            ]}
          />

          <FilterBar
            activeFilters={[
              { id: 'city', label: 'Region', value: 'South Zone' },
              { id: 'type', label: 'Payment', value: 'COD' },
            ]}
            onRemoveFilter={(id) => toast.info(`Removed filter: ${id}`)}
            onClearAll={() => toast.info('Cleared all filters')}
            totalResults={mockData.length}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => toast.success('Export started...')}
                >
                  Export CSV
                </Button>
              </div>
            }
          >
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by tracking number, customer..."
              className="max-w-xs"
            />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Select
              className="w-36 text-xs py-1.5"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'transit', label: 'In Transit' },
                { value: 'delivered', label: 'Delivered' },
              ]}
            />
          </FilterBar>
        </div>
      </section>

      {/* 6. DataTable with Selection, Sorting, Loading, Empty State */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            5. DataTable (Sortable, Selectable, Paginated)
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsTableLoading(!isTableLoading)}
            >
              Toggle Loading State ({isTableLoading ? 'ON' : 'OFF'})
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowEmptyTable(!showEmptyTable)}
            >
              Toggle Empty State ({showEmptyTable ? 'ON' : 'OFF'})
            </Button>
          </div>
        </div>

        <DataTable
          data={showEmptyTable ? [] : mockData}
          columns={columns}
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => setSelectedKeys(keys)}
          loading={isTableLoading}
          bulkActions={
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="xs"
                leftIcon={<Send className="w-3 h-3" />}
                onClick={() =>
                  toast.success(`Bulk assigned ${selectedKeys.length} deliveries to agent!`)
                }
              >
                Assign Agent
              </Button>
              <Button
                variant="danger"
                size="xs"
                leftIcon={<Trash2 className="w-3 h-3" />}
                onClick={() => setIsConfirmOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          }
          pagination={{
            currentPage: 1,
            totalPages: 3,
            totalItems: 18,
            pageSize: 6,
            onPageChange: (p) => toast.info(`Navigated to page ${p}`),
            onPageSizeChange: (s) => toast.info(`Page size changed to ${s}`),
          }}
          onRowClick={(row) => toast.info(`Clicked row: ${row.trackingNo}`)}
        />
      </section>

      {/* 7. Modals, Dialogs, Drawers & Forms */}
      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          6. Modal, ConfirmDialog & Drawer
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Standard Modal
          </Button>
          <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
            Open Slide-out Drawer
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            Open Danger Confirm Dialog
          </Button>
        </div>
      </section>

      {/* 8. StatusTimeline & FormField Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* StatusTimeline */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            7. StatusTimeline
          </h3>
          <StatusTimeline events={timelineEvents} />
        </div>

        {/* FormField & Controls */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
            8. FormField & Inputs
          </h3>
          <FormField
            label="Customer Name"
            required
            tooltip="Legal customer name as per invoice"
            helperText="Enter full name of the consignee"
          >
            <Input placeholder="e.g. Ramesh Kumar" />
          </FormField>

          <FormField
            label="Phone Number"
            required
            error="Please enter a valid 10-digit mobile number"
          >
            <Input placeholder="+91 98765 43210" error />
          </FormField>

          <FormField label="Assigned Delivery Agent">
            <Select
              options={[
                { value: 'ag1', label: 'Arun (Indiranagar Hub)' },
                { value: 'ag2', label: 'David (Koramangala Hub)' },
                { value: 'ag3', label: 'Ramesh (Whitefield Hub)' },
              ]}
            />
          </FormField>
        </div>
      </div>

      {/* 9. EmptyState & Skeleton Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            9. EmptyState Component
          </h3>
          <EmptyState
            title="No Deliveries Found"
            description="There are currently no active deliveries matching your filter parameters. Try expanding your search or date range."
            action={
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => toast.info('Clicked create delivery')}
              >
                Create Delivery
              </Button>
            }
            secondaryAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Cleared filters')}
              >
                Clear Filters
              </Button>
            }
          />
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            10. Skeleton Loaders
          </h3>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonTable rows={2} columns={3} />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Delivery"
        description="Fill in the delivery details to dispatch this order."
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                toast.success('New delivery order created successfully!');
              }}
            >
              Save Delivery
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Recipient Name" required>
            <Input placeholder="Enter customer name" />
          </FormField>
          <FormField label="Delivery Address" required>
            <Input placeholder="Street address, Apartment/Flat" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Package Type">
              <Select
                options={[
                  { value: 'standard', label: 'Standard Parcel' },
                  { value: 'express', label: 'Express Delivery' },
                  { value: 'fragile', label: 'Fragile Electronics' },
                ]}
              />
            </FormField>
            <FormField label="COD Amount (₹)">
              <Input type="number" placeholder="0.00" />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Demo Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Delivery Order #DEL-8941"
        subtitle="Full audit trail and customer delivery profile"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsDrawerOpen(false);
                toast.success('Delivery marked as Dispatched');
              }}
            >
              Dispatch Now
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-700 font-semibold">Current Status</div>
              <div className="text-base font-bold text-blue-950 mt-0.5">In Transit</div>
            </div>
            <StatusBadge status="In Transit" />
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Delivery Progress
            </h4>
            <StatusTimeline events={timelineEvents} />
          </div>
        </div>
      </Drawer>

      {/* Demo ConfirmDialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          await new Promise((res) => setTimeout(res, 800));
          setIsConfirmOpen(false);
          toast.success('Selected records permanently deleted.');
          setSelectedKeys([]);
        }}
        title="Delete Selected Deliveries?"
        message="Are you sure you want to delete these deliveries? This action cannot be reversed and will remove all audit logs."
        confirmText="Yes, Delete"
        variant="danger"
      />
    </div>
  );
};
