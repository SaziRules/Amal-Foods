"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useRouter,
} from "next/navigation";
import {
  TrendingUp,
  PlusCircle,
  Users,
  X,
  ExternalLink,
  Download,
  FileText,
  ShoppingBag,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import CustomerAnalytics from "@/components/CustomerAnalytics";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<any>(null);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [isGeneratingInvoices, setIsGeneratingInvoices] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    password: "",
    branch: "Durban",
  });

  const staffRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        if (typeof window !== "undefined") window.location.href = "/admin/login";
        return;
      }
      setUser(data.user);
      const { data: allOrders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: allManagers } = await supabase
        .from("managers")
        .select("*")
        .order("created_at", { ascending: false });
      setOrders(allOrders || []);
      setManagers(allManagers || []);
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdateManager = async (manager: any) => {
    try {
      const { error } = await supabase
        .from("managers")
        .update({
          name: manager.name,
          email: manager.email,
          branch: manager.branch,
          ...(manager.password && { password: manager.password }),
        })
        .eq("id", manager.id);
      if (error) throw error;
      alert("Manager updated!");
      setSelectedManager(null);
      const { data: updated } = await supabase.from("managers").select("*");
      setManagers(updated || []);
    } catch (err: any) {
      alert("Error updating manager: " + err.message);
    }
  };

  const handleDeleteManager = async (id: string) => {
    try {
      const { error } = await supabase.from("managers").delete().eq("id", id);
      if (error) throw error;
      alert("Manager deleted");
      setSelectedManager(null);
      const { data: updated } = await supabase.from("managers").select("*");
      setManagers(updated || []);
    } catch (err: any) {
      alert("Error deleting manager: " + err.message);
    }
  };

  const totalRevenue = orders.reduce((a, b) => a + b.total, 0);
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const unpaidOrders = orders.filter((o) => o.payment_status === "unpaid");
  const paidCount = paidOrders.length;
  const unpaidCount = unpaidOrders.length;
  const paidTotal = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const unpaidTotal = unpaidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const dayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === day.toDateString()
    );
    return { day: label, revenue: dayOrders.reduce((a, b) => a + b.total, 0), count: dayOrders.length };
  });

  const statusBreakdown = [
    { name: "Pending", value: orders.filter(o => o.status === "pending").length, color: "#EAB308" },
    { name: "Processed", value: orders.filter(o => o.status === "processed").length, color: "#A855F7" },
    { name: "Packed", value: orders.filter(o => o.status === "packed").length, color: "#3B82F6" },
    { name: "Collected", value: orders.filter(o => o.status === "collected").length, color: "#14B8A6" },
    { name: "Cancelled", value: orders.filter(o => o.status === "cancelled").length, color: "#EF4444" },
  ];

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

  const handleExportToExcel = () => {
    const rows: Record<string, any>[] = [];
    orders.forEach((order) => {
      let items: any[] = [];
      try {
        if (typeof order.items === "string") {
          const parsed = JSON.parse(order.items);
          items = Array.isArray(parsed) ? parsed : parsed.items ? parsed.items : Object.values(parsed);
        } else if (Array.isArray(order.items)) {
          items = order.items;
        } else if (order.items && typeof order.items === "object") {
          items = Object.values(order.items);
        }
      } catch { items = []; }
      const base = {
        "Order ID": order.id,
        Date: new Date(order.created_at).toLocaleString("en-ZA", { dateStyle: "short", timeStyle: "short" }),
        Customer: order.customer_name || "",
        Phone: order.phone_number || "",
        Email: order.email || "",
        Branch: order.branch || "",
        "Order Total (R)": Number(order.total || 0).toFixed(2),
        Status: order.status || "",
        Payment: order.payment_status || "",
      };
      if (items.length === 0) {
        rows.push({ ...base, Item: "", Variant: "", Qty: "", "Item Price (R)": "" });
      } else {
        items.forEach((item: any, idx: number) => {
          rows.push({
            "Order ID": idx === 0 ? order.id : "",
            Date: idx === 0 ? base["Date"] : "",
            Customer: idx === 0 ? base["Customer"] : "",
            Phone: idx === 0 ? base["Phone"] : "",
            Email: idx === 0 ? base["Email"] : "",
            Branch: idx === 0 ? base["Branch"] : "",
            Item: item.name || item.title || item.product || item.item_name || "",
            Variant: item.variant || "",
            Qty: item.quantity ?? 1,
            "Item Price (R)": Number(item.price || item.total || 0).toFixed(2),
            "Order Total (R)": idx === 0 ? base["Order Total (R)"] : "",
            Status: idx === 0 ? base["Status"] : "",
            Payment: idx === 0 ? base["Payment"] : "",
          });
        });
      }
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const colKeys = Object.keys(rows[0] || {});
    ws["!cols"] = colKeys.map((key) => ({ wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length)) + 2 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Orders");
    XLSX.writeFile(wb, `amal-foods-orders-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleGenerateAllInvoices = async () => {
    if (orders.length === 0) return alert("No orders to generate invoices for.");
    setIsGeneratingInvoices(true);
    try {
      const logoUrl = "/images/logo-light.png";
      const logoBlob = await fetch(logoUrl).then((r) => r.blob());
      const logoDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(logoBlob);
      });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      for (let idx = 0; idx < orders.length; idx++) {
        const order = orders[idx];
        if (idx > 0) doc.addPage();
        let items: any[] = [];
        try {
          if (typeof order.items === "string") {
            const parsed = JSON.parse(order.items);
            items = Array.isArray(parsed) ? parsed : parsed.items ? parsed.items : Object.values(parsed);
          } else if (Array.isArray(order.items)) {
            items = order.items;
          } else if (order.items && typeof order.items === "object") {
            items = Object.values(order.items);
          }
        } catch { items = []; }
        doc.addImage(logoDataUrl, "PNG", pageWidth / 2 - 25, 10, 50, 20);
        doc.setFontSize(16);
        doc.text("PROFORMA INVOICE", pageWidth / 2, 40, { align: "center" });
        doc.setFontSize(10);
        const paymentStatus = (order.payment_status || "unpaid").toUpperCase();
        const infoLines = [
          `Date: ${new Date(order.created_at).toLocaleDateString()}`,
          `Order Number: ${order.order_number || order.id}`,
          `Customer: ${order.customer_name || "-"}`,
          `Cell: ${order.cell_number || order.phone_number || "-"}`,
          `Email: ${order.email || "-"}`,
          `Region: ${order.region || "-"}`,
          `Branch: ${order.branch || "-"}`,
          `Payment Method: ${order.payment_method || "-"}`,
          `Payment Status: ${paymentStatus}`,
        ];
        infoLines.forEach((line, i) => doc.text(line, 14, 55 + i * 6));
        const tableRows = items.map((item: any) => [
          item.title || item.name || item.product || "-",
          item.quantity ?? 1,
          `R${Number(item.price || 0).toFixed(2)}`,
          `R${(Number(item.price || 0) * (item.quantity ?? 1)).toFixed(2)}`,
        ]);
        autoTable(doc, {
          startY: 55 + infoLines.length * 6 + 5,
          head: [["Item", "Qty", "Price", "Subtotal"]],
          body: tableRows.length > 0 ? tableRows : [["-", "-", "-", "-"]],
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [184, 0, 19] },
        });
        const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
        doc.setFontSize(11);
        doc.text(`Total: R${Number(order.total || 0).toFixed(2)}`, 14, lastY + 10);
        doc.setFontSize(10);
        const bankY = lastY + 25;
        doc.text("EFT Banking Details:", 14, bankY);
        doc.text("Bank: Nedbank", 14, bankY + 6);
        doc.text("Account Name: Amal Holdings", 14, bankY + 12);
        doc.text("Account Number: 1169327818", 14, bankY + 18);
        doc.text("Reference: Your Full Name", 14, bankY + 24);
        doc.text("Please send proof of payment to your nearest branch before collection.", 14, bankY + 30);
      }
      doc.save(`amal-foods-all-invoices-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err: any) {
      alert("Failed to generate invoices: " + err.message);
    } finally {
      setIsGeneratingInvoices(false);
    }
  };

  const handleAddManager = async () => {
    const { name, email, password, branch } = managerForm;
    if (!name || !email || !password) return alert("Please fill in all fields");
    const res = await fetch("/api/create-manager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, branch }),
    });
    const result = await res.json();
    if (!result.success) return alert("Error: " + result.error);
    alert("Manager added successfully!");
    setShowManagerModal(false);
    setManagerForm({ name: "", email: "", password: "", branch: "Durban" });
    const { data: updated } = await supabase.from("managers").select("*").order("created_at", { ascending: false });
    setManagers(updated || []);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white text-sm tracking-widest uppercase">
        Loading…
      </div>
    );

  const actionBtnClass =
    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[12px] border border-white/10 rounded-[8px] text-white/60 hover:text-white hover:border-white/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <DashboardShell
      role="admin"
      userEmail={user?.email || ""}
      pageTitle="Admin Dashboard"
      onLogout={handleLogout}
      onRefresh={() => window.location.reload()}
      onReports={() => setShowReportModal(true)}
      onStaff={() => staffRef.current?.scrollIntoView({ behavior: "smooth" })}
      onAnalytics={() => analyticsRef.current?.scrollIntoView({ behavior: "smooth" })}
      sidebarActions={
        <>
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer"
          >
            <TrendingUp size={14} /> Generate Report
          </button>
          <button
            onClick={handleExportToExcel}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer"
          >
            <Download size={14} /> Export to Excel
          </button>
          <button
            onClick={handleGenerateAllInvoices}
            disabled={isGeneratingInvoices}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] disabled:opacity-40 transition cursor-pointer"
          >
            <FileText size={14} /> {isGeneratingInvoices ? "Generating…" : "Generate All Invoices"}
          </button>
          <button
            onClick={() => window.open("/studio", "_blank")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-[6px] border border-white/[0.07] transition cursor-pointer"
          >
            <ExternalLink size={14} /> Open Studio
          </button>
        </>
      }
      topBarActions={
        <>
          <button onClick={() => router.push("/admin/orders")} className={actionBtnClass}>
            <ShoppingBag size={13} /><span className="hidden sm:inline">Orders</span>
          </button>
          <button onClick={() => setShowReportModal(true)} className={actionBtnClass}>
            <TrendingUp size={13} /><span className="hidden sm:inline">Report</span>
          </button>
          <button onClick={handleExportToExcel} className={actionBtnClass}>
            <Download size={13} /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => window.open("/studio", "_blank")} className={actionBtnClass}>
            <ExternalLink size={13} /><span className="hidden sm:inline">Studio</span>
          </button>
        </>
      }
    >
      {/* ── Add Manager Modal ── */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-md p-4 sm:p-6 relative">
            <button
              className="absolute top-4 right-4 text-white/30 hover:text-white"
              onClick={() => setShowManagerModal(false)}
            >
              <X size={20} />
            </button>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5" style={{ fontFamily: "var(--font-heading)" }}>
              Add Manager
            </p>
            <div className="space-y-5">
              {[
                { placeholder: "Full Name", type: "text", value: managerForm.name, onChange: (v: string) => setManagerForm({ ...managerForm, name: v }) },
                { placeholder: "Email Address", type: "email", value: managerForm.email, onChange: (v: string) => setManagerForm({ ...managerForm, email: v }) },
                { placeholder: "Password", type: "password", value: managerForm.password, onChange: (v: string) => setManagerForm({ ...managerForm, password: v }) },
              ].map(({ placeholder, type, value, onChange }) => (
                <input
                  key={placeholder}
                  type={type}
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 placeholder-white/25 transition-colors"
                />
              ))}
              <div className="flex gap-3">
                {["Durban", "Joburg"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setManagerForm({ ...managerForm, branch: b })}
                    className={`flex-1 py-2 text-[13px] border rounded-[4px] transition ${managerForm.branch === b ? "border-[#B80013] text-white bg-[#B80013]/10" : "border-white/[0.07] text-white/50 hover:text-white hover:border-white/20"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddManager}
                className="w-full h-[48px] bg-[#B80013] hover:bg-[#960010] text-white font-bold text-[13px] uppercase tracking-[0.1em] transition rounded-[4px]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Add Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Manager Modal ── */}
      {selectedManager && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-md p-4 sm:p-6 relative">
            <button
              className="absolute top-4 right-4 text-white/30 hover:text-white"
              onClick={() => setSelectedManager(null)}
            >
              <X size={20} />
            </button>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5" style={{ fontFamily: "var(--font-heading)" }}>
              Edit Manager
            </p>
            <div className="space-y-5">
              <input
                type="text"
                placeholder="Full Name"
                value={selectedManager.name}
                onChange={(e) => setSelectedManager({ ...selectedManager, name: e.target.value })}
                className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 placeholder-white/25 transition-colors"
              />
              <input
                type="email"
                placeholder="Email"
                value={selectedManager.email}
                onChange={(e) => setSelectedManager({ ...selectedManager, email: e.target.value })}
                className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 placeholder-white/25 transition-colors"
              />
              <input
                type="password"
                placeholder="New Password (optional)"
                value={selectedManager.password || ""}
                onChange={(e) => setSelectedManager({ ...selectedManager, password: e.target.value })}
                className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 placeholder-white/25 transition-colors"
              />
              <div className="flex gap-3">
                {["Durban", "Joburg"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedManager({ ...selectedManager, branch: b })}
                    className={`flex-1 py-2 text-[13px] border rounded-[4px] transition ${selectedManager.branch === b ? "border-[#B80013] text-white bg-[#B80013]/10" : "border-white/[0.07] text-white/50 hover:text-white hover:border-white/20"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleUpdateManager(selectedManager)}
                  className="flex-1 h-[44px] bg-[#B80013] hover:bg-[#960010] text-white font-bold text-[12px] uppercase tracking-[0.1em] transition rounded-[4px]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setManagerToDelete(selectedManager); setShowDeleteConfirm(true); }}
                  className="flex-1 h-[44px] border border-red-700/60 text-red-400 hover:bg-red-700/20 text-[12px] uppercase tracking-[0.1em] transition rounded-[4px]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-md p-4 sm:p-6 relative">
            <button
              className="absolute top-4 right-4 text-white/30 hover:text-white"
              onClick={() => setShowReportModal(false)}
            >
              <X size={20} />
            </button>
            <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5" style={{ fontFamily: "var(--font-heading)" }}>
              Generate Report
            </p>
            <select className="w-full bg-transparent border-b border-white/[0.1] focus:border-[#B80013] outline-none text-[14px] text-white py-2 mb-6 transition-colors">
              <option value="" className="bg-[#111]">Select Timespan</option>
              <option value="7days" className="bg-[#111]">Last 7 Days</option>
              <option value="30days" className="bg-[#111]">Last 30 Days</option>
              <option value="90days" className="bg-[#111]">Last 90 Days</option>
              <option value="custom" className="bg-[#111]">Custom Range</option>
            </select>
            <button
              onClick={() => alert("Report generation coming soon")}
              className="w-full h-[44px] bg-[#B80013] hover:bg-[#960010] text-white font-bold text-[12px] uppercase tracking-[0.1em] transition rounded-[4px]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {showDeleteConfirm && managerToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4">
          <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-sm p-6 sm:p-8 text-center">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#B80013] mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Confirm Deletion
            </p>
            <p className="text-[13px] text-white/60 mb-8">
              Permanently delete{" "}
              <span className="text-white font-medium">{managerToDelete.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-white/[0.07] text-[13px] text-white/60 hover:text-white transition rounded-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeleteManager(managerToDelete.id); setShowDeleteConfirm(false); }}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-[13px] text-white font-medium transition rounded-[4px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-white/[0.07] rounded-[8px] overflow-hidden mb-8">
        <RevenueStatItem label="Total Revenue" value={totalRevenue} />
        <RevenueStatItem label={`${paidCount} Paid`} value={paidTotal} valueClass="text-green-500" />
        <RevenueStatItem label={`${unpaidCount} Unpaid`} value={unpaidTotal} valueClass="text-yellow-400" />
        <AdminStatItem label="Pending" value={pending} valueClass="text-yellow-400" />
        <AdminStatItem label="Completed" value={completed} valueClass="text-green-500" />
        <AdminStatItem label="Managers" value={managers.length} />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-6">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5" style={{ fontFamily: "var(--font-heading)" }}>
            Weekly Revenue Trend
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="revenue" stroke="#B80013" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-6">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5" style={{ fontFamily: "var(--font-heading)" }}>
            Order Status Breakdown
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 0, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", fontSize: "12px" }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {statusBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Customer Analytics ── */}
      <div ref={analyticsRef} id="analytics">
        <CustomerAnalytics />
      </div>

      {/* ── Staff Management ── */}
      <div ref={staffRef} id="staff" className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-white/50"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            — Staff Management —
          </p>
          <button
            onClick={() => setShowManagerModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] border border-white/10 rounded-[8px] text-white/60 hover:text-white hover:border-white/20 transition cursor-pointer"
          >
            <PlusCircle size={14} /> Add Manager
          </button>
        </div>
        {managers.length === 0 ? (
          <p className="text-white/25 text-sm italic">No managers yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {managers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedManager(m)}
                className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-4 text-left hover:border-white/[0.14] transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13px] font-medium text-white truncate">{m.name}</p>
                  <Users size={14} className="text-white/25 flex-shrink-0 ml-2" />
                </div>
                <p className="text-[11px] text-white/40 truncate">{m.email}</p>
                <p className="text-[10px] text-white/25 mt-1 uppercase tracking-wider">{m.branch}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

/* ── Local UI Components ── */

function AdminStatItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col px-5 py-5 border-r border-b border-white/[0.07]">
      <span
        className={`text-[30px] font-bold leading-none ${valueClass || "text-white"}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase tracking-[0.1em] text-white/50 mt-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </span>
    </div>
  );
}

function RevenueStatItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  const formatted = value.toLocaleString("en-ZA", { maximumFractionDigits: 0 });
  return (
    <div className="flex flex-col px-5 py-5 border-r border-b border-white/[0.07]">
      <span
        className={`text-[28px] font-bold leading-none ${valueClass || "text-white"}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        <span className="text-[18px]">R</span>
        {formatted}
      </span>
      <span
        className="text-[10px] uppercase tracking-[0.1em] text-white/50 mt-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </span>
    </div>
  );
}
