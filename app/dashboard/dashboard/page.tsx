"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Clock,
  TrendingUp,
  CheckCircle,
  Loader2,
  X,
  FileDown,
  FileSpreadsheet,
  Pen
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
import ManageOrdersModal from "@/components/ManageOrdersModal";

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; current: string } | null>(null);
  const [filter, setFilter] = useState("all");

  /* ───────────── Modal for Managing Orders ───────────── */
  const [showManageOrders, setShowManageOrders] = useState(false);


  /* ───────────── Fetch Orders ───────────── */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/dashboard/login";
        return;
      }
      setUser(data.user);

      const { data: manager, error: managerError } = await supabase
        .from("managers")
        .select("branch")
        .eq("email", data.user.email)
        .single();

      if (managerError || !manager?.branch) {
        console.error("Manager fetch error:", managerError?.message);
        alert("Unable to determine branch for this manager.");
        setLoading(false);
        return;
      }

      const branchName = manager.branch.trim();
      setBranch(branchName);

      const { data: branchOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("branch", branchName)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error.message);
        setLoading(false);
        return;
      }

      setOrders(branchOrders || []);
      setLoading(false);
    };

    init();
  }, []);

  /* ───────────── Utilities for items ───────────── */
  const parseItems = (raw: any) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.items)) return parsed.items;
        if (typeof parsed === "object") return Object.values(parsed);
      } catch {
        return [];
      }
    }
    if (typeof raw === "object") {
      if (Array.isArray(raw.items)) return raw.items;
      return Object.values(raw);
    }
    return [];
  };

  /* ───────────── Prep summary for reports ───────────── */
  const summarizeItems = () => {
    const activeOrders = orders.filter((o) =>
  ["pending", "packed", "unpaid"].includes(o.status)
);

    const summary: Record<
      string,
      { totalQty: number; orders: number; statusBreakdown: Record<string, number> }
    > = {};
    activeOrders.forEach((order) => {
      const items = parseItems(order.items);
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        const qty = Number(item.quantity || 0);
        if (!summary[name]) {
          summary[name] = { totalQty: 0, orders: 0, statusBreakdown: {} };
        }
        summary[name].totalQty += qty;
        summary[name].orders++;
        summary[name].statusBreakdown[order.status] =
          (summary[name].statusBreakdown[order.status] || 0) + 1;
      });
    });
    return summary;
  };

  /* ───────────── Generate PDF / Excel ───────────── */
 const generatePDFReport = () => {
  if (!orders.length) return alert("No orders available to report.");

  const doc = new jsPDF("p", "mm", "a4"); // Portrait layout
  let y = 15;

  doc.setFontSize(14);
  doc.text(`Prep Report — ${branch || "Branch"}`, 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
  y += 10;

  // 🔍 Collect all unique item names (for totals only)
  const allItems = new Set<string>();
  orders.forEach((order) => {
    parseItems(order.items).forEach((item: any) => {
      allItems.add(item.title || item.name || "Unnamed");
    });
  });
  const itemList = Array.from(allItems);

  // 🧮 Totals
  const totals: Record<string, number> = {};
  let totalValue = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  const statusCount: Record<string, number> = {};

  // 🧾 Iterate orders as mini-tables
  orders.forEach((order, index) => {
    const items = parseItems(order.items);
    const rowData = items.map((i: any) => [
      i.title || i.name || "Unnamed",
      i.quantity || 0,
      `R${Number(i.price || 0).toFixed(2)}`,
      `R${(Number(i.price || 0) * Number(i.quantity || 0)).toFixed(2)}`,
    ]);

    // Totals collection
    totalValue += Number(order.total || 0);
    if (order.payment_status === "paid") paidCount++;
    if (order.payment_status === "unpaid") unpaidCount++;
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    items.forEach((i: any) => {
      const name = i.title || i.name || "Unnamed";
      totals[name] = (totals[name] || 0) + Number(i.quantity || 0);
    });

    // 📦 Page break logic
    if (y > 250) {
      doc.addPage();
      y = 15;
    }

    // Header for this order
    doc.setFontSize(11);
    doc.setTextColor(184, 0, 19);
    doc.text(`Order ${index + 1}: ${order.order_number || order.id}`, 14, y);
    doc.setTextColor(0);
    y += 5;
    doc.setFontSize(9);
    doc.text(`Customer: ${order.customer_name || "—"}`, 14, y);
    doc.text(`Cell: ${order.cell_number || order.phone_number || "—"}`, 80, y);
    doc.text(`Status: ${order.status || "—"}`, 140, y);
    y += 5;
    doc.text(`Payment: ${order.payment_status || "—"}`, 14, y);
    doc.text(`Total: R${Number(order.total || 0).toFixed(2)}`, 80, y);
    y += 6;

    // 🧾 Items mini-table
    autoTable(doc, {
      startY: y,
      head: [["Item", "Qty", "Price", "Subtotal"]],
      body: rowData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [184, 0, 19], textColor: 255 },
      theme: "grid",
      margin: { left: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // 🧾 Final Totals Summary
  doc.addPage();
  doc.setFontSize(13);
  doc.setTextColor(184, 0, 19);
  doc.text("Summary Totals", 14, 20);
  doc.setTextColor(0);
  doc.setFontSize(9);

  // Totals table
  const totalsTable = Object.entries(totals).map(([name, qty]) => [name, qty]);
  autoTable(doc, {
    startY: 28,
    head: [["Product", "Total Quantity"]],
    body: totalsTable,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [184, 0, 19], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14 },
  });

  // 📊 Grand totals footer
  let footerY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total Order Value: R${totalValue.toFixed(2)}`, 14, footerY);
  footerY += 5;
  doc.text(
    `Statuses: ${Object.entries(statusCount)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}`,
    14,
    footerY
  );
  footerY += 5;
  doc.text(`Paid: ${paidCount} | Unpaid: ${unpaidCount}`, 14, footerY);

  doc.save(
    `Readable_Prep_Report_${branch || "Branch"}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`
  );
};



  const generateExcelReport = () => {
  if (!orders.length) return alert("No orders available to report.");

  // 🔍 Collect all unique item names
  const allItems = new Set<string>();
  orders.forEach((order) => {
    parseItems(order.items).forEach((item: any) => {
      allItems.add(item.title || item.name || "Unnamed");
    });
  });
  const itemColumns = Array.from(allItems);

  // 🧾 Build rows
  const data = orders.map((order) => {
    const items = parseItems(order.items);
    const itemMap: Record<string, number> = {};
    items.forEach((i: any) => {
      const name = i.title || i.name || "Unnamed";
      itemMap[name] = (itemMap[name] || 0) + Number(i.quantity || 0);
    });

    const row: Record<string, any> = {
      "Order Number": order.order_number || order.id,
      "Customer Name": order.customer_name || "—",
      "Cell Number": order.cell_number || order.phone_number || "—",
    };

    itemColumns.forEach((col) => (row[col] = itemMap[col] || 0));
    row["Total Value"] = `R${Number(order.total || 0).toFixed(2)}`;
    row["Status"] = order.status || "—";
    row["Payment"] = order.payment_status || "—";
    return row;
  });

  // 🧮 Totals
  const totals: Record<string, number> = {};
  itemColumns.forEach((col) => (totals[col] = 0));
  let totalValue = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  const statusCount: Record<string, number> = {};

  orders.forEach((order) => {
    const items = parseItems(order.items);
    items.forEach((i: any) => {
      const name = i.title || i.name || "Unnamed";
      totals[name] = (totals[name] || 0) + Number(i.quantity || 0);
    });
    totalValue += Number(order.total || 0);
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    if (order.payment_status === "paid") paidCount++;
    if (order.payment_status === "unpaid") unpaidCount++;
  });

  const totalRow: Record<string, any> = {
    "Order Number": "Totals",
    "Customer Name": "",
    "Cell Number": "",
  };
  itemColumns.forEach((col) => (totalRow[col] = totals[col] || 0));
  totalRow["Total Value"] = `R${totalValue.toFixed(2)}`;
  totalRow["Status"] = Object.entries(statusCount)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  totalRow["Payment"] = `Paid: ${paidCount}, Unpaid: ${unpaidCount}`;

  data.push(totalRow);

  // 📦 Export
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detailed Prep Report");
  XLSX.writeFile(
    wb,
    `Detailed_Prep_Report_${branch || "Branch"}_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
};



  /* ───────────── Update order status ───────────── */
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id)
        .select();

      if (error) {
        console.error("Error updating status:", error.message);
        alert("Error updating status: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        const updatedOrder = data[0];
        setOrders((prev) =>
          prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
        );
      }

      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Unexpected update error:", err);
      alert("Unexpected error while updating order status.");
    }
  };

  /* ───────────── Logout ───────────── */
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
      alert("Logout failed — please refresh manually.");
    }
  };

  /* ───────────── Stats ───────────── */
  const totalRevenue = orders.reduce((a, b) => a + Number(b.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
const packed = orders.filter((o) => o.status === "packed").length;
const collected = orders.filter((o) => o.status === "collected").length;
const cancelled = orders.filter((o) => o.status === "cancelled").length;
const paid = orders.filter((o) => o.status === "paid").length;
const unpaid = orders.filter((o) => o.status === "unpaid").length;


  /* ───────────── Weekly Chart Data ───────────── */
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const dayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === day.toDateString()
    );
    const revenue = dayOrders.reduce((a, b) => a + Number(b.total || 0), 0);
    return { day: label, revenue, count: dayOrders.length };
  });

  /* ───────────── Filtering ───────────── */
  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status.toLowerCase() === filter);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        Loading Manager Dashboard...
      </div>
    );

  /* ───────────── Render ───────────── */
  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white p-6 md:p-10 relative"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

      <div className="relative z-10 mt-[25%] md:mt-[7%] space-y-8">
        {/* Header */}
        <header className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#B80013]">
              Welcome, {user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-300">
              Managing <span className="text-[#B80013] font-semibold">{branch}</span> Orders
            </p>
          </div>

          {/* Right-side buttons (added two new report buttons) */}
          <div className="flex gap-3 flex-wrap">
            <button
  onClick={() => setShowManageOrders(true)}
  className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
>
 <Pen size={16} /> Manage Orders
</button>

            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileDown size={16} /> PDF Prep Report
            </button>
            <button
              onClick={generateExcelReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileSpreadsheet size={16} /> Excel Prep Report
            </button>
            <button
              onClick={() => window.open("/studio", "_blank")}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-medium"
            >
              Launch Studio
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#B80013] rounded-lg hover:bg-[#90000f] transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard title="Pending Orders" value={pending} icon={<Clock size={22} />} color="yellow" />
  <StatCard title="Packed Orders" value={packed} icon={<Loader2 size={22} />} color="blue" />
  <StatCard title="Collected Orders" value={collected} icon={<CheckCircle size={22} />} color="green" />
  <StatCard title="Cancelled Orders" value={cancelled} icon={<X size={22} />} color="red" />
</div>


        {/* Weekly Revenue Trend + Branch Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Revenue Trend */}
          <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-[#B80013]">Weekly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#B80013" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Performance Analytics */}
          <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-[#B80013] mb-4">Branch Performance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Products by Sales */}
              <div>
                <h3 className="text-sm text-gray-400 mb-3">Top Products by Sales</h3>
                {(() => {
                  const productTotals: Record<string, number> = {};
                  orders.forEach((o) => {
                    try {
                      const items = parseItems(o.items);
                      items.forEach((item: any) => {
                        const name = item.title || item.name || "Unnamed";
                        const subtotal = Number(item.quantity || 1) * Number(item.price || 0);
                        productTotals[name] = (productTotals[name] || 0) + subtotal;
                      });
                    } catch {}
                  });

                  const top = Object.entries(productTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                  return top.length ? (
                    <div className="space-y-3">
                      {top.map(([name, total], i) => (
                        <div key={i} className="flex justify-between bg-white/5 p-2 rounded-lg border border-white/10 text-sm">
                          <span className="text-gray-300">{name}</span>
                          <span className="text-[#B80013] font-semibold">R{total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">No product data available yet.</p>
                  );
                })()}
              </div>

              {/* Summary Cards */}
              <div className="flex flex-col justify-center space-y-4">
                {(() => {
                  const totalOrders = orders.length;
                  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
                  const collectedOrders = orders.filter((o) => o.status === "collected").length;
const completionRate = totalOrders > 0 ? (collectedOrders / totalOrders) * 100 : 0;


                  return (
                    <>
                      <SummaryCard title="Average Order Value" value={`R${avgOrderValue.toFixed(2)}`} />
                      <SummaryCard
                        title="Orders This Month"
                        value={
                          orders.filter((o) => {
                            const d = new Date(o.created_at);
                            const now = new Date();
                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                          }).length
                        }
                      />
                      <SummaryCard title="Completion Rate" value={`${completionRate.toFixed(1)}%`} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mt-8">
          {["all", "pending", "packed", "collected", "cancelled", "paid", "unpaid"].map((s) => (

            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === s ? "bg-[#B80013] text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders */}
        <section className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-[#B80013] mb-4">{branch} Orders</h2>

          {filteredOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No {filter} orders found for {branch} branch.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setStatusTarget({ id: order.id, current: order.status });
                    setShowStatusModal(true);
                  }}
                  className="cursor-pointer bg-white/5 hover:bg-white/10 transition rounded-xl p-4 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#B80013] font-semibold">#{order.id.slice(0, 6)}</span>
                    <span
  className={`text-xs px-2 py-1 rounded-full capitalize ${
    order.status === "paid"
      ? "bg-green-700/50 text-green-300"
      : order.status === "unpaid"
      ? "bg-orange-700/50 text-orange-300"
      : order.status === "pending"
      ? "bg-yellow-700/50 text-yellow-300"
      : order.status === "packed"
      ? "bg-blue-700/50 text-blue-300"
      : order.status === "collected"
      ? "bg-teal-700/50 text-teal-300"
      : "bg-red-700/50 text-red-300"
  }`}
>
  {order.status}
</span>

                  </div>
                  <p className="text-sm text-gray-300">
                    <strong>Customer:</strong> {order.customer_name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-400">
                    <strong>Total:</strong> R{Number(order.total || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 🔄 Status Modal */}
      {showStatusModal && statusTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm">
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/10 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#B80013]">
                Update Order Status
              </h2>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["pending", "packed", "collected", "cancelled", "paid", "unpaid"].map((s) => (

                <button
                  key={s}
                  onClick={() => handleUpdateStatus(statusTarget.id, s)}
                  className={`py-2 rounded-lg font-medium text-sm capitalize transition ${
                    s === statusTarget.current
                      ? "bg-[#B80013] text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* 🗃️ Manage Orders Modal */}
      {showManageOrders && (
  <ManageOrdersModal
    branch={branch}
    onClose={() => setShowManageOrders(false)}
  />
)}



    </main>
  );
}

/* ───────────── Reusable Components ───────────── */
function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-xl font-semibold text-[#B80013] mt-1">{value}</p>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    red: "text-red-500",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
    green: "text-green-500",
    emerald: "text-emerald-400",
  };
  return (
    <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify_between mb-2">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`p-2 bg-white/5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
