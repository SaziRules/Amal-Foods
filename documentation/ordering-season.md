# Ordering Season

**Files involved:**
- `components/HomeHero.tsx` — homepage countdown + phase-driven hero copy
- `app/products/page.tsx` — products page countdown + cart stepper gating
- `app/api/place-order/route.ts` — server-side ordering-window gate (public checkout only)
- `lib/emailTemplates.ts` — campaign/newsletter templates referencing the close date

---

## 1. Overview

Ordering is only available during a fixed seasonal window. The current season runs **1 October 2026 → end of Sunday 15 November 2026** (i.e. up to `2026-11-16 00:00 SAST`).

The window is enforced in two layers:

```
Browser (HomeHero, ProductsPage)
    └── Countdown ticks every second
            ├── phase === 'pre'    → "Orders open in {d:h:m:s}", steppers disabled
            ├── phase === 'open'   → "Orders close in {d:h:m:s}", steppers live
            └── phase === 'closed' → brand/seasonal messaging, steppers hidden

Next.js API Route (/api/place-order)
    └── Date.now() gate
            ├── before ORDER_OPEN  → 403 "Ordering is not yet open..."
            ├── inside window      → proceed to insert
            └── at/after ORDER_CLOSE → 403 "Ordering has closed..."
```

The client gate controls what customers see. The server gate is the authoritative check — it prevents stale tabs, scripted requests, or clock-manipulated clients from placing orders outside the window.

**Scope of the gate — admin / store manager orders are NOT affected.** Owners and branch managers submit orders from their dashboards via `components/CustomerDetailsModal.tsx.tsx`, which inserts directly into the `orders` table using the authenticated browser session (allowed by the `public_insert_orders` RLS policy). That path never touches `/api/place-order`, so the window check does not apply to it. A manager or admin can log in and place an order at any time — including after the public close date.

---

## 2. Window Constants

Two sources of truth exist by design: the client needs the window to drive countdowns and UI state, and the server needs it to reject out-of-window POSTs. Keep them in sync when changing dates.

### Client (browser local time)

```ts
// components/HomeHero.tsx
// app/products/page.tsx
const ORDER_DATE = new Date('2026-10-01T00:00:00');
const CLOSE_DATE = new Date('2026-11-16T00:00:00');
```

No timezone is specified, so browsers interpret these as the user's local time. For SA customers this is SAST, which matches business intent.

### Server (explicit SAST offset)

```ts
// app/api/place-order/route.ts
const ORDER_OPEN  = new Date('2026-10-01T00:00:00+02:00').getTime();
const ORDER_CLOSE = new Date('2026-11-16T00:00:00+02:00').getTime();
```

Explicit `+02:00` prevents the cutoff from drifting with the server's runtime timezone (Vercel defaults to UTC).

---

## 3. Phase Logic (Client)

Both `HomeHero` and `ProductsPage` run the same `setInterval(tick, 1000)` effect. Each tick compares `Date.now()` against the two constants and sets:

| Condition | `phase` | UI effect |
|---|---|---|
| `now < ORDER_DATE` | `'pre'` | Countdown header: *"Orders open in"*. Cart steppers disabled. |
| `ORDER_DATE ≤ now < CLOSE_DATE` | `'open'` | Countdown header: *"Orders close in"*. Steppers live. |
| `now ≥ CLOSE_DATE` | `'closed'` | Countdown unmounts; hero switches to evergreen brand copy; steppers hidden. |

`timeLeft` is derived from the remaining distance:

```ts
const dist = CLOSE_DATE.getTime() - now;
setTimeLeft({
  days:    Math.floor(dist / 86400000),
  hours:   Math.floor((dist / 3600000) % 24),
  minutes: Math.floor((dist / 60000) % 60),
  seconds: Math.floor((dist / 1000) % 60),
});
```

---

## 4. Server Gate (`/api/place-order`)

The gate runs at the top of the `POST` handler, **before** body parsing or `generateOrderNumber()`, so rejected requests are cheap and never consume sequence numbers:

```ts
export async function POST(req: Request) {
  try {
    const now = Date.now();
    if (now < ORDER_OPEN) {
      return NextResponse.json(
        { error: "Ordering is not yet open for this season." },
        { status: 403 }
      );
    }
    if (now >= ORDER_CLOSE) {
      return NextResponse.json(
        { error: "Ordering has closed for this season." },
        { status: 403 }
      );
    }
    // ...body parsing, validation, insert
  }
}
```

### Responses

| Timing | Status | Body |
|---|---|---|
| Before 1 Oct 2026 00:00 SAST | `403` | `{ error: "Ordering is not yet open for this season." }` |
| Within window | `200` | `{ data: OrderRow }` |
| At/after 16 Nov 2026 00:00 SAST | `403` | `{ error: "Ordering has closed for this season." }` |

The checkout form surfaces the `error` string in the existing error toast — no client changes are required for the messages to appear if someone with a stale tab tries to submit.

> **Do not route admin / manager order submissions through `/api/place-order`.** They would hit this gate and be rejected after close. Keep the dashboard `CustomerDetailsModal` on its current direct-insert path so staff can continue placing orders outside the public window.

---

## 5. Email Templates

`lib/emailTemplates.ts` hardcodes the close date in several template strings (urgency strip, deadline callout, footer year). These are display-only — they don't affect the gate — but should be updated when the season changes:

| Location | String |
|---|---|
| Promo urgency strip | `Orders Close · 15 November 2026` |
| Newsletter month tag | `November 2026` |
| Deadline callout | `15 November 2026` |
| Reminder footer | `2026 · ORDERS CLOSE` |

---

## 6. Changing the Season

When rolling into a new season, update these five locations in lockstep:

1. `components/HomeHero.tsx` — `ORDER_DATE`, `CLOSE_DATE`, and the visible `'Orders Close · 15 November 2026'` / `'Orders Opening · 1 October 2026'` strings.
2. `app/products/page.tsx` — same as above.
3. `app/api/place-order/route.ts` — `ORDER_OPEN`, `ORDER_CLOSE`.
4. `lib/emailTemplates.ts` — the four strings listed in section 5.
5. `app/api/place-order/route.ts` — add a new `YEAR_SEEDS` entry for the new year (see `order-placement.md` §4).

### Choosing times

- Both client constants should use `YYYY-MM-DDT00:00:00` without timezone — reads as local time.
- Both server constants should use `YYYY-MM-DDT00:00:00+02:00` — pinned to SAST.
- For "close on Sunday midnight", set the close date to the **following Monday** at `00:00`. `2026-11-16T00:00:00` means the window stays open through all of Sunday 15 November and shuts at the moment Sunday ends.
