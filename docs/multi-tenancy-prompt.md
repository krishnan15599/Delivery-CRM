# Prompt: Make Delivery CRM multi-company (multi-tenant) with teams

> **Status (2026-11-19):** Phase 0 is merged. Branch `feat/business-onboarding` implements
> **Phase 1, Phase 2, the Platform part of Phase 3, and the Platform page + business name of Phase 4**
> (migrations `04_multi_tenancy.sql` and `05_tenant_scoped_functions.sql`).
> Decisions that differ from the text below:
> - Existing data goes into **one** team ("Main Team", `TEAM-DEFAULT`), not one team per `hub_location`.
> - A delivery **follows its agent's team** when assigned (instead of "agent must already be in the delivery's team").
> - Every business has a **default team** (`teams.is_default`); new agents/deliveries/managers use it when no team is given.
> - Login returns the backend's own 24h token (`{ sub: profileId }`), because Supabase tokens expire after 1 hour.
>
> **Still to do:** Teams management (create teams, assign managers: API + Settings tab), team dropdowns
> and team columns/filters in the agent and delivery forms/lists, and removing the frontend's
> fake/mock fallbacks (services fall back to local mock data whenever a request fails).

> **How to use:** paste everything below the line into your AI coding assistant, opened in the `delivery-crm` repo.
> Then say "Do Phase 0". When it finishes and you have checked it, say "Do Phase 1", and so on.

---

## Who you are and how to work

You are working in the `delivery-crm` monorepo:

- `backend/`: Node + Express 5 (CommonJS) using `@supabase/supabase-js` v2 with the **service-role key**, so Row Level Security is bypassed and the backend code is the only thing protecting data. Tests are plain Node scripts in `backend/tests/` and run with `npm test`. Responses use `sendSuccess`/`sendError`; inputs are checked with `validateBody`; IDs come from `generateId`.
- `frontend/`: React + TypeScript + Vite + TanStack Query.
- The database is Supabase Postgres. The schema is in `backend/supabase/migrations/01_initial_schema.sql` and `02_delivery_functions.sql`, and the seed data is in `backend/supabase/seed.sql`.

Working rules:

1. **Do one phase per run.** At the end of each phase:
   - run `npm test` in `backend/` and the type check/build in `frontend/`
   - stop and give me a short summary covering: what changed, which SQL files I must run in Supabase and in what order, which commands to run, and anything you were unsure about.
   - Do not start the next phase until I say so.
2. Work on a new git branch for each phase (`feat/mt-phase-0`, `feat/mt-phase-1`, …). Do not push or merge.
3. Read the existing code before you change it, and keep its style.
4. Build exactly what this spec says. If the code conflicts with the spec in a way it did not anticipate, stop and ask me. Do not guess.
5. Never edit `.env`. Add any new variable to `.env.example`.

---

## Background

Today the app supports only one company. No table has a company column, so if two delivery companies used it, each would see the other's deliveries, agents, customers and cash collections.

The goal is a SaaS that many delivery companies can use, with every company's data fully isolated. Inside each company, work is split by **teams (hubs/zones)**.

This design copies established delivery-management products:
- **Onfleet:** Administrators see everything. Dispatchers see only the teams they are assigned to. Drivers belong to teams.
- **Tookan:** the Admin (business owner) has full access. Managers are assigned one or more teams and see only those teams' agents. Each agent belongs to one team.

---

## Final design (already decided, do not change it)

### Hierarchy

```
Platform owner (SuperAdmin)              manages companies only; no access to company data
└── Organization  (one per company)
    ├── Admins (1..many)                 see and manage everything in their company
    ├── Teams  (hubs/zones, e.g. "Chennai North Hub")
    │   ├── Managers (assigned to 1..many teams)   see only their teams
    │   └── Agents   (belong to exactly 1 team)    see only deliveries assigned to them
    └── Customers (shared across the whole company)
```

- Managers link to **teams** through a many-to-many table. **Do not** add a `manager_id` / "reports to" column anywhere.
- One login email belongs to one person in one company. `profiles.email` stays globally unique.
- `deliveries.tracking_number` stays globally unique.

### Permissions (enforced in the backend; the frontend only hides buttons)

| Action | Admin | Manager | Agent |
|---|---|---|---|
| View deliveries | All in company | Their teams | Only ones assigned to them |
| Create / edit / assign deliveries | Any team | Their teams | ✗ |
| Change delivery status | ✓ | Their teams | Own deliveries only, and only to `Picked Up`, `In Transit`, `Delivered`, `Failed` |
| Delete deliveries | ✓ | ✗ | ✗ |
| View / create / edit customers | ✓ | ✓ (whole company) | ✗ |
| Delete customers | ✓ | ✗ | ✗ |
| View agents | All in company | Their teams | Only themselves |
| Add / edit agents | Any team | Their teams only | ✗ (own availability status only) |
| Delete agents | ✓ | ✗ | ✗ |
| Add / edit Admins and Managers | ✓ | ✗ | ✗ |
| Teams: create, edit, assign managers | ✓ | View own | View own |
| Company settings | Edit | View | ✗ |

### Scope rules (apply to every endpoint)

- **`organization_id` always comes from the logged-in user (`req.user.organizationId`).** Never read it from the body, query string or URL. If any input contains `organizationId` or `organization_id`, the validator returns **400**.
- Anything outside the user's scope (another company, or another team for a Manager, or another agent's delivery for an Agent) returns **404 Not Found**, not 403. This stops people probing for IDs. Use 403 only when the user can see the record but their role cannot perform the action (e.g. a Manager deleting a customer).
- SuperAdmin has `organization_id = NULL` and gets **403** on every company-data route (`/customers`, `/deliveries`, `/agents`, `/profiles`, `/teams`, `/organization`). SuperAdmin uses only `/platform/*`.
- If the user is `Inactive` or their organization is `Suspended`, login returns 403 and any existing token returns 403.
- An Admin cannot delete, deactivate or demote the **last active Admin** of their company (409).
- Nobody can change their own role or status. A user's `organization_id` never changes through the API.
- SuperAdmin accounts are created only with SQL, never through the API.
- A Manager with zero teams sees no deliveries or agents. Handle this explicitly: don't pass an empty array to `.in()`, return an empty result instead.

---

## Phase 0: Close the login holes (do this first)

**Problems** in `backend/src/services/authService.js`:
1. **A wrong password still logs you in.** When Supabase `signInWithPassword` fails, the code looks up `profiles`/`agents` by email and issues a token **without checking the password**.
2. **Demo fallback:** any email containing "admin", "manager" or "agent" gets a token with any password, in every environment, including production.

The root cause is that users created through the API (`profileService.createProfile`, `agentService.createAgent`) never get a Supabase Auth account, so this fallback was the only way they could log in.

**Do:**
1. Create the migration `backend/supabase/migrations/03_auth_user_link.sql`: add `auth_user_id UUID UNIQUE` (nullable) to `profiles`.
2. Login uses **only** Supabase `signInWithPassword`.
   - On failure, return 401 "Invalid email or password". Return 503 only for real network errors.
   - Delete the passwordless lookup and the demo fallback entirely.
   - After a successful login, load the profile with `auth_user_id = <auth user id>`.
3. In `middlewares/auth.js`, the Supabase-token branch also looks up the profile by `auth_user_id`.
4. Creating a login (in `createProfile`, and in `createAgent` when it creates a profile):
   - Call `supabase.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true })` first.
   - `temporaryPassword` is a new required input field, minimum 8 characters.
   - Save the returned id in `auth_user_id`.
   - If the profile insert fails, call `supabase.auth.admin.deleteUser` so nothing is left half-created.
   - Deleting a profile also deletes its auth user.
5. Add the script `backend/scripts/sync-auth-users.js` and the npm script `sync-auth-users`. For every profile with a null `auth_user_id`:
   - If an auth user with that email already exists, link it.
   - Otherwise, create one. With `--demo`, use the password from env `DEMO_USER_PASSWORD`. Without it, generate a random 12-character temporary password and print an `email | temp password` table once.
   - The script must be safe to run twice.
6. Frontend:
   - In `frontend/src/context/AuthContext.tsx`, remove the default `role = user?.role || 'Admin'`. No user means not logged in.
   - Show `switchRole` and the "switch to Admin" button in `ProtectedRoute.tsx` only when `import.meta.env.DEV` is true.
   - If the login page has demo quick-login buttons, show them only in dev, and have them fill in the email only.
7. Tests: a wrong password returns 401, and `someone-admin@x.com` with any password returns 401. With the DB offline, 503 is also acceptable.
8. In your summary, warn me: **before deploying, run migration 03 and then `npm run sync-auth-users` against Supabase, or existing users can't log in.**

---

## Phase 1: Database for companies and teams

Create `backend/supabase/migrations/04_multi_tenancy.sql`.

**Before writing the file:**
- Check the Postgres version with `SHOW server_version;`. The `ON DELETE SET NULL (column)` syntax below needs **Postgres 15 or newer**. If the version is lower, stop and tell me.
- Wrap the whole file in `BEGIN; … COMMIT;` and make it safe to run twice (`IF NOT EXISTS`, plus `DO` blocks that check `pg_constraint` before adding constraints).
- The existing single-column foreign keys must be **dropped** before the composite ones are added. Look up their real names in `pg_constraint`; don't guess them.

### New tables

```sql
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,                  -- short uppercase code, e.g. 'QKART'
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,       -- company settings page fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  hub_address TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, id)                        -- target for composite foreign keys
);

-- created AFTER profiles gets UNIQUE (organization_id, id)
CREATE TABLE IF NOT EXISTS team_managers (
  organization_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, manager_id),
  FOREIGN KEY (organization_id, team_id)    REFERENCES teams    (organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, manager_id) REFERENCES profiles (organization_id, id) ON DELETE CASCADE
);
```

### Changes to existing tables

Composite foreign keys `(organization_id, x_id)` are the database-level guarantee that a row in one company can never point at a row in another company.

| Table | Changes |
|---|---|
| `profiles` | `organization_id TEXT NULL REFERENCES organizations(id) ON DELETE CASCADE`; `status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive'))`; replace role check with `role IN ('SuperAdmin','Admin','Manager','Agent')`; `CHECK ((role = 'SuperAdmin') = (organization_id IS NULL))`; `UNIQUE (organization_id, id)` |
| `agents` | `organization_id NOT NULL`; `team_id NOT NULL`; FK `(organization_id, team_id) → teams(organization_id, id) ON DELETE RESTRICT`; FK `(organization_id, user_id) → profiles(organization_id, id) ON DELETE SET NULL (user_id)`; `UNIQUE (organization_id, id)`. Keep the `hub_location` column but stop writing to it (team replaces it). |
| `customers` | `organization_id NOT NULL`; `UNIQUE (organization_id, id)` |
| `deliveries` | `organization_id NOT NULL`; `team_id NOT NULL`; `created_by TEXT`; FK `(organization_id, team_id) → teams ON DELETE RESTRICT`; FK `(organization_id, agent_id) → agents(organization_id, id) ON DELETE SET NULL (agent_id)`; FK `(organization_id, customer_id) → customers(organization_id, id) ON DELETE SET NULL (customer_id)`; FK `(organization_id, created_by) → profiles(organization_id, id) ON DELETE SET NULL (created_by)`; `UNIQUE (organization_id, id)` |
| `collections` | `organization_id NOT NULL`; `team_id`; FK `(organization_id, delivery_id) → deliveries(organization_id, id) ON DELETE CASCADE`; FK `(organization_id, agent_id) → agents ON DELETE SET NULL (agent_id)`; FK `(organization_id, team_id) → teams ON DELETE RESTRICT` |
| `conversations` | `organization_id NOT NULL`; `UNIQUE (organization_id, id)` |
| `chat_messages` | `organization_id NOT NULL`; FK `(organization_id, conversation_id) → conversations(organization_id, id) ON DELETE CASCADE`; allow `'manager'` in `sender_role` |

### Order inside the migration

1. Create `organizations` and `teams`.
2. Insert the default company: `id 'ORG-DEFAULT', code 'DEFAULT', name 'Default Company'` (ON CONFLICT DO NOTHING).
3. Create one team in ORG-DEFAULT for each distinct non-empty `agents.hub_location`, plus a team named `Main Team`.
4. Add every new column as **nullable**.
5. Backfill existing rows:
   - All `profiles`, `customers`, `conversations` and `chat_messages` → ORG-DEFAULT.
   - `agents` → ORG-DEFAULT, in the team that matches their `hub_location`, otherwise `Main Team`.
   - `deliveries` → ORG-DEFAULT, in the team of their agent, otherwise `Main Team`.
   - `collections` → copy `organization_id` and `team_id` from their delivery.
6. `SET NOT NULL` where the table above requires it.
7. Drop the old single-column foreign keys, add the `UNIQUE (organization_id, id)` constraints, then add the composite foreign keys and the new checks.
8. Create `team_managers`. Assign **every existing Manager to every team** in ORG-DEFAULT, so today's managers keep seeing what they see now.
9. Indexes:
   - `deliveries (organization_id, status)`, `(organization_id, team_id)`, `(organization_id, date DESC)`, `(organization_id, agent_id)`
   - `agents (organization_id, team_id)`
   - `customers (organization_id, phone)`
   - `profiles (organization_id, role)`
   - `collections (organization_id, status)`
   - `team_managers (manager_id)`
10. `ENABLE ROW LEVEL SECURITY` on the 3 new tables, with no public policies (the same as the other tables).
11. Add a SQL comment explaining how to create a SuperAdmin manually: insert a profile with `role 'SuperAdmin'` and `organization_id NULL`, then run `npm run sync-auth-users`.

### Seed data (`seed.sql`, for a fresh dev database)

The seed must work after running migrations 01 → 05 on an empty database, and it should set up two **fictional** companies:

- **Company 1** = `ORG-DEFAULT`, renamed to "QuickKart Logistics" (code `QKART`). The existing demo rows (USR-001…, CUST-…, AG-…, DEL-…) belong here.
  - 2 Admins (the existing `admin@deliverycrm.in` plus one more)
  - Teams "North Hub" and "South Hub"
  - One Manager per team (the existing `manager@deliverycrm.in` → North Hub)
  - 2 agents per team (the existing `agent@deliverycrm.in` is one of them)
  - Deliveries spread across both teams
- **Company 2** = `ORG-TRENDW`, "TrendWear" (code `TRENDW`).
  - 1 Admin, team "Central Hub", 1 Manager, 2 agents
  - 2 customers and 3 deliveries
- 1 SuperAdmin: `platform@deliverycrm.in`.
- Use `.test` email domains for every new user. After seeding, run `npm run sync-auth-users -- --demo`.

---

## Phase 2: Backend isolation (the most important phase)

### 2a. Load tenant context on every request (`middlewares/auth.js`)

After verifying the token, **reload the user from the database on every request**. Don't trust role or organization claims from the token, so role changes and deactivations take effect immediately. Build:

```js
req.user = {
  id, name, email, role, status,
  organizationId,                       // null for SuperAdmin
  organization: { id, name, code, status } | null,
  teamIds: [],                          // Manager: from team_managers; Agent: [agent.team_id]; Admin: [] (Admin sees all)
  agentId: null,                        // Agent only: agents.id where user_id = profile id
};
```

- Return 403 if the profile is `Inactive` or the organization is `Suspended`.
- Tests run with no database configured. In that case only, use the payload of a backend-signed test JWT as `req.user`; the test tokens must include `organizationId`, `teamIds` and `agentId`.
- Add `requireOrgUser` (any role except SuperAdmin) to every company-data router in `routes/index.js`, and add `requireSuperAdmin` for `/platform`.

### 2b. Permission helpers: `backend/src/utils/access.js`

Keep the logic in **pure functions** (no database calls) so it can be unit-tested:

- `isSuperAdmin/isAdmin/isManager/isAgent(user)`
- `deliveryScope(user)` returns `{ organizationId, teamIds | null, agentId | null }`:
  - Admin: `teamIds` null (all teams)
  - Manager: their `teamIds`
  - Agent: their `agentId`
- `applyDeliveryScope(query, user)` adds `.eq('organization_id', …)`, plus `.in('team_id', …)` or `.eq('agent_id', …)` depending on the role.
- `applyAgentScope(query, user)`: Admin sees all agents in the company, a Manager sees agents in their teams, and an Agent sees only themselves.
- `canAccessTeam(user, teamId)`
- `canCreateRole(actor, targetRole)`: an Admin can create Admin, Manager and Agent; a Manager can create Agent only; everyone else nothing. SuperAdmin can never be created through this.
- `canAgentSetStatus(status)`: only `Picked Up`, `In Transit`, `Delivered`, `Failed`.

### 2c. Scope every query in the services

- Change service signatures to take the user first (e.g. `listDeliveries(user, filters)`), and have the controllers pass `req.user`.
- **Every** `.from(...)` read in `customerService`, `agentService`, `deliveryService` and `profileService` must be scoped. That includes counts, search, `getDeliveryByTrackingNumber` and `getCustomerDeliveries`.
- For update and delete, first fetch the row **with scope**. If it isn't found, return 404. Only then update or delete it, again with `.eq('organization_id', …)`.
- For insert, set `organization_id` from `req.user`.
- Rules per resource:
  - **Customers:** whole company, for Admin and Manager. An Agent gets 403.
  - **Profiles:**
    - Admin: everyone in the company.
    - Manager: themselves plus the Agents in their teams.
    - Agent: only themselves.
  - **Creating a delivery:**
    - `teamId` is required. If a Manager has exactly one team and leaves it out, default to that team. A Manager can only use their own teams.
    - `agentId`, if given, must be in that team.
    - `customerId` must belong to the same company; return a clear 400 if it doesn't.
  - **Agents changing status:** an Agent can change only their own deliveries, and only to the statuses allowed by `canAgentSetStatus`. On `PATCH /agents/:id/status`, an Agent can change only their own status.
- Validators:
  - Reject `organizationId` and `organization_id`.
  - Add `teamId` to the create/update validators for agents and deliveries.

### 2d. Company-scoped SQL functions: `backend/supabase/migrations/05_tenant_scoped_functions.sql`

- **`DROP FUNCTION` the 4 old signatures first.** `CREATE OR REPLACE` with new arguments would create a second version alongside the old one, and the old, unscoped one would still be callable.
- New signatures, each taking `p_organization_id TEXT` as the first argument:
  - `create_delivery(p_organization_id, p_delivery JSONB, p_user_id TEXT, p_user_name TEXT)`
  - `update_delivery_status(p_organization_id, p_delivery_id, p_new_status, p_note, p_updated_by)`
  - `bulk_assign_deliveries(p_organization_id, p_delivery_ids TEXT[], p_agent_id, p_updated_by)`
  - `reassign_delivery_agent(p_organization_id, p_delivery_id, p_new_agent_id, p_updated_by)`
- Inside them, every SELECT and UPDATE on `agents`, `deliveries`, `collections` and `customers` gets `AND organization_id = p_organization_id`. A row in another company counts as "not found" and raises the same error as a missing row.
- The agent must belong to the delivery's team:
  - `create_delivery` and `reassign_delivery_agent`: raise an error with code `22023`.
  - `bulk_assign_deliveries`: skip any delivery from another team or company, and return its ID in a `skippedIds` array.
- `create_delivery` writes `organization_id`, `team_id` and `created_by`. The collection row it creates copies `organization_id` and `team_id`.
- Keep every existing status-transition rule and counter update **exactly** as it is.
- Repeat the REVOKE/GRANT block for the new signatures.
- On the backend side:
  - Pass `req.user.organizationId` to these functions.
  - Before calling them, load the delivery with scope first (404 if it isn't visible).
  - For bulk-assign, a Manager may only target an agent in their own teams.

### 2e. Tests

- New `backend/tests/access.test.js` (add it to the `npm test` script), testing the pure helpers:
  - An Admin of company A can see company A deliveries in any team, and cannot see company B.
  - A Manager with teams `[T1]` can see T1, cannot see T2 in the same company, and cannot see company B.
  - A Manager with `[]` teams sees nothing.
  - An Agent can see their own delivery but not another agent's delivery in the same team.
  - A SuperAdmin cannot see any company data.
  - `canCreateRole`: Manager → Agent is allowed. Manager → Admin, Manager → Manager, and anyone → SuperAdmin are all rejected.
- Update `crud.test.js`:
  - Test tokens include `organizationId`, `teamIds` and `agentId`.
  - A SuperAdmin token on `/api/customers` returns 403.
  - A body containing `organizationId` returns 400.

---

## Phase 3: New backend APIs

- **Company:**
  - `GET /api/organization`: any company user; returns the current company.
  - `PUT /api/organization`: Admin only; can update `name` and `settings`, but not `code` or `status`.
- **Teams:**
  - `GET /api/teams`: Admin sees all teams, Manager and Agent see their own. Each team includes `managers: [{id, name}]` and `agentCount`.
  - `POST /api/teams`, `PUT /api/teams/:id`: Admin only.
  - `DELETE /api/teams/:id`: Admin only. Return 409 if the team still has agents or deliveries, with a message telling the user to set it Inactive instead.
  - `PUT /api/teams/:id/managers` with body `{ managerIds: [] }`: Admin only; replaces the team's manager list. Each ID must be an active Manager in the same company.
- **Users** (`/api/profiles`):
  - Creating a user requires `role` and `temporaryPassword`, and checks `canCreateRole`.
    - Agent: also requires `teamId` plus the vehicle fields. Create the agent row in the same request.
    - Manager: optional `teamIds`.
  - `POST /api/agents` and creating a profile with role Agent must use **one shared internal function**, so there is only one way to create an agent login.
  - Updating:
    - An Admin can edit name, phone, role (never to SuperAdmin, never their own), status, and team assignments.
    - A Manager can edit Agents in their own teams: name, phone, vehicle, status, and move them between their own teams.
  - Add the last-Admin guard (409).
  - Deleting is Admin-only and also deletes the auth user. Suggest deactivating instead when the user has delivery history.
- **Platform** (SuperAdmin only), `/api/platform/organizations`:
  - `GET`: list of companies with user and delivery counts.
  - `POST {name, code, admin: {name, email, temporaryPassword}}`: creates the company, a `Main Team`, and the first Admin. This is all-or-nothing: if any step fails, undo the earlier steps, including the auth user.
  - `PATCH /:id {status}`: set `Active` or `Suspended`.
- `GET /api/auth/me` returns the full `req.user` shape from 2a.
- Update the endpoint list in `routes/index.js`.

---

## Phase 4: Frontend

- `types/auth.ts`:
  - Add `'SuperAdmin'` to `UserRole`.
  - Add `organization`, `teamIds`, `agentId` and `status` to `User`.
- SuperAdmin logs in to a single **Platform** page with these features:
  - list companies
  - create a company together with its first admin
  - suspend or activate a company

  A SuperAdmin cannot see any other page.
- Update the role maps in `App.tsx`, `Sidebar.tsx` and `AuthContext.tsx` (`ROLE_ROUTE_PERMISSIONS`, `getDefaultRouteForRole`) for SuperAdmin.
- Header: show the company name next to the user's name.
- Settings:
  - **Company tab:** load and save through `GET`/`PUT /api/organization`, replacing the hardcoded "Express Logistics CRM India Pvt Ltd".
  - **New Teams tab** (Admin only): list, create, edit and deactivate teams, and assign managers with a multi-select of the company's Managers.
  - **Users/Roles tab:** create users with a role (an Admin can pick Admin, Manager or Agent; a Manager only Agent), a temporary password, and team(s).
- Agent form: replace the free-text hub location with a **Team dropdown** (a Manager sees only their teams).
- Delivery create form:
  - Add a **Team dropdown**. If the user has exactly one team, auto-select it and hide the dropdown.
  - The agent dropdown shows only agents in the selected team.
- Lists:
  - Show a Team column on deliveries and agents.
  - Add a team filter for Admins, and for Managers with more than one team.
- Errors:
  - A 404 from the API shows "Not found".
  - A 403 because the company is suspended or the user is inactive logs the user out with that message.
- Follow the existing TanStack Query hooks pattern, and invalidate the affected queries after each mutation.
- **Never rely on the frontend for security.** The backend already enforces all of the above.

---

## Phase 5: Final check, against real Supabase with the seed data

Run each check and report pass or fail:

1. Logged in as the QuickKart Admin, every list shows only QuickKart data. Opening a TrendWear delivery, agent or customer ID directly returns **404**.
2. `POST /api/deliveries` with `organizationId` set to TrendWear in the body returns **400**.
3. The QuickKart North Manager sees only North Hub deliveries and agents. Assigning a South Hub agent fails, and opening a South Hub delivery returns 404.
4. Bulk-assigning a mix of QuickKart and TrendWear delivery IDs updates only the QuickKart ones, returns the others in `skippedIds`, and leaves the TrendWear rows unchanged.
5. A QuickKart Agent sees only their own deliveries, can mark them Picked Up → In Transit → Delivered, and cannot change another agent's delivery.
6. A wrong password returns 401, and `anything-admin@x.com` returns 401.
7. Suspending TrendWear on the Platform page: login returns 403, and an already logged-in TrendWear user gets 403 on their next request.
8. Deactivating a user: their next request returns 403.
9. Removing or demoting the last QuickKart Admin returns 409.
10. A SuperAdmin gets 403 on `/api/deliveries`.
11. Delivery counters, COD collections and status transitions still work exactly as before.

---

## Out of scope (do not build)

- Supabase RLS policies for direct browser-to-database access. The backend with the service-role key stays the only path to the data.
- One person belonging to several companies.
- Billing, plans or usage limits.
- Custom roles or a permission editor.
- A subdomain per company.
- A chat backend. Only the chat table columns change.
