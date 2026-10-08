import type { Customer } from '../types/customer';
import type { Delivery } from '../types/delivery';
import type { Agent } from '../types/agent';
import type { Collection } from '../types/collection';
import type { Conversation, ChatMessage } from '../types/chat';

export const delay = (ms = 350): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEYS = {
  CUSTOMERS: 'delivery_crm_customers',
  DELIVERIES: 'delivery_crm_deliveries',
  AGENTS: 'delivery_crm_agents',
  COLLECTIONS: 'delivery_crm_collections',
  CONVERSATIONS: 'delivery_crm_conversations',
  MESSAGES: 'delivery_crm_messages',
};

// Seed Customers
const initialCustomers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Krishnan K.',
    email: 'krishnan@example.com',
    phone: '+91 98450 12345',
    address: '42, 100ft Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    totalOrders: 14,
    totalSpent: 18450,
    status: 'Active',
    createdAt: '2026-08-15',
    updatedAt: '2026-10-06',
  },
  {
    id: 'CUST-002',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@example.com',
    phone: '+91 98201 45678',
    address: 'Flat 402, Green Glen Layout, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560103',
    totalOrders: 8,
    totalSpent: 9200,
    status: 'Active',
    createdAt: '2026-09-01',
    updatedAt: '2026-10-05',
  },
  {
    id: 'CUST-003',
    name: 'Rajesh Patel',
    email: 'rajesh.patel@example.com',
    phone: '+91 97123 78901',
    address: '15, Nariman Point, Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400021',
    totalOrders: 22,
    totalSpent: 42100,
    status: 'Active',
    createdAt: '2026-07-12',
    updatedAt: '2026-10-06',
  },
  {
    id: 'CUST-004',
    name: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    phone: '+91 99887 65432',
    address: '88, Connaught Place, Block B',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    totalOrders: 5,
    totalSpent: 4850,
    status: 'Active',
    createdAt: '2026-09-18',
    updatedAt: '2026-10-02',
  },
  {
    id: 'CUST-005',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 94140 11223',
    address: 'Plot 7, Banjara Hills Road No. 12',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500034',
    totalOrders: 11,
    totalSpent: 16700,
    status: 'Active',
    createdAt: '2026-08-04',
    updatedAt: '2026-10-01',
  },
  {
    id: 'CUST-006',
    name: 'Deepa Menon',
    email: 'deepa.menon@example.com',
    phone: '+91 94470 33445',
    address: '23, Marine Drive Walkway',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682011',
    totalOrders: 3,
    totalSpent: 2600,
    status: 'Inactive',
    createdAt: '2026-09-25',
    updatedAt: '2026-09-29',
  },
  {
    id: 'CUST-007',
    name: 'Siddharth Joshi',
    email: 'siddharth.j@example.com',
    phone: '+91 98220 55667',
    address: '104, Koregaon Park South',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    totalOrders: 19,
    totalSpent: 27900,
    status: 'Active',
    createdAt: '2026-06-20',
    updatedAt: '2026-10-04',
  },
  {
    id: 'CUST-008',
    name: 'Kavita Iyer',
    email: 'kavita.iyer@example.com',
    phone: '+91 98400 99881',
    address: '12, TTK Road, Alwarpet',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600018',
    totalOrders: 7,
    totalSpent: 8350,
    status: 'Active',
    createdAt: '2026-08-30',
    updatedAt: '2026-10-05',
  },
];

// Seed Delivery Agents
const initialAgents: Agent[] = [
  {
    id: 'AG-101',
    name: 'Ramesh Kumar',
    phone: '+91 98765 11001',
    email: 'ramesh.k@deliverycrm.in',
    vehicleType: 'Bike',
    vehicleNumber: 'KA-01-EQ-4421',
    status: 'On Delivery',
    hubLocation: 'Indiranagar Hub',
    assignedDeliveriesCount: 4,
    completedDeliveriesCount: 182,
    failedDeliveriesCount: 6,
    pendingCashAmount: 4350,
    settledCashAmount: 189000,
    rating: 4.8,
    joiningDate: '2025-11-10',
  },
  {
    id: 'AG-102',
    name: 'Arun Thomas',
    phone: '+91 98765 11002',
    email: 'arun.t@deliverycrm.in',
    vehicleType: 'Scooter',
    vehicleNumber: 'KA-03-MR-9820',
    status: 'On Delivery',
    hubLocation: 'Indiranagar Hub',
    assignedDeliveriesCount: 3,
    completedDeliveriesCount: 145,
    failedDeliveriesCount: 4,
    pendingCashAmount: 2600,
    settledCashAmount: 142000,
    rating: 4.9,
    joiningDate: '2026-01-15',
  },
  {
    id: 'AG-103',
    name: 'David Wilson',
    phone: '+91 98765 11003',
    email: 'david.w@deliverycrm.in',
    vehicleType: 'Van',
    vehicleNumber: 'KA-05-AB-1299',
    status: 'Active',
    hubLocation: 'Koramangala Hub',
    assignedDeliveriesCount: 2,
    completedDeliveriesCount: 210,
    failedDeliveriesCount: 9,
    pendingCashAmount: 1800,
    settledCashAmount: 245000,
    rating: 4.7,
    joiningDate: '2025-08-01',
  },
  {
    id: 'AG-104',
    name: 'Manish Rawat',
    phone: '+91 98765 11004',
    email: 'manish.r@deliverycrm.in',
    vehicleType: 'Bike',
    vehicleNumber: 'DL-04-CK-8832',
    status: 'Off Duty',
    hubLocation: 'Whitefield Hub',
    assignedDeliveriesCount: 0,
    completedDeliveriesCount: 98,
    failedDeliveriesCount: 3,
    pendingCashAmount: 0,
    settledCashAmount: 95000,
    rating: 4.6,
    joiningDate: '2026-03-20',
  },
  {
    id: 'AG-105',
    name: 'Suresh Reddy',
    phone: '+91 98765 11005',
    email: 'suresh.r@deliverycrm.in',
    vehicleType: 'Truck',
    vehicleNumber: 'TS-09-TR-4560',
    status: 'Active',
    hubLocation: 'Banjara Hub',
    assignedDeliveriesCount: 5,
    completedDeliveriesCount: 160,
    failedDeliveriesCount: 8,
    pendingCashAmount: 5900,
    settledCashAmount: 310000,
    rating: 4.5,
    joiningDate: '2025-10-05',
  },
];

// Seed Deliveries
const initialDeliveries: Delivery[] = [
  {
    id: 'DEL-9001',
    trackingNumber: 'TRK-9001',
    customerId: 'CUST-001',
    customerName: 'Krishnan K.',
    customerPhone: '+91 98450 12345',
    pickupAddress: 'Warehouse A, Electronic City, Bengaluru',
    deliveryAddress: '42, 100ft Road, Indiranagar, Bengaluru',
    city: 'Bengaluru',
    pincode: '560038',
    packageType: 'Electronics',
    itemDescription: 'Wireless Noise Cancelling Headphones',
    amount: 1450,
    codAmount: 1450,
    agentId: 'AG-101',
    agentName: 'Ramesh Kumar',
    agentPhone: '+91 98765 11001',
    status: 'In Transit',
    paymentStatus: 'pending',
    date: '2026-10-07',
    scheduledDate: '2026-10-07',
    createdAt: '2026-10-07T08:30:00Z',
    updatedAt: '2026-10-07T11:45:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-07 08:30 AM', note: 'Order placed by customer' },
      { status: 'Assigned', timestamp: '2026-10-07 09:15 AM', note: 'Assigned to Ramesh Kumar' },
      { status: 'Picked Up', timestamp: '2026-10-07 10:30 AM', note: 'Picked up from Warehouse A' },
      { status: 'In Transit', timestamp: '2026-10-07 11:45 AM', note: 'Out for delivery' },
    ],
    notes: 'Call customer before arrival',
  },
  {
    id: 'DEL-9002',
    trackingNumber: 'TRK-9002',
    customerId: 'CUST-002',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98201 45678',
    pickupAddress: 'Hub B, Outer Ring Road, Bengaluru',
    deliveryAddress: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru',
    city: 'Bengaluru',
    pincode: '560103',
    packageType: 'Apparel',
    itemDescription: 'Cotton Designer Kurti & Dupatta Set',
    amount: 820,
    codAmount: 820,
    agentId: 'AG-102',
    agentName: 'Arun Thomas',
    agentPhone: '+91 98765 11002',
    status: 'Delivered',
    paymentStatus: 'paid',
    date: '2026-10-06',
    scheduledDate: '2026-10-06',
    createdAt: '2026-10-06T09:00:00Z',
    updatedAt: '2026-10-06T15:20:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-06 09:00 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-06 10:00 AM', note: 'Assigned to Arun' },
      { status: 'Picked Up', timestamp: '2026-10-06 11:30 AM', note: 'Picked up' },
      { status: 'In Transit', timestamp: '2026-10-06 01:10 PM', note: 'Out for delivery' },
      { status: 'Delivered', timestamp: '2026-10-06 03:20 PM', note: 'Delivered and cash collected' },
    ],
  },
  {
    id: 'DEL-9003',
    trackingNumber: 'TRK-9003',
    customerId: 'CUST-003',
    customerName: 'Rajesh Patel',
    customerPhone: '+91 97123 78901',
    pickupAddress: 'Central Hub, Kurla West, Mumbai',
    deliveryAddress: '15, Nariman Point, Marine Drive, Mumbai',
    city: 'Mumbai',
    pincode: '400021',
    packageType: 'Documents',
    itemDescription: 'Confidential Legal Documents Folder',
    amount: 3200,
    codAmount: 0,
    agentId: 'AG-103',
    agentName: 'David Wilson',
    agentPhone: '+91 98765 11003',
    status: 'Picked Up',
    paymentStatus: 'paid',
    date: '2026-10-07',
    scheduledDate: '2026-10-07',
    createdAt: '2026-10-07T07:15:00Z',
    updatedAt: '2026-10-07T10:00:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-07 07:15 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-07 08:30 AM', note: 'Assigned to David' },
      { status: 'Picked Up', timestamp: '2026-10-07 10:00 AM', note: 'Picked up from Kurla Hub' },
    ],
  },
  {
    id: 'DEL-9004',
    trackingNumber: 'TRK-9004',
    customerId: 'CUST-004',
    customerName: 'Pooja Verma',
    customerPhone: '+91 99887 65432',
    pickupAddress: 'Fulfillment Hub 1, Okhla, New Delhi',
    deliveryAddress: '88, Connaught Place, Block B, New Delhi',
    city: 'New Delhi',
    pincode: '110001',
    packageType: 'Cosmetics',
    itemDescription: 'Organic Skincare Gift Hamper',
    amount: 1950,
    codAmount: 1950,
    status: 'Pending',
    paymentStatus: 'pending',
    date: '2026-10-07',
    scheduledDate: '2026-10-08',
    createdAt: '2026-10-07T11:00:00Z',
    updatedAt: '2026-10-07T11:00:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-07 11:00 AM', note: 'Order registered' },
    ],
  },
  {
    id: 'DEL-9005',
    trackingNumber: 'TRK-9005',
    customerId: 'CUST-005',
    customerName: 'Vikram Singh',
    customerPhone: '+91 94140 11223',
    pickupAddress: 'Hitech City Depot, Hyderabad',
    deliveryAddress: 'Plot 7, Banjara Hills Road No. 12, Hyderabad',
    city: 'Hyderabad',
    pincode: '500034',
    packageType: 'Electronics',
    itemDescription: 'Mechanical Gaming Keyboard',
    amount: 2900,
    codAmount: 2900,
    agentId: 'AG-105',
    agentName: 'Suresh Reddy',
    status: 'Failed',
    paymentStatus: 'failed',
    date: '2026-10-05',
    scheduledDate: '2026-10-05',
    createdAt: '2026-10-05T09:00:00Z',
    updatedAt: '2026-10-05T17:30:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-05 09:00 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-05 10:15 AM', note: 'Assigned' },
      { status: 'Picked Up', timestamp: '2026-10-05 11:45 AM', note: 'Picked up' },
      { status: 'In Transit', timestamp: '2026-10-05 01:30 PM', note: 'Out for delivery' },
      { status: 'Failed', timestamp: '2026-10-05 05:30 PM', note: 'Door locked, recipient uncontactable' },
    ],
    notes: 'Reschedule requested by recipient',
  },
  {
    id: 'DEL-9006',
    trackingNumber: 'TRK-9006',
    customerId: 'CUST-006',
    customerName: 'Deepa Menon',
    customerPhone: '+91 94470 33445',
    pickupAddress: 'Willingdon Island Depot, Kochi',
    deliveryAddress: '23, Marine Drive Walkway, Kochi',
    city: 'Kochi',
    pincode: '682011',
    packageType: 'Home & Kitchen',
    itemDescription: 'Ceramic Dinner Set (18 pcs)',
    amount: 1100,
    codAmount: 1100,
    agentId: 'AG-101',
    agentName: 'Ramesh Kumar',
    status: 'Returned',
    paymentStatus: 'pending',
    date: '2026-10-04',
    scheduledDate: '2026-10-04',
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-04T16:00:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-04 08:00 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-04 09:00 AM', note: 'Assigned' },
      { status: 'Picked Up', timestamp: '2026-10-04 10:30 AM', note: 'Picked up' },
      { status: 'In Transit', timestamp: '2026-10-04 12:00 PM', note: 'Out for delivery' },
      { status: 'Failed', timestamp: '2026-10-04 02:30 PM', note: 'Item rejected due to outer box damage' },
      { status: 'Returned', timestamp: '2026-10-04 04:00 PM', note: 'Returned to hub warehouse' },
    ],
  },
  {
    id: 'DEL-9007',
    trackingNumber: 'TRK-9007',
    customerId: 'CUST-007',
    customerName: 'Siddharth Joshi',
    customerPhone: '+91 98220 55667',
    pickupAddress: 'Hadapsar Logistics Centre, Pune',
    deliveryAddress: '104, Koregaon Park South, Pune',
    city: 'Pune',
    pincode: '411001',
    packageType: 'Books & Stationery',
    itemDescription: 'Academic Reference Books Pack',
    amount: 1780,
    codAmount: 1780,
    agentId: 'AG-102',
    agentName: 'Arun Thomas',
    status: 'Assigned',
    paymentStatus: 'pending',
    date: '2026-10-07',
    scheduledDate: '2026-10-07',
    createdAt: '2026-10-07T09:30:00Z',
    updatedAt: '2026-10-07T10:15:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-07 09:30 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-07 10:15 AM', note: 'Assigned to Arun Thomas' },
    ],
  },
  {
    id: 'DEL-9008',
    trackingNumber: 'TRK-9008',
    customerId: 'CUST-008',
    customerName: 'Kavita Iyer',
    customerPhone: '+91 98400 99881',
    pickupAddress: 'Guindy Sorting Centre, Chennai',
    deliveryAddress: '12, TTK Road, Alwarpet, Chennai',
    city: 'Chennai',
    pincode: '600018',
    packageType: 'Healthcare',
    itemDescription: 'Ayurvedic Wellness Pack',
    amount: 1250,
    codAmount: 1250,
    agentId: 'AG-103',
    agentName: 'David Wilson',
    status: 'Delivered',
    paymentStatus: 'paid',
    date: '2026-10-06',
    scheduledDate: '2026-10-06',
    createdAt: '2026-10-06T10:00:00Z',
    updatedAt: '2026-10-06T14:45:00Z',
    timeline: [
      { status: 'Pending', timestamp: '2026-10-06 10:00 AM', note: 'Created' },
      { status: 'Assigned', timestamp: '2026-10-06 10:45 AM', note: 'Assigned' },
      { status: 'Picked Up', timestamp: '2026-10-06 12:00 PM', note: 'Picked up' },
      { status: 'In Transit', timestamp: '2026-10-06 01:30 PM', note: 'In transit' },
      { status: 'Delivered', timestamp: '2026-10-06 02:45 PM', note: 'Delivered successfully via UPI' },
    ],
  },
];

// Seed Collections
const initialCollections: Collection[] = [
  {
    id: 'COL-101',
    deliveryId: 'DEL-9002',
    trackingNumber: 'TRK-9002',
    customerName: 'Ananya Sharma',
    agentId: 'AG-102',
    agentName: 'Arun Thomas',
    amount: 820,
    paymentMode: 'Cash',
    status: 'Pending',
    collectedAt: '2026-10-06T15:20:00Z',
    createdAt: '2026-10-06T15:20:00Z',
    notes: 'Collected in cash, pending handover at hub',
  },
  {
    id: 'COL-102',
    deliveryId: 'DEL-9008',
    trackingNumber: 'TRK-9008',
    customerName: 'Kavita Iyer',
    agentId: 'AG-103',
    agentName: 'David Wilson',
    amount: 1250,
    paymentMode: 'UPI',
    status: 'Collected',
    collectedAt: '2026-10-06T14:45:00Z',
    createdAt: '2026-10-06T14:45:00Z',
    notes: 'UPI transaction ID: UPI/883921093/HDFC',
  },
  {
    id: 'COL-103',
    deliveryId: 'DEL-9001',
    trackingNumber: 'TRK-9001',
    customerName: 'Krishnan K.',
    agentId: 'AG-101',
    agentName: 'Ramesh Kumar',
    amount: 1450,
    paymentMode: 'Cash',
    status: 'Pending',
    createdAt: '2026-10-07T08:30:00Z',
    notes: 'In transit delivery COD amount',
  },
  {
    id: 'COL-104',
    deliveryId: 'DEL-8990',
    trackingNumber: 'TRK-8990',
    customerName: 'Sunil Mehta',
    agentId: 'AG-101',
    agentName: 'Ramesh Kumar',
    amount: 2900,
    paymentMode: 'Cash',
    status: 'Settled',
    collectedAt: '2026-10-05T16:10:00Z',
    settledAt: '2026-10-05T19:00:00Z',
    settledBy: 'Admin Krishnan',
    createdAt: '2026-10-05T16:10:00Z',
    notes: 'Settled at Indiranagar evening shift cash desk',
  },
  {
    id: 'COL-105',
    deliveryId: 'DEL-8995',
    trackingNumber: 'TRK-8995',
    customerName: 'Meera Nambiar',
    agentId: 'AG-102',
    agentName: 'Arun Thomas',
    amount: 1780,
    paymentMode: 'Cash',
    status: 'Settled',
    collectedAt: '2026-10-05T14:30:00Z',
    settledAt: '2026-10-05T18:30:00Z',
    settledBy: 'Admin Krishnan',
    createdAt: '2026-10-05T14:30:00Z',
  },
];

// Seed Conversations
const initialConversations: Conversation[] = [
  {
    id: 'CONV-001',
    participantId: 'CUST-001',
    participantName: 'Krishnan K.',
    participantType: 'customer',
    participantPhone: '+91 98450 12345',
    lastMessage: 'Will the package arrive before 2 PM?',
    lastMessageTime: '11:50 AM',
    unreadCount: 1,
    isOnline: true,
    relatedDeliveryTracking: 'TRK-9001',
  },
  {
    id: 'CONV-002',
    participantId: 'AG-101',
    participantName: 'Ramesh Kumar (Agent)',
    participantType: 'agent',
    participantPhone: '+91 98765 11001',
    lastMessage: 'Reached Indiranagar 100ft road. Customer notified.',
    lastMessageTime: '11:46 AM',
    unreadCount: 0,
    isOnline: true,
    relatedDeliveryTracking: 'TRK-9001',
  },
  {
    id: 'CONV-003',
    participantId: 'CUST-002',
    participantName: 'Ananya Sharma',
    participantType: 'customer',
    participantPhone: '+91 98201 45678',
    lastMessage: 'Thank you, received the package safely!',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    relatedDeliveryTracking: 'TRK-9002',
  },
  {
    id: 'CONV-004',
    participantId: 'AG-102',
    participantName: 'Arun Thomas (Agent)',
    participantType: 'agent',
    participantPhone: '+91 98765 11002',
    lastMessage: 'Handing over COD cash 820 at hub counter.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
  },
];

// Seed Messages
const initialMessages: ChatMessage[] = [
  {
    id: 'MSG-001',
    conversationId: 'CONV-001',
    senderId: 'admin',
    senderName: 'Delivery CRM Support',
    senderRole: 'admin',
    text: 'Hello Krishnan, your delivery #TRK-9001 is out for delivery with Ramesh Kumar.',
    timestamp: '11:40 AM',
    read: true,
  },
  {
    id: 'MSG-002',
    conversationId: 'CONV-001',
    senderId: 'CUST-001',
    senderName: 'Krishnan K.',
    senderRole: 'customer',
    text: 'Will the package arrive before 2 PM?',
    timestamp: '11:50 AM',
    read: false,
  },
  {
    id: 'MSG-003',
    conversationId: 'CONV-002',
    senderId: 'admin',
    senderName: 'Dispatcher',
    senderRole: 'admin',
    text: 'Ramesh, please prioritize TRK-9001 on 100ft road first.',
    timestamp: '11:20 AM',
    read: true,
  },
  {
    id: 'MSG-004',
    conversationId: 'CONV-002',
    senderId: 'AG-101',
    senderName: 'Ramesh Kumar',
    senderRole: 'agent',
    text: 'Reached Indiranagar 100ft road. Customer notified.',
    timestamp: '11:46 AM',
    read: true,
  },
];

class MockStorage {
  private get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // In-memory fallback if quota exceeded or restricted
    }
  }

  getCustomers(): Customer[] {
    return this.get<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  }
  setCustomers(data: Customer[]): void {
    this.set(STORAGE_KEYS.CUSTOMERS, data);
  }

  getDeliveries(): Delivery[] {
    return this.get<Delivery[]>(STORAGE_KEYS.DELIVERIES, initialDeliveries);
  }
  setDeliveries(data: Delivery[]): void {
    this.set(STORAGE_KEYS.DELIVERIES, data);
  }

  getAgents(): Agent[] {
    return this.get<Agent[]>(STORAGE_KEYS.AGENTS, initialAgents);
  }
  setAgents(data: Agent[]): void {
    this.set(STORAGE_KEYS.AGENTS, data);
  }

  getCollections(): Collection[] {
    return this.get<Collection[]>(STORAGE_KEYS.COLLECTIONS, initialCollections);
  }
  setCollections(data: Collection[]): void {
    this.set(STORAGE_KEYS.COLLECTIONS, data);
  }

  getConversations(): Conversation[] {
    return this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, initialConversations);
  }
  setConversations(data: Conversation[]): void {
    this.set(STORAGE_KEYS.CONVERSATIONS, data);
  }

  getMessages(): ChatMessage[] {
    return this.get<ChatMessage[]>(STORAGE_KEYS.MESSAGES, initialMessages);
  }
  setMessages(data: ChatMessage[]): void {
    this.set(STORAGE_KEYS.MESSAGES, data);
  }

  resetAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      localStorage.removeItem(STORAGE_KEYS.DELIVERIES);
      localStorage.removeItem(STORAGE_KEYS.AGENTS);
      localStorage.removeItem(STORAGE_KEYS.COLLECTIONS);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    } catch {
      // noop
    }
  }
}

export const mockStorage = new MockStorage();
