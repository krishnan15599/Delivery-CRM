# Delivery CRM - Operations, Dispatch & Cash Settlement Platform

A high-performance, enterprise-grade delivery logistics & cash collection CRM built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite**, **TanStack Query**, and **Recharts**.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC)**
   - **Admin**: Full access to dispatching, agent management, settlements, reporting, and settings.
   - **Manager**: Hub supervision, customer accounts, dispatches, roster, and operational reports.
   - **Agent**: Mobile-responsive courier delivery roster, order updates, and chat.
   - One-click role demo switcher available directly on the login page and sidebar footer.

2. **Core Modules**
   - **Dashboard**: Real-time KPI statistics, dispatch volume area charts, status distribution breakdown, top agents roster, and recent shipments table.
   - **Customers**: Customer records, order history, lifetime spend, delivery addresses, and shipment creation.
   - **Deliveries**: Lifecycle dispatch management (Pending → Assigned → Picked Up → In Transit → Delivered / Failed / Returned), bulk courier reassignment, filters, and status timeline.
   - **Live Route Tracking**: Simulated real-time GPS telemetry, waypoint progress, speed, ETA, and pickup/drop-off pins.
   - **Electronic Proof of Delivery (e-POD)**: Recipient signature canvas, photo upload simulation, and 4-digit customer OTP verification.
   - **Print Shipping Waybill**: Printable standard courier shipping manifest label with barcode simulation.
   - **Agents Roster**: Field personnel vehicle tracking, active hub location, assigned deliveries, and unsettled cash balances.
   - **Collections & Cashier Settlements**: Pending COD collections vs. settled cashier cash, agent reconciliation modal with auto-balancing.
   - **Chat**: Real-time customer and courier inbox with unread counter badges and search.
   - **Analytics & Reports**: Delivery performance, COD payment mode breakdown, courier audits, and customer frequency analysis with CSV export.

3. **Backend Integration Ready**
   - Centralized Axios client (`src/services/api/axiosClient.ts`) with Bearer token authentication, automatic 401 refresh interceptor, and error normalization.
   - TanStack Query hooks (`useDeliveries`, `useCustomers`, `useAgents`, `useCollections`) with intelligent caching and cross-entity cache invalidation.
   - Seamless switch between Mock Storage and Live API via `VITE_USE_MOCK_API` in `.env`.
   - Comprehensive backend developer specification in `API_CONTRACT.md`.

---

## 📁 Project Architecture & Folder Structure

```
src/
├── components/
│   ├── common/             # Reusable UI primitives (Button, Modal, DataTable, Tabs, Toast, etc.)
│   ├── delivery/           # DeliveryTrackingMap, ProofOfDeliveryModal, PrintShippingLabelModal
├── context/
│   ├── AuthContext.tsx     # RBAC roles, user state, and route permissions
│   ├── CustomerContext.tsx # Customer data state
│   ├── DeliveryContext.tsx # Delivery list state
├── hooks/
│   └── queries/            # TanStack Query hooks (useDeliveries, useCustomers, useAgents, etc.)
├── layouts/
│   └── DashboardLayout/    # Responsive sidebar (desktop + mobile drawer) and top navigation header
├── pages/
│   ├── Dashboard/          # Analytics overview and metrics
│   ├── Customers/          # List, Add, Edit, Customer Details
│   ├── Deliveries/         # List, Create, Delivery Details with Tracking & POD
│   ├── Agents/             # Agent roster, modal, details
│   ├── Collections/        # COD collections & Cashier settlements
│   ├── Chat/               # Inbound courier/customer messaging
│   ├── Reports/            # 4 exportable business intelligence tabs
│   ├── Settings/           # Company profiles & role permissions
│   └── Login/              # Auth page with 1-click test roles
├── services/
│   ├── api/                # Axios instance & interceptors
│   ├── authService.ts      # Token management & authentication
│   ├── deliveryService.ts  # Delivery lifecycle operations
│   ├── customerService.ts  # Customer CRUD
│   ├── agentService.ts     # Courier operations
│   ├── collectionService.ts# COD reconciliation
│   └── mockStorage.ts      # Resilient localStorage engine with seed fixtures
├── types/                  # Strict TypeScript domain interfaces
├── utils/                  # Formatters, validators, classname merger
└── test/                   # Vitest unit & integration test suites
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create or edit `.env.development` or `.env.production`:
```env
VITE_APP_NAME="Delivery CRM"
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_USE_MOCK_API="true" # Set to "false" to connect to real backend
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Admin** | `admin@deliverycrm.in` | `admin123` | Full CRM access (All modules + Settlements + Settings) |
| **Manager** | `manager@deliverycrm.in` | `manager123` | Dashboard, Customers, Deliveries, Agents, Chat, Reports |
| **Agent** | `agent@deliverycrm.in` | `agent123` | Deliveries Roster, Chat Inbox |

*(Quick 1-click buttons are available on the Login page for rapid evaluation)*

---

## 🧪 Testing & Quality Assurance

### Run Unit & Business Logic Tests
```bash
npm test
```
Tests cover utility formatters, button interactions, badge rendering, and full end-to-end COD settlement data consistency.

### Run Code Quality Linter
```bash
npm run lint
```
Guaranteed 0 warnings and 0 errors.

### Production Build & Code Splitting
```bash
npm run build
```
Builds an optimized production bundle with dynamic `React.lazy` code splitting across all route boundaries.
