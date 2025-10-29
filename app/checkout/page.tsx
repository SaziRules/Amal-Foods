"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ───────────── PDF + Email Logic ───────────── */
async function generateInvoicePDF(order: any) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Amal Foods — Invoice", 14, 20);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
  doc.text(`Customer: ${order.customer_name}`, 14, 34);
  if (order.email) doc.text(`Email: ${order.email}`, 14, 40);
  doc.text(`Branch: ${order.branch}`, 14, 46);
  doc.text(`Payment: ${order.payment_method}`, 14, 52);

  const rows = order.items.map((i: any) => [
    i.title,
    i.quantity,
    `R${i.price.toFixed(2)}`,
    `R${(i.price * i.quantity).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [["Item", "Qty", "Price", "Subtotal"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [184, 0, 19] },
  });

  const totalY = ((doc as any).lastAutoTable?.finalY ?? 60) + 10;
  doc.setFontSize(12);
  doc.text(`Total: R${order.total.toFixed(2)}`, 14, totalY);
  return doc.output("blob");
}

async function sendInvoiceEmail(order: any) {
  try {
    const pdfBlob = await generateInvoicePDF(order);
    const formData = new FormData();
    formData.append("pdf", pdfBlob, `Invoice_${order.customer_name}.pdf`);
    formData.append("email", order.email);
    formData.append("name", order.customer_name);
    formData.append("total", order.total.toString());
    await fetch("/api/send-invoice", { method: "POST", body: formData });
  } catch (err) {
    console.error("⚠️ Invoice email failed:", err);
  }
}

/* ───────────── Main Checkout Component ───────────── */
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
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "eft" | "">("");

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

  /* ───────────── Submit Order ───────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mixedRegions)
      return setError("Your cart has items from multiple regions. Please split orders by branch.");
    if (totalItems < 10) return setError("Minimum order is 10 items.");
    if (!branch) return setError("Unable to determine branch. Please check your cart region.");
    if (!paymentMethod) return setError("Please select a payment method.");
    if (!region) return setError("Please select your region.");

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const orderPayload = {
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const { error: insertError } = await supabase
        .from("orders")
        .insert([orderPayload])
        .abortSignal(controller.signal);

      clearTimeout(timeout);
      if (insertError) throw insertError;

      if (email) sendInvoiceEmail(orderPayload);

      clearCart();
      setSuccess(true);
      setShowSignup(true);
      setPaymentMethod("");
    } catch (err: any) {
      console.error("⚠️ Order insert failed:", err);
      setError(
        err.name === "AbortError"
          ? "Connection timed out. Please check your internet and try again."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ───────────── Magic Signup ───────────── */
  const handleMagicSignup = async () => {
    if (!email) return setError("Enter your email to receive a signup link.");
    const { error: signupError } = await supabase.auth.signInWithOtp({ email });
    if (signupError) setError(signupError.message);
    else alert("A signup link has been sent to your email!");
  };

  /* ───────────── UI ───────────── */
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
          {/* 🧾 Order Summary */}
          <section className="flex-1 bg-black/60 p-6 rounded-2xl border border-white/10 shadow-inner">
            <h2 className="text-xl font-semibold mb-6 text-[#B80013]">Review</h2>
            {cart.length === 0 ? (
              <p className="text-gray-400">Your cart is empty.</p>
            ) : (
              <>
                <ul className="divide-y divide-white/10 mb-4">
                  {cart.map((item) => (
                    <li key={item.id} className="flex justify-between items-center py-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.title}</span>
                        {item.quantity > 1 && (
                          <span className="px-2.5 py-0.5 text-[11px] rounded-full bg-[#B80013] text-white font-semibold tracking-wide uppercase shadow-[0_0_6px_rgba(184,0,19,0.5)]">
                            {item.quantity} Units
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-white">
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
                    <span className="font-semibold text-white">R{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <div className="mt-5 text-xs text-gray-400 border border-white/10 rounded-lg p-3 bg-[#111]/70">
              Minimum order is <strong>10 items</strong>.
            </div>
            <div className="mt-6">
              <Link href="/products" className="text-sm text-gray-300 hover:text-white transition">
                ← Continue shopping
              </Link>
            </div>
          </section>

          {/* 👤 Customer Details */}
          <form
            onSubmit={handleSubmit}
            className="flex-[1.5] bg-black/60 p-8 rounded-2xl border border-white/10 shadow-inner max-h-[600px] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold mb-6 text-[#B80013]">Customer Details</h2>

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
              <input
                placeholder="Cell"
                value={cell}
                onChange={(e) => setCell(e.target.value)}
                className="rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
              />
            </div>

            {/* 🌍 Region Modal Trigger */}
            <div className="mt-5">
              <label className="block text-sm font-semibold mb-2 text-gray-200">Select Region</label>
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
              <p className="text-xs text-gray-400 mt-2">
                Please select the region closest to your collection area.
              </p>
            </div>

            {/* 💳 Payment Method */}
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

              {paymentMethod === "eft" && (
                <div className="mt-4 bg-[#111]/80 border border-white/20 rounded-lg p-4 text-sm text-gray-200">
                  <h3 className="text-[#B80013] font-semibold mb-2">EFT Banking Details</h3>
                  <p><strong>Bank:</strong> Albaraka Bank</p>
                  <p><strong>Account Name:</strong> Amal Holdings</p>
                  <p><strong>Account Number:</strong> 78600236323</p>
                  <p>
                    <strong>Ref:</strong>{" "}
                    <span className="italic text-white/90">
                      {name ? name : "Your Full Name"}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Please use your full name as reference and send proof of payment
                    to your nearest branch before collection.
                  </p>
                </div>
              )}
            </div>

            {/* 🏬 Pickup Branch */}
            <div className="mt-6">
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
                Branch automatically set based on your product region.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm font-medium mt-4">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                type="submit"
                disabled={loading || totalItems < 10}
                className={`rounded-full px-8 py-3 font-semibold text-sm transition-all ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-red-700 hover:bg-red-800 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                }`}
              >
                {loading ? "Submitting..." : "Submit Order"}
              </button>

              {showSignup && (
                <button
                  type="button"
                  onClick={handleMagicSignup}
                  className="rounded-full px-8 py-3 bg-white text-black text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Signup in One-click (Magic Link)
                </button>
              )}
            </div>

            {success && (
              <p className="text-green-400 text-sm mt-4">
                ✅ Order submitted successfully! We’ll contact you soon.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 🌍 Region Modal */}
      {showRegionModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#111]/95 border border-white/10 rounded-2xl p-6 w-[90%] max-w-md text-center shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#B80013]">Select Your Region</h2>
              <button onClick={() => setShowRegionModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {["PMB", "Tongaat", "Stanger", "Richards Bay", "Other"].map((r) => (
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
    </main>
  );
}
