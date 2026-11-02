"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { X, ShoppingBag } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CustomerSidebar from "@/components/CustomerSidebar";

interface Order {
  id: string;
  branch: string;
  total: number;
  status: string;
  payment_status?: string;
  order_number?: string;
  created_at: string;
  items?: any[];
}

const STATUS_STYLE: Record<string, string> = {
  completed:  "bg-emerald-700/25 text-emerald-400 border-emerald-700/40",
  collected:  "bg-teal-700/25    text-teal-400    border-teal-700/40",
  packed:     "bg-blue-700/25    text-blue-400    border-blue-700/40",
  processed:  "bg-violet-700/25  text-violet-400  border-violet-700/40",
  cancelled:  "bg-white/[0.05]   text-white/35    border-white/[0.07]",
  pending:    "bg-amber-700/20   text-amber-400   border-amber-700/40",
};

const FILTERS = ["all", "pending", "packed", "collected", "cancelled", "paid", "unpaid"] as const;

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/customer/login"); return; }
      setUser(user);

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    document.body.style.opacity = "0.5";
    document.body.style.pointerEvents = "none";
    setTimeout(() => { window.location.href = "/"; }, 300);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    await supabase.from("customers").delete().eq("id", user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "all") return true;
    const s = o.status?.toLowerCase() || "";
    const p = o.payment_status?.toLowerCase() || "";
    return s === activeFilter || p === activeFilter;
  });

  const pending   = orders.filter(o => o.status?.toLowerCase() === "pending").length;
  const completed = orders.filter(o => ["collected", "completed"].includes(o.status?.toLowerCase())).length;
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white text-[11px] tracking-widest uppercase" style={{ fontFamily: "var(--font-heading)" }}>
      Loading…
    </div>
  );

  return (
    <DashboardShell
      role="customer"
      userEmail={user?.email || ""}
      pageTitle="My Account"
      onLogout={handleLogout}
      onRefresh={() => window.location.reload()}
      sidebarTop={<CustomerSidebar user={user} />}
      sidebarActions={
        <div className="px-2 pb-2 pt-1">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] text-[#B80013]/60 hover:text-[#B80013] bg-transparent hover:bg-[#B80013]/[0.06] rounded-[6px] border border-transparent hover:border-[#B80013]/20 transition cursor-pointer"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Delete Account
            </button>
          ) : (
            <div className="bg-[#111111] border border-[#B80013]/30 rounded-[8px] p-3">
              <p className="text-[11px] text-white/60 mb-3 leading-snug">
                This permanently deletes your account.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-[30px] bg-[#B80013] hover:bg-[#960010] text-[11px] text-white font-bold uppercase tracking-[0.08em] rounded-[4px] transition disabled:opacity-40 cursor-pointer"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {deleting ? "…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-[30px] border border-white/[0.07] text-[11px] text-white/40 hover:text-white rounded-[4px] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      }
    >
      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border border-white/[0.07] rounded-[8px] overflow-hidden mb-8">
        <StatItem label="Total Orders" value={orders.length} />
        <StatItem label="Pending"      value={pending}       valueClass="text-amber-400" />
        <StatItem label="Completed"    value={completed}     valueClass="text-emerald-400" />
        <SpendItem label="Total Spent" value={totalSpent} />
      </div>

      {/* ── Orders section ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <p
            className="text-[11px] uppercase tracking-[0.12em] text-white/50"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Order History
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`h-[26px] px-3 text-[10px] font-bold uppercase tracking-[0.08em] rounded-[4px] border transition cursor-pointer capitalize ${
                  activeFilter === f
                    ? "border-[#B80013] bg-[#B80013]/10 text-white"
                    : "border-white/[0.07] text-white/35 hover:text-white hover:border-white/20"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag size={28} className="text-white/[0.12] mb-4" />
            <p
              className="text-[22px] font-extrabold uppercase text-white/[0.12] leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {activeFilter === "all" ? "No orders yet." : `No ${activeFilter} orders.`}
            </p>
            {activeFilter === "all" && (
              <a
                href="/products"
                className="mt-5 text-[11px] uppercase tracking-[0.1em] text-[#B80013] hover:text-white transition-colors"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Browse Products →
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-px">
            {filteredOrders.map((order) => {
              const statusKey = order.status?.toLowerCase() || "pending";
              const badgeClass = STATUS_STYLE[statusKey] || STATUS_STYLE.pending;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center justify-between bg-[#111111] hover:bg-[#161616] border border-white/[0.07] hover:border-white/[0.12] px-5 py-4 rounded-[6px] cursor-pointer transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate group-hover:text-white transition-colors">
                      {order.order_number || `#${order.id.slice(0, 8).toUpperCase()}`}
                    </p>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      {order.branch ? ` · ${order.branch}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-[4px] border capitalize ${badgeClass}`} style={{ fontFamily: "var(--font-heading)" }}>
                      {order.status}
                    </span>
                    <span className="text-[13px] font-semibold text-white/70">
                      R{Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111111] border border-white/[0.07] rounded-[12px] w-full max-w-lg p-6 relative">
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <p
                className="text-[11px] uppercase tracking-[0.12em] text-white/50 mb-5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Order Details
              </p>

              <div className="space-y-3 mb-5">
                {[
                  { label: "Order", value: selectedOrder.order_number || selectedOrder.id },
                  { label: "Date", value: new Date(selectedOrder.created_at).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) },
                  { label: "Branch", value: selectedOrder.branch || "—" },
                  { label: "Status", value: selectedOrder.status },
                  { label: "Payment", value: selectedOrder.payment_status || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline gap-4">
                    <span
                      className="text-[10px] uppercase tracking-[0.1em] text-white/30 shrink-0"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {label}
                    </span>
                    <span className="text-[13px] text-white/70 text-right capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.07] pt-4 mb-4">
                <p
                  className="text-[10px] uppercase tracking-[0.1em] text-white/30 mb-3"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Items
                </p>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  <div className="space-y-px">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/[0.05] last:border-0">
                        <div>
                          <p className="text-[13px] text-white/80">{item.title || item.name || "—"}</p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-white/30 mt-0.5">× {item.quantity}</p>
                          )}
                        </div>
                        <span className="text-[13px] text-white/55">
                          R{(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-white/25 italic">Item details unavailable.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/[0.07]">
                <span
                  className="text-[10px] uppercase tracking-[0.1em] text-white/30"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Total
                </span>
                <span className="text-[16px] font-bold text-[#B80013]">
                  R{Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

/* ── Stat cells ── */

function StatItem({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="flex flex-col px-5 py-5 border-r border-b border-white/[0.07] last:border-r-0">
      <span
        className={`text-[30px] font-bold leading-none ${valueClass || "text-white"}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase tracking-[0.1em] text-white/40 mt-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </span>
    </div>
  );
}

function SpendItem({ label, value }: { label: string; value: number }) {
  const formatted = value.toLocaleString("en-ZA", { maximumFractionDigits: 0 });
  return (
    <div className="flex flex-col px-5 py-5 border-b border-white/[0.07]">
      <span
        className="text-[30px] font-bold leading-none text-white"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        <span className="text-[18px]">R</span>{formatted}
      </span>
      <span
        className="text-[10px] uppercase tracking-[0.1em] text-white/40 mt-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {label}
      </span>
    </div>
  );
}
