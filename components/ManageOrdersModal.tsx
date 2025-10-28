"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Search, ChevronDown } from "lucide-react";

interface ManageOrdersModalProps {
  branch: string | null;
  onClose: () => void;
}

export default function ManageOrdersModal({ branch, onClose }: ManageOrdersModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "lastMonth" | "all">("today");
  const [statusFilter, setStatusFilter] = useState<"all" | string>("all");

  useEffect(() => {
    if (!branch) return;
    fetchOrders();
  }, [branch]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("branch", branch)
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    if (error) {
      alert("Failed to update status: " + error.message);
    } else {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    }
  };

  /* ───────────── Date Filter Logic ───────────── */
  const applyDateFilter = (orders: any[]) => {
    if (dateFilter === "all") return orders;

    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at);
      const sameDay = orderDate.toDateString() === now.toDateString();

      if (dateFilter === "today") return sameDay;

      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo && orderDate <= now;
      }

      if (dateFilter === "month") {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }

      if (dateFilter === "lastMonth") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return orderDate >= lastMonth && orderDate <= monthEnd;
      }

      return true;
    });
  };

  /* ───────────── Combined Filters ───────────── */
  const filteredOrders = applyDateFilter(
    orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        o.customer_name?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q) ||
        o.created_at?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  );

  const totalOrders = filteredOrders.length;

  /* ───────────── Status Counts ───────────── */
  const statusCounts = ["pending", "packed", "collected", "cancelled", "paid", "unpaid"].reduce(
    (acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-[95%] md:w-[90%] lg:w-[80%] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#0b0b0b]/60">
          <h2 className="text-xl font-semibold text-[#B80013]">
            Manage / Process Orders — {branch}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="p-4 flex flex-col gap-4 bg-[#0b0b0b]/40">
          {/* Search Bar */}
          <div className="flex items-center gap-3 w-full">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, order ID, or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 focus:border-[#B80013] outline-none text-sm text-gray-300 placeholder-gray-500 py-1"
            />
          </div>

          {/* Date Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
              { key: "all", label: "All" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateFilter(key as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  dateFilter === key
                    ? "bg-[#B80013] text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start border-t border-white/10 pt-3">
            {["all", "pending", "packed", "collected", "cancelled", "paid", "unpaid"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === s
                    ? "bg-[#B80013] text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {s === "all"
                  ? `All (${orders.length})`
                  : `${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Total Orders Count */}
        <div className="text-center py-2 text-sm text-gray-400 bg-black/30 border-t border-white/10">
          Showing <span className="text-[#B80013] font-semibold">{totalOrders}</span> orders
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-400">Loading orders...</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">No matching orders found.</p>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#B80013] font-semibold text-sm">
                    #{order.id.slice(0, 6)}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-gray-300 text-sm">
                  <strong>Customer:</strong> {order.customer_name}
                </p>
                <p className="text-gray-400 text-sm">
                  <strong>Total:</strong> R{order.total.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>

                <details className="mt-3 bg-white/5 rounded-lg p-2">
                  <summary className="text-xs text-gray-400 flex items-center justify-between cursor-pointer">
                    View Items <ChevronDown size={14} />
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {Array.isArray(order.items) ? (
                      order.items.map((item: any, i: number) => (
                        <li key={i} className="text-xs text-gray-300">
                          {item.title || item.name} × {item.quantity}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 text-xs">No item data</li>
                    )}
                  </ul>
                </details>

                {/* Status Update Buttons */}
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "packed", "collected", "cancelled", "paid", "unpaid"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(order.id, s)}
                        className={`text-xs px-2 py-1.5 rounded-lg transition-all ${
                          s === order.status
                            ? "bg-[#B80013] text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Status Badge ───────────── */
function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    paid: "bg-green-700/50 text-green-300",
    unpaid: "bg-orange-700/50 text-orange-300",
    pending: "bg-yellow-700/50 text-yellow-300",
    packed: "bg-blue-700/50 text-blue-300",
    collected: "bg-teal-700/50 text-teal-300",
    cancelled: "bg-red-700/50 text-red-300",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full capitalize ${
        colorMap[status] || "bg-gray-700/50 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}
