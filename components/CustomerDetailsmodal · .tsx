"use client";

import { useState } from "react";
import { X, User, Phone, Mail, CreditCard, CheckCircle, Loader2, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

// Timeout wrapper (same as checkout)
function withSupabaseTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Supabase insert timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function CustomerDetailsModal({
  items,
  branch,
  onClose,
  onSuccess,
}: CustomerDetailsModalProps) {
  // Form state
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cellNumber, setCellNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "eft" | "">("");
  
  // UI state
  const [step, setStep] = useState<"review" | "details" | "success">("review");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cellError, setCellError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  // Calculate total
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateTotal();

  // Validate SA cell number
  const validateCell = (value: string) => {
    const cleaned = value.replace(/\s+/g, "");
    const saRegex = /^(?:\+27|27|0)[6-8][0-9]{8}$/;
    if (cleaned === "") {
      setCellError(null);
      return;
    }
    if (!saRegex.test(cleaned)) {
      setCellError("Enter a valid South African cellphone number");
    } else {
      setCellError(null);
    }
  };

  // Generate order number (same logic as checkout)
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
        const last = data[0].order_number;
        const match = last?.match(/#(\d+)$/);
        if (match) {
          nextSeq = parseInt(match[1], 10) + 1;
        }
      }

      return `Amal${currentYear}#${String(nextSeq).padStart(4, "0")}`;
    } catch (err) {
      console.error("Order number generation failed:", err);
      const fallbackYear = new Date().getFullYear().toString().slice(-2);
      return `Amal${fallbackYear}#0001`;
    }
  };

  // Submit order to database
  const handleSubmitOrder = async () => {
    // Validation
    if (!customerName.trim()) {
      setError("Please enter customer name");
      return;
    }

    if (!cellNumber.trim()) {
      setError("Please enter cell number");
      return;
    }

    if (cellError) {
      setError("Please enter a valid South African cellphone number");
      return;
    }

    if (!email.trim()) {
      setError("Please enter customer email address");
      return;
    }

    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    if (!branch) {
      setError("Branch information is missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderNumber = await generateOrderNumber();

      // Normalize branch name for region mapping
      let region = "durban";
      if (branch.toLowerCase().includes("joburg") || branch.toLowerCase().includes("johannesburg")) {
        region = "joburg";
      } else if (branch.toLowerCase().includes("cape")) {
        region = "capetown";
      }

      const orderPayload = {
        order_number: orderNumber,
        customer_name: customerName.trim(),
        phone_number: phoneNumber.trim() || cellNumber.trim(),
        cell_number: cellNumber.trim() || phoneNumber.trim(),
        email: email.trim() || null,
        branch: branch,
        region: region,
        payment_method:
          paymentMethod === "cash" ? "Cash on Collection" : "EFT before Collection",
        items: items.map((item) => ({
          id: item.product_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          region: region,
        })),
        total: total,
        status: "pending",
        payment_status: "unpaid",
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

      console.log("🎯 Order inserted successfully, returned data:", data);
      console.log("📧 Customer email in returned data:", data.email);
      console.log("📧 Customer name:", data.customer_name);

      if (!data.email) {
        console.error("❌ ERROR: No email in returned order data!");
        console.log("Original email from form:", email);
      }

      setOrderData(data);

      console.log("✅ Order created successfully:", data.order_number);
      
      // Failsafe: Check if email exists
      if (!data.email || data.email.trim() === "") {
        console.error("❌ CRITICAL: No email address for invoice! Skipping email send.");
        setStep("success");
        return;
      }
      
      console.log("📧 Starting invoice generation for:", data.email);

      // 🧾 Generate PDF invoice and send email (matches checkout flow exactly)
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add logo
      console.log("📄 Generating PDF invoice...");
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
        `Order Number: ${data.order_number || data.id}`,
        `Customer: ${data.customer_name}`,
        `Cell: ${data.cell_number || data.phone_number || "—"}`,
        `Email: ${data.email || "—"}`,
        `Region: ${data.region || "—"}`,
        `Branch: ${data.branch || "—"}`,
        `Payment Method: ${data.payment_method || "—"}`,
      ];
      infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));

      const rows = data.items.map((i: any) => [
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
      doc.text(`Total: R${data.total.toFixed(2)}`, 14, lastY + 10);

      doc.setFontSize(10);
      const bankY = lastY + 25;
      doc.text("EFT Banking Details:", 14, bankY);
      doc.text("Bank: Nedbank", 14, bankY + 6);
      doc.text("Account Name: Amal Holdings", 14, bankY + 12);
      doc.text("Account Number: 1169327818", 14, bankY + 18);
      doc.text("Reference: Your Full Name", 14, bankY + 24);
      doc.text(
        "Please send proof of payment to your nearest branch before collection.",
        14,
        bankY + 30
      );

      // Convert to blob for email attachment
      const pdfBlob = doc.output("blob");
      console.log("✅ PDF generated successfully, size:", pdfBlob.size, "bytes");

      const form = new FormData();
      form.append("order-number", data.order_number);
      form.append("total", String(data.total));
      form.append("branch", data.branch);
      form.append("region", data.region);
      form.append("payment-method", data.payment_method || "");
      form.append("email", data.email || "");
      form.append("name", data.customer_name);
      form.append("items", JSON.stringify(data.items));
      form.append(
        "pdf",
        new File([pdfBlob], `${data.order_number}.pdf`, { type: "application/pdf" })
      );

      console.log("📤 Sending invoice email to:", data.email);
      console.log("📋 FormData prepared with", form.has("pdf") ? "PDF attached" : "NO PDF");

      // 📧 Send invoice email silently
      setSendingInvoice(true);
      
      await fetch("/api/send-invoice", {
        method: "POST",
        body: form,
      })
        .then((res) => {
          console.log("📧 Email API response status:", res.status);
          return res.json();
        })
        .then((result) => {
          console.log("📧 Email API result:", result);
          if (result.success) {
            console.log("✅ Invoice email sent successfully!");
          } else {
            console.error("❌ Email sending failed:", result);
          }
        })
        .catch((err) => {
          console.error("❌ Email send failed:", err);
        })
        .finally(() => {
          console.log("📧 Invoice sending complete, hiding modal");
          setSendingInvoice(false);
        });

      // Show success screen after invoice is sent (or failed)
      console.log("🎉 Moving to success screen");
      setStep("success");

      setStep("success");

      // Call success callback after a short delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error("Order submission failed:", err);
      setError(err.message || "Failed to submit order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════ STEP 1: REVIEW ITEMS ═══════════
  if (step === "review") {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#141414] rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">Review Order</h2>
              <p className="text-sm text-gray-400 mt-1">Step 1 of 2</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-400">
                        {item.quantity} × R{item.price.toFixed(2)} {item.unit && `/ ${item.unit}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#B80013] font-bold text-lg">
                        R{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Total Items:</span>
                <span className="text-white font-semibold">{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Branch:</span>
                <span className="text-white font-semibold">{branch}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-white/10">
                <span className="text-gray-300">Total:</span>
                <span className="text-[#B80013] text-2xl">R{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("details")}
                className="flex-1 px-6 py-3 bg-[#B80013] hover:bg-[#960010] rounded-xl text-white font-semibold transition"
              >
                Continue to Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ STEP 2: CUSTOMER DETAILS ═══════════
  if (step === "details") {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#141414] rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("review")}
                className="p-2 hover:bg-white/10 rounded-lg transition text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Details</h2>
                <p className="text-sm text-gray-400 mt-1">Step 2 of 2</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-4">
              
              {/* Customer Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B80013]"
                    placeholder="Enter customer name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Phone & Cell */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Telephone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B80013]"
                      placeholder="e.g., 0311234567"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Cell Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={cellNumber}
                      onChange={(e) => {
                        setCellNumber(e.target.value);
                        validateCell(e.target.value);
                      }}
                      className={`w-full bg-black/30 border ${
                        cellError ? "border-red-500" : "border-white/20"
                      } rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B80013]`}
                      placeholder="e.g., 0821234567"
                      disabled={loading}
                    />
                  </div>
                  {cellError && (
                    <p className="text-red-500 text-xs mt-1">{cellError}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#B80013]"
                    placeholder="customer@example.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "cash")}
                      className="accent-[#B80013] w-5 h-5"
                      disabled={loading}
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-[#B80013]" />
                      <span className="text-white font-medium">Cash on Collection</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="eft"
                      checked={paymentMethod === "eft"}
                      onChange={(e) => setPaymentMethod(e.target.value as "eft")}
                      className="accent-[#B80013] w-5 h-5"
                      disabled={loading}
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-[#B80013]" />
                      <span className="text-white font-medium">EFT before Collection</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="mt-6 bg-[#B80013]/10 border border-[#B80013]/30 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-2">Order Summary</p>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Items:</span>
                  <span className="text-white">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Branch:</span>
                  <span className="text-white">{branch}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 mt-2 border-t border-[#B80013]/30">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-[#B80013]">R{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6">
            <div className="flex gap-3">
              <button
                onClick={() => setStep("review")}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#B80013] hover:bg-[#960010] rounded-xl text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ STEP 3: SUCCESS ═══════════
  if (step === "success" && orderData) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl border border-white/10 w-full max-w-md overflow-hidden">
            
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-green-500" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Order Created!</h2>
              <p className="text-gray-400 mb-6">The order has been successfully submitted</p>

              {/* Order Details */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Number:</span>
                    <span className="text-white font-semibold">{orderData.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white">{orderData.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Branch:</span>
                    <span className="text-white">{orderData.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment:</span>
                    <span className="text-white">{orderData.payment_method}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-gray-300 font-semibold">Total:</span>
                    <span className="text-[#B80013] font-bold text-lg">
                      R{Number(orderData.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-[#B80013] hover:bg-[#960010] rounded-xl text-white font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Sending Invoice Modal */}
        <SendingInvoiceModal open={sendingInvoice} />
      </>
    );
  }

  return null;
}