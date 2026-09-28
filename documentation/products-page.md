# Products Page

**File:** `app/products/page.tsx`  
**Route:** `/products`

---

## 1. Overview

The products page is the primary shopping interface. It combines:
- A countdown to orders opening (1 October 2026)
- A Sanity-powered product grid
- A sidebar with category filters, label filters, and a price range slider
- An inline `− qty +` stepper on each card (inactive pre-launch, live post-launch)

---

## 2. Sanity Data Fetch

```ts
client.fetch<Product[]>(
  `*[_type == "product" && active == true && category != "internal-stock"]
    { _id, title, category, label, unit, image, pricing }
    | order(category asc, title asc)`
)
```

Only `active` products are shown. `internal-stock` category is explicitly excluded. Pricing is an object: `{ durban?: number; joburg?: number }`. `getPrice(p)` returns `durban ?? joburg ?? null`.

---

## 3. Countdown

`ORDER_DATE = new Date('2026-10-01T00:00:00')`. A `setInterval` ticks every second computing `{ days, hours, minutes, seconds }`. When `dist <= 0`, `launched` flips to `true` and the countdown section unmounts. The same `launched` boolean activates the cart steppers on product cards.

---

## 4. Filters

All filter state is maintained in `ProductsPage`. `SidebarFilters` is defined at **module scope** (not inside `ProductsPage`) to prevent React remounting it on every state change.

### Category filter
- Multi-select — `selectedCategories: string[]`
- `toggleCategory` adds/removes from the array (OR logic across selected categories)
- Counts shown per category, updates as other filters change

### Label filter
- Same multi-select pattern — `selectedLabels: string[]`
- Labels: `new`, `crumbed`, `ready-to-heat`, `limited`, `seasonal`

### Price range slider
- Dual-range slider — two overlapping `<input type="range">` elements
- Container height `28px`, inputs at `height: 100%` for full hit area
- `pointer-events: none` on inputs, `pointer-events: all` on CSS thumbs
- Z-index swaps when thumbs are within 10% of each other so the lo thumb stays reachable
- Bounds derived from the actual product data (`useMemo`)

### URL-based pre-selection
Navigating from the homepage slider deep-links to `/products?category=samoosas`. On mount:
```ts
const cat = searchParams.get('category');
if (cat && CATEGORY_LABELS[cat]) setSelectedCategories([cat]);
```

---

## 5. Sorting

Sort state: `'default' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'`

All sorts use `[...list].sort(...)` (immutable — never mutates the source array). Displayed in a right-aligned dropdown above the grid with a `SORT BY:` label.

---

## 6. Product Card

Each card shows:
- Product image (from Sanity, `aspect-[4/3]`) or a red gradient placeholder
- Category label + label badge (`new`, `crumbed`, etc.)
- Title + unit
- Price (`R{price}` large, or `Price TBC`)
- "Add to Cart" label + `− qty +` stepper

### Cart stepper behaviour

| State | Behaviour |
|---|---|
| `!launched` or `price === null` | Buttons disabled (`opacity-20`, `cursor-not-allowed`) |
| `launched`, `quantity === 0` | + adds item via `addToCart`, sets qty to 1 |
| `launched`, `quantity > 0` | + calls `updateQuantity(id, qty+1)`, − decrements or removes at 0 |

Quantity is synced from the global cart via `useEffect` so it stays accurate if changed from the drawer.

---

## 7. Grid Animation

```tsx
<motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
  <AnimatePresence mode="popLayout">
    {filtered.map(product => <ProductCard key={product._id} ... />)}
  </AnimatePresence>
</motion.div>
```

`mode="popLayout"` removes exiting cards from layout flow immediately (sets to `position: absolute`) so remaining cards reflow without gaps or flashes. Each card animates `opacity` + `scale` over 200ms.

---

## 8. Mobile Filter Drawer

On screens below `lg`, filters are hidden and accessible via a "Filters" button that opens a left-side `motion.aside` with a spring transition. A sticky "Show N Products" button at the bottom closes the drawer.
