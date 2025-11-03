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
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);


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
    doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });

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
    doc.text("Bank: Nedbank", 14, bankY + 6);
    doc.text("Account Name: Amal Holdings", 14, bankY + 12);
    doc.text("Account Number: 1169327818", 14, bankY + 18);
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

                {/* ITEMS ACTIONS */}
<div className="mt-3 flex gap-2">
  <button
    onClick={() => setViewingOrder(order)}
    className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 font-medium transition"
  >
    View Items
  </button>
  <button
    onClick={() => setEditingOrder(order)}
    className="flex-1 text-xs px-3 py-2 rounded-lg bg-[#B80013]/80 hover:bg-[#B80013] text-white font-medium transition"
  >
    Edit Order
  </button>
</div>


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
   {/* View Items Modal */}
{viewingOrder && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-[#141414]/95 border border-white/10 rounded-3xl shadow-2xl w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] max-h-[85vh] overflow-y-auto p-10 relative">
      <button
        onClick={() => setViewingOrder(null)}
        className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
      >
        <X size={24} />
      </button>

      <h3 className="text-2xl font-semibold text-[#B80013] mb-6">
        {viewingOrder.order_number || `Order #${viewingOrder.id.slice(0, 6)}`}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-400">Customer</p>
          <p className="font-medium text-white">
            {viewingOrder.customer_name || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Branch</p>
          <p className="font-medium text-white">{viewingOrder.branch}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Status</p>
          <p className="font-medium capitalize text-white">
            {viewingOrder.status}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Total</p>
          <p className="font-semibold text-[#B80013]">
            R{Number(viewingOrder.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Items Ordered</h4>
        {Array.isArray(viewingOrder.items) && viewingOrder.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 uppercase text-xs">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {viewingOrder.items.map((i: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="py-2 px-3">{i.title || i.name}</td>
                    <td className="py-2 px-3 text-center">{i.quantity}</td>
                    <td className="py-2 px-3 text-right">
                      R{Number(i.price || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      R{(i.price * i.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No items found for this order.</p>
        )}
      </div>
    </div>
  </div>
)}

{/* Edit Order Modal */}
{editingOrder && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-[#141414]/95 border border-white/10 rounded-3xl shadow-2xl w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] max-h-[85vh] overflow-y-auto p-10 relative">
      <button
        onClick={() => setEditingOrder(null)}
        className="absolute top-5 right-5 text-gray-400 hover:text-white transition"
      >
        <X size={24} />
      </button>

      <h3 className="text-2xl font-semibold text-[#B80013] mb-6">
        Edit {editingOrder.order_number || `Order #${editingOrder.id.slice(0, 6)}`}
      </h3>

      {/* Order Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div>
          <p className="text-sm text-gray-400">Customer</p>
          <p className="font-medium text-white">
            {editingOrder.customer_name || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Branch</p>
          <p className="font-medium text-white">{editingOrder.branch}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Payment</p>
          <p className="font-medium capitalize text-white">
            {editingOrder.payment_status || "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Total</p>
          <p className="font-semibold text-[#B80013]">
            R{Number(editingOrder.total || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Editable Items Table */}
      <div className="border-t border-white/10 pt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Edit Order Items</h4>

        {Array.isArray(editingOrder.items) && editingOrder.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400 uppercase text-xs">
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Price</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {editingOrder.items.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-white/5 transition"
                  >
                    <td className="py-2 px-3">{item.title || item.name}</td>

                    {/* Quantity input */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = Number(e.target.value);
                          setEditingOrder((prev: any) => {
                            const updatedItems = [...prev.items];
                            updatedItems[idx].quantity = newQty;
                            const newTotal = updatedItems.reduce(
                              (acc: number, i: any) => acc + Number(i.price || 0) * Number(i.quantity || 0),
                              0
                            );
                            return { ...prev, items: updatedItems, total: newTotal };
                          });
                        }}
                        className="w-16 text-center bg-black/40 border border-white/10 rounded-md text-gray-200 focus:border-[#B80013] outline-none"
                      />
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3 text-right">
                      R{Number(item.price || 0).toFixed(2)}
                    </td>

                    {/* Subtotal */}
                    <td className="py-2 px-3 text-right">
                      R{(item.price * item.quantity).toFixed(2)}
                    </td>

                    {/* Remove item */}
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => {
                          setEditingOrder((prev: any) => {
                            const updatedItems = prev.items.filter(
                              (_: any, i: number) => i !== idx
                            );
                            const newTotal = updatedItems.reduce(
                              (acc: number, i: any) => acc + Number(i.price || 0) * Number(i.quantity || 0),
                              0
                            );
                            return { ...prev, items: updatedItems, total: newTotal };
                          });
                        }}
                        className="text-red-500 hover:text-red-400 text-xs font-semibold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No items available to edit.</p>
        )}
      </div>

      {/* Total + Save Button */}
      <div className="border-t border-white/10 mt-6 pt-6 flex justify-between items-center">
        <p className="text-lg font-semibold text-[#B80013]">
          Total: R{Number(editingOrder.total || 0).toFixed(2)}
        </p>

        <button
          onClick={async () => {
            try {
              const { error } = await supabase
  .from("orders")
  .update({
    items: editingOrder.items,
    total: editingOrder.total,
  })
  .eq("id", editingOrder.id);


              if (error) throw error;

              alert("✅ Order updated successfully!");
              setEditingOrder(null);
              fetchOrders();
            } catch (err: any) {
              console.error("Update failed:", err.message);
              alert("❌ Failed to update order: " + err.message);
            }
          }}
          className="px-6 py-3 rounded-full bg-[#B80013] hover:bg-[#a20010] text-white font-semibold text-sm transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}


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
