# Amal Foods — System Documentation

**Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · Sanity CMS · Supabase · Resend  
**Last updated:** September 2026

---

## Documentation Map

| File | Covers |
|---|---|
| [cart.md](cart-logic.md) | Cart context, actions, region lock, toast, localStorage |
| [order-placement.md](order-placement.md) | Checkout form, `/api/place-order` route, order number seeding |
| [database-security.md](database-security.md) | RLS policies, grants, service role pattern |
| [invoice.md](invoice.md) | PDF generation, `/api/send-invoice`, Resend email |
| [products-page.md](products-page.md) | Products page, Sanity fetch, filters, sorting, countdown, cart stepper |
| [admin.md](admin.md) | Admin dashboard, manager auth, order management |

---

## Architecture Overview

```
Browser (Next.js client components)
    │
    ├── CartContext          — global cart state, region lock, localStorage
    ├── /products            — Sanity fetch, filter/sort UI, cart stepper
    ├── /checkout            — form validation → POST /api/place-order
    │                                           → PDF generation (jsPDF)
    │                                           → POST /api/send-invoice
    │
    └── /admin/dashboard     — Supabase Auth (authenticated role)
                               reads orders, manages managers

Next.js API Routes (server-side)
    ├── /api/place-order     — service role INSERT into orders (bypasses RLS)
    ├── /api/send-invoice    — server-side PDF + Resend email delivery
    ├── /api/create-manager  — service role creates Supabase Auth user + managers row
    └── /api/orders          — legacy route (basic insert, superseded by place-order)

Supabase (PostgreSQL + Auth)
    ├── orders               — RLS enabled; anon blocked from reads
    ├── customers            — customer profiles
    ├── profiles             — Supabase Auth user profiles + roles
    └── managers             — branch manager records

Sanity CMS
    └── product              — title, category, label, unit, pricing, image, active flag
```

---

## Key Design Decisions

- **Service role for order INSERT** — Supabase RLS on anon INSERT proved unreliable; moved to server-side API route with service role key. Key never reaches the browser.
- **Region lock** — Cart locks to the first item's region; mixing regions is blocked to prevent fulfilment errors across Durban/Joburg branches.
- **Order number seeding** — Numbers start at a per-year random offset (`4829` for 2026) so public-facing order numbers never reveal real order volume.
- **Orders open date** — `ORDER_DATE = 2026-10-01`. Cart stepper on product cards is disabled until this date.
