"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AddItemsModal from "@/components/AddItemsModal";
import {
  Search, X, FileDown, FileSpreadsheet, ChevronDown,
  TrendingUp, Download, FileText, ExternalLink,
  LayoutList, LayoutGrid,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const STATUSES = ["pending", "processed", "packed", "collected", "cancelled"];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  processed: "bg-purple-500/15 text-purple-400",
  packed: "bg-blue-500/15 text-blue-400",
  collected: "bg-teal-500/15 text-teal-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  processed: "bg-purple-400",
  packed: "bg-blue-400",
  collected: "bg-teal-400",
  cancelled: "bg-red-400",
};

const STATUS_TINT: Record<string, string> = {
  pending:   "bg-yellow-500/[0.12] text-yellow-300/70",
  processed: "bg-purple-500/[0.12] text-purple-300/70",
  packed:    "bg-blue-500/[0.12] text-blue-300/70",
  collected: "bg-teal-500/[0.12] text-teal-300/70",
  cancelled: "bg-red-500/[0.12] text-red-300/70",
};

const STATUS_TEXT: Record<string, string> = {
  pending:   "text-yellow-300/70",
  processed: "text-purple-300/70",
  packed:    "text-blue-300/70",
  collected: "text-teal-300/70",
  cancelled: "text-red-300/70",
};


export default function AdminOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "lastMonth" | "all">("today");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/admin/login"); return; }
      setUser(data.user);
      await fetchOrders();
    };
    init();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    document.body.style.opacity = "0.5";
    document.body.style.pointerEvents = "none";
    setTimeout(() => window.location.reload(), 200);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) alert("Failed to update status: " + error.message);
    else setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  };

  const handleUpdatePaymentStatus = async (id: string, newVal: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: newVal }).eq("id", id);
    if (error) alert("Failed to update payment: " + error.message);
    else setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status: newVal } : o)));
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("orders").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { alert("Failed to delete: " + error.message); return; }
    setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const applyDateFilter = (list: any[]) => {
    if (dateFilter === "all") return list;
    const now = new Date();
    return list.filter((o) => {
      const d = new Date(o.created_at);
      if (dateFilter === "today") return d.toDateString() === now.toDateString();
      if (dateFilter === "week") { const w = new Date(); w.setDate(now.getDate() - 7); return d >= w && d <= now; }
      if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === "lastMonth") { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); const me = new Date(now.getFullYear(), now.getMonth(), 0); return d >= lm && d <= me; }
      return true;
    });
  };

  const filteredOrders = applyDateFilter(
    orders.filter((o) => {
      const q = search.toLowerCase();
      return (
        (o.customer_name?.toLowerCase().includes(q) || o.order_number?.toLowerCase().includes(q) || o.id?.toLowerCase().includes(q)) &&
        (statusFilter === "all" || o.status === statusFilter) &&
        (paymentFilter === "all" || o.payment_status === paymentFilter)
      );
    })
  );

  const statusCounts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const generateOrderReport = async (order: any, format: "pdf" | "xlsx") => {
    const items = Array.isArray(order.items) ? order.items : [];
    const filename = `AmalFoods_${order.order_number || order.id}_${new Date().toISOString().slice(0, 10)}.${format}`;
    if (format === "pdf") {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const logo = await fetch("/images/logo-light.png").then((r) => r.blob()).then((b) => URL.createObjectURL(b));
      doc.addImage(logo, "PNG", pageWidth / 2 - 25, 10, 50, 20);
      doc.setFontSize(16);
      doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });
      doc.setFontSize(10);
      const infoLines = [`Date: ${new Date(order.created_at).toLocaleDateString()}`, `Order Number: ${order.order_number || order.id}`, `Customer: ${order.customer_name || "-"}`, `Cell: ${order.cell_number || order.phone_number || "-"}`, `Email: ${order.email || "-"}`, `Region: ${order.region || "-"}`, `Branch: ${order.branch || "-"}`, `Payment Method: ${order.payment_method || order.payment_status || "-"}`];
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
      type Row = { Item: string; Quantity: number; Price: string; Subtotal: string };
      const rows: Row[] = items.map((i: any) => ({ Item: i.title || i.name || "-", Quantity: Number(i.quantity) || 0, Price: `R${Number(i.price || 0).toFixed(2)}`, Subtotal: `R${(Number(i.price || 0) * (Number(i.quantity) || 0)).toFixed(2)}` }));
      const meta = [["Order Number", order.order_number || order.id], ["Date", new Date(order.created_at).toLocaleDateString()], ["Customer", order.customer_name || "-"], ["Total", `R${Number(order.total || 0).toFixed(2)}`], []];
      const ws = XLSX.utils.aoa_to_sheet([["Amal Foods - Order Summary"], [], ...meta, [], ["Item", "Quantity", "Price", "Subtotal"], ...rows.map((r: Row) => Object.values(r))]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Order");
      XLSX.writeFile(wb, filename);
    }
  };

  const handleExportAllExcel = () => {
    const rows: Record<string, any>[] = [];
    orders.forEach((order) => {
      let items: any[] = [];
      try {
        if (typeof order.items === "string") { const p = JSON.parse(order.items); items = Array.isArray(p) ? p : p.items ? p.items : Object.values(p); }
        else if (Array.isArray(order.items)) items = order.items;
        else if (order.items && typeof order.items === "object") items = Object.values(order.items);
      } catch { items = []; }
      const base = { "Order ID": order.id, Date: new Date(order.created_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }), Customer: order.customer_name || "", Phone: order.phone_number || "", Email: order.email || "", Branch: order.branch || "", "Order Total (R)": Number(order.total || 0).toFixed(2), Status: order.status || "", Payment: order.payment_status || "" };
      if (items.length === 0) rows.push({ ...base, Item: "", Qty: "", "Item Price (R)": "" });
      else items.forEach((item: any, idx: number) => { rows.push({ "Order ID": idx === 0 ? order.id : "", Date: idx === 0 ? base["Date"] : "", Customer: idx === 0 ? base["Customer"] : "", Phone: idx === 0 ? base["Phone"] : "", Email: idx === 0 ? base["Email"] : "", Branch: idx === 0 ? base["Branch"] : "", Item: item.name || item.title || "", Qty: item.quantity ?? 1, "Item Price (R)": Number(item.price || 0).toFixed(2), "Order Total (R)": idx === 0 ? base["Order Total (R)"] : "", Status: idx === 0 ? base["Status"] : "", Payment: idx === 0 ? base["Payment"] : "" }); });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Orders");
    XLSX.writeFile(wb, `amal-foods-orders-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleGenerateAllInvoices = async () => {
    if (!orders.length) return alert("No orders.");
    setIsGeneratingInvoices(true);
    try {
      const logoBlob = await fetch("/images/logo-light.png").then((r) => r.blob());
      const logoDataUrl: string = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(logoBlob); });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      for (let idx = 0; idx < orders.length; idx++) {
        const order = orders[idx];
        if (idx > 0) doc.addPage();
        let items: any[] = [];
        try { if (typeof order.items === "string") { const p = JSON.parse(order.items); items = Array.isArray(p) ? p : p.items ? p.items : Object.values(p); } else if (Array.isArray(order.items)) items = order.items; else if (order.items && typeof order.items === "object") items = Object.values(order.items); } catch { items = []; }
        doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 25, 10, 50, 20);
        doc.setFontSize(16);
        doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });
        doc.setFontSize(10);
        const infoLines = [`Date: ${new Date(order.created_at).toLocaleDateString()}`, `Order Number: ${order.order_number || order.id}`, `Customer: ${order.customer_name || "-"}`, `Cell: ${order.cell_number || order.phone_number || "-"}`, `Email: ${order.email || "-"}`, `Region: ${order.region || "-"}`, `Branch: ${order.branch || "-"}`, `Payment Method: ${order.payment_method || "-"}`, `Payment Status: ${(order.payment_status || "unpaid").toUpperCase()}`];
        infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));
        const tableRows = items.map((item: any) => [item.title || item.name || "-", item.quantity ?? 1, `R${Number(item.price || 0).toFixed(2)}`, `R${(Number(item.price || 0) * (item.quantity ?? 1)).toFixed(2)}`]);
        autoTable(doc, { startY: 55 + infoLines.length * 6 + 5, head: [["Item", "Qty", "Price", "Subtotal"]], body: tableRows.length ? tableRows : [["-", "-", "-", "-"]], theme: "grid", styles: { fontSize: 9 }, headStyles: { fillColor: [184, 0, 19] } });
        const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
        doc.setFontSize(11);
        doc.text(`Total: R${Number(order.total || 0).toFixed(2)}`, 14, lastY + 10);
        doc.setFontSize(10);
        const bankY = lastY + 25;
        ["EFT Banking Details:", "Bank: Nedbank", "Account Name: Amal Holdings", "Account Number: 1169327818", "Reference: Your Full Name", "Please send proof of payment to your nearest branch before collection."].forEach((l, i) => doc.text(l, 14, bankY + i * 6));
      }
      doc.save(`amal-foods-all-invoices-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err: any) {
      alert("Failed to generate invoices: " + err.message);
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  /* ── Drawer helpers ── */
  const openViewDrawer = (order: any) => { setViewingOrder(order); requestAnimationFrame(() => setViewDrawerOpen(true)); };
  const closeViewDrawer = () => { setViewDrawerOpen(false); setTimeout(() => setViewingOrder(null), 300); };
  const openEditDrawer = (order: any) => { setEditingOrder(order); requestAnimationFrame(() => setEditDrawerOpen(true)); };
  const closeEditDrawer = () => { setEditDrawerOpen(false); setTimeout(() => setEditingOrder(null), 300); };

  const actionBtnClass = "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[12px] border border-white/10 rounded-[8px] text-white/60 hover:text-white hover:border-white/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((a, b) => a + Number(b.total || 0), 0);
  const activeCount = orders.filter((o) => ["pending", "processed", "packed"].includes(o.status)).length;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white text-sm tracking-widest uppercase">
        Loading…
      </div>
    );
  }

  return (
    <DashboardShell
      role="admin"
      userEmail={user?.email || ""}
      pageTitle="Orders"
      onLogout={handleLogout}
      onRefresh={fetchOrders}
      onReports={() => router.push("/admin/dashboard")}
      onStaff={() => router.push("/admin/dashboard")}
      onAnalytics={() => router.push("/admin/dashboard")}
      sidebarActions={
        <>
          <button onClick={() => router.push("/admin/dashboard")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer">
            <TrendingUp size={14} /> Dashboard
          </button>
          <button onClick={handleExportAllExcel} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer">
            <Download size={14} /> Export to Excel
          </button>
          <button onClick={handleGenerateAllInvoices} disabled={isGeneratingInvoices} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] disabled:opacity-40 transition cursor-pointer">
            <FileText size={14} /> {isGeneratingInvoices ? "Generating…" : "All Invoices"}
          </button>
          <button onClick={() => window.open("/studio", "_blank")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer">
            <ExternalLink size={14} /> Open Studio
          </button>
        </>
      }
      topBarActions={
        <>
          <button onClick={handleExportAllExcel} className={actionBtnClass}><Download size={13} /><span className="hidden sm:inline">Export Excel</span></button>
          <button onClick={handleGenerateAllInvoices} disabled={isGeneratingInvoices} className={actionBtnClass}><FileText size={13} /><span className="hidden sm:inline">{isGeneratingInvoices ? "Generating…" : "All Invoices"}</span></button>
          <button onClick={() => window.open("/studio", "_blank")} className={actionBtnClass}><ExternalLink size={13} /><span className="hidden sm:inline">Studio</span></button>
        </>
      }
    >
      <div>
      {/* ── Summary Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/[0.07] rounded-[8px] overflow-hidden mb-6">
        {[
          { label: "Today's Orders", value: todayOrders.length },
          { label: "Today's Revenue", value: `R${todayRevenue.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}` },
          { label: "Active", value: activeCount },
          { label: "Total Orders", value: orders.length },
        ].map(({ label, value }, i) => (
          <div key={label} className={`px-5 py-4 border-white/[0.07] ${["border-r border-b sm:border-b-0","border-b sm:border-b-0 sm:border-r","border-r",""][i] || ""}`}>
            <p className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 mt-1.5" style={{ fontFamily: "var(--font-heading)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Search + Date */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search name, order #, ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent border-b border-white/[0.07] focus:border-[#B80013] outline-none text-[13px] text-white/70 placeholder-white/25 py-1.5 pl-5 transition-colors" />
          </div>
          <div className="flex items-center bg-white/[0.04] rounded-[8px] p-1 gap-0.5 self-start sm:self-auto overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden">
            {(["today", "week", "month", "lastMonth", "all"] as const).map((key) => {
              const label = key === "lastMonth" ? "Last Mo." : key.charAt(0).toUpperCase() + key.slice(1);
              return <button key={key} onClick={() => setDateFilter(key)} className={`px-3 py-1.5 text-[11px] rounded-[6px] transition whitespace-nowrap cursor-pointer ${dateFilter === key ? "bg-[#1a1a1a] text-white font-medium" : "text-white/40 hover:text-white/70"}`} style={dateFilter === key ? { fontFamily: "var(--font-heading)" } : {}}>{label}</button>;
            })}
          </div>
        </div>
        {/* Row 2: Status+Payment pills (scrollable) + Count+Toggle (pinned right) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 flex-nowrap pr-2">
              <button onClick={() => setStatusFilter("all")} className={`px-3 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer whitespace-nowrap ${statusFilter === "all" ? "bg-[#1a1a1a] border-white/[0.12] text-white" : "border-white/[0.07] text-white/40 hover:text-white/70"}`}>All · {orders.length}</button>
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer whitespace-nowrap ${statusFilter === s ? `${STATUS_STYLE[s]} border-transparent` : "border-white/[0.07] text-white/40 hover:text-white/70"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                  {s.charAt(0).toUpperCase() + s.slice(1)} · {statusCounts[s] || 0}
                </button>
              ))}
              <div className="h-4 w-px bg-white/[0.1] shrink-0 mx-0.5" />
              {[{ key: "all", label: "All Payments" }, { key: "paid", label: `Paid · ${orders.filter(o => o.payment_status === "paid").length}` }, { key: "unpaid", label: `Unpaid · ${orders.filter(o => o.payment_status === "unpaid").length}` }].map(({ key, label }) => (
                <button key={key} onClick={() => setPaymentFilter(key as any)} className={`px-3 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer whitespace-nowrap ${paymentFilter === key ? (key === "paid" ? "bg-green-500/15 border-green-500/30 text-green-400" : key === "unpaid" ? "bg-orange-500/15 border-orange-500/30 text-orange-400" : "bg-[#1a1a1a] border-white/[0.12] text-white") : "border-white/[0.07] text-white/40 hover:text-white/70"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-white/30 hidden sm:block">{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
            <div className="flex items-center bg-white/[0.04] rounded-[8px] p-1 gap-0.5">
              <button onClick={() => setViewMode("table")} title="Table view" className={`p-1.5 rounded-[5px] transition cursor-pointer ${viewMode === "table" ? "bg-[#1a1a1a] text-white" : "text-white/35 hover:text-white/70"}`}>
                <LayoutList size={13} />
              </button>
              <button onClick={() => setViewMode("grid")} title="Grid view" className={`p-1.5 rounded-[5px] transition cursor-pointer ${viewMode === "grid" ? "bg-[#1a1a1a] text-white" : "text-white/35 hover:text-white/70"}`}>
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Orders ── */}
      {loading ? (
        <p className="text-white/30 text-[13px]">Loading orders…</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-white/25 text-[13px]">No matching orders found.</p>
      ) : viewMode === "table" ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-white/[0.07] rounded-[8px] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#111111]">
                  {["Order #", "Customer", "Region", "Total", "Status", "Payment", "Date", "Actions"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-white/30 font-medium ${i >= 3 && i !== 7 ? "text-right" : i === 7 ? "text-center" : "text-left"}`} style={{ fontFamily: "var(--font-heading)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition last:border-0">
                    <td className="px-4 py-3"><span className="text-[12px] font-medium text-[#B80013]" style={{ fontFamily: "var(--font-heading)" }}>{order.order_number || `#${order.id.slice(0, 6)}`}</span></td>
                    <td className="px-4 py-3"><p className="text-[13px] text-white font-medium leading-snug">{order.customer_name || "N/A"}</p><p className="text-[11px] text-white/35">{order.cell_number || order.phone_number || "—"}</p></td>
                    <td className="px-4 py-3 text-[13px] text-white/50">{order.region || "—"}</td>
                    <td className="px-4 py-3 text-right"><span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>R{Number(order.total || 0).toFixed(2)}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end flex-wrap gap-1">
                        {STATUSES.map((s) => <button key={s} onClick={() => handleUpdateStatus(order.id, s)} className={`text-[10px] px-2 py-0.5 rounded-full capitalize border transition cursor-pointer ${order.status === s ? `${STATUS_STYLE[s]} border-transparent font-medium` : "border-white/[0.07] text-white/25 hover:text-white/60"}`}>{s}</button>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {["paid", "unpaid"].map((p) => <button key={p} onClick={() => handleUpdatePaymentStatus(order.id, p)} className={`text-[10px] px-2 py-0.5 rounded-full capitalize border transition cursor-pointer ${order.payment_status === p ? (p === "paid" ? "bg-green-500/15 text-green-400 border-transparent font-medium" : "bg-orange-500/15 text-orange-400 border-transparent font-medium") : "border-white/[0.07] text-white/25 hover:text-white/60"}`}>{p}</button>)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-white/35">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openViewDrawer(order)} className="px-2.5 py-1 text-[11px] bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.12] text-white/60 hover:text-white rounded-[4px] transition cursor-pointer">View</button>
                        <button onClick={() => openEditDrawer(order)} className="px-2.5 py-1 text-[11px] bg-[#B80013]/80 hover:bg-[#B80013] text-white rounded-[4px] transition cursor-pointer">Edit</button>
                        <button onClick={() => generateOrderReport(order, "pdf")} className="text-white/20 hover:text-white/60 transition cursor-pointer"><FileDown size={13} /></button>
                        <button onClick={() => generateOrderReport(order, "xlsx")} className="text-white/20 hover:text-white/60 transition cursor-pointer"><FileSpreadsheet size={13} /></button>
                        {order.status === "cancelled" && <button onClick={() => setDeleteTarget(order)} className="text-red-500/40 hover:text-red-400 text-[11px] transition cursor-pointer">Del</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards (table mode) — full-featured grid cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-[#111111] rounded-[12px] overflow-hidden border border-white/[0.07] hover:border-white/[0.11] hover:bg-[#131313] transition-all duration-200 flex flex-col">
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-bold tracking-[0.08em] text-[#B80013] shrink-0" style={{ fontFamily: "var(--font-heading)" }}>{order.order_number || `#${order.id.slice(0, 6)}`}</span>
                      <span className="text-white/[0.10] text-[10px]">·</span>
                      <span className="text-[10px] text-white/20 truncate">{new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-[3px] rounded-full text-[10px] capitalize leading-none ${STATUS_TINT[order.status] || "bg-white/[0.05] text-white/50"}`}>{order.status}</span>
                      <span className={`px-2 py-[3px] rounded-full text-[10px] capitalize leading-none ${order.payment_status === "paid" ? "bg-green-500/[0.12] text-green-300/70" : "bg-orange-500/[0.12] text-orange-300/70"}`}>{order.payment_status || "unpaid"}</span>
                    </div>
                  </div>
                  <p className="text-[15px] font-semibold text-white leading-none mb-3">{order.customer_name || "N/A"}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-white/20 w-8 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Cell</span>
                      <span className="text-[11px] text-white/45">{order.cell_number || order.phone_number || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] uppercase tracking-[0.1em] text-white/20 w-8 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Region</span>
                      <span className="text-[11px] text-white/45">{order.region || "—"}</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-5">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 mb-1" style={{ fontFamily: "var(--font-heading)" }}>Total</p>
                    <p className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>R{Number(order.total || 0).toFixed(2)}</p>
                  </div>
                </div>
                {/* Stacked actions */}
                <div className="border-t border-white/[0.05] px-4 py-3 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => openViewDrawer(order)} className="flex-1 h-9 text-[12px] font-medium bg-white/[0.05] hover:bg-white/[0.09] text-white/60 hover:text-white rounded-[7px] transition cursor-pointer active:scale-[0.97]">View</button>
                    <button onClick={() => openEditDrawer(order)} className="flex-1 h-9 text-[12px] font-semibold bg-[#B80013] hover:bg-[#c8001a] text-white rounded-[7px] transition cursor-pointer active:scale-[0.97]">Edit</button>
                  </div>
                  <button onClick={() => setStatusModalOrder(order)} className="w-full h-9 flex items-center justify-between px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-[7px] transition cursor-pointer active:scale-[0.97]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] || "bg-white/30"}`} />
                      <span className={`text-[13px] capitalize truncate ${STATUS_TEXT[order.status] || "text-white/50"}`}>{order.status}</span>
                      <span className="text-white/20 shrink-0">·</span>
                      <span className={`text-[13px] capitalize truncate ${order.payment_status === "paid" ? "text-green-300/70" : "text-orange-300/70"}`}>{order.payment_status || "unpaid"}</span>
                    </div>
                    <ChevronDown size={13} className="text-white/30 shrink-0 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-[#111111] rounded-[12px] overflow-hidden border border-white/[0.07] hover:border-white/[0.11] hover:bg-[#131313] transition-all duration-200 flex flex-col">
              {/* Info zone */}
              <div className="p-5 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-bold tracking-[0.08em] text-[#B80013] shrink-0" style={{ fontFamily: "var(--font-heading)" }}>{order.order_number || `#${order.id.slice(0, 6)}`}</span>
                    <span className="text-white/[0.10] text-[10px]">·</span>
                    <span className="text-[10px] text-white/20 truncate">{new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-2 py-[3px] rounded-full text-[10px] capitalize leading-none ${STATUS_TINT[order.status] || "bg-white/[0.05] text-white/50"}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-[3px] rounded-full text-[10px] capitalize leading-none ${order.payment_status === "paid" ? "bg-green-500/[0.12] text-green-300/70" : "bg-orange-500/[0.12] text-orange-300/70"}`}>
                      {order.payment_status || "unpaid"}
                    </span>
                  </div>
                </div>
                {/* Customer */}
                <p className="text-[15px] font-semibold text-white leading-none mb-3">{order.customer_name || "N/A"}</p>
                {/* Labelled fields */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-white/20 w-8 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Cell</span>
                    <span className="text-[11px] text-white/45">{order.cell_number || order.phone_number || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-white/20 w-8 shrink-0" style={{ fontFamily: "var(--font-heading)" }}>Region</span>
                    <span className="text-[11px] text-white/45">{order.region || "—"}</span>
                  </div>
                </div>
                {/* Total — pushed to bottom */}
                <div className="mt-auto pt-5">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-white/20 mb-1" style={{ fontFamily: "var(--font-heading)" }}>Total</p>
                  <p className="text-[22px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>R{Number(order.total || 0).toFixed(2)}</p>
                </div>
              </div>
              {/* Stacked actions */}
              <div className="border-t border-white/[0.05] px-4 py-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button onClick={() => openViewDrawer(order)} className="flex-1 h-9 text-[12px] font-medium bg-white/[0.05] hover:bg-white/[0.09] text-white/60 hover:text-white rounded-[7px] transition cursor-pointer active:scale-[0.97]">View</button>
                  <button onClick={() => openEditDrawer(order)} className="flex-1 h-9 text-[12px] font-semibold bg-[#B80013] hover:bg-[#c8001a] text-white rounded-[7px] transition cursor-pointer active:scale-[0.97]">Edit</button>
                </div>
                <button onClick={() => setStatusModalOrder(order)} className="w-full h-9 flex items-center justify-between px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-[7px] transition cursor-pointer active:scale-[0.97]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] || "bg-white/30"}`} />
                    <span className={`text-[13px] capitalize truncate ${STATUS_TEXT[order.status] || "text-white/50"}`}>{order.status}</span>
                    <span className="text-white/20 shrink-0">·</span>
                    <span className={`text-[13px] capitalize truncate ${order.payment_status === "paid" ? "text-green-300/70" : "text-orange-300/70"}`}>{order.payment_status || "unpaid"}</span>
                  </div>
                  <ChevronDown size={13} className="text-white/30 shrink-0 ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STATUS MODAL ── */}
      {statusModalOrder && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/40" onClick={() => setStatusModalOrder(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[75] w-[min(280px,90vw)] bg-[#111111] border border-white/[0.12] rounded-[14px] overflow-hidden" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <div>
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#B80013]" style={{ fontFamily: "var(--font-heading)" }}>{statusModalOrder.order_number || `#${statusModalOrder.id.slice(0, 6)}`}</p>
                <p className="text-[12px] text-white/50 mt-0.5">{statusModalOrder.customer_name || "N/A"}</p>
              </div>
              <button onClick={() => setStatusModalOrder(null)} className="w-7 h-7 flex items-center justify-center rounded-[6px] text-white/25 hover:text-white hover:bg-white/[0.06] transition cursor-pointer shrink-0"><X size={13} /></button>
            </div>
            <div className="px-3 pt-3 pb-2">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/25 px-1 mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>Processing Status</p>
              <div className="space-y-0.5">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => { handleUpdateStatus(statusModalOrder.id, s); setStatusModalOrder((prev: any) => ({ ...prev, status: s })); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-[12px] capitalize transition cursor-pointer text-left ${statusModalOrder.status === s ? "bg-white/[0.07] text-white font-medium" : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s]}`} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-3 pb-3 pt-2 border-t border-white/[0.05]">
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/25 px-1 mb-1.5" style={{ fontFamily: "var(--font-heading)" }}>Payment</p>
              <div className="flex gap-1.5">
                {["paid", "unpaid"].map((p) => (
                  <button key={p} onClick={() => { handleUpdatePaymentStatus(statusModalOrder.id, p); setStatusModalOrder((prev: any) => ({ ...prev, payment_status: p })); }}
                    className={`flex-1 py-2 text-[12px] capitalize rounded-[7px] font-medium transition cursor-pointer ${statusModalOrder.payment_status === p ? (p === "paid" ? "bg-green-500/[0.18] text-green-400" : "bg-orange-500/[0.18] text-orange-400") : "bg-white/[0.04] text-white/30 hover:text-white/60 hover:bg-white/[0.07]"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── VIEW DRAWER ── */}
      {viewingOrder && (
        <>
          <div
            className={`fixed inset-0 z-[55] transition-opacity duration-300 ${viewDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={closeViewDrawer}
          />
          <div className={`fixed inset-y-0 right-0 z-[60] bg-[#0a0a0a] flex flex-col shadow-2xl w-full md:w-[min(680px,50vw)] border-l border-white/[0.07] transition-transform duration-300 ease-out ${viewDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013]" style={{ fontFamily: "var(--font-heading)" }}>{viewingOrder.order_number || `#${viewingOrder.id.slice(0, 6)}`}</p>
                <p className="text-[14px] text-white font-medium mt-0.5">{viewingOrder.customer_name || "N/A"}</p>
              </div>
              <button onClick={closeViewDrawer} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.07] shrink-0">
              {[["Branch", viewingOrder.branch || "—"], ["Region", viewingOrder.region || "—"], ["Status", viewingOrder.status], ["Payment", viewingOrder.payment_status || "—"]].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/30 mb-1" style={{ fontFamily: "var(--font-heading)" }}>{label}</p>
                  <p className="text-[13px] text-white capitalize">{val}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/35 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Items Ordered</p>
              {Array.isArray(viewingOrder.items) && viewingOrder.items.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full border-collapse min-w-[320px]">
                    <thead><tr className="border-b border-white/[0.07]">{["Item", "Qty", "Price", "Subtotal"].map((h, i) => <th key={h} className={`pb-2.5 ${i === 0 ? "text-left" : "text-right"} text-[10px] uppercase tracking-[0.1em] text-white/25 font-normal`} style={{ fontFamily: "var(--font-heading)" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {viewingOrder.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/[0.04] last:border-0">
                          <td className="py-3 text-[13px] text-white/80">{item.title || item.name}</td>
                          <td className="py-3 text-right text-[13px] text-white/55">{item.quantity}</td>
                          <td className="py-3 text-right text-[13px] text-white/55">R{Number(item.price || 0).toFixed(2)}</td>
                          <td className="py-3 text-right text-[13px] text-white font-medium">R{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-white/25 text-[13px]">No items found.</p>}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] shrink-0 flex items-center justify-between">
              <p className="text-[11px] text-white/35 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>Order Total</p>
              <p className="text-[24px] font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>R{Number(viewingOrder.total || 0).toFixed(2)}</p>
            </div>
          </div>
        </>
      )}

      {/* ── EDIT DRAWER ── */}
      {editingOrder && (
        <>
          <div
            className={`fixed inset-0 z-[55] transition-opacity duration-300 ${editDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={closeEditDrawer}
          />
          <div className={`fixed inset-y-0 right-0 z-[60] bg-[#0a0a0a] flex flex-col shadow-2xl w-full md:w-[min(680px,50vw)] border-l border-white/[0.07] transition-transform duration-300 ease-out ${editDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013]" style={{ fontFamily: "var(--font-heading)" }}>Edit · {editingOrder.order_number || `#${editingOrder.id.slice(0, 6)}`}</p>
                <p className="text-[14px] text-white font-medium mt-0.5">{editingOrder.customer_name || "N/A"}</p>
              </div>
              <button onClick={closeEditDrawer} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-white/30 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-4 border-b border-white/[0.07] shrink-0">
              {[["Branch", editingOrder.branch || "—"], ["Region", editingOrder.region || "—"], ["Payment", editingOrder.payment_status || "—"], ["Status", editingOrder.status]].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/30 mb-1" style={{ fontFamily: "var(--font-heading)" }}>{label}</p>
                  <p className="text-[13px] text-white capitalize">{val}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/35 mb-4" style={{ fontFamily: "var(--font-heading)" }}>Edit Items</p>
              {Array.isArray(editingOrder.items) && editingOrder.items.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full border-collapse min-w-[360px]">
                    <thead><tr className="border-b border-white/[0.07]">{["Item", "Qty", "Price", "Subtotal", ""].map((h, i) => <th key={i} className={`pb-2.5 ${i === 0 ? "text-left" : "text-right"} text-[10px] uppercase tracking-[0.1em] text-white/25 font-normal`} style={{ fontFamily: "var(--font-heading)" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {editingOrder.items.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/[0.04] last:border-0">
                          <td className="py-3 text-[13px] text-white/80">{item.title || item.name}</td>
                          <td className="py-3 text-right">
                            <input type="number" min="1" value={item.quantity} onChange={(e) => { const q = Number(e.target.value); setEditingOrder((prev: any) => { const u = [...prev.items]; u[idx].quantity = q; return { ...prev, items: u, total: u.reduce((a: number, i: any) => a + Number(i.price || 0) * Number(i.quantity || 0), 0) }; }); }} className="w-16 text-center bg-[#1a1a1a] border border-white/[0.07] rounded-[4px] text-white focus:border-[#B80013] outline-none text-[13px] py-1" />
                          </td>
                          <td className="py-3 text-right text-[13px] text-white/55">R{Number(item.price || 0).toFixed(2)}</td>
                          <td className="py-3 text-right text-[13px] text-white font-medium">R{(item.price * item.quantity).toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <button onClick={() => setEditingOrder((prev: any) => { const u = prev.items.filter((_: any, i: number) => i !== idx); return { ...prev, items: u, total: u.reduce((a: number, i: any) => a + Number(i.price || 0) * Number(i.quantity || 0), 0) }; })} className="text-red-500/50 hover:text-red-400 text-xs cursor-pointer">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-white/25 text-[13px]">No items to edit.</p>}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                <p className="text-[22px] font-bold text-[#B80013] mr-auto" style={{ fontFamily: "var(--font-heading)" }}>R{Number(editingOrder.total || 0).toFixed(2)}</p>
                {editingOrder.status === "pending" ? (
                  <button onClick={() => setShowAddItems(true)} className="h-[40px] px-4 text-[12px] border border-white/[0.07] text-white/60 hover:text-white hover:border-white/20 transition rounded-[4px] cursor-pointer">Add Items</button>
                ) : (
                  <button disabled className="h-[40px] px-4 text-[12px] border border-white/[0.04] text-white/20 cursor-not-allowed rounded-[4px]">Add Items</button>
                )}
                <button
                  onClick={async () => { try { const { error } = await supabase.from("orders").update({ items: editingOrder.items, total: editingOrder.total }).eq("id", editingOrder.id); if (error) throw error; alert("Order updated!"); closeEditDrawer(); fetchOrders(); } catch (err: any) { alert("Failed: " + err.message); } }}
                  className="h-[40px] px-6 bg-[#B80013] hover:bg-[#960010] text-white text-[12px] font-bold uppercase tracking-wide transition rounded-[4px] cursor-pointer"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Add Items (above edit drawer) ── */}
      {showAddItems && editingOrder && (
        <AddItemsModal
          orderId={editingOrder.id}
          currentItems={Array.isArray(editingOrder.items) ? editingOrder.items.map((i: any) => i.product_id || i._id || i.id || i.title) : []}
          region={editingOrder.region || "durban"}
          onClose={() => setShowAddItems(false)}
          onItemAdded={async () => { setShowAddItems(false); await fetchOrders(); const { data } = await supabase.from("orders").select("*").eq("id", editingOrder.id).single(); if (data) setEditingOrder(data); }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[65] bg-black/80 flex items-center justify-center p-6">
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-[12px] w-[90%] max-w-md p-8">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-4" style={{ fontFamily: "var(--font-heading)" }}>Delete Order?</p>
            <p className="text-[13px] text-white/60 mb-8">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-white/[0.07] text-[13px] text-white/60 hover:text-white transition rounded-[4px] cursor-pointer">Cancel</button>
              <button onClick={handleDeleteOrder} disabled={deleting} className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-[13px] font-medium text-white transition rounded-[4px] disabled:opacity-40 cursor-pointer">{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
