"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { MapPin, X, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ───────────── PDF Invoice Generator ───────────── */
async function generateFullInvoice(order: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // 🖼️ Add Amal logo
  const logoUrl = "/images/logo-light.png";
  const logo = await fetch(logoUrl)
    .then((res) => res.blob())
    .then((blob) => URL.createObjectURL(blob));

  doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);

  doc.setFontSize(16);
  doc.text("INVOICE", pageWidth / 2, 40, { align: "center" });

  doc.setFontSize(10);
  const infoLines = [
    `Date: ${new Date().toLocaleDateString()}`,
    `Order Number: ${order.order_number || order.id}`,
    `Customer: ${order.customer_name}`,
    `Cell: ${order.cell_number || order.phone_number || "—"}`,
    `Email: ${order.email || "—"}`,
    `Region: ${order.region || "—"}`,
    `Branch: ${order.branch || "—"}`,
    `Payment Method: ${order.payment_method || "—"}`,
  ];
  infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));

  const rows = order.items.map((i: any) => [
    i.title,
    i.quantity,
    `R${i.price.toFixed(2)}`,
    `R${(i.price * i.quantity).toFixed(2)}`,
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

  // 🏦 Banking Details
  doc.setFontSize(10);
  const bankY = lastY + 25;
  doc.text("EFT Banking Details:", 14, bankY);
  doc.text("Bank: Albaraka Bank", 14, bankY + 6);
  doc.text("Account Name: Amal Holdings", 14, bankY + 12);
  doc.text("Account Number: 78600236323", 14, bankY + 18);
  doc.text("Reference: Your Full Name", 14, bankY + 24);
  doc.text(
    "Please send proof of payment to your nearest branch before collection.",
    14,
    bankY + 30
  );

  const filename = `AmalFoods_Invoice_${order.customer_name}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}

/* ───────────── Main Checkout ───────────── */
export const runtime = "nodejs";

export default function Checkout() {
  const { cart, totalItems, totalPrice, clearCart, selectedRegion } = useCart();

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

  /* ───────────── Auto-Detect Branch ───────────── */
  useEffect(() => {
    if (cart.length === 0) return;
    const regions = cart.map((item: any) => item.region?.toLowerCase?.()).filter(Boolean);
    const uniqueRegions = Array.from(new Set(regions));
    if (uniqueRegions.length > 1) {
      setMixedRegions(true);
      setBranch("");
    } else {
      setMixedRegions(false);
      const region = uniqueRegions[0] || selectedRegion;
      if (region === "durban") setBranch("Durban");
      else if (region === "joburg") setBranch("Joburg");
      else if (region === "capetown") setBranch("Cape Town");
    }
  }, [cart, selectedRegion]);

  /* ───────────── Validate SA Cell ───────────── */
  const validateCell = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");
    const saRegex = /^(?:\+27|27|0)[6-8][0-9]{8}$/; // South African mobile numbers: 06–08 start
    if (cleaned === "") return setCellError(null);
    if (!saRegex.test(cleaned)) {
      setCellError("Enter a valid South African cellphone number");
    } else {
      setCellError(null);
    }
  };

  /* ───────────── Generate Order Number ───────────── */
const generateOrderNumber = async () => {
  try {
    const { data: latest, error } = await supabase
      .from("orders")
      .select("order_number, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    const currentYear = new Date().getFullYear().toString().slice(-2);
    let nextSeq = 1;

    if (latest?.order_number) {
      const match = latest.order_number.match(/#(\d+)$/);
      if (match && match[1]) nextSeq = parseInt(match[1]) + 1;
    }

    return `Amal${currentYear}#${nextSeq.toString().padStart(4, "0")}`;
  } catch (err) {
    console.error("Error generating order number:", err);
    return `Amal${new Date().getFullYear().toString().slice(-2)}#0001`;
  }
};


  /* ───────────── Submit order ───────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate all required fields
    if (!name.trim()) return setError("Please enter your full name.");
    if (!cell.trim()) return setError("Please enter your cell number.");
    if (cellError) return setError("Please enter a valid South African cellphone number.");
    if (!region) return setError("Please select a region.");
    if (!branch) return setError("Branch could not be determined. Please try again.");
    if (!paymentMethod)
      return setError("Please select your payment method before submitting.");
    if (totalItems < 10) return setError("Minimum order is 10 items.");
    if (mixedRegions)
      return setError("Your cart has items from multiple regions. Please split orders.");

    setLoading(true);
    setError(null);

    const orderNumber = await generateOrderNumber();


    try {
      const orderPayload = {
        order_number: orderNumber,
        customer_name: name.trim(),
        phone_number: phone || cell,
        cell_number: cell || phone,
        email: email || null,
        branch,
        region,
        payment_method:
          paymentMethod === "cash" ? "Cash on Collection" : "EFT before Collection",
        items: cart.map((i) => ({
          id: i.id,
          title: i.title,
          quantity: i.quantity,
          price: i.price,
          region: (i as any).region,
        })),
        total: totalPrice,
        status: "pending",
      };

      const { data, error: insertError } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select()
        .single();

      if (insertError) throw insertError;

      setOrderData(data);
      clearCart();
      setShowThankYouModal(true);
    } catch (err: any) {
      console.error("⚠️ Order insert failed:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen text-white px-6 md:px-16 pb-20 pt-40 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      <div className="max-w-7xl mx-auto bg-black/50 backdrop-blur-sm p-10 rounded-2xl border border-white/10 shadow-[0_0_35px_rgba(255,0,0,0.1)]">
        <h1 className="text-3xl md:text-4xl font-bold text-center md:text-left text-white mb-12 drop-shadow-md">
          Almost there! Review and Checkout.
        </h1>

        <div className="flex flex-col md:flex-row gap-10">
          {/* 🧾 Review Section */}
          <section className="flex-1 bg-black/60 p-6 rounded-2xl border border-white/10 shadow-inner">
            <h2 className="text-xl font-semibold mb-6 text-[#B80013]">Review</h2>

            {cart.length === 0 ? (
              <p className="text-gray-400">Your cart is empty.</p>
            ) : (
              <>
                <ul className="divide-y divide-white/10 mb-4">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center py-2 text-sm text-gray-300"
                    >
                      <span>{item.title}</span>
                      <span className="text-white font-semibold">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-white/10 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-white">
                      R{totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 text-xs text-gray-400 border border-white/10 rounded-lg p-3 bg-[#111]/70">
                  Minimum order quantity is <strong>10 items per cart</strong>.
                </div>

                <div className="mt-6">
                  <Link
                    href="/products"
                    className="text-sm text-gray-300 hover:text-white transition"
                  >
                    ← Continue Shopping
                  </Link>
                </div>
              </>
            )}
          </section>

          {/* 👤 Customer Form (expanded, no scroll) */}
          <form
            onSubmit={handleSubmit}
            className="flex-[1.5] bg-black/60 p-8 rounded-2xl border border-white/10 shadow-inner"
          >
            <h2 className="text-xl font-semibold mb-6 text-[#B80013]">
              Customer Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
              />
              <input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
              />
              <input
                placeholder="Telephone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
              />
              <div className="flex flex-col">
                <input
                  required
                  placeholder="Cell (e.g. 0821234567)"
                  value={cell}
                  onChange={(e) => {
                    setCell(e.target.value);
                    validateCell(e.target.value);
                  }}
                  className={`rounded-lg px-4 py-2.5 bg-black/50 border ${
                    cellError ? "border-red-600" : "border-white/20"
                  } focus:border-red-600 outline-none`}
                />
                {cellError && (
                  <p className="text-red-500 text-xs mt-1">{cellError}</p>
                )}
              </div>
            </div>

            {/* 🌍 Region Selector */}
            <div className="mt-5">
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Select Region
              </label>
              <button
                type="button"
                onClick={() => setShowRegionModal(true)}
                className="w-full rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 text-left text-gray-200 hover:bg-white/10 transition"
              >
                {region ? (
                  <span className="font-semibold text-white">Region: {region}</span>
                ) : (
                  <span className="text-gray-400">Tap to choose your region</span>
                )}
              </button>
            </div>

            {/* 🏬 Pickup Branch (indicator) */}
            <div className="mt-5">
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Pickup Branch
              </label>
              <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 text-gray-200 text-sm">
                <MapPin size={18} className="text-red-500" />
                {mixedRegions ? (
                  <span className="text-red-400 font-medium">
                    ⚠ Mixed regions detected — please checkout separately.
                  </span>
                ) : branch ? (
                  <span className="font-semibold text-white">Pickup from {branch}</span>
                ) : (
                  <span className="text-gray-400">Auto-selecting branch...</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Branch is automatically set based on your product region.
              </p>
            </div>

            {/* 💳 Payment */}
            <div className="mt-6">
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Payment Method
              </label>
              <div className="flex flex-col gap-3 text-sm text-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                    className="accent-[#B80013] w-4 h-4"
                  />
                  <span>💵 Cash on Collection</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="eft"
                    checked={paymentMethod === "eft"}
                    onChange={(e) => setPaymentMethod(e.target.value as "eft")}
                    className="accent-[#B80013] w-4 h-4"
                  />
                  <span>💳 EFT before Collection</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                type="submit"
                disabled={loading}
                className={`rounded-full px-8 py-3 font-semibold text-sm transition-all ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                }`}
              >
                {loading ? "Submitting..." : "Submit Order"}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium mt-4">{error}</p>
            )}
          </form>
        </div>
      </div>

      {/* 🌍 Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111]/95 border border-white/10 rounded-2xl p-6 w-[90%] max-w-md text-center shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#B80013]">
                Select Your Region
              </h2>
              <button
                onClick={() => setShowRegionModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {["Durban & Surrounding Areas", "PMB", "Tongaat", "Stanger", "Richards Bay", "Other"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRegion(r);
                    setShowRegionModal(false);
                  }}
                  className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                    region === r
                      ? "bg-[#B80013] text-white"
                      : "bg-white/10 text-gray-200 hover:bg-white/20"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Thank You Modal */}
      {showThankYouModal && orderData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111]/95 border border-white/10 rounded-2xl p-8 w-[90%] max-w-md text-center shadow-2xl">
            <Image
              src="/images/logo-dark.png"
              alt="Amal Foods"
              width={120}
              height={40}
              className="mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-[#B80013] mb-3">
              Thank You!
            </h2>
            <p className="text-gray-300 text-sm mb-4">
              Your order has been submitted successfully.
            </p>
            <div className="text-sm text-gray-400 mb-6">
              <p><strong>Order Number:</strong> {orderData.order_number || orderData.id}</p>
              <p><strong>Total:</strong> R{Number(orderData.total).toFixed(2)}</p>
              <p><strong>Branch:</strong> {orderData.branch}</p>
              <p><strong>Region:</strong> {orderData.region}</p>
            </div>
            <button
              type="button"
              onClick={() => { void generateFullInvoice(orderData); }}
              className="inline-flex items-center gap-2 bg-[#B80013] hover:bg-[#a20010] text-white px-6 py-2.5 rounded-full font-semibold transition"
            >
              <FileDown size={16} /> Download Invoice (PDF)
            </button>
            <div className="mt-5">
              <button
                onClick={() => setShowThankYouModal(false)}
                className="text-gray-400 text-sm hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
