"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  LogOut,
  Clock,
  TrendingUp,
  ShoppingBag,
  PlusCircle,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);


  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerForm, setManagerForm] = useState({
    name: "",
    email: "",
    password: "",
    branch: "Durban",
  });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.push("/admin/login");
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
  }, [router]);

  const [selectedManager, setSelectedManager] = useState<any>(null);

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
    alert("✅ Manager updated!");
    setSelectedManager(null);
    const { data: updated } = await supabase.from("managers").select("*");
    setManagers(updated || []);
  } catch (err: any) {
    alert("Error updating manager: " + err.message);
  }
};

const handleDeleteManager = async (id: string) => {
  if (!confirm("Are you sure you want to delete this manager?")) return;
  try {
    const { error } = await supabase.from("managers").delete().eq("id", id);
    if (error) throw error;
    alert("🗑️ Manager deleted");
    setSelectedManager(null);
    const { data: updated } = await supabase.from("managers").select("*");
    setManagers(updated || []);
  } catch (err: any) {
    alert("Error deleting manager: " + err.message);
  }
};


  const totalRevenue = orders.reduce((a, b) => a + b.total, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const completed = orders.filter((o) => o.status === "completed").length;

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const dayOrders = orders.filter(
      (o) => new Date(o.created_at).toDateString() === day.toDateString()
    );
    const revenue = dayOrders.reduce((a, b) => a + b.total, 0);
    return { day: label, revenue, count: dayOrders.length };
  });

  const branches = ["Durban", "Joburg"];
  const branchData = branches.map((b) => {
    const branchOrders = orders.filter(
      (o) => o.branch?.toLowerCase() === b.toLowerCase()
    );
    const revenue = branchOrders.reduce((a, b) => a + b.total, 0);
    return { name: b, value: revenue };
  });

  const COLORS = ["url(#gradientRed)", "url(#gradientGold)"];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
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

    alert("✅ Manager added successfully!");
    setShowManagerModal(false);
    setManagerForm({ name: "", email: "", password: "", branch: "Durban" });
    const { data: updated } = await supabase
      .from("managers")
      .select("*")
      .order("created_at", { ascending: false });
    setManagers(updated || []);
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        Loading dashboard...
      </div>
    );

  // Filtered Orders
  const displayedOrders = orders.filter((order) => {
    if (filter === "All") return true;
    if (["Durban", "Joburg"].includes(filter))
      return order.branch?.toLowerCase() === filter.toLowerCase();
    return order.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white p-6 md:p-10 relative"
      style={{ backgroundImage: "url('/images/checkout.png')" }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

      {/* Manager Modal */}
      {showManagerModal && (
        <Modal onClose={() => setShowManagerModal(false)} title="Add Manager">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={managerForm.name}
              onChange={(e) =>
                setManagerForm({ ...managerForm, name: e.target.value })
              }
              className="input"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={managerForm.email}
              onChange={(e) =>
                setManagerForm({ ...managerForm, email: e.target.value })
              }
              className="input"
            />
            <input
              type="password"
              placeholder="Password"
              value={managerForm.password}
              onChange={(e) =>
                setManagerForm({ ...managerForm, password: e.target.value })
              }
              className="input"
            />
            <select
              value={managerForm.branch}
              onChange={(e) =>
                setManagerForm({ ...managerForm, branch: e.target.value })
              }
              className="input"
            >
              <option value="Durban">Durban</option>
              <option value="Joburg">Joburg</option>
            </select>
            <button
              onClick={handleAddManager}
              className="w-full py-2 bg-[#B80013] hover:bg-red-800 rounded-lg font-medium transition"
            >
              Add Manager
            </button>
          </div>
        </Modal>
      )}

     {/* 🧾 Order Details Modal */}
{selectedOrder && (
  <Modal
    onClose={() => setSelectedOrder(null)}
    title={`Order #${selectedOrder.id.slice(0, 8)}`}
  >
    {(() => {
      // ✅ normalize any item format (JSON string, object, array)
      let items = [];
      try {
        if (typeof selectedOrder.items === "string") {
          const parsed = JSON.parse(selectedOrder.items);
          items = Array.isArray(parsed)
            ? parsed
            : parsed.items
            ? parsed.items
            : Object.values(parsed);
        } else if (Array.isArray(selectedOrder.items)) {
          items = selectedOrder.items;
        } else if (selectedOrder.items && typeof selectedOrder.items === "object") {
          items = Object.values(selectedOrder.items);
        }
      } catch {
        items = [];
      }

      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            <strong>Customer:</strong> {selectedOrder.customer_name || "N/A"}
          </p>
          <p className="text-sm text-gray-300">
            <strong>Total:</strong> R{selectedOrder.total?.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">
            <strong>Status:</strong>{" "}
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                selectedOrder.status === "completed"
                  ? "bg-green-700/40 text-green-300"
                  : selectedOrder.status === "pending"
                  ? "bg-yellow-700/40 text-yellow-300"
                  : "bg-red-700/40 text-red-300"
              }`}
            >
              {selectedOrder.status}
            </span>
          </p>
          <p className="text-sm text-gray-400">
            <strong>Branch:</strong> {selectedOrder.branch}
          </p>
          <p className="text-xs text-gray-500">
            Created:{" "}
            {new Date(selectedOrder.created_at).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          {/* 🧾 Ordered Items Section */}
          <div className="mt-5">
            <h3 className="text-[#B80013] text-sm font-semibold mb-3">
              Ordered Items
            </h3>

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm flex justify-between items-center hover:bg-white/10 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-200">
                        {item.name ||
                          item.title ||
                          item.product ||
                          item.item_name ||
                          "Unnamed"}
                      </p>
                      {item.variant && (
                        <p className="text-xs text-gray-400">
                          Variant: {item.variant}
                        </p>
                      )}
                      {item.quantity && (
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 font-semibold">
                      R{Number(item.price || item.total || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs italic">
                No items found for this order.
              </p>
            )}
          </div>
        </div>
      );
    })()}
  </Modal>
)}



      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 mt-[25%] md:mt-[8%]">
       {/* 🧑‍💼 Left Sidebar */}
<aside className="col-span-1 bg-[#141414]/90 rounded-3xl border border-white/10 p-6 shadow-2xl flex flex-col text-center relative">
  {/* Top Section */}
  <div className="flex flex-col items-center">
    <img
      src="https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
      alt="Admin"
      className="w-28 h-28 rounded-full border-4 border-[#B80013] object-cover mb-4 shadow-md"
    />
    <h3 className="font-semibold text-lg text-white">{user?.email}</h3>
    <p className="text-xs text-gray-400 mt-1 mb-6">Owner</p>

    {/* Buttons */}
    <div className="w-full flex flex-col gap-2">
      <button
        onClick={() => alert("Edit profile coming soon")}
        className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/15 rounded-lg text-sm transition"
      >
        <Settings size={16} /> Edit Profile
      </button>

      <button
        onClick={() => setShowReportModal(true)}
        className="flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
      >
        <TrendingUp size={16} /> Generate Report
      </button>

      <button
        onClick={() => window.open("/studio", "_blank")}
        className="flex items-center justify-center gap-2 w-full py-2 bg-[#B80013] hover:bg-red-800 rounded-lg text-sm transition"
      >
        <ExternalLink size={16} /> Open Studio
      </button>
    </div>
  </div>

  {/* Divider */}
  <div className="w-full h-[1px] bg-white/10 my-6"></div>

  {/* 👥 Managers Section */}
  <div className="flex-1">
    <div className="flex justify-between items-center mb-3">
      <h4 className="text-[#B80013] font-semibold uppercase tracking-wide text-sm">
        Manage Staff
      </h4>
      <button
        onClick={() => setShowManagerModal(true)}
        className="p-1 bg-[#B80013] hover:bg-red-800 rounded-lg transition"
      >
        <PlusCircle size={18} />
      </button>
    </div>

    <div className="w-full space-y-2">
      {managers.length === 0 ? (
        <p className="text-sm text-gray-500 text-center">No managers yet.</p>
      ) : (
        managers.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedManager(m)}
            className="bg-white/5 p-2 rounded-lg flex items-center justify-between text-sm hover:bg-white/10 transition cursor-pointer"
          >
            <span className="text-gray-200 truncate">{m.name}</span>
            <Users size={16} className="text-[#B80013]" />
          </div>
        ))
      )}
    </div>
  </div>

  {/* Bottom Section (Logout pinned) */}
  <div className="mt-8 pt-4 border-t border-white/10">
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 w-full py-2 bg-red-700/70 hover:bg-red-800 rounded-lg text-sm transition"
    >
      <LogOut size={16} /> Logout
    </button>
  </div>

  {/* ✏️ Edit Manager Modal */}
  {selectedManager && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#141414]/95 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-xl">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setSelectedManager(null)}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-[#B80013] mb-4">
          Edit Manager
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={selectedManager.name}
            onChange={(e) =>
              setSelectedManager({ ...selectedManager, name: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B80013]"
          />
          <input
            type="email"
            placeholder="Email"
            value={selectedManager.email}
            onChange={(e) =>
              setSelectedManager({ ...selectedManager, email: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B80013]"
          />
          <input
            type="password"
            placeholder="New Password (optional)"
            value={selectedManager.password || ""}
            onChange={(e) =>
              setSelectedManager({
                ...selectedManager,
                password: e.target.value,
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B80013]"
          />
          <select
            value={selectedManager.branch}
            onChange={(e) =>
              setSelectedManager({ ...selectedManager, branch: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#B80013]"
          >
            <option value="Durban">Durban</option>
            <option value="Joburg">Joburg</option>
          </select>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => handleUpdateManager(selectedManager)}
            className="py-2 px-4 bg-[#B80013] hover:bg-red-800 rounded-lg font-medium transition text-sm"
          >
            Save Changes
          </button>
          <button
            onClick={() => handleDeleteManager(selectedManager.id)}
            className="py-2 px-4 bg-red-700/70 hover:bg-red-800 rounded-lg font-medium transition text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )}

  {/* 📊 Generate Report Modal (UI Only) */}
  {showReportModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#141414]/95 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-xl">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={() => setShowReportModal(false)}
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-[#B80013] mb-4">
          Generate Report
        </h2>

        <div className="space-y-4">
          <select className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#B80013]">
            <option value="">Select Timespan</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-[#B80013] hover:bg-red-800 rounded-lg text-sm font-medium"
              onClick={() => alert("Report generation coming soon")}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</aside>




        {/* Main */}
        <section className="col-span-3 space-y-8">
          <h1 className="text-4xl font-bold text-[#B80013]">
            Welcome, {user?.email?.split("@")[0]}
          </h1>
          <p className="text-gray-300">
            Manage your operations, monitor performance, and analyze growth.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Revenue" value={`R${totalRevenue.toLocaleString()}`} icon={<TrendingUp size={22} />} color="emerald" />
            <StatCard title="Pending Orders" value={pending} icon={<Clock size={22} />} color="yellow" />
            <StatCard title="Completed Orders" value={completed} icon={<ShoppingBag size={22} />} color="green" />
            <StatCard title="Managers" value={`${managers.length} Active`} icon={<User size={22} />} color="red" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ChartCard title="Weekly Revenue Trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#B80013" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Revenue by Branch">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <defs>
                    <linearGradient id="gradientRed" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#B80013" />
                      <stop offset="100%" stopColor="#ff5f5f" />
                    </linearGradient>
                    <linearGradient id="gradientGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#FACC15" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={branchData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label={({ name, percent }) => `${name}: ${Math.round(Number(percent ?? 0) * 100)}%`}
                  >
                    {branchData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Orders Section */}
          <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-[#B80013] mb-4">
              Recent Orders
            </h2>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-5">
              {["All", "Durban", "Joburg", "Completed", "Pending", "Cancelled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm border border-white/10 transition ${
                    filter === f
                      ? "bg-[#B80013] text-white"
                      : "bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedOrders.length === 0 && (
                <p className="text-gray-400 text-sm">No orders found.</p>
              )}
              {displayedOrders.slice(0, 9).map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer bg-white/5 hover:bg-white/10 transition rounded-xl p-4 border border-white/10"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#B80013] font-semibold">
                      #{order.id.slice(0, 6)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "completed"
                          ? "bg-green-700/50 text-green-300"
                          : order.status === "cancelled"
                          ? "bg-red-700/50 text-red-300"
                          : "bg-yellow-700/50 text-yellow-300"
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
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()} |{" "}
                    {order.branch}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ───────────── Reusable Components ───────────── */
function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#141414]/95 border border-white/10 rounded-3xl w-full max-w-md p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-semibold text-[#B80013] mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-[#B80013]">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap: Record<string, string> = {
    red: "text-red-500",
    yellow: "text-yellow-400",
    green: "text-green-500",
    emerald: "text-emerald-400",
  };
  return (
    <div className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`p-2 bg-white/5 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

/* ───────────── Utility Styles ───────────── */
const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B80013]";
