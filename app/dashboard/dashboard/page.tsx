"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Clock,
  TrendingUp,
  CheckCircle,
  Loader2,
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

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ id: string; current: string } | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/manager/login";
        return;
      }
      setUser(data.user);

      // Find manager’s branch
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

      // Get orders for Durban branch only
      const { data: branchOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("branch", "Durban")
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

  // ✅ Fixed: Update order status (actually persists to Supabase)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", id)
        .select(); // ensures Supabase returns updated row

      if (error) {
        console.error("Error updating status:", error.message);
        alert("Error updating status: " + error.message);
        return;
      }

      if (data && data.length > 0) {
        const updatedOrder = data[0];
        setOrders((prev) =>
          prev.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      }

      setShowStatusModal(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Unexpected update error:", err);
      alert("Unexpected error while updating order status.");
    }
  };

  // 🧠 Logout function
  const handleLogout = async () => {
  try {
    await supabase.auth.signOut();
    localStorage.clear(); // <-- add this line for stubborn sessions
    window.location.replace("/manager/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};


  // 📊 Quick Stats
  const totalRevenue = orders.reduce((a, b) => a + Number(b.total || 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  // 📅 Weekly Chart
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

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status.toLowerCase() === filter);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        Loading Manager Dashboard...
      </div>
    );

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
              Managing <span className="text-[#B80013] font-semibold">Durban</span> Orders
            </p>
          </div>

          {/* Right-side buttons */}
          <div className="flex gap-3">
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
          <StatCard title="Total Revenue" value={`R${totalRevenue.toLocaleString()}`} icon={<TrendingUp size={22} />} color="emerald" />
          <StatCard title="Pending Orders" value={pending} icon={<Clock size={22} />} color="yellow" />
          <StatCard title="Processing Orders" value={processing} icon={<Loader2 size={22} />} color="blue" />
          <StatCard title="Completed Orders" value={completed} icon={<CheckCircle size={22} />} color="green" />
        </div>

        {/* Weekly Revenue Trend + Branch Performance Side by Side */}
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
              {/* Top Products */}
              <div>
                <h3 className="text-sm text-gray-400 mb-3">Top Products by Sales</h3>
                {(() => {
                  const productTotals: Record<string, number> = {};
                  orders.forEach((o) => {
                    try {
                      let items: any[] = [];
                      if (typeof o.items === "string") {
                        const parsed = JSON.parse(o.items);
                        items = Array.isArray(parsed)
                          ? parsed
                          : parsed.items
                          ? parsed.items
                          : Object.values(parsed);
                      } else if (Array.isArray(o.items)) {
                        items = o.items;
                      }

                      items.forEach((item) => {
                        const name = item.title || item.name || "Unnamed";
                        const subtotal = Number(item.quantity || 1) * Number(item.price || 0);
                        productTotals[name] = (productTotals[name] || 0) + subtotal;
                      });
                    } catch {}
                  });

                  const topProducts = Object.entries(productTotals)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);

                  return topProducts.length ? (
                    <div className="space-y-3">
                      {topProducts.map(([name, total], i) => (
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
                  const completedOrders = orders.filter((o) => o.status === "completed").length;
                  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

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
          {["all", "pending", "processing", "completed", "cancelled"].map((s) => (
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
          <h2 className="text-lg font-semibold text-[#B80013] mb-4">Durban Orders</h2>

          {filteredOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No {filter} orders found for Durban branch.</p>
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
                        order.status === "completed"
                          ? "bg-green-700/50 text-green-300"
                          : order.status === "processing"
                          ? "bg-blue-700/50 text-blue-300"
                          : order.status === "pending"
                          ? "bg-yellow-700/50 text-yellow-300"
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
                    <strong>Total:</strong> R{order.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
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
              {["pending", "processing", "completed", "cancelled"].map((s) => (
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
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`p-2 bg-white/5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}
