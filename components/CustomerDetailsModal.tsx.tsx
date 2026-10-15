"use client";

import { useState } from "react";
import { X, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import SendingInvoiceModal from "@/components/SendingInvoiceModal";

interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  unit: string;
}

interface CustomerDetailsModalProps {
  items: OrderItem[];
  branch: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function withSupabaseTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Supabase insert timeout")),
      ms
    );
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

const REGIONS = [
  "Durban & Surrounding Areas",
  "PMB",
  "Tongaat",
  "Stanger",
  "Richards Bay",
  "Other",
];

export default function CustomerDetailsModal({
  items,
  branch,
  onClose,
  onSuccess,
}: CustomerDetailsModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "eft" | "">("");
  const [step, setStep] = useState<"review" | "details" | "success">("review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cellError, setCellError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [region, setRegion] = useState<string>("");
  const [showRegionModal, setShowRegionModal] = useState(false);

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateTotal();

  const validateCell = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");
    const saRegex = /^(?:\+27|27|0)[6-8][0-9]{8}$/;
    if (cleaned === "") { setCellError(null); return; }
    setCellError(saRegex.test(cleaned) ? null : "Enter a valid South African cellphone number");
  };

  const generateOrderNumber = async () => {
    try {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const { data, error } = await supabase
        .from("orders")
        .select("order_number")
        .like("order_number", `Amal${currentYear}#%`)
        .order("order_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextSeq = 1;
      if (data && data.length > 0) {
        const match = data[0].order_number?.match(/#(\d+)$/);
        if (match) nextSeq = parseInt(match[1], 10) + 1;
      }

      return `Amal${currentYear}#${String(nextSeq).padStart(4, "0")}`;
    } catch {
      const fallbackYear = new Date().getFullYear().toString().slice(-2);
      return `Amal${fallbackYear}#0001`;
    }
  };

  const handleSubmitOrder = async () => {
    if (loading) return;

    if (!customerName.trim()) { setError("Please enter customer name"); return; }
    if (!cellNumber.trim()) { setError("Please enter cell number"); return; }
    if (cellError) { setError("Please enter a valid South African cellphone number"); return; }
    if (!email.trim()) { setError("Please enter customer email address"); return; }
    if (!region) { setError("Please select a region"); return; }
    if (!paymentMethod) { setError("Please select a payment method"); return; }
    if (!branch) { setError("Branch information is missing"); return; }

    setLoading(true);
    setError(null);

    try {
      const orderNumber = await generateOrderNumber();

      const orderPayload = {
        order_number: orderNumber,
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim() || cellNumber.trim(),
        cell_number: cellNumber.trim() || phoneNumber.trim(),
        email: email.trim() || null,
        branch,
        region,
        payment_method: paymentMethod === "cash" ? "Cash on Collection" : "EFT before Collection",
        items: items.map((item) => ({
          id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          region,
        })),
        total,
        status: "pending",
      };

      const { data, error: insertError } = await withSupabaseTimeout(
        (async () => {
          const result = await supabase
            .from("orders")
            .insert([orderPayload])
            .select()
            .single();
          return result;
        })(),
        8000
      );

      if (insertError) throw insertError;

      setOrderData(data);
      setStep("success");
      setLoading(false);

      if (!data.email || data.email.trim() === "") return;

      const form = new FormData();
      form.append("order-number", data.order_number);
      form.append("total", String(data.total));
      form.append("branch", data.branch);
      form.append("region", data.region);
      form.append("payment-method", data.payment_method || "");
      form.append("email", data.email || "");
      form.append("name", data.customer_name);
      form.append("items", JSON.stringify(data.items));

      setSendingInvoice(true);
      fetch("/api/send-invoice", { method: "POST", body: form })
        .catch((err) => console.error("Email send failed:", err))
        .finally(() => setSendingInvoice(false));

    } catch (err: any) {
      console.error("Order submission failed:", err);
      setError(err.message || "Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── STEP 1: REVIEW ── */
  if (step === "review") {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-t-[20px] sm:rounded-[12px] w-full sm:max-w-lg max-h-[92dvh] overflow-hidden flex flex-col">

          {/* Drag handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 h-14 border-b border-white/[0.07] shrink-0">
            <span
              className="text-[13px] tracking-[0.1em] uppercase text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Review Order
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-white/25" style={{ fontFamily: "var(--font-heading)" }}>
                01 / 02
              </span>
              <button
                onClick={onClose}
                className="p-1.5 text-white/40 hover:text-white transition-colors rounded-[4px] hover:bg-white/[0.06]"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-0">
              {items.map((item, idx) => (
                <div
                  key={item.product_id}
                  className={`flex items-center justify-between py-3 ${
                    idx < items.length - 1 ? "border-b border-white/[0.07]" : ""
                  }`}
                >
                  <div>
                    <p className="text-[13px] text-white">{item.title}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">
                      {item.quantity} × R{item.price.toFixed(2)}
                      {item.unit && ` / ${item.unit}`}
                    </p>
                  </div>
                  <span
                    className="text-[14px] font-bold text-[#B80013]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    R{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-white/[0.07] space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-white/25">Total Items</span>
                <span className="text-white">{totalItems}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/25">Branch</span>
                <span className="text-white">{branch}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/[0.07]">
                <span className="text-[11px] text-white/25 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>
                  Total
                </span>
                <span
                  className="text-[22px] font-bold text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="text-[13px] text-white/40 mr-0.5">R</span>
                  {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.07] flex shrink-0">
            <button
              onClick={onClose}
              className="flex-1 h-[52px] text-[11px] tracking-[0.1em] uppercase text-white/40 hover:text-white border-r border-white/[0.07] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => setStep("details")}
              className="flex-1 h-[52px] text-[11px] tracking-[0.1em] uppercase bg-[#B80013] text-white font-medium hover:bg-[#a30011] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── STEP 2: DETAILS ── */
  if (step === "details") {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-t-[20px] sm:rounded-[12px] w-full sm:max-w-lg max-h-[92dvh] overflow-hidden flex flex-col">

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep("review")}
                  className="p-1.5 text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  className="text-[13px] tracking-[0.1em] uppercase text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Customer Details
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-white/25" style={{ fontFamily: "var(--font-heading)" }}>
                  02 / 02
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 text-white/40 hover:text-white transition-colors rounded-[4px] hover:bg-white/[0.06]"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-5">

                {/* Name */}
                <div>
                  <label className="block text-[11px] text-white/25 uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-transparent border-b border-white/[0.1] text-[16px] sm:text-[14px] text-white placeholder-white/20 py-3 sm:py-2 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Full name"
                    disabled={loading}
                  />
                </div>

                {/* Cell */}
                <div>
                  <label className="block text-[11px] text-white/25 uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Cell Number *
                  </label>
                  <input
                    type="tel"
                    value={cellNumber}
                    onChange={(e) => { setCellNumber(e.target.value); validateCell(e.target.value); }}
                    className={`w-full bg-transparent border-b text-[16px] sm:text-[14px] text-white placeholder-white/20 py-3 sm:py-2 focus:outline-none transition-colors ${
                      cellError ? "border-red-500" : "border-white/[0.1] focus:border-white/30"
                    }`}
                    placeholder="e.g., 0821234567"
                    disabled={loading}
                  />
                  {cellError && (
                    <p className="text-[11px] text-red-400 mt-1">{cellError}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] text-white/25 uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-white/[0.1] text-[16px] sm:text-[14px] text-white placeholder-white/20 py-3 sm:py-2 focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="customer@example.com"
                    disabled={loading}
                  />
                </div>

                {/* Region */}
                <div>
                  <label className="block text-[11px] text-white/25 uppercase tracking-[0.1em] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                    Region *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRegion(r)}
                        className={`px-4 py-3.5 sm:py-2.5 text-[13px] sm:text-[12px] text-left border rounded-[8px] sm:rounded-[4px] transition-colors active:scale-[0.98] ${
                          region === r
                            ? "border-[#B80013] bg-[#B80013]/[0.08] text-white"
                            : "border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <label className="block text-[11px] text-white/25 uppercase tracking-[0.1em] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                    Payment Method *
                  </label>
                  <div className="space-y-2">
                    {(["cash", "eft"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        disabled={loading}
                        className={`w-full flex items-center gap-3 py-4 sm:py-3 pl-4 border-l-[3px] rounded-r-[4px] transition-colors active:scale-[0.99] ${
                          paymentMethod === method
                            ? "border-l-[#B80013] bg-[#B80013]/[0.06] text-white"
                            : "border-l-transparent text-white/40 hover:text-white/70"
                        }`}
                      >
                        <span className="text-[14px] sm:text-[13px]">
                          {method === "cash" ? "Cash on Collection" : "EFT before Collection"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-[12px] text-red-400">{error}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.07] flex shrink-0">
              <button
                onClick={() => setStep("review")}
                disabled={loading}
                className="flex-1 h-[56px] sm:h-[52px] text-[11px] tracking-[0.1em] uppercase text-white/40 hover:text-white border-r border-white/[0.07] transition-colors disabled:opacity-30"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Back
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 h-[56px] sm:h-[52px] text-[11px] tracking-[0.1em] uppercase bg-[#B80013] text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a30011] transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {loading ? (
                  <><Loader2 size={13} className="animate-spin" /> Submitting...</>
                ) : (
                  "Submit Order"
                )}
              </button>
            </div>
          </div>
        </div>

        {showRegionModal && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[60]">
            <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] p-6 w-[90%] max-w-sm">
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-[11px] tracking-[0.1em] uppercase text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Select Region
                </span>
                <button onClick={() => setShowRegionModal(false)} className="text-white/40 hover:text-white">
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRegion(r); setShowRegionModal(false); }}
                    className={`py-2.5 px-3 text-[13px] text-left border rounded-[4px] transition-colors ${
                      region === r
                        ? "border-[#B80013] text-white"
                        : "border-white/[0.07] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ── STEP 3: SUCCESS ── */
  if (step === "success" && orderData) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[12px] w-full max-w-md overflow-hidden">
            <div className="px-8 py-10">

              {/* Checkmark */}
              <div className="flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>

              {/* Heading */}
              <p
                className="text-[28px] font-bold text-white tracking-[0.06em] uppercase text-center mb-1"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Order Created
              </p>
              <p className="text-[13px] text-white/25 text-center mb-8">
                Successfully submitted
              </p>

              {/* Details list */}
              <div className="space-y-3 mb-8">
                {[
                  ["Order", orderData.order_number],
                  ["Customer", orderData.customer_name],
                  ["Branch", orderData.branch],
                  ["Region", orderData.region],
                  ["Payment", orderData.payment_method],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b border-white/[0.07] pb-3">
                    <span className="text-[11px] text-white/25 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>
                      {label}
                    </span>
                    <span className="text-[13px] text-white">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[11px] text-white/25 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>
                    Total
                  </span>
                  <span
                    className="text-[22px] font-bold text-[#B80013]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <span className="text-[13px] mr-0.5">R</span>
                    {Number(orderData.total).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full h-[52px] text-[11px] tracking-[0.1em] uppercase bg-[#B80013] text-white font-medium hover:bg-[#a30011] transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <SendingInvoiceModal open={sendingInvoice} />
      </>
    );
  }

  return null;
}
