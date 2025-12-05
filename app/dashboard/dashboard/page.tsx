"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Clock,
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

/* ⭐ Toast Component */
function FeatureToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 bg-[#111]/90 border border-white/10 text-white px-5 py-3 rounded-xl shadow-lg z-[9999] animate-slideIn">
      <div className="flex items-center gap-3">
        <span className="text-lg">✨</span>
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={16} />
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
  const [showManageOrders, setShowManageOrders] = useState(false);

  /* ⭐ Toast visibility */
  const [showFeatureToast, setShowFeatureToast] = useState(true);

  /* ------------------ Fetch Orders ------------------ */
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

  /* ------------------ Utilities ------------------ */
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

  /* ------------------ Report Generators ------------------ */

  const generatePDFReport = () => {
    if (!orders.length) return alert("No orders available.");

    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;

    doc.setFontSize(14);
    doc.text(`Prep Report — ${branch}`, 14, y);
    y += 10;

    orders.forEach((order) => {
      const rows = parseItems(order.items).map((i: any) => [
        i.title,
        i.quantity,
        `R${i.price}`,
        `R${i.quantity * i.price}`,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Item", "Qty", "Price", "Subtotal"]],
        body: rows,
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Prep_Report_${branch}.pdf`);
  };

  const generateExcelReport = () => {
    const data = orders.map((order) => ({
      "Order Number": order.order_number || order.id,
      Total: order.total,
      Status: order.status,
      Payment: order.payment_status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Orders.xlsx");
  };

  /* ------------------ RESTORED PERFECT LOGOUT LOGIC ------------------ */
  const handleLogout = () => {
    try {
      supabase.auth.signOut();              // logout supabase
      localStorage.clear();                 // clear storage
      sessionStorage.clear();               // clear session
      document.body.style.opacity = "0.5";  // fade out for UX polish
      document.body.style.pointerEvents = "none"; 

      setTimeout(() => {
        window.location.reload();           // hard reload to guarantee clean session
      }, 200);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed — please refresh manually.");
    }
  };

  /* ------------------ Stats & Analytics ------------------ */

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

    const revenue = dayOrders.reduce((a, b) => a + Number(b.total), 0);

    return { day: label, revenue };
  });

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Loading Manager Dashboard...
      </div>
    );

  /* ------------------ Render ------------------ */

  return (
    <main
      className="min-h-screen bg-cover bg-center text-white p-6 md:p-10 relative"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative z-10 mt-10 space-y-8">

        {/* Header */}
        <header className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[#B80013]">
              Welcome, {user?.email?.split("@")[0]}
            </h1>
            <p className="text-gray-300">
              Managing <span className="font-semibold text-[#B80013]">{branch}</span> Orders
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowManageOrders(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <Pen size={16} /> Manage Orders
            </button>

            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileDown size={16} /> PDF Report
            </button>

            <button
              onClick={generateExcelReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileSpreadsheet size={16} /> Excel Report
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-[#B80013] rounded-lg"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Pending Orders" value={pending} icon={<Clock size={22} />} color="yellow" />
          <StatCard title="Processed Orders" value={processed} icon={<Loader2 size={22} />} color="purple" />
          <StatCard title="Packed Orders" value={packed} icon={<Loader2 size={22} />} color="blue" />
          <StatCard title="Collected Orders" value={collected} icon={<CheckCircle size={22} />} color="green" />
          <StatCard title="Cancelled Orders" value={cancelled} icon={<X size={22} />} color="red" />
        </div>

        {/* Weekly Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#141414]/80 rounded-3xl p-6 border border-white/10">
            <h2 className="text-lg text-[#B80013] font-semibold mb-4">
              Weekly Revenue Trend
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333" }} />
                <Line type="monotone" dataKey="revenue" stroke="#B80013" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ⭐ FULL BRANCH PERFORMANCE ANALYTICS (RESTORED) */}
          <div className="bg-[#141414]/80 rounded-3xl p-6 border border-white/10">
            <h2 className="text-lg text-[#B80013] font-semibold mb-4">
              Branch Performance Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Top Products */}
              <div>
                <h3 className="text-sm text-gray-400 mb-2">Top Products by Sales</h3>
                {(() => {
                  const totals: Record<string, number> = {};

                  orders.forEach((o) => {
                    parseItems(o.items).forEach((item: any) => {
                      const subtotal = item.quantity * item.price;
                      totals[item.title] = (totals[item.title] || 0) + subtotal;
                    });
                  });

                  const top = Object.entries(totals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                  return top.length ? (
                    <div className="space-y-3">
                      {top.map(([name, total], i) => (
                        <div
                          key={i}
                          className="flex justify-between bg-white/5 p-2 rounded-lg border border-white/10 text-sm"
                        >
                          <span className="text-gray-300">{name}</span>
                          <span className="text-[#B80013] font-semibold">
                            R{total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs italic">
                      No product data available.
                    </p>
                  );
                })()}
              </div>

              {/* Metrics */}
              <div className="flex flex-col justify-center space-y-4">
                {(() => {
                  const totalOrders = orders.length;
                  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
                  const collectedOrders = orders.filter((o) => o.status === "collected").length;
                  const completionRate = totalOrders ? (collectedOrders / totalOrders) * 100 : 0;

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

        {/* Orders */}
        <OrderPrepDisplay orders={orders} parseItems={parseItems} />

        {showManageOrders && (
          <ManageOrdersModal
            branch={branch}
            onClose={() => setShowManageOrders(false)}
          />
        )}

      </div>

      {/* ⭐ Toast */}
      {showFeatureToast && (
        <FeatureToast
          message="✨ New! You can now delete cancelled orders in Manage Orders."
          onClose={() => setShowFeatureToast(false)}
        />
      )}
    </main>
  );
}

/* ------------------ UI COMPONENTS ------------------ */

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
    purple: "text-purple-400",
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
