# Amal Foods — Bulk Promo Email Campaign Feature Plan

## Overview

Add a self-contained campaign manager to the admin dashboard that lets the owner compose a promotional email, choose from 3 branded templates, and manually send batches of 150 emails per day until the full customer list is covered. Progress is tracked in Supabase so each day the owner simply opens the dashboard and fires the next batch — no duplicates, no guesswork.

**What's already in place:**
- Brevo API key in env (`BREVO_API_KEY`), already used for invoices
- `/api/get-auth-users` returns all registered customers (id, email, created_at)
- Brevo transactional email endpoint (`POST /v3/smtp/email`) already in use
- Admin dashboard auth + role check already working

**What needs to be built:**
- 1 Supabase table (`campaigns`)
- 3 new API routes
- 3 HTML email templates
- 1 new section in the admin dashboard UI

---

## Constraints

| Item | Value |
|------|-------|
| Brevo free daily cap | 300 emails/day |
| Our daily batch size | 150 (conservative — leaves 150 for invoice sends) |
| Customer list size | ~1000+ |
| Days to complete a full send | ~7 days |
| Scheduling | Manual trigger by admin each day |
| Duplicate protection | Supabase tracks every sent email per campaign |

---

## 1. Database — Supabase Table

### Table: `campaigns`

```sql
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                     -- admin label, e.g. "Eid Promo 2025"
  subject       text not null,                     -- email subject line
  template_id   int  not null check (template_id in (1, 2, 3)),
  headline      text,                              -- large heading inside the email
  body_text     text,                              -- main paragraph copy
  cta_label     text default 'Shop Now',           -- CTA button text
  cta_url       text default 'https://amalfoods.co.za',
  status        text not null default 'draft'
                  check (status in ('draft','active','paused','complete')),
  total_recipients int not null default 0,        -- set when campaign is activated
  sent_count    int  not null default 0,
  sent_emails   jsonb not null default '[]',      -- array of email strings already sent
  created_at    timestamptz default now(),
  last_batch_at timestamptz                       -- timestamp of most recent send
);
```

**Why `sent_emails` as JSONB:** Simple to query (`NOT IN` logic), easy to update with a single `array_append` equivalent, no join needed. At 1000 strings it's ~50KB — trivial for Postgres JSONB.

**RLS:** Table should only be accessible via service role key (same pattern as `get-auth-users`). Admin dashboard calls it through API routes, never directly from the client.

---

## 2. API Routes

### Route 1: `POST /api/campaigns` — Create campaign

**Purpose:** Save a new campaign as a draft.

**Body:**
```json
{
  "name": "Eid Promo 2025",
  "subject": "Something special from Amal Foods 🌙",
  "template_id": 2,
  "headline": "Celebrate Eid with Amal Foods",
  "body_text": "This Eid, treat your family to the finest...",
  "cta_label": "Order Now",
  "cta_url": "https://amalfoods.co.za"
}
```

**Logic:**
1. Auth check — service role / admin session
2. Fetch total recipient count from `/api/get-auth-users` (or call Supabase admin directly)
3. Insert into `campaigns` with `status: 'draft'`, `total_recipients: count`
4. Return the new campaign record

---

### Route 2: `GET /api/campaigns` — List campaigns

**Purpose:** Load all campaigns for the dashboard list view.

Returns array of campaigns ordered by `created_at desc`. Includes `sent_count`, `total_recipients`, `status`, `last_batch_at`.

---

### Route 3: `POST /api/campaigns/[id]/send-batch` — Send today's 150

**Purpose:** Core sending route. Called once per day by the admin.

**Logic:**
```
1. Auth check
2. Fetch campaign from Supabase by id
3. If status === 'complete' → return early, nothing to do
4. Fetch all registered customer emails via Supabase admin.listUsers()
   - Handle pagination: perPage 1000, check if more pages exist
5. Filter out emails already in campaign.sent_emails
6. Take first 150 from the remaining list
7. If remaining list is empty → mark campaign complete, return
8. For each email in the batch:
   a. Build HTML from the selected template (template_id + campaign fields)
   b. POST to https://api.brevo.com/v3/smtp/email
   c. On success: add email to successfullySent array
   d. On failure: log but continue (don't block the batch)
9. Update campaign in Supabase:
   - sent_emails: append successfullySent
   - sent_count: increment by successfullySent.length
   - last_batch_at: now()
   - status: 'active' (or 'complete' if no remaining emails after this batch)
10. Return { sent: n, remaining: m, status }
```

**Rate limiting within the batch:** Send emails sequentially with a 100ms pause between each to avoid hitting Brevo's per-second limits. 150 emails × 100ms = ~15 seconds. The route uses `export const runtime = "nodejs"` and `export const maxDuration = 60` (Vercel hobby allows 60s, Pro allows 300s).

**Error handling:** If Brevo returns a 429 (rate limit hit mid-batch), stop sending, save progress for emails sent so far, return partial success with a warning.

---

## 3. Email Templates

All three templates are written as TypeScript functions that accept the campaign fields and return an HTML string. They share the same footer and unsubscribe block. They use inline styles throughout (required for Outlook compatibility).

### Shared elements across all templates

**Header:** Amal Foods logo on `#111111` background (same as the invoice email — already known to render correctly).

**Footer:**
```
1271 Umgeni Rd, Stamford Hill, Durban, 4025
031 303 7786 | info@amalfoods.co.za
© 2025 Amal Foods. All rights reserved.
[Unsubscribe] — small grey link at the very bottom
```

**Unsubscribe link:** Points to `https://amalfoods.co.za/unsubscribe?email={encodedEmail}` — a simple page to be built that sets a flag. For now the link can say "To stop receiving emails, reply with UNSUBSCRIBE" — sufficient for POPIA compliance during a manual campaign at this scale.

---

### Template 1 — "Bold Drop"

**Tone:** Product launch, new arrival, high-energy promo.

**Layout:**
```
┌─────────────────────────────────────┐
│ [LOGO]                  bg: #111    │  ← header, 70px tall
├─────────────────────────────────────┤
│                                     │
│  ████████████████████████████████   │  ← full-width banner image
│  (optional: product/lifestyle img)  │  ← 300px tall, bg #1a1a1a if no image
│                                     │
├─────────────────────────────────────┤
│ bg: #000                            │
│                                     │
│  NEW ARRIVAL          [red label]   │
│                                     │
│  {headline}                         │  ← 28px bold, white, uppercase
│                                     │
│  {body_text}                        │  ← 15px, #ccc, 1.7 line-height
│                                     │
│  [ ORDER NOW → ]                    │  ← #B80013 pill button, white text
│                                     │
├─────────────────────────────────────┤
│ [footer]                bg: #000    │
└─────────────────────────────────────┘
```

**Character:** Dark, punchy, direct. Feels like a product drop notification. The red label ("NEW ARRIVAL" or "LIMITED TIME") is hardcoded for this template but customisable via a `template_tag` field.

---

### Template 2 — "Editorial"

**Tone:** Brand storytelling, seasonal greeting, warmth. Newsletter-style.

**Layout:**
```
┌─────────────────────────────────────┐
│ [LOGO]                  bg: #111    │
├─────────────────────────────────────┤
│ bg: #ffffff                         │
│                                     │
│  ─────────────────────────────────  │  ← 3px top border, #B80013
│                                     │
│  {headline}                         │  ← 26px, #111, font-weight 700
│                                     │
│  {body_text}                        │  ← 15px, #444, 1.8 line-height
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Key detail or pull quote   │    │  ← left-border block: 3px #B80013
│  └─────────────────────────────┘    │
│                                     │
│  [ {cta_label} ]                    │  ← outlined button: border #B80013,
│                                     │    text #B80013, white bg
│                                     │
├─────────────────────────────────────┤
│ [footer]                bg: #111    │
└─────────────────────────────────────┘
```

**Character:** Confident and warm. Light background makes it feel premium rather than aggressive. The pull-quote block adds editorial hierarchy. Best for seasonal messages (Eid, Ramadan, year-end).

---

### Template 3 — "Split"

**Tone:** Offer-focused, structured, easy to scan.

**Layout:**
```
┌──────────────┬──────────────────────┐
│              │                      │
│  bg: #B80013 │  bg: #ffffff         │
│              │                      │
│  [LOGO]      │  {headline}          │  ← 24px, #111, bold
│              │                      │
│  Amal Foods  │  {body_text}         │  ← 14px, #555
│  Durban's    │                      │
│  Favourite   │  ┌────────────────┐  │
│  Food Brand  │  │  Key detail    │  │  ← info box: bg #f5f5f5, border #eee
│              │  │  or offer terms│  │
│  white text  │  └────────────────┘  │
│              │                      │
│              │  [ {cta_label} ]     │  ← full-width #B80013 button
│              │                      │
└──────────────┴──────────────────────┘
│ [footer]                bg: #000    │
└─────────────────────────────────────┘
```

**Note on email client support:** True CSS two-column layouts break in Outlook. This template uses an HTML table with two `<td>` cells, which is the reliable cross-client approach. On mobile the red column stacks above the content column.

**Character:** Direct and offer-oriented. The red left column makes the brand unmistakable. Works well for promotional discounts or limited-time offers.

---

## 4. Admin Dashboard UI — Campaign Section

### Location in the redesigned shell

Under the admin sidebar navigation, a new item: **"Campaigns"** (envelope icon). Clicking it navigates to `/admin/campaigns` within the shell layout.

If the full dashboard redesign hasn't been implemented yet, this section can be added as a new scrollable section within the existing `/admin/dashboard/page.tsx` — gated behind a "Campaigns" tab in the existing layout.

---

### Campaign List View (default state)

```
─── CAMPAIGNS ──────────────────────────────────────────
  
  [+ New Campaign]                    ← right-aligned button, #B80013

  ┌─────────────────────────────────────────────────────┐
  │  Eid Promo 2025          ACTIVE                     │
  │  Subject: Something special from Amal Foods         │
  │  Progress: ██████░░░░░░░░  450 / 1,043 sent         │
  │  Last batch: 14 Oct 2025 · Next batch: send now →   │
  └─────────────────────────────────────────────────────┘
  
  ┌─────────────────────────────────────────────────────┐
  │  Winter Sale 2025        COMPLETE                   │
  │  Subject: Warm up with Amal Foods                   │
  │  Progress: ██████████████  892 / 892 sent           │
  │  Completed: 08 Aug 2025                             │
  └─────────────────────────────────────────────────────┘
```

Each campaign card shows:
- Name + status badge (DRAFT / ACTIVE / PAUSED / COMPLETE)
- Subject line preview
- Progress bar with fraction (sent / total)
- "Send Next Batch (150)" button — only visible on ACTIVE campaigns, disabled if last batch was today

---

### Create Campaign Flow (modal or inline panel)

**Step 1 — Choose Template**

Three visual cards side by side, each showing a miniature wireframe of the layout (similar to the Bodidoc TemplateSelector). Clicking a card selects it with a red border indicator.

Card contents: template name, one-line description, mini diagram.

**Step 2 — Compose**

Form fields:
- Campaign name (internal label only, not in email)
- Subject line
- Headline (shown large inside the email)
- Body text (textarea, 3–4 sentences typical)
- CTA button label (default: "Order Now")
- CTA URL (default: https://amalfoods.co.za)

**Step 3 — Preview**

Renders the selected template with the entered fields as a live HTML preview inside a scaled iframe (600px wide, scaled to fit the modal). Admin can scroll through the full email before confirming.

A "Send Test Email" button sends the preview to the admin's own email address for review in a real inbox.

**Step 4 — Confirm & Save**

Shows recipient count ("Will send to 1,043 registered customers over ~7 days at 150/day").
Two buttons: "Save as Draft" and "Activate Campaign".

Activating locks the template/subject/copy and enables the daily send button.

---

### Daily Send Interaction

On the campaign card, the **"Send Next Batch (150)"** button:

1. Shows a confirmation: "Send next 150 emails now? (450 already sent, 593 remaining)"
2. On confirm: calls `POST /api/campaigns/[id]/send-batch`
3. While sending: button shows a spinner + "Sending..." (route takes ~15s)
4. On completion: progress bar updates, button shows "Sent ✓ — come back tomorrow"
5. Button is disabled for the rest of the day (tracked via `last_batch_at` date comparison)

If the owner forgets a day and comes back after 48 hours, they can simply send two batches (300 total), which still fits within Brevo's 300/day cap — but the UI will warn: "You have not sent since [date]. You can send 1 or 2 batches today. Sending 2 batches = 300 emails (your full daily allowance)."

---

## 5. Unsubscribe Handling

**Minimal POPIA-compliant approach for now:**

1. Every campaign email footer includes: "You are receiving this because you registered at amalfoods.co.za. [Unsubscribe]"
2. The unsubscribe link: `https://amalfoods.co.za/unsubscribe?e={base64EncodedEmail}`
3. New page `app/unsubscribe/page.tsx` — reads the `e` param, decodes it, and adds the email to an `unsubscribed_emails` table in Supabase.
4. The send-batch route fetches the unsubscribed list and skips those emails before building the batch.

**Supabase table:**
```sql
create table unsubscribed_emails (
  email      text primary key,
  created_at timestamptz default now()
);
```

This is a simple, auditable, permanent record. No personal data beyond the email address.

---

## 6. Implementation Order

```
1.  Supabase: create campaigns table + unsubscribed_emails table
2.  app/unsubscribe/page.tsx — simple unsubscribe confirmation page
3.  app/api/campaigns/route.ts — POST (create) + GET (list)
4.  app/api/campaigns/[id]/send-batch/route.ts — core send logic
5.  lib/emailTemplates.ts — 3 template functions returning HTML strings
6.  Admin dashboard — Campaign list section
7.  Admin dashboard — Create campaign modal (steps 1–4)
8.  Admin dashboard — Daily send button + progress display
9.  Test: create a draft, send to admin test email, verify all 3 templates render
10. Test: send a batch of 5 to real emails, confirm delivery, check progress tracking
```

---

## 7. Environment Variables Required

All already present:
```
BREVO_API_KEY              ✓ exists (used by send-invoice)
NEXT_PUBLIC_SUPABASE_URL   ✓ exists
SUPABASE_SERVICE_ROLE_KEY  ✓ exists (used by get-auth-users)
```

No new env variables needed.
