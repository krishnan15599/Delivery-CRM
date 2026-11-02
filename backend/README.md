# Delivery CRM Backend API (v2.0)

Production-ready Node.js & Express REST API for the Delivery CRM platform backed by Supabase PostgreSQL.

---

## 📁 Directory Structure

```
backend/
├── src/
│   ├── app.js               # Express application initialization & middleware setup (no listen)
│   ├── server.js            # Starts HTTP server on PORT
│   ├── config/
│   │   ├── env.js           # Centralized environment variable loader (requires JWT_SECRET)
│   │   └── supabase.js      # Supabase client using Service-Role Key (RLS bypass)
│   ├── controllers/         # Thin HTTP request / response handlers
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── profileController.js
│   │   ├── agentController.js
│   │   └── deliveryController.js
│   ├── services/            # Core business logic, atomic transitions & counter calculations
│   │   ├── authService.js
│   │   ├── customerService.js
│   │   ├── profileService.js
│   │   ├── agentService.js
│   │   └── deliveryService.js
│   ├── validators/          # Input validation schemas & camelCase mapping
│   │   ├── authValidator.js
│   │   ├── customerValidator.js
│   │   ├── profileValidator.js
│   │   ├── agentValidator.js
│   │   └── deliveryValidator.js
│   ├── middlewares/
│   │   ├── auth.js          # JWT authentication & role-based authorization
│   │   ├── ensureDb.js      # Database availability guard
│   │   ├── errorHandler.js  # Centralized global error handling (hides DB internals)
│   │   ├── logger.js        # Request logger with status and duration
│   │   └── validate.js      # Validation middleware factory
│   ├── routes/              # Modular Express routers mounted under /api
│   │   ├── authRoutes.js    # /api/auth (login, me)
│   │   ├── customerRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── agentRoutes.js
│   │   ├── deliveryRoutes.js
│   │   └── index.js
│   └── utils/
│       ├── apiResponse.js   # Standardized JSON response envelope
│       ├── idGenerator.js   # Collision-resistant ID & tracking number generators
│       ├── pagination.js    # PostgREST pagination helper
│       └── sanitize.js      # Search input & date sanitizer
├── supabase/
│   ├── migrations/
│   │   ├── 01_initial_schema.sql      # Tables, constraints, RLS policies
│   │   └── 02_delivery_functions.sql  # Atomic SQL functions for transitions & bulk assign
│   └── seed.sql             # Standardized seed data with ISO-8601 timestamps
├── tests/
│   ├── crud.test.js         # Integration test suite for all endpoints
│   └── delivery.test.js     # Unit test suite for business rules & collision resistance
├── .env                     # Local environment configuration
└── package.json
```

---

## 🔒 Security & Architecture Improvements

1. **Authentication & Authorization**:
   - Protected API routes now require a valid `Bearer <token>` in the `Authorization` header.
   - Endpoint `POST /api/auth/login` verifies user and returns a signed HS256 JWT.
   - Endpoint `GET /api/profiles/me` dynamically identifies the user from the verified token without fallback to hardcoded admin.
   - Default role for new profiles is set to the lowest privilege (`Agent`).
   - Database RLS enabled on all tables; anon key direct access is blocked. The backend connects securely using `SUPABASE_SERVICE_ROLE_KEY`.

2. **Collision-Resistant ID Generation**:
   - Upgraded from 4-digit random numbers (`1000–9999`) to high-entropy identifiers combining base-36 timestamps and crypto random bytes.
   - Sequences defined in PostgreSQL migrations (`seq_customer_id`, `seq_delivery_id`, etc.).
   - Standard RFC-4122 v4 UUIDs generated via `crypto.randomUUID()`.

3. **Atomic Delivery Transitions & Counters**:
   - Status updates are managed atomically via PostgreSQL function `update_delivery_status` and transactional services.
   - Idempotent: Transitioning an already `Delivered` delivery to `Delivered` does not double-count agent earnings or customer spend.
   - Disallowed status transitions are blocked with clear validation error messages.
   - Bulk assignment excludes terminal deliveries (`Delivered`, `Returned`), decrements previous agents' counts, appends timeline records, and updates associated COD collection records.
   - Agent counters are only incremented after delivery record insertion succeeds.

4. **Bug Fixes**:
   - **Search Sanitization**: Characters like `,`, `(`, and `)` are stripped to prevent PostgREST syntax errors and filter injections.
   - **Numeric Input Crash**: Numeric fields like `pincode: 560038` are safely converted to string without throwing `TypeError`.
   - **Health Check**: Properly inspects Supabase error objects instead of expecting thrown errors.
   - **Agent Status 404**: Missing agent IDs return `404 Not Found` instead of false `400 Bad Request`.
   - **Date Range Filters**: `endDate` query parameter includes the full 24 hours of the selected day.
   - **Timestamps**: All timeline timestamps stored in UTC ISO-8601 strings.
   - **Payment Status**: Standardized on capitalised `Paid`, `Pending`, `Failed`.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret-key-2026
```

### 3. Apply Supabase Database Migrations
Run these in the [Supabase SQL Editor](https://app.supabase.com) in order:
1. `supabase/migrations/01_initial_schema.sql` (Creates/updates tables, normalizes payment statuses, sets Agent default role, and secures RLS)
2. `supabase/migrations/02_delivery_functions.sql` (Installs atomic functions `create_delivery`, `update_delivery_status`, `bulk_assign_deliveries` and locks them to `service_role`)
3. *(Optional)* `supabase/seed.sql` (Seeds demo data with normalized casing and ISO timestamps)

### 4. Run Development Server
```bash
npm run dev
```

### 5. Run Automated Test Suites
```bash
npm test
```

---

## 🌐 Production & Render Deployment

When deploying to Render:
1. **Build Command**: `npm install`
2. **Start Command**: `npm start` *(Must be updated from legacy `node index.js`)*
3. **Environment Variables**:
   - `PORT`: `5000` (or Render default)
   - `SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your secret key from Supabase **Project Settings → API Keys** *(Do not use the anon key)*
   - `JWT_SECRET`: A secure, secret string for signing JWT tokens *(The server will refuse to start if this is missing)*
