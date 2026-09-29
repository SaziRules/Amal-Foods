"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Image from "next/image";
import { MapPin, X, FileDown, ArrowRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SendingInvoiceModal from "@/components/SendingInvoiceModal";


/* ───────────── PDF Invoice Generator ───────────── */
async function generateFullInvoice(order: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoUrl = "/images/logo-light.png";
  const logo = await fetch(logoUrl)
    .then((res) => res.blob())
    .then((blob) => URL.createObjectURL(blob));

  doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);
  doc.setFontSize(16);
  doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(10);
  const infoLines = [
    `Date: ${new Date().toLocaleDateString()}`,
    `Order Number: ${order.order_number || order.id}`,
    `Customer: ${order.customer_name}`,
    `Cell: ${order.cell_number || order.phone_number || "-"}`,
    `Email: ${order.email || "-"}`,
    `Region: ${order.region || "-"}`,
    `Branch: ${order.branch || "-"}`,
    `Payment Method: ${order.payment_method || "-"}`,
  ];
  infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));

  const rows = order.items.map((i: any) => [
    i.title, i.quantity, `R${i.price.toFixed(2)}`, `R${(i.price * i.quantity).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 55 + infoLines.length * 6 + 5,
    head: [["Item", "Qty", "Price", "Subtotal"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [184, 0, 19] },
  });

  const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
  doc.setFontSize(11);
  doc.text(`Total: R${order.total.toFixed(2)}`, 14, lastY + 10);

  doc.setFontSize(10);
  const bankY = lastY + 25;
  doc.text("EFT Banking Details:", 14, bankY);
  doc.text("Bank: Nedbank", 14, bankY + 6);
  doc.text("Account Name: Amal Holdings", 14, bankY + 12);
  doc.text("Account Number: 1169327818", 14, bankY + 18);
  doc.text("Reference: Your Full Name", 14, bankY + 24);
  doc.text("Please send proof of payment to your nearest branch before collection.", 14, bankY + 30);

  const filename = `AmalFoods_Invoice_${order.customer_name}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/* ───────────── Main Checkout ───────────── */
export const runtime = "nodejs";

export default function Checkout() {
  const router = useRouter();
  const { cart, totalItems, qualifyingItems, totalPrice, clearCart, selectedRegion, hydrated } = useCart();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cell, setCell] = useState("");
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState("");
  const [mixedRegions, setMixedRegions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "eft" | "">("");
  const [cellError, setCellError] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (cart.length === 0) return;
    const regions = cart.map((item: any) => item.region?.toLowerCase?.()).filter(Boolean);
    const uniqueRegions = Array.from(new Set(regions));
    if (uniqueRegions.length > 1) {
      setMixedRegions(true);
      setBranch("");
    } else {
      setMixedRegions(false);
      const r = uniqueRegions[0] || selectedRegion;
      if (r === "durban") setBranch("Durban");
      else if (r === "joburg") setBranch("Joburg");
      else if (r === "capetown") setBranch("Cape Town");
    }
  }, [cart, selectedRegion]);

  const validateCell = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");
    const saRegex = /^(?:\+27|27|0)[6-8][0-9]{8}$/;
    if (cleaned === "") return setCellError(null);
    setCellError(!saRegex.test(cleaned) ? "Enter a valid South African cellphone number" : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your full name.");
    if (!cell.trim()) return setError("Please enter your cell number.");
    if (cellError) return setError("Please enter a valid South African cellphone number.");
    if (!region) return setError("Please select a region.");
    if (!branch) return setError("Branch could not be determined. Please try again.");
    if (!paymentMethod) return setError("Please select your payment method before submitting.");
    if (qualifyingItems < 10) return setError("Minimum order is 10 items.");
    if (mixedRegions) return setError("Your cart has items from multiple regions. Please split orders.");

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          phone_number: phone || cell,
          cell_number: cell || phone,
          email: email || null,
          branch, region,
          payment_method: paymentMethod === "cash" ? "Cash on Collection" : "EFT before Collection",
          items: cart.map((i) => ({ id: i.id, title: i.title, quantity: i.quantity, price: i.price, region: (i as any).region })),
          total: totalPrice,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to place order");
      const data = json.data;

      setOrderData(data);
      clearCart();

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoUrl = "/images/logo-light.png";
      const logo = await fetch(logoUrl).then((r) => r.blob()).then((b) => URL.createObjectURL(b));

      doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);
      doc.setFontSize(16);
      doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });
      doc.setFontSize(10);
      const infoLines = [
        `Date: ${new Date().toLocaleDateString()}`,
        `Order Number: ${data.order_number || data.id}`,
        `Customer: ${data.customer_name}`,
        `Cell: ${data.cell_number || data.phone_number || "-"}`,
        `Email: ${data.email || "-"}`,
        `Region: ${data.region || "-"}`,
        `Branch: ${data.branch || "-"}`,
        `Payment Method: ${data.payment_method || "-"}`,
      ];
      infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));
      const rows = data.items.map((i: any) => [i.title, i.quantity, `R${i.price.toFixed(2)}`, `R${(i.price * i.quantity).toFixed(2)}`]);
      autoTable(doc, {
        startY: 55 + infoLines.length * 6 + 5,
        head: [["Item", "Qty", "Price", "Subtotal"]],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [184, 0, 19] },
      });
      const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
      doc.setFontSize(11);
      doc.text(`Total: R${data.total.toFixed(2)}`, 14, lastY + 10);
      doc.setFontSize(10);
      const bankY = lastY + 25;
      doc.text("EFT Banking Details:", 14, bankY);
      doc.text("Bank: Nedbank", 14, bankY + 6);
      doc.text("Account Name: Amal Holdings", 14, bankY + 12);
      doc.text("Account Number: 1169327818", 14, bankY + 18);
      doc.text("Reference: Your Full Name", 14, bankY + 24);
      doc.text("Please send proof of payment to your nearest branch before collection.", 14, bankY + 30);

      const pdfBlob = doc.output("blob");
      const form = new FormData();
      form.append("order-number", data.order_number);
      form.append("total", String(data.total));
      form.append("branch", data.branch);
      form.append("region", data.region);
      form.append("payment-method", data.payment_method || "");
      form.append("email", data.email);
      form.append("name", data.customer_name);
      form.append("items", JSON.stringify(data.items));
      form.append("pdf", new File([pdfBlob], `${data.order_number}.pdf`, { type: "application/pdf" }));

      setSendingInvoice(true);
      await fetch("/api/send-invoice", { method: "POST", body: form })
        .catch((err) => console.error("Email send failed:", err))
        .finally(() => setSendingInvoice(false));

      setShowThankYouModal(true);
    } catch (err: any) {
      console.error("Order insert failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return null;

  return (
    <main
      className="min-h-screen flex items-start md:items-center justify-center px-4 py-8 text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      {/* dark overlay so card reads cleanly against the bg image */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* ── Centered card ── */}
      <div className="relative w-full max-w-5xl bg-[#111] rounded-2xl md:rounded-3xl border border-white/[0.07] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 md:px-10 py-5 md:py-6 border-b border-white/[0.06]">
          <Link href="/">
            <Image src="/images/logo-dark.png" alt="Amal Foods" width={110} height={38} className="h-7 md:h-8 w-auto" />
          </Link>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/25 font-bold">Checkout</p>
        </div>

        {/* Body — stacked on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row md:divide-x divide-white/[0.06]">

          {/* ── Order Review ── */}
          <div className="md:w-[42%] px-6 md:px-10 py-6 md:py-8 flex flex-col border-b border-white/[0.06] md:border-b-0">
            <h2
              className="text-3xl md:text-[32px] font-extrabold uppercase leading-none mb-1"
              style={{ fontFamily: "var(--font-roboto-condensed)" }}
            >
              Your Order.
            </h2>
            <p className="text-white/30 text-xs mb-5">Min. 10 qualifying items per order.</p>

            {cart.length === 0 ? (
              <p className="text-white/30 text-sm">
                Your cart is empty.{" "}
                <Link href="/products" className="text-[#B80013] hover:underline">Browse products</Link>
              </p>
            ) : (
              <>
                {/* on mobile show all items; on desktop cap + scroll */}
                <ul className="divide-y divide-white/[0.05] md:overflow-y-auto md:max-h-[260px] md:pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {cart.map((item) => (
                    <li key={item.id} className="flex justify-between items-center py-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-white/75 truncate">{item.title}</p>
                        <p className="text-xs text-white/30">x{item.quantity} &nbsp;&nbsp;R{item.price.toFixed(2)} each</p>
                      </div>
                      <span className="text-sm text-white/50 shrink-0">R{(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                      Total &nbsp;·&nbsp; {totalItems} items
                    </span>
                    <span className="text-lg font-bold">R{totalPrice.toFixed(2)}</span>
                  </div>
                  <Link href="/products" className="mt-3 inline-block text-[11px] text-white/20 hover:text-white/45 transition-colors">
                    ← Continue shopping
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* ── Customer Details Form ── */}
          <form onSubmit={handleSubmit} className="flex-1 px-6 md:px-10 py-6 md:py-8 flex flex-col gap-6">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/30 font-bold">Customer Details</p>

            {/* Inputs — single col mobile, 2-col desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Full Name</label>
                <input
                  required
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-b border-white/12 focus:border-[#B80013] pb-2.5 text-white text-base placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-b border-white/12 focus:border-[#B80013] pb-2.5 text-white text-base placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Cell Number</label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  placeholder="e.g. 0821234567"
                  value={cell}
                  onChange={(e) => { setCell(e.target.value); validateCell(e.target.value); }}
                  className={`bg-transparent border-b pb-2.5 text-white text-base placeholder-white/20 outline-none transition-colors ${cellError ? "border-[#B80013]" : "border-white/12 focus:border-[#B80013]"}`}
                />
                {cellError && <p className="text-[#B80013] text-[11px]">{cellError}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
                  Telephone <span className="normal-case tracking-normal opacity-40">(optional)</span>
                </label>
                <input
                  placeholder="Landline or alternative"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent border-b border-white/12 focus:border-[#B80013] pb-2.5 text-white text-base placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Region</label>
                <button
                  type="button"
                  onClick={() => setShowRegionModal(true)}
                  className="bg-transparent border-b border-white/12 active:border-[#B80013] hover:border-[#B80013] pb-2.5 text-left text-base transition-colors min-h-[44px] flex items-end"
                >
                  {region
                    ? <span className="text-white">{region}</span>
                    : <span className="text-white/20">Select your region</span>}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Pickup Branch</label>
                <div className="flex items-center gap-2 border-b border-white/12 pb-2.5 text-base min-h-[44px]">
                  <MapPin size={14} className="text-[#B80013] shrink-0" />
                  {mixedRegions
                    ? <span className="text-[#B80013] text-sm">Mixed regions — please split orders</span>
                    : branch
                      ? <span className="text-white">{branch}</span>
                      : <span className="text-white/20">Auto-set from your cart</span>}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Payment Method</label>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === "cash"} onChange={(e) => setPaymentMethod(e.target.value as "cash")} className="accent-[#B80013] w-4 h-4 shrink-0" />
                  <span className="text-sm text-white/55">Cash on Collection</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                  <input type="radio" name="paymentMethod" value="eft" checked={paymentMethod === "eft"} onChange={(e) => setPaymentMethod(e.target.value as "eft")} className="accent-[#B80013] w-4 h-4 shrink-0" />
                  <span className="text-sm text-white/55">EFT before Collection</span>
                </label>
              </div>
            </div>

            {error && <p className="text-[#B80013] text-xs leading-relaxed">{error}</p>}

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-[#B80013] active:bg-[#a20010] hover:bg-[#a20010] text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : <><span>Submit Order</span><ArrowRight size={13} /></>}
            </button>
          </form>
        </div>
      </div>

      {/* ── Region Modal ── */}
      {showRegionModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 px-4 pb-[env(safe-area-inset-bottom)]">
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl mb-4 sm:mb-0">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">Select Region</p>
              <button onClick={() => setShowRegionModal(false)} className="text-white/30 hover:text-white p-1"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-2">
              {["Durban & Surrounding Areas", "PMB", "Tongaat", "Stanger", "Richards Bay", "Other"].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRegion(r); setShowRegionModal(false); }}
                  className={`py-3.5 rounded-full text-sm font-semibold transition-all min-h-[44px] ${region === r ? "bg-[#B80013] text-white" : "bg-white/[0.07] text-white/55 active:bg-white/15"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Thank You Modal ── */}
      {showThankYouModal && orderData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl">
            <Image src="/images/logo-dark.png" alt="Amal Foods" width={110} height={38} className="mx-auto mb-5 h-8 w-auto" />
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#B80013] font-bold mb-2">Order Confirmed</p>
            <h2 className="text-3xl font-extrabold uppercase leading-none mb-4" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
              Thank You!
            </h2>
            <p className="text-white/35 text-sm mb-5 leading-relaxed">Your order has been submitted successfully.</p>
            <div className="text-xs text-white/30 space-y-1.5 mb-7 text-left">
              <p><span className="text-white/50 w-14 inline-block">Order</span>{orderData.order_number || orderData.id}</p>
              <p><span className="text-white/50 w-14 inline-block">Total</span>R{Number(orderData.total).toFixed(2)}</p>
              <p><span className="text-white/50 w-14 inline-block">Branch</span>{orderData.branch}</p>
              <p><span className="text-white/50 w-14 inline-block">Region</span>{orderData.region}</p>
            </div>
            <button
              type="button"
              onClick={() => { void generateFullInvoice(orderData); setTimeout(() => router.push("/thank-you"), 800); }}
              className="w-full flex items-center justify-center gap-2 bg-[#B80013] active:bg-[#a20010] hover:bg-[#a20010] text-white font-bold uppercase text-[11px] tracking-widest py-4 rounded-full transition-all duration-200"
            >
              <FileDown size={14} /><span>Download Invoice</span>
            </button>
            <button onClick={() => router.push("/thank-you")} className="mt-4 text-white/20 text-xs hover:text-white/45 transition-colors min-h-[44px] flex items-center justify-center w-full">
              Close
            </button>
          </div>
        </div>
      )}

      <SendingInvoiceModal open={sendingInvoice} />
    </main>
  );
}
