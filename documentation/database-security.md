# Database Security

**Database:** Supabase (PostgreSQL)  
**Relevant files:** `app/api/place-order/route.ts`, `app/api/create-manager/route.ts`, `lib/supabaseClient.ts`

---

## 1. Client Setup

There are two Supabase clients in use:

### Anon client — `lib/supabaseClient.ts`
```ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```
Used by all client components (Navbar, CartDrawer, admin dashboard). Safe to ship in the browser. Respects RLS.

### Admin client — created inline in API routes
```ts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // ← NOT NEXT_PUBLIC_, server-side only
);
```
Used in `/api/place-order` and `/api/create-manager`. Bypasses RLS entirely. Never exposed to the browser.

---

## 2. Tables and Roles

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `orders` | INSERT only (via API route) | SELECT, UPDATE, DELETE | Full access (bypasses RLS) |
| `customers` | — | SELECT, INSERT, UPDATE, DELETE | Full access |
| `profiles` | — | SELECT, UPSERT, DELETE (own row) | Full access |
| `managers` | — | SELECT, UPDATE, DELETE | Full access |

---

## 3. Row Level Security — `orders` Table

RLS was enabled on the `orders` table in September 2026. All four policies plus explicit GRANTs are required.

### Enable RLS
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

### Table-level grants (required alongside policies)
```sql
GRANT INSERT ON orders TO anon;
GRANT INSERT ON orders TO authenticated;
GRANT SELECT, UPDATE, DELETE ON orders TO authenticated;
```

### Policies

```sql
-- Customers (anon + logged-in) can place orders
CREATE POLICY "anon_insert_orders"
ON orders FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "auth_insert_orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (true);

-- Only authenticated users (admins/managers) can read orders
CREATE POLICY "authenticated_select_orders"
ON orders FOR SELECT TO authenticated
USING (true);

-- Only authenticated users can update order status
CREATE POLICY "authenticated_update_orders"
ON orders FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

-- Only authenticated users can delete orders
CREATE POLICY "authenticated_delete_orders"
ON orders FOR DELETE TO authenticated
USING (true);
```

> **Note:** Despite the INSERT policies above, order inserts from the browser were moved to the `/api/place-order` server-side route (service role) because the anon INSERT RLS policy proved unreliable in practice. The policies remain as a defence-in-depth measure but the service role route is the actual insertion path.

---

## 4. Why Service Role for Inserts

The architectural decision to use a server-side API route with the service role key for order inserts was made after RLS anon INSERT policies consistently returned `42501` errors despite correct policy syntax and explicit GRANTs.

Benefits of the service role API route approach:
- `SUPABASE_SERVICE_ROLE_KEY` is never sent to the browser
- Server-side validation can run before the insert
- Order number generation happens atomically with the insert on the server
- No dependency on Supabase RLS anon INSERT behaviour
- Future server-side logic (fraud checks, rate limiting) can be added to the same route

---

## 5. Authentication Flow

The admin dashboard uses Supabase Auth. The anon client (`lib/supabaseClient.ts`) handles auth sessions — when a user signs in, the JWT is stored in the browser and automatically attached to all subsequent Supabase requests. This causes those requests to run as the `authenticated` PostgreSQL role rather than `anon`, enabling the SELECT/UPDATE/DELETE RLS policies.

```ts
// Admin dashboard checks auth on mount
const { data } = await supabase.auth.getUser();
if (!data.user) window.location.href = "/admin/login";
```

Managers are identified by querying the `managers` table or `profiles.role === "manager"`. Admins have `profiles.role === "admin"`.
