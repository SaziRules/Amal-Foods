# Email Campaigns

**Files involved:**
- `app/admin/campaigns/page.tsx` — campaigns UI (composer, preview, audience, history table, report modal)
- `app/api/admin/campaigns/send/route.ts` — validates daily limit, sends via Brevo, records daily count and per-campaign history
- `app/api/admin/customers/route.ts` — returns all customer records (bypasses RLS via service role)
- `lib/brevo.ts` — Brevo transactional email helper
- `lib/emailTemplates.ts` — HTML email template builders (3 templates)
- `lib/supabaseAdmin.ts` — service role Supabase client (server-side only)
- `supabase/migrations/20261113000000_campaigns_history.sql` — `campaigns` table + RLS policies

---

## 1. Overview

The Campaigns page (`/admin/campaigns`) allows the admin to compose, preview, and send bulk HTML email campaigns to customers. Campaigns are sent via Brevo's transactional SMTP API, limited to **100 emails per day** to preserve 200 of Brevo's 300 free daily sends for order invoice emails.

Every send persists a per-campaign record to the `campaigns` table so the page can render a history list, status chips, delivery stats, and a per-row Report modal. The daily throttle counter (`campaign_sends`) is maintained separately — see §5 and §6.

---

## 2. Email Templates (`lib/emailTemplates.ts`)

Three templates are available, each returning a full standalone HTML email string:

| Key | Function | Style | Hero image |
|---|---|---|---|
| `promotional` | `buildPromo()` | Dark (`#0a0a0a`), Montserrat | `P64A3074.jpg` |
| `newsletter` | `buildNewsletter()` | Warm cream (`#F7F3EE`), Roboto Condensed | `P64A3180.jpg` |
| `announcement` | `buildAnnouncement()` | Near-black (`#080808`), Montserrat | `P64A3148.jpg` |

All three share:
- Logo: `logo-dark.png` at 44px height
- CTA: links to `https://www.amalfoods.co.za/`
- Footer: 5 gallery thumbnail images in a flush strip
- No `border-radius` on any element
- No em dashes

**Selector:**
```ts
export function buildEmailHTML(template: string, subject: string, body: string, baseUrl: string): string
```

`baseUrl` is set client-side via `window.location.origin` so image `src` attributes resolve correctly inside the live preview iframe.

### Live preview

The composer opens a full-screen overlay split into two panels:
- **Left (55%)** — iframe that renders the live HTML email. Content is written via `document.open/write/close` (more reliable than `srcDoc`). Auto-resizes to match email body height.
- **Right** — form: campaign name, subject, preview text, template selector, audience, body, delivery mode.

A device toggle switches the iframe wrapper between 600px (desktop) and 390px (mobile) widths.

---

## 3. Audience Segments

Segments are computed at runtime from two Supabase queries made on page load:

| Source | Query |
|---|---|
| `customers` | Fetched via `/api/admin/customers` (service role, bypasses RLS) — provides total customer count |
| `orders` | Fetched via anon client — provides `cell_number`, `region`, `payment_status`, `created_at` |

Segments are derived by grouping orders by `cell_number` (unique customer proxy):

| Segment | Logic |
|---|---|
| All Customers | Count of unique phone numbers across all orders |
| KZN | Phones with at least one order where `region` includes `kzn`, `kwazulu`, or `durban` |
| Cape Town | Phones with at least one order where `region` includes `cape` |
| Johannesburg | Phones with at least one order where `region` includes `johannesburg`, `jhb`, or `joburg` |
| Inactive (60d+) | Phones whose most recent order is older than 60 days |
| Paid Customers | Phones with at least one `payment_status = "paid"` order |
| Unpaid / Outstanding | Phones with at least one order where `payment_status ≠ "paid"` |

> **Known limitation:** Regional segments reflect order data only. Customers are not directly linked to orders by a foreign key — `cell_number` is used as a proxy. Actual email delivery uses customer emails from the `customers` table (all customers for any segment).

### CSV upload

An alternative to database segments. The user uploads a `.csv` file; it is parsed entirely client-side:

1. Auto-detects a header row by checking for the word `email`
2. Locates the `email` column index; optionally picks up a `name` column
3. Validates each entry with a regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
4. Stores the parsed list in `csvEmails` state

When a CSV is loaded, the segment pills are dimmed and disabled. The CSV list takes full precedence as the recipient source. Clearing the CSV restores segment selection.

---

## 4. Sending — `/api/admin/campaigns/send`

```
POST /api/admin/campaigns/send
Content-Type: application/json
```

**Body:**

| Field | Type | Notes |
|---|---|---|
| `campaignName` | string | Used as `campaigns.name`; falls back to `subject` if empty |
| `subject` | string | Email subject line |
| `htmlContent` | string | Full rendered HTML from `buildEmailHTML()` |
| `recipients` | `{email, name}[]` | From CSV or fetched from `/api/admin/customers` |
| `segment` | string? | Optional. Segment key (`all`, `kzn`, `cpt`, `jhb`, `inactive`, `paid`, `unpaid`) — persisted to `campaigns.segment` |
| `audience` | string? | Optional. Human-readable label (e.g. `"All Customers"`) — persisted to `campaigns.audience` |

**Flow:**

1. Reads today's send count from `campaign_sends` (Supabase table, keyed by date)
2. If `count >= 100` → returns `429` with a clear message
3. Slices `recipients` to the remaining daily allowance
4. Sends in parallel batches of 10 via `lib/brevo.ts`
5. Upserts the updated count back to `campaign_sends`
6. Inserts a row into `campaigns` (status `sent` if any succeeded, `failed` if none). Insert runs unconditionally — a fully-failed send still produces a history row. See §6.

**Response:**

```json
{
  "sent": 87,
  "failed": 0,
  "wasCapped": false,
  "cappedAt": 100,
  "remaining": 13,
  "errors": [],
  "historyError": null
}
```

`historyError` is `null` on success. If the `campaigns` insert itself fails, the message surfaces here (and in the server console as `campaigns insert failed: ...`). The HTTP status stays `200` because the Brevo send already succeeded — the admin UI surfaces `historyError` in the completion alert so the operator notices.

`maxDuration = 60` is set on the route to accommodate up to 100 sequential-batch sends within Vercel's serverless timeout.

---

## 5. Daily Send Limit

**Campaign limit:** 100 emails/day  
**Reason:** Brevo free tier allows 300 emails/day. 200 are reserved for order invoice sends (`/api/send-invoice`). Invoice sends are not tracked in `campaign_sends` — the two pools are independent.

### Supabase table required

```sql
create table campaign_sends (
  date  date primary key,
  count int4 not null default 0
);
```

The send route upserts into this table on every successful send using `onConflict: "date"`. If the table does not exist, the route will error — it is a hard dependency.

---

## 6. Campaign History (`campaigns` table)

Separate from `campaign_sends` (which is a daily throttle counter — one row per date), `campaigns` stores one row per send and powers the entire history list, stats tiles, status filters, and Report modal on `/admin/campaigns`.

### Schema

Migration: `supabase/migrations/20261113000000_campaigns_history.sql`.

```sql
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subject       text not null,
  audience      text,
  segment       text,
  status        text not null default 'sent',   -- 'sent' | 'failed' (draft/scheduled reserved for future)
  recipients    integer not null default 0,     -- length of the request payload
  sent_count    integer not null default 0,     -- Brevo successes
  failed_count  integer not null default 0,     -- Brevo failures
  open_rate     numeric not null default 0,     -- always 0 until Brevo webhooks are wired up
  click_rate    numeric not null default 0,     -- "
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);
```

RLS: `SELECT` and `DELETE` granted to `authenticated`. Inserts happen server-side via `supabaseAdmin` (service role, bypasses RLS).

### Fetching

`loadCampaigns()` in `app/admin/campaigns/page.tsx` runs on page mount (in parallel with the customers + orders fetches) and again after every successful send:

```ts
supabase.from("campaigns").select("*").order("created_at", { ascending: false })
```

Snake-case DB columns are mapped to the camelCase shape the table/cards expect (`open_rate` → `openRate`, `sent_at` → `sentAt`, etc.).

### Report modal

The `⋯` row menu "View Report" (desktop) and the mobile "Report" link both call `setReportTarget(c)`, which opens a modal showing:

- Campaign name + subject
- Sent date/time (SAST, long format) and status chip
- Audience label and total recipient count
- **Delivery** stat cards — Delivered (`sent_count`) and Failed (`failed_count`)
- **Engagement** — if both `openRate` and `clickRate` are `0`, a dashed placeholder reads *"No engagement data yet — Brevo webhooks not wired up."* Otherwise two `MiniBar` rows render the percentages.

Dismissed via backdrop click, Close button, or `X`.

### Delete

The delete-confirm modal's Delete button optimistically removes the row from UI state and issues a `supabase.from("campaigns").delete().eq("id", id)`. Row disappearance is permanent.

### Backfilling historical sends

`campaign_sends` only stores a daily total, so true per-campaign history for pre-migration sends isn't recoverable. A one-time SQL seeds placeholder rows (one per past date) so the history list isn't empty after the migration lands:

```sql
INSERT INTO public.campaigns
  (name, subject, audience, status, recipients, sent_count, failed_count, sent_at)
SELECT
  'Campaign · ' || to_char(date, 'DD Mon YYYY'),
  'Daily send (' || to_char(date, 'DD Mon') || ')',
  'All Customers',
  'sent',
  count,
  count,
  0,
  (date::timestamp + interval '12 hours') AT TIME ZONE 'Africa/Johannesburg'
FROM public.campaign_sends
WHERE NOT EXISTS (
  SELECT 1 FROM public.campaigns c
  WHERE c.sent_at::date = campaign_sends.date
    AND c.name LIKE 'Campaign · %'
);
```

Idempotent — safe to re-run.

---

## 7. Brevo Integration (`lib/brevo.ts`)

```ts
sender:  { name: "Amal Foods", email: "admin@amalfoods.co.za" }
replyTo: { email: "orders@amalfoods.co.za" }
```

No SDK — direct `fetch` to `https://api.brevo.com/v3/smtp/email`. Same pattern as `/api/send-invoice`. Required headers: `accept`, `content-type`, `api-key`.

Unlike invoice emails, campaign sends do **not** CC `orders@amalfoods.co.za` (would duplicate for every recipient).

### Brevo setup (already complete)

- Domain `amalfoods.co.za` verified (SPF, DKIM, DMARC)
- Sender `admin@amalfoods.co.za` verified
- `BREVO_API_KEY` set in `.env.local` and Vercel environment variables

---

## 8. RLS Bypass — `/api/admin/customers`

The `customers` table has RLS policies that restrict reads to the authenticated user's own row (`auth.uid() = id`). Admin sessions cannot read all rows via the anon client.

`/api/admin/customers` uses `supabaseAdmin` (service role key, server-side only) to bypass RLS and return the full customer list.

```ts
supabaseAdmin.from("customers").select("id, email, name, surname, city, phone")
```

The service role key (`SUPABASE_SERVICE_ROLE_KEY`) is never exposed to the browser.

---

## 9. Access Control

The campaigns page is admin-only. On mount it calls `supabase.auth.getUser()` — no session redirects to `/admin/login`. The `DashboardShell` nav only renders the Campaigns item when `role === "admin"`.
