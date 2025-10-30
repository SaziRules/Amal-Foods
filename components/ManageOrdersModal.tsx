"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  Search,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ManageOrdersModalProps {
  branch: string | null;
  onClose: () => void;
}

export default function ManageOrdersModal({
  branch,
  onClose,
}: ManageOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "lastMonth" | "all"
  >("today");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");

  useEffect(() => {
  // Always fetch — admin passes null to load all branches
  fetchOrders();
}, [branch]);


  const fetchOrders = async () => {
  setLoading(true);

  try {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    // 🧠 Only filter by branch if one is provided
    if (branch) {
      query = query.eq("branch", branch);
    }

    const { data, error } = await query;

    if (error) throw error;
    setOrders(data || []);
  } catch (err) {
    console.error("Error fetching orders:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};


  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
    }
  };

  const handleUpdatePaymentStatus = async (
    id: string,
    newPaymentStatus: string
  ) => {
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newPaymentStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update payment status: " + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, payment_status: newPaymentStatus } : o
        )
      );
    }
  };

  const applyDateFilter = (orders: any[]) => {
    if (dateFilter === "all") return orders;
    const now = new Date();

    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      const sameDay = orderDate.toDateString() === now.toDateString();

      if (dateFilter === "today") return sameDay;
      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo && orderDate <= now;
      }
      if (dateFilter === "month")
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      if (dateFilter === "lastMonth") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return orderDate >= lastMonth && orderDate <= monthEnd;
      }
      return true;
    });
  };

  const filteredOrders = applyDateFilter(
  orders.filter((o) => {
    const q = search.toLowerCase();

    const matchesSearch =
      o.customer_name?.toLowerCase().includes(q) ||
      o.order_number?.toLowerCase().includes(q) || // ✅ new friendly order number
      o.id?.toLowerCase().includes(q) || // still supports old UUID searches
      o.created_at?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
);


  const totalOrders = filteredOrders.length;

  const statusCounts = ["pending", "packed", "collected", "cancelled"].reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const generateOrderReport = async (order: any, format: "pdf" | "xlsx") => {
  if (!order) return;

  const items = Array.isArray(order.items) ? order.items : [];
  const filename = `AmalFoods_${order.order_number || order.id}_${new Date()

    .toISOString()
    .slice(0, 10)}.${format}`;

  if (format === "pdf") {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 🖼️ Add Amal logo (light version for white background PDF)
    const logoUrl = "/images/logo-light.png";
    const logo = await fetch(logoUrl)
      .then((res) => res.blob())
      .then((blob) => URL.createObjectURL(blob));

    doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);

    doc.setFontSize(16);
    doc.text("INVOICE", pageWidth / 2, 40, { align: "center" });

    // 🧾 Order Info
    doc.setFontSize(10);
    const infoLines = [
      `Date: ${new Date(order.created_at).toLocaleDateString()}`,
      `Order Number: ${order.order_number || order.id}`,
      `Customer: ${order.customer_name || "—"}`,
      `Cell: ${order.cell_number || order.phone_number || "—"}`,
      `Email: ${order.email || "—"}`,
      `Region: ${order.region || "—"}`,
      `Branch: ${order.branch || "—"}`,
      `Payment Method: ${order.payment_method || order.payment_status || "—"}`,
    ];
    infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));

    // 🧾 Table
    const rows = items.map((i: any) => [
      i.title,
      i.quantity,
      `R${Number(i.price).toFixed(2)}`,
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
    doc.text(`Total: R${Number(order.total || 0).toFixed(2)}`, 14, lastY + 10);

    // 🏦 Banking details
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

    doc.save(filename);
  } else {
    // 🧮 XLSX Report (mirror fields)
        type OrderRow = {
          Item: string;
          Quantity: number;
          Price: string;
          Subtotal: string;
        };
    
        const rows: OrderRow[] = items.map((i: any) => ({
          Item: i.title || i.name || "—",
          Quantity: Number(i.quantity) || 0,
          Price: `R${Number(i.price || 0).toFixed(2)}`,
          Subtotal: `R${(Number(i.price || 0) * (Number(i.quantity) || 0)).toFixed(2)}`,
        }));
    
        const meta = [
          ["Order Number", order.order_number || order.id],
          ["Date", new Date(order.created_at).toLocaleDateString()],
          ["Customer", order.customer_name || "—"],
          ["Cell", order.cell_number || order.phone_number || "—"],
          ["Email", order.email || "—"],
          ["Region", order.region || "—"],
          ["Branch", order.branch || "—"],
          ["Payment Method", order.payment_method || order.payment_status || "—"],
          ["Total", `R${Number(order.total || 0).toFixed(2)}`],
          [],
        ];
    
        const ws = XLSX.utils.aoa_to_sheet([
          ["Amal Foods — Order Summary"],
          [],
          ...meta,
          [],
          ["Item", "Quantity", "Price", "Subtotal"],
          ...rows.map((r: OrderRow) => Object.values(r)),
        ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order");
    XLSX.writeFile(wb, filename);
  }
};


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-[95%] md:w-[90%] lg:w-[80%] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#0b0b0b]/60">
          <h2 className="text-xl font-semibold text-[#B80013]">
            Manage / Process Orders — {branch || "All Branches"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="p-4 flex flex-col gap-4 bg-[#0b0b0b]/40">
          <div className="flex items-center gap-3 w-full">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, order ID, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 focus:border-[#B80013] outline-none text-sm text-gray-300 placeholder-gray-500 py-1"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateFilter(key as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  dateFilter === key
                    ? "bg-[#B80013] text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start border-t border-white/10 pt-3">
            {["all", "pending", "packed", "collected", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === s
                    ? "bg-[#B80013] text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {s === "all"
                  ? `All (${orders.length})`
                  : `${s.charAt(0).toUpperCase() + s.slice(1)} (${
                      statusCounts[s] || 0
                    })`}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center py-2 text-sm text-gray-400 bg-black/30 border-t border-white/10">
          Showing <span className="text-[#B80013] font-semibold">{totalOrders}</span> orders
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-400">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">No matching orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition"
              >
                {/* TOP: ID + Status + Payment */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#B80013] font-semibold text-sm">
  {order.order_number || `#${order.id.slice(0, 6)}`}
</span>

                  <div className="flex gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge paid={order.payment_status === "paid"} />
                  </div>
                </div>

                {/* BASIC INFO */}
                <p className="text-gray-300 text-sm">
                  <strong>Customer:</strong> {order.customer_name || "N/A"}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Cell:</strong> {order.cell_number || "—"}
                </p>
                <p className="text-gray-300 text-sm">
                  <strong>Region:</strong> {order.region || "—"}
                </p>
                <p className="text-gray-400 text-sm">
                  <strong>Total:</strong> R{Number(order.total || 0).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>

                {/* ITEMS */}
                <details className="mt-3 bg-white/5 rounded-lg p-2">
                  <summary className="text-xs text-gray-400 flex items-center justify-between cursor-pointer">
                    View Items <ChevronDown size={14} />
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {Array.isArray(order.items) ? (
                      order.items.map((item: any, i: number) => (
                        <li key={i} className="text-xs text-gray-300">
                          {item.title || item.name} × {item.quantity}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-xs">No item data</li>
                    )}
                  </ul>
                </details>

                {/* BUTTON ROWS */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {["pending", "packed", "collected", "cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(order.id, s)}
                      className={`text-xs px-2 py-1.5 rounded-lg transition-all ${
                        s === order.status
                          ? "bg-[#B80013] text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {["paid", "unpaid"].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleUpdatePaymentStatus(order.id, p)}
                      className={`text-xs px-2 py-1.5 rounded-lg transition-all ${
                        order.payment_status === p
                          ? "bg-[#B80013] text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={() => generateOrderReport(order, "pdf")}
                    className="text-xs px-2 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-gray-300 flex items-center gap-1"
                  >
                    <FileDown size={12} /> PDF
                  </button>
                  <button
                    onClick={() => generateOrderReport(order, "xlsx")}
                    className="text-xs px-2 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 text-gray-300 flex items-center gap-1"
                  >
                    <FileSpreadsheet size={12} /> XLSX
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Status Badge ───────────── */
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-700/50 text-yellow-300",
    packed: "bg-blue-700/50 text-blue-300",
    collected: "bg-teal-700/50 text-teal-300",
    cancelled: "bg-red-700/50 text-red-300",
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full capitalize ${
        colorMap[status] || "bg-gray-700/50 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

/* ───────────── Payment Badge ───────────── */
function PaymentBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full capitalize ${
        paid ? "bg-green-700/50 text-green-300" : "bg-orange-700/50 text-orange-300"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}
