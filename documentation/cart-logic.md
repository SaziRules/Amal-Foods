# Cart Logic — Amal Foods

**Last updated:** September 2026  
**Stack:** Next.js 15 · React Context API · localStorage · Supabase · jsPDF

---

## Overview

The cart system is built on React Context and spans four layers:

```
CartContext (state + actions)
    └── CartProvider (wraps the app in layout.tsx)
            ├── ProductCard     → adds/adjusts items
            ├── CartDrawer      → reviews, adjusts, proceeds
            └── Checkout page   → validates, submits, invoices
```

No external cart library is used. All state lives in `context/CartContext.tsx` and is persisted to `localStorage` on every change.

---

## 1. Data Types

### `CartItem`

```ts
export interface CartItem {
  id:       string;    // product._id from Sanity, or title as fallback
  title:    string;
  price:    number;    // region-specific price in ZAR
  quantity: number;    // always ≥ 1 once in cart
  image?:   string;    // imageUrl from Sanity
  region?:  string;    // "durban" | "joburg"
}
```

`region` drives the region-lock system — once the first item is added, all subsequent items must share the same region value.

### `CartContextType`

```ts
interface CartContextType {
  cart:              CartItem[];
  addToCart:         (item: CartItem) => void;
  removeFromCart:    (id: string) => void;
  updateQuantity:    (id: string, qty: number) => void;
  clearCart:         () => void;
  totalItems:        number;   // sum of all quantities
  totalPrice:        number;   // sum of (price × quantity) for all items
  selectedRegion:    string | null;
  setSelectedRegion: (region: string | null) => void;
}
```

---

## 2. CartProvider

**File:** `context/CartContext.tsx`

`CartProvider` is a standard React context provider. It wraps the entire app via `layout.tsx` so every page and component has access to cart state without prop drilling.

### Initialisation

On mount, the provider reads any persisted session from `localStorage`:

```ts
useEffect(() => {
  try {
    const storedCart   = localStorage.getItem("cart");
    const storedRegion = localStorage.getItem("selectedRegion");
    if (storedCart)   setCart(JSON.parse(storedCart));
    if (storedRegion) setSelectedRegion(storedRegion);
  } catch {
    localStorage.removeItem("cart"); // corrupted JSON — wipe and start fresh
  }
}, []);
```

Errors during parse silently wipe the corrupted key; the cart starts empty rather than crashing.

### Persistence

Two separate effects keep `localStorage` in sync whenever state changes:

```ts
useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
}, [cart]);

useEffect(() => {
  if (selectedRegion)
    localStorage.setItem("selectedRegion", selectedRegion);
}, [selectedRegion]);
```

`selectedRegion` is only written when it has a value — it is never written as `"null"`. Deletion happens explicitly in `clearCart`.

---

## 3. Cart Actions

### `addToCart(item: CartItem)`

This is the most complex action. It handles three cases in order:

**Case 1 — Region mismatch (rejected):**
```ts
const existingRegion = prev.length > 0 ? prev[0].region : null;

if (existingRegion && item.region && existingRegion !== item.region) {
  setToast(`Cart locked to ${existingRegion.toUpperCase()} region — clear cart to add ${item.region.toUpperCase()} products.`);
  return prev; // cart unchanged
}
```
The region is read from the first item in the cart — not from `selectedRegion` state — so the guard is always consistent with the actual cart contents.

**Case 2 — Item already in cart (increment):**
```ts
const existing = prev.find((i) => i.id === item.id);
if (existing) {
  return prev.map((i) =>
    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
  );
}
```
Quantity increments by exactly 1, regardless of the `quantity` field on the incoming `item` object. This prevents accidental bulk-adds.

**Case 3 — New item (append, set region):**
```ts
if (!selectedRegion && item.region) {
  setSelectedRegion(item.region);
  localStorage.setItem("selectedRegion", item.region);
}

return [...prev, { ...item, quantity: 1 }];
```
The quantity is forced to `1` on insertion, even if the caller passes a different value. `selectedRegion` is set on the first add and written to `localStorage` immediately (not waiting for the effect) to avoid any race condition.

---

### `removeFromCart(id: string)`

Filters the item out of the array:

```ts
const removeFromCart = (id: string) =>
  setCart((prev) => prev.filter((i) => i.id !== id));
```

Does not reset `selectedRegion` — the region remains locked even after removing individual items. Only `clearCart` unlocks the region.

---

### `updateQuantity(id: string, qty: number)`

If `qty` drops to zero or below, the item is automatically removed:

```ts
const updateQuantity = (id: string, qty: number) => {
  if (qty <= 0) removeFromCart(id);
  else setCart((prev) =>
    prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
  );
};
```

This is the action used by both `CartDrawer` (the ± buttons) and `ProductCard` (when the item is already in the cart).

---

### `clearCart()`

Fully resets all cart state and removes both `localStorage` keys:

```ts
const clearCart = () => {
  setCart([]);
  setSelectedRegion(null);
  localStorage.removeItem("cart");
  localStorage.removeItem("selectedRegion");
  setToast("Cart cleared — you can now shop any region.");
};
```

After `clearCart`, the next `addToCart` call will set a new region as if it were the first item added. This is the only way to switch regions.

---

### Derived state

```ts
const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
```

Computed on every render — no memoisation needed here as cart arrays are typically small.

---

## 4. Region-Lock System

Amal Foods operates out of separate fulfilment branches (Durban, Joburg). Prices differ by region, and mixing items from different regions in a single order is not possible logistically.

The enforcement is one-directional and automatic:

1. The first product added to the cart determines the cart's region.
2. Every subsequent `addToCart` checks `prev[0].region` against `item.region`.
3. If they differ, the add is silently rejected and a toast fires.
4. The toast includes an inline **"Clear Cart"** button that calls `clearCart()`, so the user can immediately switch regions without leaving the current page.
5. `clearCart()` nulls `selectedRegion` and removes it from `localStorage`, unlocking for a new region on the next add.

The `ProductCard` component also reads `localStorage.selectedRegion` independently on mount and uses it to show the correct regional price and hide products not available in that region via the `available_in` array on the Sanity document.

---

## 5. Toast Notifications

The toast system is built into the `CartProvider` itself — no separate context or library.

```ts
const [toast, setToast] = useState<string | null>(null);

// Auto-hide after 3.5 seconds
useEffect(() => {
  if (toast) {
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }
}, [toast]);
```

The toast renders at the bottom of the page inside the `CartProvider` return, always on top (`z-[9999]`):

```tsx
{toast && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 ... animate-fade-in-out">
    <span>{toast}</span>
    <button onClick={clearCart}>Clear Cart</button>
  </div>
)}
```

The `animate-fade-in-out` class is defined in `globals.css` — a 3.5 s keyframe animation that fades in, holds, then fades out to match the `setTimeout` duration.

Toasts fire in two scenarios:
- Region mismatch on `addToCart` — informs the user and offers to clear.
- After `clearCart` — confirms the cart is empty and the region is now open.

---

## 6. CartDrawer

**File:** `components/CartDrawer.tsx`  
**Props:** `open: boolean`, `onClose: () => void`, `onCheckout: () => void`

The drawer is a right-side slide-in panel. It uses CSS transforms rather than conditional rendering so it mounts once and remains in the DOM — avoiding layout reflow on open/close.

```tsx
<aside className={`fixed top-0 right-0 w-full sm:w-[400px] ...
  transform transition-transform duration-500
  ${open ? "translate-x-0" : "translate-x-full"}`}
>
```

A `mounted` guard prevents server-side rendering (which has no `localStorage`):

```ts
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### Drawer layout

| Section | Behaviour |
|---|---|
| Header | Title + close button (calls `onClose`) |
| Scrollable body | Renders each `CartItem` with `updateQuantity` ± buttons and a `removeFromCart` link |
| Sticky footer | Shows `totalItems`, `totalPrice`, and the checkout button |

### Checkout minimum

The checkout button is disabled until the cart contains at least **10 items total** (not 10 distinct products):

```tsx
<button
  disabled={totalItems < 10}
  onClick={onCheckout}
>
  {totalItems < 10
    ? `Add ${10 - totalItems} more to checkout`
    : "Proceed to Checkout"}
</button>
```

When the minimum is not met, the button renders in grey with a live count of how many more items are needed.

---

## 7. ProductCard

**File:** `components/ProductCard.tsx`

The card reads its quantity from the global cart on every render, keeping the stepper in sync even if the cart changes elsewhere (e.g. from the drawer):

```ts
useEffect(() => {
  const existing = cart.find((item) => item.id === id);
  setQuantity(existing ? existing.quantity : 0);
}, [cart, id]);
```

### Add to cart (`handleAdd`)

```ts
const handleAdd = () => {
  const existing = cart.find((item) => item.id === id);
  if (!existing) {
    // First add — passes full CartItem object
    addToCart({ id, title, price, image: imageSrc, quantity: 1, region });
    setAdded(true);
    setTimeout(() => setAdded(false), 600); // brief glow animation
  } else if (selectedRegion === region) {
    // Already in cart — increment via updateQuantity
    updateQuantity(id, quantity + 1);
  }
};
```

Note: once an item is in the cart, subsequent taps call `updateQuantity` directly rather than `addToCart`. This bypasses the `addToCart` increment path but arrives at the same result. The `selectedRegion === region` guard prevents the + button from firing if the region has somehow diverged.

### Decrement (`handleSubtract`)

```ts
const handleSubtract = () => {
  const newQty = Math.max(quantity - 1, 0);
  if (newQty === 0) removeFromCart(id);
  else updateQuantity(id, newQty);
};
```

Quantity cannot go below zero. Reaching zero removes the item entirely.

### UI state transitions

| Condition | Rendered |
|---|---|
| `quantity === 0` | "Add to Cart" button |
| `quantity > 0` AND `selectedRegion === region` | `−  {quantity}  +` stepper |
| `quantity > 0` AND `selectedRegion !== region` | Falls back to "Add to Cart" (region divergence guard) |

### Region availability

If `product.available_in` does not include the current `region`, the component returns `null` — the card is completely hidden without any placeholder.

---

## 8. Checkout Page

**File:** `app/checkout/page.tsx`

### Cart reading

```ts
const { cart, totalItems, totalPrice, clearCart, selectedRegion } = useCart();
```

The page reads the cart directly from context. The 10-item minimum is re-validated in `handleSubmit` regardless of what the drawer showed.

### Order number generation

Order numbers use a per-year seed to hide real order volume from the public. This logic was moved to the server-side API route in September 2026. See [order-placement.md](order-placement.md) for the full algorithm, `YEAR_SEEDS` definition, and admin calculation formula.

> **Note:** `generateOrderNumber()` and `YEAR_SEEDS` no longer live in `app/checkout/page.tsx`. They are defined and executed inside `app/api/place-order/route.ts`.

### Order submission flow

```
handleSubmit
  ├── Client-side validation (name, cell, region, branch, payment, min 10 items)
  ├── POST /api/place-order (JSON body)  ← server-side insert via service role
  │       ├── generateOrderNumber() → Supabase query (server-side)
  │       └── supabaseAdmin.from("orders").insert([orderPayload])
  ├── clearCart()  ← immediately after successful API response
  ├── generateFullInvoice() in-memory → PDF blob
  ├── POST /api/send-invoice (FormData: order fields + PDF attachment)  ← fire-and-forget
  └── setShowThankYouModal(true)
```

> The direct `supabase.from("orders").insert()` call and `generateOrderNumber()` were removed from the checkout page in September 2026 when RLS was enabled. Both now live server-side in `app/api/place-order/route.ts`. See [order-placement.md](order-placement.md) and [database-security.md](database-security.md) for full details.

### Order payload shape

```ts
{
  order_number:   "Amal26#0042",
  customer_name:  string,
  phone_number:   string,
  cell_number:    string,
  email:          string | null,
  branch:         "Durban" | "Joburg" | "Cape Town",
  region:         string,  // as selected in the region modal
  payment_method: "Cash on Collection" | "EFT before Collection",
  items: [{ id, title, quantity, price, region }],
  total:          number,
  status:         "pending",
}
```

Branch is auto-detected from the cart's item regions — no manual selection required. `mixedRegions` flag blocks submission if cart somehow contains items from different regions (secondary guard on top of the `addToCart` lock).

### PDF Invoice

Generated with `jsPDF` + `jspdf-autotable`. Produced twice:

1. **On submit:** generated in-memory as a `Blob`, attached to the FormData sent to `/api/send-invoice` for email delivery.
2. **On modal button click:** regenerated with `doc.save()` to download locally.

The PDF includes: logo, order metadata, itemised table with Qty/Price/Subtotal columns, order total, and EFT banking details (Nedbank, Amal Holdings, account 1169327818).

### Email delivery

```ts
await fetch("/api/send-invoice", { method: "POST", body: form })
  .catch((err) => console.error("Email send failed:", err))
  .finally(() => setSendingInvoice(false));
```

Email failures are logged but do not block the thank-you flow — the order is already committed to Supabase by this point. A `SendingInvoiceModal` overlay is shown during the send.

---

## 9. The `useCart` Hook

```ts
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
```

Calling `useCart` outside a `CartProvider` throws immediately with a clear message. All components that touch the cart — `ProductCard`, `CartDrawer`, `CartButton`, `Checkout` — use this hook.

---

## 10. State Flow Summary

```
User taps "Add to Cart" on ProductCard
    │
    ├─ region check passes?
    │       ├─ YES → item added or incremented → cart state updates
    │       │            → localStorage synced via useEffect
    │       │            → CartButton badge re-renders (totalItems)
    │       └─ NO  → toast fires; cart unchanged
    │
User opens CartDrawer
    ├─ adjusts quantities → updateQuantity → cart state
    └─ taps "Proceed to Checkout" (only if totalItems ≥ 10)
            → onCheckout callback → router.push("/checkout")
    │
Checkout page
    ├─ reads cart from context (no re-fetch)
    ├─ on submit → POST /api/place-order → clearCart → PDF → email
    └─ thank-you modal → download invoice → router.push("/thank-you")
```
