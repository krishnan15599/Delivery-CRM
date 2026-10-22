# Delivery CRM - Backend API Contract Specification

> **Base URL**: `http://localhost:5000/api/v1` (configurable via `VITE_API_BASE_URL`)  
> **Auth Scheme**: HTTP Bearer Token (`Authorization: Bearer <token>`)  
> **Payload Format**: `application/json`

---

## 1. Standard Envelope & Pagination

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 48,
    "pageSize": 10
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "status": 404
}
```

---

## 2. Authentication Module

### `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "admin@deliverycrm.in",
    "password": "password123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "dGhpcy1pcy1hLXJlZnJlc2g...",
      "expiresIn": 3600,
      "user": {
        "id": "USR-001",
        "name": "Krishnan K.",
        "email": "admin@deliverycrm.in",
        "role": "Admin",
        "phone": "+91 98450 12345"
      }
    }
  }
  ```

### `POST /auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "dGhpcy1pcy1hLXJlZnJlc2g..."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "expiresIn": 3600
    }
  }
  ```

---

## 3. Deliveries Module

### `GET /deliveries`
- **Query Parameters**:
  - `page`: integer (default `1`)
  - `pageSize`: integer (default `10`)
  - `search`: string (tracking number, customer, recipient, address)
  - `status`: enum (`Pending`, `Assigned`, `Picked Up`, `In Transit`, `Delivered`, `Failed`, `Returned`, `Unassigned`)
  - `agentId`: string
  - `customerId`: string
  - `startDate`: ISO 8601 Date (`YYYY-MM-DD`)
  - `endDate`: ISO 8601 Date (`YYYY-MM-DD`)
- **Response** (200 OK): Paginated list of `Delivery` objects.

### `GET /deliveries/:id`
- **Response** (200 OK): Single `Delivery` object including `timeline` events.

### `POST /deliveries`
- **Request Body**:
  ```json
  {
    "customerName": "Ramesh Kumar",
    "customerId": "CUST-001",
    "customerPhone": "+91 98765 43210",
    "pickupAddress": "Indiranagar 100ft Rd, Bangalore",
    "deliveryAddress": "45, 2nd Cross, Koramangala, Bangalore",
    "city": "Bengaluru",
    "pincode": "560034",
    "packageType": "Electronics",
    "itemDescription": "Smartphone Box with Charger",
    "amount": 14999,
    "codAmount": 14999,
    "agentId": "AGENT-001",
    "paymentStatus": "pending",
    "notes": "Handle with care, call before delivery"
  }
  ```
- **Response** (201 Created): Newly created `Delivery`.

### `PATCH /deliveries/:id/status`
- **Request Body**:
  ```json
  {
    "status": "Delivered",
    "note": "Delivered to recipient. Cash of Rs 14999 collected.",
    "updatedBy": "AGENT-001"
  }
  ```
- **Response** (200 OK): Updated `Delivery`.
- **Side Effects**:
  - If `codAmount > 0` and status transitions to `Delivered`: auto-creates or marks `Collection` status as `Collected`.
  - Increments assigned Agent's `pendingCashAmount` (unsettled balance) and `completedDeliveriesCount`.

### `POST /deliveries/bulk-assign`
- **Request Body**:
  ```json
  {
    "deliveryIds": ["DEL-9001", "DEL-9002"],
    "agentId": "AGENT-002"
  }
  ```
- **Response** (200 OK): Array of updated `Delivery` records.

---

## 4. Customers Module

### `GET /customers`
- **Query Parameters**: `search`, `status` (`Active` | `Inactive`), `page`, `pageSize`
- **Response** (200 OK): Paginated list of `Customer` objects.

### `GET /customers/:id`
- **Response** (200 OK): Detailed `Customer` profile.

### `GET /customers/:id/deliveries`
- **Response** (200 OK): Array of deliveries for this customer.

### `POST /customers`
- **Request Body**:
  ```json
  {
    "name": "Ananya Sharma",
    "email": "ananya@example.com",
    "phone": "+91 98451 99887",
    "address": "Flat 302, Green Meadows, Whitefield",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560066",
    "status": "Active"
  }
  ```

### `PUT /customers/:id`
- **Request Body**: Partial customer profile update.

---

## 5. Delivery Agents Module

### `GET /agents`
- **Query Parameters**: `search`, `status` (`Active` | `On Delivery` | `Off Duty` | `Inactive`), `vehicleType` (`Bike` | `Scooter` | `Van` | `Truck`), `hubLocation`, `page`, `pageSize`
- **Response** (200 OK): Paginated list of `Agent` objects.

### `GET /agents/:id`
- **Response** (200 OK): Detailed `Agent` record with vehicle info and performance stats.

### `POST /agents`
- **Request Body**:
  ```json
  {
    "name": "Vikram Singh",
    "phone": "+91 99887 76655",
    "email": "vikram@deliverycrm.in",
    "vehicleType": "Bike",
    "vehicleNumber": "KA-01-EQ-9876",
    "hubLocation": "Indiranagar Hub",
    "status": "Active"
  }
  ```

---

## 6. Collections & Cashier Settlements

### `GET /collections`
- **Query Parameters**: `status` (`Pending` | `Collected` | `Settled`), `agentId`, `paymentMode` (`Cash` | `UPI` | `Card`), `startDate`, `endDate`, `search`, `page`, `pageSize`

### `GET /collections/summary`
- **Response** (200 OK):
  ```json
  {
    "totalPendingAmount": 42500,
    "totalCollectedAmount": 18200,
    "totalSettledAmount": 95400,
    "pendingCount": 12,
    "collectedCount": 8,
    "settledCount": 45
  }
  ```

### `POST /collections/settle`
- **Request Body**:
  ```json
  {
    "collectionIds": ["COL-101", "COL-102"],
    "settledBy": "Krishnan K. (Admin)",
    "notes": "EOD cashier reconciliation completed"
  }
  ```
- **Response** (200 OK): Array of settled `Collection` records.
- **Side Effects**: Moves amount from agent's `pendingCashAmount` to `settledCashAmount`.

---

## 7. Operational Reports & Analytics

- `GET /reports/delivery?startDate=...&endDate=...`: Returns delivery summary, completion rates, and status timeline chart data.
- `GET /reports/collection?startDate=...&endDate=...`: Returns COD collection breakdown by payment mode and hub.
- `GET /reports/agent?startDate=...&endDate=...`: Returns agent performance metrics (deliveries count, COD settled, rating).
- `GET /reports/customer?startDate=...&endDate=...`: Returns top spending customers and repeat order frequencies.
