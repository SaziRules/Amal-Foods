"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FileDown,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import OrderPrepDisplay from "@/components/OrderPrepDisplay";
import useOrderPrepExport from "@/components/OrderPrepExport";
import CreateOrderModal from "@/components/CreateOrderModal";
import CustomerDetailsModal from "@/components/CustomerDetailsModal.tsx";
import DashboardShell from "@/components/dashboard/DashboardShell";

function FeatureToast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-4 md:left-[calc(240px+24px)] right-4 md:right-auto bg-[#111111] border border-white/[0.07] text-white px-5 py-3 rounded-[8px] z-50 animate-slideIn">
      <div className="flex items-center gap-3">
        <p className="text-[13px] text-white/80">{message}</p>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition ml-2 shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeatureToast, setShowFeatureToast] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const parseItems = (raw: any) => {
    try {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed.items)) return parsed.items;
      if (typeof parsed === "object") return Object.values(parsed);
    } catch {}
    return [];
  };

  const { generateOrderPrepPDF, generateOrderPrepExcel } =
    useOrderPrepExport(orders, parseItems, branch || "");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return (window.location.href = "/dashboard/login");
      setUser(data.user);

      const { data: manager } = await supabase
        .from("managers")
        .select("branch")
        .eq("email", data.user.email)
        .single();

      if (!manager?.branch) {
        alert("Unable to determine branch for this manager.");
        setLoading(false);
        return;
      }

      const branchName = manager.branch.trim();
      setBranch(branchName);

      const { data: branchOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("branch", branchName)
        .order("created_at", { ascending: false });

      setOrders(branchOrders || []);
      setLoading(false);
    };

    init();
  }, []);

  const generatePDFReport = () => {
    if (!orders.length) return alert("No orders available.");
    const doc = new jsPDF("p", "mm", "a4");
    let y = 20;
    doc.setFontSize(18);
    doc.setTextColor(184, 0, 19);
    doc.text(`Order Prep Report - ${branch}`, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 12;

    const summary: Record<string, { quantity: number; orders: number; statuses: Record<string, number>; payments: Record<string, number> }> = {};
    orders.forEach((order) => {
      const items = parseItems(order.items);
      const seenInOrder = new Set<string>();
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        const qty = Number(item.quantity) || 0;
        if (!summary[name]) summary[name] = { quantity: 0, orders: 0, statuses: {}, payments: {} };
        summary[name].quantity += qty;
        if (!seenInOrder.has(name)) { summary[name].orders += 1; seenInOrder.add(name); }
        const status = order.status || "pending";
        summary[name].statuses[status] = (summary[name].statuses[status] || 0) + 1;
        const payment = order.payment_status || "unpaid";
        summary[name].payments[payment] = (summary[name].payments[payment] || 0) + 1;
      });
    });

    const tableRows = Object.entries(summary).map(([name, data]) => [
      name, data.quantity, data.orders,
      Object.entries(data.statuses).map(([s, c]) => `${s}: ${c}`).join(", "),
      Object.entries(data.payments).map(([p, c]) => `${p}: ${c}`).join(", "),
    ]);
    tableRows.sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

    autoTable(doc, {
      startY: y,
      head: [["Item", "Qty", "Orders", "Statuses", "Payments"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [184, 0, 19], textColor: 255, fontSize: 11 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const generateExcelReport = () => {
    if (!orders.length) return alert("No orders available.");
    const summary: Record<string, { quantity: number; orders: number; statuses: Record<string, number>; payments: Record<string, number> }> = {};
    orders.forEach((order) => {
      const items = parseItems(order.items);
      const seenInOrder = new Set<string>();
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        const qty = Number(item.quantity) || 0;
        if (!summary[name]) summary[name] = { quantity: 0, orders: 0, statuses: {}, payments: {} };
        summary[name].quantity += qty;
        if (!seenInOrder.has(name)) { summary[name].orders += 1; seenInOrder.add(name); }
        const status = order.status || "pending";
        summary[name].statuses[status] = (summary[name].statuses[status] || 0) + 1;
        const payment = order.payment_status || "unpaid";
        summary[name].payments[payment] = (summary[name].payments[payment] || 0) + 1;
      });
    });
    const rows = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => ({
      Item: name,
      Qty: data.quantity,
      Orders: data.orders,
      Statuses: Object.entries(data.statuses).map(([s, c]) => `${s}: ${c}`).join(", "),
      Payments: Object.entries(data.payments).map(([p, c]) => `${p}: ${c}`).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order Prep Summary");
    XLSX.writeFile(wb, `Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const generateKitchenPDF = () => {
    if (!orders.length) return alert("No orders available.");
    const kitchenOrders = orders.filter((o) => o.status === "pending" || o.status === "processed");
    if (!kitchenOrders.length) return alert("No pending or processed orders found.");
    const doc = new jsPDF("p", "mm", "a4");
    let y = 20;
    doc.setFontSize(18);
    doc.setTextColor(184, 0, 19);
    doc.text(`Kitchen Report - ${branch}`, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 12;
    const summary: Record<string, { quantity: number; orders: number; statuses: Record<string, number> }> = {};
    kitchenOrders.forEach((order) => {
      const items = parseItems(order.items);
      const seen = new Set<string>();
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        if (!summary[name]) summary[name] = { quantity: 0, orders: 0, statuses: {} };
        summary[name].quantity += Number(item.quantity) || 0;
        if (!seen.has(name)) { summary[name].orders += 1; seen.add(name); }
        summary[name].statuses[order.status] = (summary[name].statuses[order.status] || 0) + 1;
      });
    });
    const rows = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => [
      name, data.quantity, data.orders,
      [data.statuses["pending"] ? `pending: ${data.statuses["pending"]}` : null, data.statuses["processed"] ? `processed: ${data.statuses["processed"]}` : null].filter(Boolean).join(", "),
    ]);
    autoTable(doc, {
      startY: y,
      head: [["Item", "Qty", "Orders", "Statuses"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [184, 0, 19], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
    doc.save(`Kitchen_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const generateKitchenExcel = () => {
    if (!orders.length) return alert("No orders available.");
    const kitchenOrders = orders.filter((o) => o.status === "pending" || o.status === "processed");
    if (!kitchenOrders.length) return alert("No pending or processed orders found.");
    const summary: Record<string, { quantity: number; orders: number; statuses: Record<string, number> }> = {};
    kitchenOrders.forEach((order) => {
      const items = parseItems(order.items);
      const seen = new Set<string>();
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        if (!summary[name]) summary[name] = { quantity: 0, orders: 0, statuses: {} };
        summary[name].quantity += Number(item.quantity) || 0;
        if (!seen.has(name)) { summary[name].orders += 1; seen.add(name); }
        summary[name].statuses[order.status] = (summary[name].statuses[order.status] || 0) + 1;
      });
    });
    const rows = Object.entries(summary).sort((a, b) => a[0].localeCompare(b[0])).map(([name, data]) => ({
      Item: name,
      Qty: data.quantity,
      Orders: data.orders,
      Statuses: [data.statuses["pending"] ? `pending: ${data.statuses["pending"]}` : null, data.statuses["processed"] ? `processed: ${data.statuses["processed"]}` : null].filter(Boolean).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kitchen Report");
    XLSX.writeFile(wb, `Kitchen_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleLogout = () => {
    try {
      supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      document.body.style.opacity = "0.5";
      document.body.style.pointerEvents = "none";
      setTimeout(() => window.location.reload(), 200);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please refresh manually.");
    }
  };

  const totalRevenue = orders.reduce((a, b) => a + Number(b.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const processed = orders.filter((o) => o.status === "processed").length;
  const packed = orders.filter((o) => o.status === "packed").length;
  const collected = orders.filter((o) => o.status === "collected").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const dayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === day.toDateString()
    );
    return { day: label, revenue: dayOrders.reduce((a, b) => a + Number(b.total), 0) };
  });

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white text-sm tracking-widest uppercase">
        Loading…
      </div>
    );

  const sidebarBtnClass =
    "w-full flex items-center gap-2.5 px-3 py-2 text-[12px] rounded-[6px] text-white/55 hover:text-white hover:bg-white/[0.05] transition cursor-pointer text-left";

  return (
    <DashboardShell
      role="manager"
      userEmail={user?.email || ""}
      pageTitle={`Dashboard · ${branch}`}
      onLogout={handleLogout}
      onRefresh={() => window.location.reload()}
      sidebarActions={
        <>
          <button onClick={generateKitchenPDF} className={sidebarBtnClass}>
            <FileDown size={13} className="shrink-0" /> Kitchen PDF
          </button>
          <button onClick={generateKitchenExcel} className={sidebarBtnClass}>
            <FileSpreadsheet size={13} className="shrink-0" /> Kitchen Excel
          </button>
          <button onClick={generateOrderPrepPDF} className={sidebarBtnClass}>
            <FileDown size={13} className="shrink-0" /> Order Prep PDF
          </button>
          <button onClick={generateOrderPrepExcel} className={sidebarBtnClass}>
            <FileSpreadsheet size={13} className="shrink-0" /> Order Prep Excel
          </button>
          <button onClick={generatePDFReport} className={sidebarBtnClass}>
            <FileDown size={13} className="shrink-0" /> PDF Order Report
          </button>
          <button onClick={generateExcelReport} className={sidebarBtnClass}>
            <FileSpreadsheet size={13} className="shrink-0" /> Excel Order Report
          </button>
        </>
      }
    >
      {/* ── Stats Row ── */}
      {/* Mobile: horizontal scroll */}
      <div className="md:hidden overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-4 px-4 mb-8">
        <div className="flex gap-2 w-max">
          {[
            { label: "Pending", value: pending, cls: "text-yellow-400" },
            { label: "Processed", value: processed, cls: "text-purple-400" },
            { label: "Packed", value: packed, cls: "text-blue-400" },
            { label: "Collected", value: collected, cls: "text-green-500" },
            { label: "Cancelled", value: cancelled, cls: "text-red-500" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-[#111111] border border-white/[0.07] rounded-[8px] px-4 py-4 flex flex-col min-w-[90px]">
              <span className={`text-[30px] font-bold leading-none ${cls}`} style={{ fontFamily: "var(--font-heading)" }}>{value}</span>
              <span className="text-[10px] uppercase tracking-[0.1em] text-white/50 mt-1.5" style={{ fontFamily: "var(--font-heading)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: original bordered grid */}
      <div className="hidden md:grid grid-cols-5 border border-white/[0.07] rounded-[8px] overflow-hidden mb-8">
        <StatItem label="Pending" value={pending} valueClass="text-yellow-400" />
        <StatItem label="Processed" value={processed} valueClass="text-purple-400" />
        <StatItem label="Packed" value={packed} valueClass="text-blue-400" />
        <StatItem label="Collected" value={collected} valueClass="text-green-500" />
        <StatItem label="Cancelled" value={cancelled} valueClass="text-red-500" last />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-6">
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Weekly Revenue Trend
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#B80013"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-6">
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Branch Performance
          </p>
          <div className="grid grid-cols-2 gap-6">
            {/* Top 5 products */}
            <div>
              <p className="text-[10px] text-white/30 mb-3 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>
                Top Products
              </p>
              {(() => {
                const totals: Record<string, number> = {};
                orders.forEach((o) => {
                  parseItems(o.items).forEach((item: any) => {
                    totals[item.title] = (totals[item.title] || 0) + item.quantity * item.price;
                  });
                });
                const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
                return top.length ? (
                  <div>
                    {top.map(([name, total], i) => (
                      <div
                        key={i}
                        className={`flex justify-between py-1.5 text-[12px] border-b border-white/[0.04] last:border-0 ${i === 0 ? "border-l-2 border-[#B80013] pl-2" : "pl-[10px]"}`}
                      >
                        <span className="text-white/60 truncate flex-1 mr-2">
                          <span className="text-white/25 mr-1">{i + 1}.</span>
                          {name}
                        </span>
                        <span className="text-[#B80013] text-[11px] font-medium">R{total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/25 text-xs italic">No data</p>
                );
              })()}
            </div>

            {/* Metrics */}
            <div className="flex flex-col gap-4">
              {(() => {
                const totalOrders = orders.length;
                const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
                const completionRate = totalOrders ? (collected / totalOrders) * 100 : 0;
                const thisMonth = orders.filter((o) => {
                  const d = new Date(o.created_at);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length;
                return (
                  <>
                    <MetricRow label="Avg Order Value" value={`R${avgOrderValue.toFixed(2)}`} />
                    <MetricRow label="Orders This Month" value={String(thisMonth)} />
                    <MetricRow label="Completion Rate" value={`${completionRate.toFixed(1)}%`} />
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Order Prep ── */}
      <OrderPrepDisplay orders={orders} parseItems={parseItems} />

      {showCreateOrder && (
        <CreateOrderModal
          branch={branch}
          onClose={() => setShowCreateOrder(false)}
          onComplete={(items) => {
            setSelectedItems(items);
            setShowCreateOrder(false);
            setShowCustomerDetails(true);
          }}
        />
      )}

      {showCustomerDetails && (
        <CustomerDetailsModal
          items={selectedItems}
          branch={branch || ""}
          onClose={() => {
            setShowCustomerDetails(false);
            setSelectedItems([]);
          }}
          onSuccess={() => {
            setShowCustomerDetails(false);
            setSelectedItems([]);
            window.location.reload();
          }}
        />
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowCreateOrder(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 w-14 h-14 md:w-12 md:h-12 bg-[#B80013] rounded-[12px] md:rounded-[8px] flex items-center justify-center hover:bg-[#960010] active:scale-95 transition cursor-pointer shadow-lg shadow-black/40"
        title="Create Order"
      >
        <Plus size={22} />
      </button>

      {/* ── Toast ── */}
      {showFeatureToast && (
        <FeatureToast
          message="You can now create orders directly from the dashboard."
          onClose={() => setShowFeatureToast(false)}
        />
      )}
    </DashboardShell>
  );
}

/* ── Local UI Components ── */

function StatItem({
  label,
  value,
  valueClass,
  last,
}: {
  label: string;
  value: number;
  valueClass: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col px-6 py-5 ${!last ? "border-r border-white/[0.07]" : ""}`}
    >
      <span
        className={`text-[36px] font-bold leading-none ${valueClass}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </span>
      <span
        className="text-[11px] uppercase tracking-[0.12em] text-white/50 mt-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[0.07] pb-3 last:border-0 last:pb-0">
      <p
        className="text-[10px] uppercase tracking-[0.1em] text-white/30 mb-0.5"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </p>
      <p
        className="text-[20px] font-bold text-white"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </p>
    </div>
  );
}
