"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Package, CheckCircle, Clock } from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  email: string;
  branch: string;
  total: number;
  status: string;
  created_at: string;
  items: { title: string; quantity: number; price: number }[];
}

export default function ManagerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  // 🧠 Get current user's branch
  useEffect(() => {
    const fetchBranchAndOrders = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
  window.location.href = "/dashboard/login";
  return;
}


      const { data: profile } = await supabase
        .from("profiles")
        .select("branch")
        .eq("id", user.id)
        .single();

      if (profile?.branch) {
        setBranch(profile.branch);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("branch", profile.branch)
          .order("created_at", { ascending: false });

        if (error) setError(error.message);
        else setOrders(data || []);
      } else {
        setError("Unable to determine branch for this manager.");
      }

      setLoading(false);
    };

    fetchBranchAndOrders();
  }, []);

  // 🔁 Update order status
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) return alert("Failed to update order: " + error.message);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: newStatus } : order
      )
    );
  };

  // 📊 Quick Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white px-8 py-28">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#B80013] mb-10">
          Branch Dashboard — {branch ? branch.toUpperCase() : "Loading..."}
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#111]/80 rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center">
            <Package className="text-red-500 mb-2" size={28} />
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-[#111]/80 rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center">
            <Clock className="text-yellow-500 mb-2" size={28} />
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-[#111]/80 rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center">
            <Loader2 className="text-blue-500 mb-2" size={28} />
            <p className="text-gray-400 text-sm">Processing</p>
            <p className="text-2xl font-bold">{stats.processing}</p>
          </div>
          <div className="bg-[#111]/80 rounded-xl p-6 border border-white/10 flex flex-col items-center justify-center">
            <CheckCircle className="text-green-500 mb-2" size={28} />
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-4 mb-8">
          {["all", "pending", "processing", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === s
                  ? "bg-red-700 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <p className="text-gray-400">Loading orders...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-400">No orders found for this filter.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#111]/80 rounded-xl p-6 border border-white/10"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {order.customer_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateStatus(order.id, e.target.value)
                    }
                    className="bg-black border border-white/20 rounded-full px-3 py-1 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="text-sm text-gray-300">
                  <p>
                    <strong>Phone:</strong> {order.phone_number}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.email || "—"}
                  </p>
                  <p>
                    <strong>Total:</strong> R{order.total.toFixed(2)}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-semibold text-gray-300 mb-2">Items:</p>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {order.items.map((i, idx) => (
                      <li key={idx}>
                        {i.title} — {i.quantity} × R{i.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
