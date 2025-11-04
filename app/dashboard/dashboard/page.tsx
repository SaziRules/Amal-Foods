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
  Pen,
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
import OrderPrepDisplay from "@/components/OrderPrepDisplay";

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; current: string } | null>(null);
  const [filter, setFilter] = useState("all");
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

  /* ───────────── Utilities ───────────── */
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

  /* ───────────── 🆕 Order Prep Report (Pending Only) ───────────── */
  const generateOrderPrepPDF = () => {
    if (!orders.length) return alert("No orders available.");

    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;
    doc.setFontSize(14);
    doc.text(`Order Prep Report — ${branch || "Branch"}`, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;

    const pendingOrders = orders.filter((o) => o.status === "pending");
    const summary: Record<string, { qty: number; orders: number }> = {};
    pendingOrders.forEach((o) => {
      const items = parseItems(o.items);
      items.forEach((i: any) => {
        const name = i.title || i.name || "Unnamed";
        const qty = Number(i.quantity || 0);
        if (!summary[name]) summary[name] = { qty: 0, orders: 0 };
        summary[name].qty += qty;
        summary[name].orders++;
      });
    });

    const rows = Object.entries(summary).map(([n, d]) => [n, d.qty, "pending", d.orders]);
    autoTable(doc, {
      startY: y,
      head: [["Item", "Quantity", "Status", "Total Orders"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [184, 0, 19], textColor: 255 },
      theme: "grid",
      margin: { left: 14 },
    });
    doc.save(`Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const generateOrderPrepExcel = () => {
    if (!orders.length) return alert("No orders available.");
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const summary: Record<string, { qty: number; orders: number }> = {};
    pendingOrders.forEach((o) => {
      const items = parseItems(o.items);
      items.forEach((i: any) => {
        const name = i.title || i.name || "Unnamed";
        const qty = Number(i.quantity || 0);
        if (!summary[name]) summary[name] = { qty: 0, orders: 0 };
        summary[name].qty += qty;
        summary[name].orders++;
      });
    });
    const data = Object.entries(summary).map(([n, d]) => ({
      Item: n,
      Quantity: d.qty,
      Status: "pending",
      "Total Orders": d.orders,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Order Prep Report");
    XLSX.writeFile(
      wb,
      `Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ───────────── PDF / Excel Generators (unchanged) ───────────── */
  const generatePDFReport = () => {
    if (!orders.length) return alert("No orders available to report.");
    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;
    doc.setFontSize(14);
    doc.text(`Prep Report — ${branch || "Branch"}`, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 10;
    const allItems = new Set<string>();
    orders.forEach((order) => {
      parseItems(order.items).forEach((item: any) => {
        allItems.add(item.title || item.name || "Unnamed");
      });
    });
    const totals: Record<string, number> = {};
    let totalValue = 0;
    const statusCount: Record<string, number> = {};
    orders.forEach((order, index) => {
      const items = parseItems(order.items);
      const rowData = items.map((i: any) => [
        i.title || i.name || "Unnamed",
        i.quantity || 0,
        `R${Number(i.price || 0).toFixed(2)}`,
        `R${(Number(i.price || 0) * Number(i.quantity || 0)).toFixed(2)}`,
      ]);
      totalValue += Number(order.total || 0);
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      items.forEach((i: any) => {
        const name = i.title || i.name || "Unnamed";
        totals[name] = (totals[name] || 0) + Number(i.quantity || 0);
      });
      if (y > 250) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(11);
      doc.setTextColor(184, 0, 19);
      doc.text(`Order ${index + 1}: ${order.order_number || order.id}`, 14, y);
      doc.setTextColor(0);
      y += 5;
      doc.setFontSize(9);
      doc.text(`Customer: ${order.customer_name || "—"}`, 14, y);
      doc.text(`Status: ${order.status || "—"}`, 140, y);
      y += 6;
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
    doc.save(`Readable_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const generateExcelReport = () => {
    if (!orders.length) return alert("No orders available to report.");
    const allItems = new Set<string>();
    orders.forEach((order) => {
      parseItems(order.items).forEach((item: any) => {
        allItems.add(item.title || item.name || "Unnamed");
      });
    });
    const itemColumns = Array.from(allItems);
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
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detailed Prep Report");
    XLSX.writeFile(
      wb,
      `Detailed_Prep_Report_${branch || "Branch"}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
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

  /* ───────────── Stats + Analytics ───────────── */
  const totalRevenue = orders.reduce((a, b) => a + Number(b.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
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
    const revenue = dayOrders.reduce((a, b) => a + Number(b.total || 0), 0);
    return { day: label, revenue, count: dayOrders.length };
  });

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

          {/* Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowManageOrders(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <Pen size={16} /> Manage Orders
            </button>

            {/* 🆕 Added Order Prep Buttons */}
            <button
              onClick={generateOrderPrepPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileDown size={16} /> Order Prep PDF
            </button>
            <button
              onClick={generateOrderPrepExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileSpreadsheet size={16} /> Order Prep Excel
            </button>

            {/* Existing Reports */}
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileDown size={16} /> PDF Order Report
            </button>
            <button
              onClick={generateExcelReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-sm font-semibold"
            >
              <FileSpreadsheet size={16} /> Excel Order Report
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

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-[#B80013] mb-4">Branch Performance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-gray-400 mb-3">Top Products by Sales</h3>
                {(() => {
                  const productTotals: Record<string, number> = {};
                  orders.forEach((o) => {
                    const items = parseItems(o.items);
                    items.forEach((item: any) => {
                      const name = item.title || item.name || "Unnamed";
                      const subtotal = Number(item.quantity || 1) * Number(item.price || 0);
                      productTotals[name] = (productTotals[name] || 0) + subtotal;
                    });
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
                        value={orders.filter((o) => {
                          const d = new Date(o.created_at);
                          const now = new Date();
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        }).length}
                      />
                      <SummaryCard title="Completion Rate" value={`${completionRate.toFixed(1)}%`} />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <OrderPrepDisplay orders={orders} parseItems={parseItems} />
        {/* 🗃️ Manage Orders Modal */}
{showManageOrders && (
  <ManageOrdersModal
    branch={branch}
    onClose={() => setShowManageOrders(false)}
  />
)}

      </div>
      
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
