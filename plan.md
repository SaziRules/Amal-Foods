# Amal Foods — Dashboard & Admin UI Redesign Plan

## Vision

The frontend is cinematic, editorial, dark — Awwwards-level. The dashboards are functional but generic: glass-morphism clichés, rounded-3xl on everything, and a layout that feels assembled rather than designed. The goal is to bring the same intentionality that was applied to the public-facing site into the internal tools without sacrificing a single piece of functionality. The result should feel like a bespoke operations platform built for a serious food brand, not a SaaS UI kit remix.

Think: Vercel + Linear + the Amal Foods editorial brand. Data-dense but never cluttered. Quiet confidence.

---

## Design Principles

1. **No glass-morphism filler.** Every surface should exist for a reason. Borders and backgrounds should define hierarchy, not decorate it.
2. **Typography does the heavy lifting.** Roboto Condensed uppercase for section titles and stat values. Roboto regular for supporting text. Size and weight contrast creates the grid, not boxes.
3. **Red is reserved.** #B80013 is a signal. CTAs, active states, key figures only — not sprinkled across the whole UI.
4. **Density without clutter.** Dashboard users scan, not read. Information should be visible and grouped by proximity, not buried in cards.
5. **Motion is purposeful.** Subtle transitions for state changes (order status, modal open), nothing gratuitous.
6. **Consistent shell.** Both dashboards should feel like two rooms in the same building, not two different apps.

---

## Design System

### Colours
```
Background (primary)    #0a0a0a   — page canvas
Background (elevated)   #111111   — cards, sidebar
Background (raised)     #1a1a1a   — inputs, hover states, nested content
Border (default)        rgba(255,255,255,0.07)
Border (emphasis)       rgba(255,255,255,0.14)
Border (active)         #B80013
Accent                  #B80013
Accent muted            rgba(184,0,19,0.15)
Text (primary)          #ffffff
Text (secondary)        rgba(255,255,255,0.5)
Text (tertiary)         rgba(255,255,255,0.25)
Success                 #22c55e
Warning                 #eab308
Danger                  #ef4444
```

### Typography
```
Display / Stat values   Roboto Condensed, 700, uppercase, tracked wide
Section labels          Roboto Condensed, 500, uppercase, 11px, letter-spacing: 0.12em, text-secondary
Body / table text       Roboto, 400, 14px
Micro / timestamps      Roboto, 400, 12px, text-tertiary
```

### Spacing grid: 4 / 8 / 16 / 24 / 32 / 48 / 64px

### Radius
```
Small (badges, pills)   4px
Default (cards)         8px       — replaces rounded-3xl everywhere
Large (modals)          12px
```

Rounding is tight and intentional. rounded-3xl on every single card made everything look the same. The new system uses 8px as the default and reserves larger radii for modals only.

### Elevation model
```
Level 0   #0a0a0a     — canvas
Level 1   #111111     — cards, panels
Level 2   #1a1a1a     — inputs, hover states, inner content
Level 3   #222222     — dropdowns, tooltips
```

No backdrop-blur on dashboards. Blur is a frontend effect. Internal tools use solid surfaces for legibility.

---

## Shell Layout — Both Dashboards

### Current
Both dashboards are single-page blobs with headers and floating buttons. The admin has a sidebar but it's styled as a standalone card that competes with the content.

### New Shell: Persistent Sidebar + Content Area

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed)          │  CONTENT AREA (flex-1)    │
│  ─────────────────────────────  │  ─────────────────────    │
│  [Logo / Brand mark]            │  [Page Header]            │
│  [User identity block]          │  [Stats Row]              │
│                                 │  [Main Content]           │
│  — Nav section —                │                           │
│  • Dashboard                    │                           │
│  • Orders                       │                           │
│  • Reports                      │                           │
│  • Staff (admin only)           │                           │
│  • Analytics (admin only)       │                           │
│                                 │                           │
│  — Bottom —                     │                           │
│  • Refresh                      │                           │
│  • Logout                       │                           │
└─────────────────────────────────────────────────────────────┘
```

The sidebar is `position: fixed`, `height: 100vh`, `bg-[#111111]`, `border-r border-white/7`. No card styling — it IS the surface. Content area has `ml-[240px]` and its own scroll.

Nav items: left-border indicator for active state (#B80013 4px left border, red text), no background fill on hover — just the border indicator sliding in.

---

## File-by-File Redesign

---

### 1. `/app/dashboard/layout.tsx` & `/app/admin/layout.tsx` — Layouts

**Change:** Both layouts will render the persistent sidebar shell. Each layout will:
- Check auth and redirect if not logged in (keeping existing auth logic).
- Render `<DashboardShell role="manager">` or `<DashboardShell role="admin">` which provides the sidebar + content wrapper.
- The shell handles the `ml-[240px]` offset and `min-h-screen` on the content area.

New file to create: `components/dashboard/DashboardShell.tsx`

---

### 2. New Component: `components/dashboard/DashboardShell.tsx`

The single shared shell for both dashboards. Accepts `role: "manager" | "admin"` and `userEmail: string` as props (passed from the page after auth resolves).

**Sidebar contents:**
- Top: Amal Foods wordmark or logo (same as footer-logo, kept small — 32px height).
- User block (below logo, separated by a `border-b border-white/7`): email truncated to 20 chars, role badge (`MANAGER` or `OWNER` in #B80013, uppercase, 10px Roboto Condensed tracked wide).
- Nav section label: `— NAVIGATION —` in text-tertiary 10px tracked.
- Nav items (see Shell Layout above).
- Bottom section (pinned via `mt-auto`): Refresh, then Logout. Both as text links with icons, no button styling. Logout text is #B80013.

**Content area:**
- `bg-[#0a0a0a]`, `flex-1`, `min-h-screen`, `overflow-y-auto`.
- Has a top bar (`h-14 border-b border-white/7 px-8 flex items-center justify-between`) that shows the current page title on the left and contextual action buttons on the right.
- The action buttons (Kitchen PDF, Order Report, etc.) move out of the old header blob and into this top bar. Consistent placement across all pages.

---

### 3. `/app/dashboard/dashboard/page.tsx` — Manager Dashboard

**Keep:** All data fetching, order management, status updates, PDF/Excel generation, floating action button logic.

**Change:**

**Page header (in top bar):** "Dashboard" as the page title. Action buttons right-aligned: "Kitchen PDF", "Kitchen Excel", "Order PDF", "Order Excel" — all as minimal text buttons with a subtle `border border-white/10` and 8px radius. No colour coding per button — they all look the same. The meaning comes from the label, not the colour.

**Stats row:** 5 stats in a single horizontal row (`grid-cols-5`). Each stat:
- No card. Just the number and label stacked, separated from the next stat by a `border-r border-white/7`.
- Value: Roboto Condensed 700, 36px, white.
- Label: 11px, uppercase, tracked, text-secondary.
- Status-specific colour applied only to the value (yellow for pending, green for collected, red for cancelled, white for the rest).

**Charts section:**
- Two columns. Both charts stay (LineChart, performance analytics).
- New card style: `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`, `p-6`. No rounded-3xl.
- Chart section labels: Roboto Condensed uppercase, text-secondary, 11px. Not large heading text.
- Top 5 products list: Remove the `bg-white/5 rounded` boxes. Use a simple numbered list with a left-border accent on the top item only.

**Order Prep section:**
- Category cards: `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`. Remove rounded-3xl.
- Category label: Roboto Condensed uppercase, tracked, 12px. Not large.
- Table rows: tighter spacing, 13px text. Less padding.
- Per-category export buttons: small, text-only with icons. No background.

**Floating action button:** Keep position and functionality. New style: square, 48×48, `bg-[#B80013]`, `rounded-[8px]`, no shadow. The plus icon only. No text on the button. Tooltip on hover.

**Toast:** Align to the DashboardShell's design system. Dark bg, white text, no emoji.

---

### 4. `/app/admin/dashboard/page.tsx` — Admin Dashboard

**Keep:** All data fetching, manager CRUD, all modals, analytics, report generation, invoice batch generation.

**Change:**

**Shell:** The old sidebar-as-card is replaced by the `DashboardShell` component above. Everything it contained (manager list, action buttons) is reorganised.

**Manager list** moves to a dedicated "Staff" nav section — clicking "Staff" in the sidebar scrolls to or reveals a staff management panel within the content area, not a sidebar card.

**Stats row:** 6 stats in a `grid-cols-6` row, same treatment as manager stats above. Revenue stat value in Roboto Condensed, the currency prefix (R) at 60% size of the value number.

**Charts section:** Same as manager dashboard — `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`. PieChart stays. Muted colour palette for the pie slices — not gradient fills, solid muted tones.

**Customer Analytics section:** The section title and insight cards follow the same card system. The 9 InsightCards: no `hover:bg-white/10` transition — instead a 1px bottom border on the value acts as the separator. The region cards: same system. Bar chart stays.

**Action buttons** (Generate Report, Export Excel, Generate All Invoices, Open Studio) move to the top bar as contextual actions for the current view.

---

### 5. `components/ManageOrdersModal.tsx`

**Keep:** All filter logic, status/payment updates, delete, view items, edit items, add items. All mutations untouched.

**Change:**

- Modal container: `bg-[#0a0a0a]` instead of bg-black/70 backdrop. `rounded-[12px]`. Feels like a dedicated page, not a popup.
- Modal takes up 90vw × 92vh. The content inside scrolls, not the modal itself expanding.
- **Header:** Order count on the left. Filters in the top bar. X close button far right. Clean single row.
- **Filters:** Instead of pill buttons in separate rows, all filters are in one horizontal strip with section dividers. Date filters / Payment / Status — three groups, subtle `border-r border-white/10` between groups.
- **Order cards:** `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`. Status badge: small pill, coloured background at 15% opacity, text at full colour. Remove the redundant status button row — status and payment are changed via the badge itself (click → cycles state) rather than having a row of 5 buttons. This cleans up enormous amounts of noise. Keep the functionality, remove the visual clutter.
- **View / Edit / Delete actions:** A single `•••` icon button per card that opens a small inline action menu (not a secondary modal) with 3 options. Keeps the card clean.

---

### 6. `components/OrderPrepDisplay.tsx`

**Keep:** All grouping logic, expand/collapse, per-category PDF/Excel.

**Change:**

- Section header: Roboto Condensed uppercase, 11px label + count badge.
- Category cards: `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`, tighter padding.
- Category name: Roboto Condensed uppercase. Remove the large colored headers.
- Table: minimal, dense. No extra padding. Header row in text-tertiary 11px tracked.
- Status/payment summaries: one line each, 11px, text-tertiary. Not stacked lines.
- Export buttons: icon-only with tooltip, right-aligned in the card header.

---

### 7. `components/CreateOrderModal.tsx`

**Keep:** Product fetch, cart logic, quantity controls, pricing, step transition.

**Change:**

- The two-pane layout stays — it's the right UX. New treatment:
- Left pane: `bg-[#0a0a0a]`. Product cards: `bg-[#111111]`, `border border-white/7`, `rounded-[8px]`. No gradient backgrounds.
- Product card image: full-width, fixed aspect 4/3, `object-cover`. Falls back to a simple category letter on `#1a1a1a`.
- Price: #B80013, Roboto Condensed bold.
- Quantity controls: minimal — minus icon | number | plus icon with `border border-white/10` around the group.
- Right pane: `bg-[#111111]`, `border-l border-white/7`. Cart items minimal, same card system.
- CTA button at bottom: `bg-[#B80013]`, `rounded-none`, full-width, 52px, uppercase Roboto Condensed.

---

### 8. `components/CustomerDetailsModal.tsx`

**Keep:** All step logic, validation, region selection, order submission, email send.

**Change:**

- Steps indicator: simple `01 / 02` text in top-right, text-tertiary. No progress bar.
- Inputs: `border-b border-white/10` only, `bg-transparent`. Same as login form.
- Region selector: styled as a grid of text buttons (not rounded pills), `border border-white/7`, active region gets `border-[#B80013]`.
- Payment method radio: instead of boxes with icons, two clear rows with left-border active indicator.
- Success state: Keep the green checkmark. New layout: Roboto Condensed "ORDER CREATED" large, then the details in a simple list — no card box.

---

### 9. `components/CustomerAnalytics.tsx`

**Keep:** All calculations, region groupings, chart data.

**Change:**

- Insight cards: no bg-white/5 box. Use a simple two-column grid where each insight is `border-b border-white/7 py-4`. No cards.
- Bar chart: stays but with muted red/gold tones to match the palette.
- Section title: Roboto Condensed uppercase label, not a large heading.

---

## Implementation Order

Work file-by-file. Do not start a file until the previous is verified working. Never touch functionality — layout and visual CSS only.

```
1.  Design tokens review — confirm colours, type scale, radius in globals or tailwind config
2.  DashboardShell component (new) — sidebar + content wrapper, nav items
3.  dashboard/layout.tsx — integrate DashboardShell
4.  admin/layout.tsx — integrate DashboardShell
5.  dashboard/dashboard/page.tsx — stats, charts, prep display, header actions
6.  admin/dashboard/page.tsx — stats, charts, customer analytics, staff section
7.  ManageOrdersModal.tsx
8.  OrderPrepDisplay.tsx
9.  CreateOrderModal.tsx
10. CustomerDetailsModal.tsx
11. CustomerAnalytics.tsx
```

---

## What Does Not Change

- Zero changes to login pages (`dashboard/login/page.tsx`, `admin/login/page.tsx`) — style is already final
- Zero changes to any Supabase query, mutation, or auth logic
- Zero changes to any PDF or Excel generation logic
- Zero changes to any API routes
- Zero changes to Recharts data or configuration (only colours updated to match palette)
- All modals remain accessible from the same triggers
- All export buttons remain functional and in place
- Floating action button functionality on manager dashboard
- Real-time data refresh behaviour
