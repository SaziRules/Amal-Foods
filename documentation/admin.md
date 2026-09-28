# Admin Dashboard

**Files involved:**
- `app/admin/dashboard/page.tsx` — main admin UI
- `app/admin/login/page.tsx` — Supabase Auth sign-in
- `components/ManageOrdersModal.tsx` — full order management
- `components/CustomerAnalytics.tsx` — analytics charts
- `components/AddItemsModal.tsx` — add items to existing orders
- `components/CustomerDetailsModal.tsx.tsx` — customer order history
- `app/api/create-manager/route.ts` — create manager accounts

---

## 1. Authentication

The admin dashboard uses Supabase Auth. On mount it checks for a valid session:

```ts
const { data } = await supabase.auth.getUser();
if (!data.user) window.location.href = "/admin/login";
```

No session → immediate redirect to `/admin/login`. The Supabase Auth JWT is persisted in the browser and automatically attached to all subsequent requests, causing them to run as the `authenticated` PostgreSQL role (enabling SELECT/UPDATE/DELETE on the `orders` table via RLS).

### Role resolution

| Role | How determined |
|---|---|
| `admin` | `profiles.role === "admin"` |
| `manager` | `profiles.role === "manager"` OR row exists in `managers` table matching email |
| `customer` | default |

---

## 2. Dashboard Metrics

The admin dashboard calculates the following on load:

| Metric | Calculation |
|---|---|
| Total revenue | `orders.reduce((a, b) => a + b.total, 0)` |
| Paid orders | `orders.filter(o => o.payment_status === "paid")` |
| Unpaid orders | `orders.filter(o => o.payment_status === "unpaid")` |

Orders are fetched with `.order("created_at", { ascending: false })`. Branch managers see only their branch; the admin sees all branches.

---

## 3. Order Management (`ManageOrdersModal`)

Full-featured order table with:
- **Date filter:** today / week / month / last month / all
- **Payment filter:** all / paid / unpaid
- **Status filter:** all / pending / confirmed / ready / collected
- **Search:** by customer name, order number, phone
- **Inline status update** — dropdown per order row
- **Add items** — opens `AddItemsModal` which patches the `items` JSONB column
- **Delete** — soft confirmation before hard delete
- **Export PDF** — full order report via jsPDF
- **Export Excel** — via SheetJS (`xlsx`)

---

## 4. Manager Management

Admins can create, update, and delete branch managers from the dashboard.

### Creating a manager — `/api/create-manager`

Uses the service role admin client to:
1. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })` — creates the Supabase Auth account
2. `supabaseAdmin.from("managers").insert([{ name, email, password, branch, role: "manager" }])` — creates the managers table row

> Password is stored in the `managers` table in plain text alongside the Supabase Auth account. This is a known limitation — consider hashing in a future update.

### Updating / deleting managers

Done directly via the anon client from the authenticated admin session. The `managers` table has no RLS (anon SELECT is allowed for role resolution in the Navbar).

---

## 5. Customer Analytics (`CustomerAnalytics`)

Reads from the `orders` table (authenticated session) and renders:
- Orders over time (LineChart via Recharts)
- Revenue breakdown by branch (PieChart via Recharts)
- Top products by order frequency

---

## 6. Access Control Summary

| Page | Who can access |
|---|---|
| `/admin/login` | Anyone |
| `/admin/dashboard` | Authenticated Supabase users only |
| `/customer/dashboard` | Authenticated customers |
| All other pages | Public |

The Navbar resolves role server-side on mount and shows the appropriate dashboard link (admin vs. customer vs. none).
