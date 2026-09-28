# Order Placement

**Files involved:**
- `app/checkout/page.tsx` — customer-facing checkout form
- `app/api/place-order/route.ts` — server-side order insert + number generation

---

## 1. Overview

The checkout flow has two distinct phases:

```
Customer fills form
    └── handleSubmit()
            ├── Client-side validation
            ├── POST /api/place-order  ← server inserts via service role
            │       └── returns { data: OrderRow }
            ├── jsPDF invoice generated in browser
            └── POST /api/send-invoice  ← fire-and-forget email
```

The direct Supabase insert from the browser was removed in September 2026 when RLS was enabled. All inserts now go through the server-side `/api/place-order` route which uses the service role key and bypasses RLS entirely.

---

## 2. Client-side Validation (`app/checkout/page.tsx`)

Before the API call is made, `handleSubmit` validates:

| Check | Error shown |
|---|---|
| `name` empty | "Please enter your full name." |
| `cell` empty | "Please enter your cell number." |
| `cellError` set | "Please enter a valid South African cellphone number." |
| `region` not selected | "Please select a region." |
| `branch` not set | "Branch could not be determined. Please try again." |
| `paymentMethod` not chosen | "Please select your payment method before submitting." |
| `totalItems < 10` | "Minimum order is 10 items." |
| `mixedRegions` | "Your cart has items from multiple regions. Please split orders." |

SA cellphone validation regex: `/^(?:\+27|27|0)[6-8][0-9]{8}$/`

---

## 3. API Route — `/api/place-order`

**File:** `app/api/place-order/route.ts`

Uses a Supabase admin client created with `SUPABASE_SERVICE_ROLE_KEY` (server-side env var, never `NEXT_PUBLIC_`). This client bypasses RLS entirely.

### Request body

```ts
{
  customer_name:  string
  phone_number:   string
  cell_number:    string
  email:          string | null
  branch:         string          // auto-detected from cart region
  region:         string          // customer-selected
  payment_method: "Cash on Collection" | "EFT before Collection"
  items:          { id, title, quantity, price, region }[]
  total:          number
}
```

### Response

```ts
{ data: OrderRow }   // the full inserted row including id, order_number, created_at
```

On error: `{ error: string }` with appropriate HTTP status.

---

## 4. Order Number Generation

Handled server-side inside `/api/place-order`. Numbers use a per-year seed to hide real order volume from the public.

```ts
const YEAR_SEEDS: Record<string, number> = {
  "26": 4829,   // 2026 — reset after DB wipe 28 Sep 2026
};
```

**Algorithm:**
1. Query Supabase for the highest existing `order_number` matching `Amal{YY}#%`
2. Parse the numeric suffix
3. `nextSeq = lastNumber + 1`, or `seed` if no orders exist yet
4. Return `Amal{YY}#${nextSeq.padStart(4, "0")}`

**Examples:**
```
First order of 2026:  Amal26#4829
Second order:         Amal26#4830
Seventh order:        Amal26#4835
```

**Admin: calculating real count**
```
actual count = order_number_digits − YEAR_SEEDS[year]
e.g. Amal26#4835 → 4835 − 4829 = 6th order
```

**Adding a new year:** add an entry to `YEAR_SEEDS` with a fresh 4-digit seed (3000–8000 range) before the first order of that year.

---

## 5. Branch Auto-Detection

Branch is set client-side based on the cart's item regions. No manual branch selection is required or shown:

```ts
useEffect(() => {
  const regions = cart.map(item => item.region?.toLowerCase()).filter(Boolean);
  const uniqueRegions = [...new Set(regions)];
  if (uniqueRegions.length > 1) {
    setMixedRegions(true);
  } else {
    const region = uniqueRegions[0] || selectedRegion;
    if (region === "durban")   setBranch("Durban");
    if (region === "joburg")   setBranch("Joburg");
    if (region === "capetown") setBranch("Cape Town");
  }
}, [cart, selectedRegion]);
```

---

## 6. Post-Submit Flow

After a successful API response:

1. `setOrderData(data)` — stores the confirmed order row
2. `clearCart()` — empties cart, nulls region, clears localStorage
3. `generateFullInvoice(data)` — builds PDF in browser memory
4. PDF blob posted to `/api/send-invoice` (fire-and-forget, failures logged not thrown)
5. `setShowThankYouModal(true)` — shows confirmation modal with order summary
6. Modal "Download Invoice" button triggers `doc.save()` for local PDF download
