"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Checkout() {
  const { cart, totalItems, totalPrice, clearCart, selectedRegion } = useCart();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cell, setCell] = useState("");
  const [address, setAddress] = useState("");
  const [branch, setBranch] = useState("");
  const [mixedRegions, setMixedRegions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);

  // 🧭 Detect product region → set branch
  useEffect(() => {
    if (cart.length === 0) return;

    const regions = cart
      .map((item: any) => item.region?.toLowerCase?.())
      .filter(Boolean);

    const uniqueRegions = Array.from(new Set(regions));

    if (uniqueRegions.length > 1) {
      setMixedRegions(true);
      setBranch("");
    } else {
      setMixedRegions(false);
      const region = uniqueRegions[0] || selectedRegion;
      if (region === "durban") setBranch("Durban");
      else if (region === "joburg") setBranch("Joburg");
    }
  }, [cart, selectedRegion]);

  // 🧾 Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mixedRegions) {
      setError("Your cart has items from multiple regions. Please split orders by branch.");
      return;
    }
    if (totalItems < 10) {
      setError("Minimum order is 10 items.");
      return;
    }
    if (!branch) {
      setError("Unable to determine branch. Please check your cart region.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("orders").insert([
        {
          customer_name: name.trim(),
          phone_number: phone || cell,
          email: email || null,
          branch,
          items: cart.map((i) => ({
            id: i.id,
            title: i.title,
            quantity: i.quantity,
            price: i.price,
            region: (i as any).region,
          })),
          total: totalPrice,
          status: "pending",
        },
      ]);

      if (insertError) throw insertError;
      clearCart();
      setSuccess(true);
      setShowSignup(true);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔑 Optional magic link signup
  const handleMagicSignup = async () => {
    if (!email) {
      setError("Enter your email to receive a signup link.");
      return;
    }
    const { error: signupError } = await supabase.auth.signInWithOtp({ email });
    if (signupError) setError(signupError.message);
    else alert("A signup link has been sent to your email!");
  };

  return (
    <main
      className="min-h-screen text-white px-6 md:px-16 pb-20 pt-40 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/checkout.png')",
      }}
    >
      <div className="max-w-7xl mx-auto bg-black/50 backdrop-blur-sm p-10 rounded-2xl border border-white/10 shadow-[0_0_35px_rgba(255,0,0,0.1)]">
        {/* Outer Heading */}
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
          <li
            key={item.id}
            className="flex justify-between items-center py-2 text-sm text-gray-300"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{item.title}</span>
              {item.quantity > 1 && (
                <span className="px-2.5 py-0.5 text-[11px] rounded-full bg-[#B80013] text-white font-semibold tracking-wide uppercase shadow-[0_0_6px_rgba(184,0,19,0.5)]">
                  {item.quantity} {item.quantity > 1 ? "Units" : "Unit"}
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
          <span className="font-semibold text-white">
            R{totalPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </>
  )}

  <div className="mt-5 text-xs text-gray-400 border border-white/10 rounded-lg p-3 bg-[#111]/70">
    Minimum order is <strong>10 items</strong>.
  </div>

  <div className="mt-6">
    <Link
      href="/products"
      className="text-sm text-gray-300 hover:text-white transition"
    >
      ← Continue shopping
    </Link>
  </div>
</section>



          {/* 👤 Customer Details */}
          <form
            onSubmit={handleSubmit}
            className="flex-[1.5] bg-black/60 p-8 rounded-2xl border border-white/10 shadow-inner max-h-[600px] overflow-y-auto"
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
              <input
                placeholder="Cell"
                value={cell}
                onChange={(e) => setCell(e.target.value)}
                className="rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
              />
            </div>

            <input
              placeholder="Physical Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-5 w-full rounded-lg px-4 py-2.5 bg-black/50 border border-white/20 focus:border-red-600 outline-none"
            />

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
                  <span className="font-semibold text-white">
                    Pickup from {branch}
                  </span>
                ) : (
                  <span className="text-gray-400">Auto-selecting branch...</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Branch automatically set based on your product region.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm font-medium mt-4">{error}</p>
            )}

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
    </main>
  );
}
