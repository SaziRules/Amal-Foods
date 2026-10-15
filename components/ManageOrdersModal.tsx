"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AddItemsModal from "./AddItemsModal";
import { X, Search, FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ManageOrdersModalProps {
  branch: string | null;
  onClose: () => void;
}

const STATUSES = ["pending", "processed", "packed", "collected", "cancelled"];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  processed: "bg-purple-500/15 text-purple-400",
  packed: "bg-blue-500/15 text-blue-400",
  collected: "bg-teal-500/15 text-teal-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const STATUS_BORDER: Record<string, string> = {
  pending: "border-l-yellow-500/60",
  processed: "border-l-purple-500/60",
  packed: "border-l-blue-500/60",
  collected: "border-l-teal-500/60",
  cancelled: "border-l-red-500/60",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  processed: "bg-purple-400",
  packed: "bg-blue-400",
  collected: "bg-teal-400",
  cancelled: "bg-red-400",
};

export default function ManageOrdersModal({ branch, onClose }: ManageOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "lastMonth" | "all">("today");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => { fetchOrders(); }, [branch]);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (branch) query = query.eq("branch", branch);
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

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("orders").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { alert("Failed to delete order: " + error.message); return; }
    setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) { alert("Failed to update status: " + error.message); }
    else { setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))); }
  };

  const handleUpdatePaymentStatus = async (id: string, newPaymentStatus: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: newPaymentStatus }).eq("id", id);
    if (error) { alert("Failed to update payment status: " + error.message); }
    else { setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status: newPaymentStatus } : o))); }
  };

  const applyDateFilter = (orders: any[]) => {
    if (dateFilter === "all") return orders;
    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      if (dateFilter === "today") return orderDate.toDateString() === now.toDateString();
      if (dateFilter === "week") { const w = new Date(); w.setDate(now.getDate() - 7); return orderDate >= w && orderDate <= now; }
      if (dateFilter === "month") return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      if (dateFilter === "lastMonth") { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); const me = new Date(now.getFullYear(), now.getMonth(), 0); return orderDate >= lm && orderDate <= me; }
      return true;
    });
  };

  const filteredOrders = applyDateFilter(
    orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        o.customer_name?.toLowerCase().includes(q) ||
        o.order_number?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.created_at?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || o.payment_status === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    })
  );

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const generateOrderReport = async (order: any, format: "pdf" | "xlsx") => {
    if (!order) return;
    const items = Array.isArray(order.items) ? order.items : [];
    const filename = `AmalFoods_${order.order_number || order.id}_${new Date().toISOString().slice(0, 10)}.${format}`;
    if (format === "pdf") {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoUrl = "/images/logo-light.png";
      const logo = await fetch(logoUrl).then((res) => res.blob()).then((blob) => URL.createObjectURL(blob));
      doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);
      doc.setFontSize(16);
      doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });
      doc.setFontSize(10);
      const infoLines = [
        `Date: ${new Date(order.created_at).toLocaleDateString()}`,
        `Order Number: ${order.order_number || order.id}`,
        `Customer: ${order.customer_name || "-"}`,
        `Cell: ${order.cell_number || order.phone_number || "-"}`,
        `Email: ${order.email || "-"}`,
        `Region: ${order.region || "-"}`,
        `Branch: ${order.branch || "-"}`,
        `Payment Method: ${order.payment_method || order.payment_status || "-"}`,
      ];
      infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));
      const rows = items.map((i: any) => [i.title, i.quantity, `R${Number(i.price).toFixed(2)}`, `R${(i.price * i.quantity).toFixed(2)}`]);
      autoTable(doc, { startY: 55 + infoLines.length * 6 + 5, head: [["Item", "Qty", "Price", "Subtotal"]], body: rows, theme: "grid", styles: { fontSize: 9 }, headStyles: { fillColor: [184, 0, 19] } });
      const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
      doc.setFontSize(11);
      doc.text(`Total: R${Number(order.total || 0).toFixed(2)}`, 14, lastY + 10);
      doc.setFontSize(10);
      const bankY = lastY + 25;
      ["EFT Banking Details:", "Bank: Nedbank", "Account Name: Amal Holdings", "Account Number: 1169327818", "Reference: Your Full Name", "Please send proof of payment to your nearest branch before collection."].forEach((l, i) => doc.text(l, 14, bankY + i * 6));
      doc.save(filename);
    } else {
      type OrderRow = { Item: string; Quantity: number; Price: string; Subtotal: string };
      const rows: OrderRow[] = items.map((i: any) => ({ Item: i.title || i.name || "-", Quantity: Number(i.quantity) || 0, Price: `R${Number(i.price || 0).toFixed(2)}`, Subtotal: `R${(Number(i.price || 0) * (Number(i.quantity) || 0)).toFixed(2)}` }));
      const meta = [["Order Number", order.order_number || order.id], ["Date", new Date(order.created_at).toLocaleDateString()], ["Customer", order.customer_name || "-"], ["Cell", order.cell_number || order.phone_number || "-"], ["Email", order.email || "-"], ["Region", order.region || "-"], ["Branch", order.branch || "-"], ["Payment Method", order.payment_method || order.payment_status || "-"], ["Total", `R${Number(order.total || 0).toFixed(2)}`], []];
      const ws = XLSX.utils.aoa_to_sheet([["Amal Foods - Order Summary"], [], ...meta, [], ["Item", "Quantity", "Price", "Subtotal"], ...rows.map((r: OrderRow) => Object.values(r))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order");
      XLSX.writeFile(wb, filename);
    }
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }}
        onClick={handleClose}
      />

      {/* ── Drawer ── */}
      <div
        className={`
          fixed z-50 bg-[#0a0a0a] flex flex-col shadow-2xl
          bottom-0 inset-x-0 h-[92vh] rounded-t-[20px]
          border border-white/[0.07]
          md:bottom-auto md:left-0 md:top-0 md:h-screen
          md:w-[min(860px,74vw)]
          md:rounded-none md:border-t-0 md:border-b-0 md:border-l-0
          transition-transform duration-300 ease-out
          ${mounted
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:-translate-x-full"
          }
        `}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <p
              className="text-[11px] font-medium tracking-[0.14em] uppercase text-white/50 whitespace-nowrap shrink-0"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Orders
            </p>
            {branch && (
              <span className="text-[11px] text-white/25 whitespace-nowrap">· {branch}</span>
            )}
            <span className="text-[11px] text-white/25 bg-white/[0.06] border border-white/[0.07] rounded-[4px] px-1.5 py-0.5 shrink-0">
              {filteredOrders.length}
            </span>
          </div>

          <div className="relative flex-1 max-w-[260px]">
            <Search size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search name, order #…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b border-white/[0.07] focus:border-[#B80013] outline-none text-[13px] text-white/70 placeholder-white/25 py-1 pl-5 transition-colors"
            />
          </div>

          <button
            onClick={handleClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Filter strip ── */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.07] overflow-x-auto scrollbar-hide shrink-0">
          {/* Date segment control */}
          <div className="flex items-center bg-white/[0.04] rounded-[8px] p-1 gap-0.5 shrink-0">
            {(["today", "week", "month", "lastMonth", "all"] as const).map((key) => {
              const label = key === "lastMonth" ? "Last Mo." : key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={`px-2.5 py-1 text-[11px] rounded-[6px] transition whitespace-nowrap cursor-pointer ${
                    dateFilter === key
                      ? "bg-[#1a1a1a] text-white font-medium shadow-sm"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  style={dateFilter === key ? { fontFamily: "var(--font-heading)" } : {}}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-white/[0.1] shrink-0" />

          {/* Payment pills */}
          {[
            { key: "all", label: "All Payments" },
            { key: "paid", label: `Paid · ${orders.filter(o => o.payment_status === "paid").length}` },
            { key: "unpaid", label: `Unpaid · ${orders.filter(o => o.payment_status === "unpaid").length}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPaymentFilter(key as any)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap cursor-pointer border shrink-0 ${
                paymentFilter === key
                  ? key === "paid"
                    ? "bg-green-500/15 border-green-500/30 text-green-400"
                    : key === "unpaid"
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                    : "bg-[#1a1a1a] border-white/[0.12] text-white"
                  : "border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="h-4 w-px bg-white/[0.1] shrink-0" />

          {/* Status pills */}
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap cursor-pointer border shrink-0 ${
              statusFilter === "all"
                ? "bg-[#1a1a1a] border-white/[0.12] text-white"
                : "border-white/[0.07] text-white/40 hover:text-white/70"
            }`}
          >
            All · {orders.length}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap cursor-pointer border shrink-0 ${
                statusFilter === s
                  ? `${STATUS_STYLE[s]} border-transparent`
                  : "border-white/[0.07] text-white/40 hover:text-white/70"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[s]}`} />
              {s.charAt(0).toUpperCase() + s.slice(1)} · {statusCounts[s] || 0}
            </button>
          ))}
        </div>

        {/* ── Orders Grid ── */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
          {loading ? (
            <p className="text-white/40 text-[13px] col-span-full">Loading orders…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-white/25 text-[13px] col-span-full">No matching orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-[#111111] border border-white/[0.07] border-l-[3px] ${STATUS_BORDER[order.status] || "border-l-white/20"} rounded-[8px] p-4 hover:bg-[#151515] transition flex flex-col`}
              >
                {/* Header: order number + date */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className="text-[12px] font-medium text-[#B80013]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {order.order_number || `#${order.id.slice(0, 6)}`}
                  </span>
                  <span className="text-[11px] text-white/25">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Status + payment badges */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-[4px] capitalize font-medium ${STATUS_STYLE[order.status] || "bg-white/[0.07] text-white/50"}`}>
                    {order.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-[4px] capitalize font-medium ${order.payment_status === "paid" ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                    {order.payment_status || "unpaid"}
                  </span>
                </div>

                {/* Customer info */}
                <div className="text-[13px] space-y-0.5 mb-3 flex-1">
                  <p><span className="text-white/35">Customer </span><span className="text-white font-medium">{order.customer_name || "N/A"}</span></p>
                  <p><span className="text-white/35">Cell </span><span className="text-white/80">{order.cell_number || order.phone_number || "—"}</span></p>
                  <p><span className="text-white/35">Region </span><span className="text-white/80">{order.region || "—"}</span></p>
                  <p className="mt-1.5">
                    <span className="text-white font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                      R{Number(order.total || 0).toFixed(2)}
                    </span>
                  </p>
                </div>

                {/* View Items + Edit Order */}
                <div className="flex gap-2 mb-2.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }}
                    className="flex-1 py-2 text-[12px] font-medium bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] text-white/70 hover:text-white rounded-[6px] transition cursor-pointer"
                  >
                    View Items
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }}
                    className="flex-1 py-2 text-[12px] font-medium bg-[#B80013] hover:bg-[#960010] text-white rounded-[6px] transition cursor-pointer"
                  >
                    Edit Order
                  </button>
                </div>

                {/* Status quick-set */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, s); }}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition cursor-pointer border ${
                        order.status === s
                          ? `${STATUS_STYLE[s]} border-transparent`
                          : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Payment quick-set + exports */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["paid", "unpaid"].map((p) => (
                    <button
                      key={p}
                      onClick={(e) => { e.stopPropagation(); handleUpdatePaymentStatus(order.id, p); }}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize transition cursor-pointer border ${
                        order.payment_status === p
                          ? p === "paid"
                            ? "bg-green-500/15 text-green-400 border-transparent"
                            : "bg-orange-500/15 text-orange-400 border-transparent"
                          : "border-white/[0.07] text-white/30 hover:text-white/60 hover:border-white/20"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); generateOrderReport(order, "pdf"); }}
                      className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition cursor-pointer"
                    >
                      <FileDown size={11} /> PDF
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); generateOrderReport(order, "xlsx"); }}
                      className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition cursor-pointer"
                    >
                      <FileSpreadsheet size={11} /> XLSX
                    </button>
                  </div>
                </div>

                {/* Delete (cancelled only) */}
                {order.status === "cancelled" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(order); }}
                    className="mt-2 text-[11px] text-red-500/50 hover:text-red-400 transition cursor-pointer text-left"
                  >
                    Delete order
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── View Items ── */}
      {viewingOrder && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[12px] shadow-2xl w-[90%] md:w-[70%] lg:w-[60%] max-h-[85vh] overflow-y-auto p-8 relative">
            <button onClick={() => setViewingOrder(null)} className="absolute top-5 right-5 text-white/30 hover:text-white transition cursor-pointer">
              <X size={18} />
            </button>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-5" style={{ fontFamily: "var(--font-heading)" }}>
              {viewingOrder.order_number || `#${viewingOrder.id.slice(0, 6)}`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[["Customer", viewingOrder.customer_name || "N/A"], ["Branch", viewingOrder.branch], ["Status", viewingOrder.status], ["Total", `R${Number(viewingOrder.total || 0).toFixed(2)}`]].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-[11px] text-white/30 mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>{label}</p>
                  <p className="text-[13px] text-white">{val}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.07] pt-5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Items Ordered</p>
              {Array.isArray(viewingOrder.items) && viewingOrder.items.length > 0 ? (
                <table className="w-full text-sm text-white/70 border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      {["Item", "Qty", "Price", "Subtotal"].map((h, i) => (
                        <th key={h} className={`py-2 ${i === 0 ? "text-left" : "text-right"} text-[10px] uppercase tracking-[0.1em] text-white/25 font-normal`} style={{ fontFamily: "var(--font-heading)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrder.items.map((i: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/[0.04] last:border-0">
                        <td className="py-2 text-[13px]">{i.title || i.name}</td>
                        <td className="py-2 text-right text-[13px]">{i.quantity}</td>
                        <td className="py-2 text-right text-[13px]">R{Number(i.price || 0).toFixed(2)}</td>
                        <td className="py-2 text-right text-[13px]">R{(i.price * i.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-white/25 text-sm">No items found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Order ── */}
      {editingOrder && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[12px] shadow-2xl w-[90%] md:w-[70%] lg:w-[60%] max-h-[85vh] overflow-y-auto p-8 relative">
            <button onClick={() => setEditingOrder(null)} className="absolute top-5 right-5 text-white/30 hover:text-white transition cursor-pointer">
              <X size={18} />
            </button>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-5" style={{ fontFamily: "var(--font-heading)" }}>
              Edit {editingOrder.order_number || `#${editingOrder.id.slice(0, 6)}`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[["Customer", editingOrder.customer_name || "N/A"], ["Branch", editingOrder.branch], ["Payment", editingOrder.payment_status || "—"], ["Total", `R${Number(editingOrder.total || 0).toFixed(2)}`]].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-[11px] text-white/30 mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>{label}</p>
                  <p className="text-[13px] text-white">{val}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/[0.07] pt-5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Edit Items</p>
              {Array.isArray(editingOrder.items) && editingOrder.items.length > 0 ? (
                <table className="w-full text-sm text-white/70 border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07]">
                      {["Item", "Qty", "Price", "Subtotal", ""].map((h, i) => (
                        <th key={i} className={`py-2 ${i === 0 ? "text-left" : "text-right"} text-[10px] uppercase tracking-[0.1em] text-white/25 font-normal`} style={{ fontFamily: "var(--font-heading)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editingOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/[0.04] last:border-0">
                        <td className="py-2 text-[13px]">{item.title || item.name}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = Number(e.target.value);
                              setEditingOrder((prev: any) => {
                                const updatedItems = [...prev.items];
                                updatedItems[idx].quantity = newQty;
                                const newTotal = updatedItems.reduce((acc: number, i: any) => acc + Number(i.price || 0) * Number(i.quantity || 0), 0);
                                return { ...prev, items: updatedItems, total: newTotal };
                              });
                            }}
                            className="w-16 text-center bg-[#1a1a1a] border border-white/[0.07] rounded-[4px] text-white focus:border-[#B80013] outline-none text-[13px] py-1"
                          />
                        </td>
                        <td className="py-2 text-right text-[13px]">R{Number(item.price || 0).toFixed(2)}</td>
                        <td className="py-2 text-right text-[13px]">R{(item.price * item.quantity).toFixed(2)}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => {
                              setEditingOrder((prev: any) => {
                                const updatedItems = prev.items.filter((_: any, i: number) => i !== idx);
                                const newTotal = updatedItems.reduce((acc: number, i: any) => acc + Number(i.price || 0) * Number(i.quantity || 0), 0);
                                return { ...prev, items: updatedItems, total: newTotal };
                              });
                            }}
                            className="text-red-500/60 hover:text-red-400 text-xs transition cursor-pointer"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-white/25 text-sm">No items to edit.</p>
              )}
            </div>
            <div className="border-t border-white/[0.07] mt-6 pt-5 flex justify-end gap-3 items-center">
              <p className="mr-auto text-[16px] font-bold text-[#B80013]" style={{ fontFamily: "var(--font-heading)" }}>
                R{Number(editingOrder.total || 0).toFixed(2)}
              </p>
              {editingOrder.status === "pending" ? (
                <button onClick={() => setShowAddItems(true)} className="px-4 py-2 text-[12px] border border-white/[0.07] text-white/60 hover:text-white hover:border-white/20 transition rounded-[4px] cursor-pointer">
                  Add Items
                </button>
              ) : (
                <button disabled title="Items can only be added to pending orders" className="px-4 py-2 text-[12px] border border-white/[0.04] text-white/25 cursor-not-allowed rounded-[4px]">
                  Add Items
                </button>
              )}
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase.from("orders").update({ items: editingOrder.items, total: editingOrder.total }).eq("id", editingOrder.id);
                    if (error) throw error;
                    alert("Order updated successfully!");
                    setEditingOrder(null);
                    fetchOrders();
                  } catch (err: any) {
                    alert("Failed to update order: " + err.message);
                  }
                }}
                className="px-5 py-2 bg-[#B80013] hover:bg-[#960010] text-white text-[12px] font-bold uppercase tracking-wide transition rounded-[4px] cursor-pointer"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Items ── */}
      {showAddItems && editingOrder && (
        <AddItemsModal
          orderId={editingOrder.id}
          currentItems={Array.isArray(editingOrder.items) ? editingOrder.items.map((i: any) => i.product_id || i._id || i.id || i.title) : []}
          region={editingOrder.region || "durban"}
          onClose={() => setShowAddItems(false)}
          onItemAdded={async () => {
            setShowAddItems(false);
            await fetchOrders();
            const { data: updatedOrder } = await supabase.from("orders").select("*").eq("id", editingOrder.id).single();
            if (updatedOrder) setEditingOrder(updatedOrder);
          }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[12px] shadow-2xl w-[90%] max-w-md p-8">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Delete Order?
            </p>
            <p className="text-[13px] text-white/60 mb-8">This action is permanent. You cannot recover deleted orders.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-white/[0.07] text-[13px] text-white/60 hover:text-white transition rounded-[4px] cursor-pointer">Cancel</button>
              <button onClick={handleDeleteOrder} disabled={deleting} className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-[13px] font-medium text-white transition rounded-[4px] disabled:bg-white/10 disabled:text-white/25 cursor-pointer">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
