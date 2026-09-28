# Invoice & Email

**Files involved:**
- `app/checkout/page.tsx` — client-side PDF blob generation
- `app/api/send-invoice/route.ts` — server-side PDF regeneration + Brevo delivery

---

## 1. Overview

Every successful order triggers two invoice actions:

1. **Download** — PDF generated in the browser with `jsPDF`, saved locally when the customer clicks "Download Invoice" in the thank-you modal.
2. **Email** — The same PDF is regenerated server-side in `/api/send-invoice`, attached to an HTML email, and sent via Brevo to the customer and `orders@amalfoods.co.za`.

---

## 2. Client-side PDF (`app/checkout/page.tsx` — `generateFullInvoice`)

Built in the browser using `jsPDF` and `jspdf-autotable`. Triggered when the customer clicks "Download Invoice" in the thank-you modal.

**Structure:**
```
[Amal Foods logo — centered]
PROFORMA INVOICE

Date / Order Number / Customer / Cell / Email / Region / Branch / Payment Method

[Itemised table — Item | Qty | Price | Subtotal]
[Total]

EFT Banking Details:
  Bank: Nedbank
  Account Name: Amal Holdings
  Account Number: 1169327818
  Reference: Your Full Name
```

Logo is fetched from `/images/logo-light.png` at runtime and embedded as a `blob:` URL.

---

## 3. Server-side PDF (`app/api/send-invoice/route.ts`)

Identical structure to the client PDF but runs on the server using Node.js `fs` to read the logo from disk (`public/images/logo-light.png`), avoiding the browser `fetch` call. Exports to base64 for attachment.

```ts
const logoPath = path.join(process.cwd(), "public/images/logo-light.png");
const logoBase64 = fs.readFileSync(logoPath).toString("base64");
// ...
const pdfBase64 = Buffer.from(doc.output("arraybuffer")).toString("base64");
```

Runtime is set to `"nodejs"` (not Edge) because `fs` is required.

---

## 4. Email Delivery — Brevo

**Provider:** Brevo REST API (`BREVO_API_KEY`)  
**Endpoint:** `POST https://api.brevo.com/v3/smtp/email`  
**From:** `Amal Foods <admin@amalfoods.co.za>`  
**Reply-To:** `orders@amalfoods.co.za`  
**To:** customer email  
**CC:** `orders@amalfoods.co.za` (operations team receives a copy on every order)

No SDK is used — the route calls the Brevo REST API directly via `fetch`, keeping the dependency footprint minimal.

### Brevo setup requirements

- Domain `amalfoods.co.za` must be verified under **Settings → Senders & IP → Domains** (SPF, DKIM, DMARC DNS records added).
- Sender `admin@amalfoods.co.za` must be added under **Settings → Senders & IP → Senders**.
- API key created under **Profile → SMTP & API → API Keys** and set as `BREVO_API_KEY` in `.env.local` and Vercel environment variables.

### Request format

`/api/send-invoice` accepts `multipart/form-data`:

| Field | Type |
|---|---|
| `email` | string (required) |
| `name` | string |
| `order-number` | string |
| `total` | string (number) |
| `branch` | string |
| `region` | string |
| `payment-method` | string |
| `items` | JSON string of `{title, quantity, price}[]` |

> The PDF is always regenerated server-side — the route does not accept or use a PDF blob from the client.

### Timeout

The Brevo fetch call uses an 8-second timeout wrapper. Failures are logged but do not block the checkout success flow — the order is already committed to Supabase before the email is sent.

---

## 5. EFT Banking Details

Embedded in both the PDF and the email:

```
Bank:           Nedbank
Account Name:   Amal Holdings
Account Number: 1169327818
Reference:      Your Full Name
```

Customers are instructed to email proof of payment to `orders@amalfoods.co.za` before collection.
