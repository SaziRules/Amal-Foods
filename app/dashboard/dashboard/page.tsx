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
  Plus,
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
import useOrderPrepExport from "@/components/OrderPrepExport";
import CreateOrderModal from "@/components/CreateOrderModal";
import CustomerDetailsModal from "@/components/CustomerDetailsmodal.tsx"

/* ⭐ Toast Component */
function FeatureToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 bg-[#111]/90 border border-white/10 text-white px-5 py-3 rounded-xl shadow-lg z-9999 animate-slideIn">
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
  const [showFeatureToast, setShowFeatureToast] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

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

  /* ------------------ Order Prep Export Hook ------------------ */
  const { generateOrderPrepPDF, generateOrderPrepExcel } =
    useOrderPrepExport(orders, parseItems, branch || "");

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

  const generatePDFReport = () => {
  if (!orders.length) return alert("No orders available.");

  const doc = new jsPDF("p", "mm", "a4");
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(184, 0, 19);
  doc.text(`Order Prep Report — ${branch}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
  y += 12;

  // --------------------------------------------------
  // BUILD ITEM SUMMARY TABLE
  // --------------------------------------------------

  const summary: Record<
    string,
    {
      quantity: number;
      orders: number;
      statuses: Record<string, number>;
      payments: Record<string, number>;
    }
  > = {};

  // Loop all orders
  orders.forEach((order) => {
    const items = parseItems(order.items);
    const seenInOrder = new Set<string>(); // Prevent duplicate order counts per item

    items.forEach((item: any) => {
      const name = item.title || item.name || "Unnamed";
      const qty = Number(item.quantity) || 0;

      if (!summary[name]) {
        summary[name] = {
          quantity: 0,
          orders: 0,
          statuses: {},
          payments: {},
        };
      }

      // Total quantity
      summary[name].quantity += qty;

      // Count orders only once per item
      if (!seenInOrder.has(name)) {
        summary[name].orders += 1;
        seenInOrder.add(name);
      }

      // Status count
      const status = order.status || "pending";
      summary[name].statuses[status] =
        (summary[name].statuses[status] || 0) + 1;

      // Payment count
      const payment = order.payment_status || "unpaid";
      summary[name].payments[payment] =
        (summary[name].payments[payment] || 0) + 1;
    });
  });

  // Convert summary → table rows
  const tableRows = Object.entries(summary).map(([name, data]) => {
    const statusString = Object.entries(data.statuses)
      .map(([s, count]) => `${s}: ${count}`)
      .join(", ");

    const paymentString = Object.entries(data.payments)
      .map(([p, count]) => `${p}: ${count}`)
      .join(", ");

    return [
      name,
      data.quantity,
      data.orders,
      statusString,
      paymentString,
    ];
  });

  // Sort alphabetically
  tableRows.sort((a, b) => (a[0] as string).localeCompare(b[0] as string));

  // --------------------------------------------------
  // PDF TABLE
  // --------------------------------------------------
  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Orders", "Statuses", "Payments"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [184, 0, 19],
      textColor: 255,
      fontSize: 11,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    margin: { left: 14, right: 14 },
  });

  // Save PDF
  doc.save(
    `Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
};


  /* ------------------ NEW EXCEL ORDER REPORT (matches PDF) ------------------ */
const generateExcelReport = () => {
  if (!orders.length) return alert("No orders available.");

  // --------------------------------------------------
  // BUILD SUMMARY (same as PDF)
  // --------------------------------------------------

  const summary: Record<
    string,
    {
      quantity: number;
      orders: number;
      statuses: Record<string, number>;
      payments: Record<string, number>;
    }
  > = {};

  orders.forEach((order) => {
    const items = parseItems(order.items);
    const seenInOrder = new Set<string>();

    items.forEach((item: any) => {
      const name = item.title || item.name || "Unnamed";
      const qty = Number(item.quantity) || 0;

      if (!summary[name]) {
        summary[name] = {
          quantity: 0,
          orders: 0,
          statuses: {},
          payments: {},
        };
      }

      // Quantity
      summary[name].quantity += qty;

      // Orders count (unique per order)
      if (!seenInOrder.has(name)) {
        summary[name].orders += 1;
        seenInOrder.add(name);
      }

      // Status count
      const status = order.status || "pending";
      summary[name].statuses[status] =
        (summary[name].statuses[status] || 0) + 1;

      // Payment count
      const payment = order.payment_status || "unpaid";
      summary[name].payments[payment] =
        (summary[name].payments[payment] || 0) + 1;
    });
  });

  // --------------------------------------------------
  // FORMAT ROWS FOR EXCEL
  // --------------------------------------------------

  const rows = Object.entries(summary)
    .sort((a, b) => a[0].localeCompare(b[0])) // alphabetical sort
    .map(([name, data]) => {
      const statusString = Object.entries(data.statuses)
        .map(([s, count]) => `${s}: ${count}`)
        .join(", ");

      const paymentString = Object.entries(data.payments)
        .map(([p, count]) => `${p}: ${count}`)
        .join(", ");

      return {
        Item: name,
        Qty: data.quantity,
        Orders: data.orders,
        Statuses: statusString,
        Payments: paymentString,
      };
    });

  // --------------------------------------------------
  // EXPORT TO EXCEL
  // --------------------------------------------------

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Order Prep Summary");

  XLSX.writeFile(
    wb,
    `Order_Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};

/* ------------------ KITCHEN REPORT PDF ------------------ */
const generateKitchenPDF = () => {
  if (!orders.length) return alert("No orders available.");

  // Filter only pending + processed
  const kitchenOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "processed"
  );

  if (!kitchenOrders.length)
    return alert("No pending or processed orders found.");

  const doc = new jsPDF("p", "mm", "a4");
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(184, 0, 19);
  doc.text(`Kitchen Report — ${branch}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
  y += 12;

  const summary: Record<
    string,
    { quantity: number; orders: number; statuses: Record<string, number> }
  > = {};

  kitchenOrders.forEach((order) => {
    const items = parseItems(order.items);
    const seen = new Set<string>();

    items.forEach((item: any) => {
      const name = item.title || item.name || "Unnamed";

      if (!summary[name]) {
        summary[name] = {
          quantity: 0,
          orders: 0,
          statuses: {},
        };
      }

      summary[name].quantity += Number(item.quantity) || 0;

      if (!seen.has(name)) {
        summary[name].orders += 1;
        seen.add(name);
      }

      const status = order.status;
      summary[name].statuses[status] =
        (summary[name].statuses[status] || 0) + 1;
    });
  });

  const rows = Object.entries(summary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, data]) => {
      const statusString = [
        data.statuses["pending"] ? `pending: ${data.statuses["pending"]}` : null,
        data.statuses["processed"]
          ? `processed: ${data.statuses["processed"]}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      return [
        name,
        data.quantity,
        data.orders,
        statusString,
      ];
    });

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Orders", "Statuses"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [184, 0, 19], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  doc.save(
    `Kitchen_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
};

/* ------------------ KITCHEN REPORT EXCEL ------------------ */
const generateKitchenExcel = () => {
  if (!orders.length) return alert("No orders available.");

  const kitchenOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "processed"
  );

  if (!kitchenOrders.length)
    return alert("No pending or processed orders found.");

  const summary: Record<
    string,
    { quantity: number; orders: number; statuses: Record<string, number> }
  > = {};

  kitchenOrders.forEach((order) => {
    const items = parseItems(order.items);
    const seen = new Set<string>();

    items.forEach((item: any) => {
      const name = item.title || item.name || "Unnamed";

      if (!summary[name]) {
        summary[name] = {
          quantity: 0,
          orders: 0,
          statuses: {},
        };
      }

      summary[name].quantity += Number(item.quantity) || 0;

      if (!seen.has(name)) {
        summary[name].orders += 1;
        seen.add(name);
      }

      const status = order.status;
      summary[name].statuses[status] =
        (summary[name].statuses[status] || 0) + 1;
    });
  });

  const rows = Object.entries(summary)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, data]) => {
      const statusString = [
        data.statuses["pending"] ? `pending: ${data.statuses["pending"]}` : null,
        data.statuses["processed"]
          ? `processed: ${data.statuses["processed"]}`
          : null,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        Item: name,
        Qty: data.quantity,
        Orders: data.orders,
        Statuses: statusString,
      };
    });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Kitchen Report");

  XLSX.writeFile(
    wb,
    `Kitchen_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};


  /* ------------------ Logout ------------------ */
  const handleLogout = () => {
    try {
      supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      document.body.style.opacity = "0.5";
      document.body.style.pointerEvents = "none";

      setTimeout(() => {
        window.location.reload();
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

            {/* NEW DETAILED EXPORTS */}
            <button
              onClick={generateKitchenPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/15  border border-white/20 rounded-lg cursor-pointer"
            >
              <FileDown size={16} /> Kitchen PDF
            </button>

            <button
              onClick={generateKitchenExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/15 border border-white/20 rounded-lg cursor-pointer"
            >
              <FileSpreadsheet size={16} /> Kitchen Excel
            </button>

            <button
              onClick={generateOrderPrepPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileDown size={16} /> Order Prep PDF
            </button>

            <button
              onClick={generateOrderPrepExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileSpreadsheet size={16} /> Order Prep Excel
            </button>

            {/* OLD SUMMARY EXPORTS */}
            <button
              onClick={generatePDFReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileDown size={16} /> PDF Order Report
            </button>

            <button
              onClick={generateExcelReport}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg"
            >
              <FileSpreadsheet size={16} /> Excel Order Report
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

          {/* Branch Performance Analytics */}
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

      {/* Floating + Button */}
      <button
        onClick={() => setShowCreateOrder(true)}
        className="
          fixed bottom-8 right-8 z-50
          w-18 h-18 rounded-full
          bg-[#B80013] text-white
          flex items-center justify-center
          shadow-xl
          hover:scale-105 active:scale-95
          transition cursor-pointer
        "
        aria-label="Create Order"
      >
        <Plus size={28} />
      </button>

      {/* Toast */}
      {showFeatureToast && (
        <FeatureToast
          message="✨ New! Mutton Haleem is readily available to add to existing orders."
          onClose={() => setShowFeatureToast(false)}
        />
      )}

      {/* STEP 1: Product Selection Modal */}
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

      {/* STEP 2: Customer Details & Submission Modal */}
      {showCustomerDetails && (
        <CustomerDetailsModal
          items={selectedItems}
          branch={branch}
          onClose={() => {
            setShowCustomerDetails(false);
            setSelectedItems([]);
          }}
          onSuccess={() => {
            setShowCustomerDetails(false);
            setSelectedItems([]);
            // Refresh orders list
            window.location.reload();
          }}
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