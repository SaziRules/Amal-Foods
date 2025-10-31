"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ───────────── Types ───────────── */
interface Order {
  id: string;
  email: string | null;
  customer_name: string;
  cell_number?: string | null;
  region?: string | null;
  total: number;
  status?: string;
  created_at: string;
}

interface Customer {
  id: string;
  email?: string | null;
  created_at: string;
}

/* ───────────── CustomerAnalytics Component ───────────── */
export default function CustomerAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: allOrders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const authRes = await fetch("/api/get-auth-users");
      const { users: allCustomers } = await authRes.json();


      setOrders((allOrders as Order[]) || []);
      setCustomers((allCustomers as Customer[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="text-center text-gray-400 py-10">
        Loading analytics...
      </div>
    );

  /* ───────────── Data Computations ───────────── */
  const signedUpCount = customers.length;
  const signedUpEmails = new Set(
    customers.map((c) => c.email?.toLowerCase()).filter(Boolean)
  );

  const ordersFromSignedUp = orders.filter((o) =>
    signedUpEmails.has(o.email?.toLowerCase() ?? "")
  );
  const ordersFromGuests = orders.filter(
    (o) => !signedUpEmails.has(o.email?.toLowerCase() ?? "")
  );

  const avgOrderValueSignedUp =
    ordersFromSignedUp.length > 0
      ? ordersFromSignedUp.reduce((a, b) => a + (b.total || 0), 0) /
        ordersFromSignedUp.length
      : 0;

  const avgOrderValueGuests =
    ordersFromGuests.length > 0
      ? ordersFromGuests.reduce((a, b) => a + (b.total || 0), 0) /
        ordersFromGuests.length
      : 0;

  const repeatCustomers = Array.from(
    ordersFromSignedUp.reduce<Map<string, number>>((map, order) => {
      if (order.email) {
        map.set(order.email, (map.get(order.email) || 0) + 1);
      }
      return map;
    }, new Map())
  ).filter(([_, count]: [string, number]) => count > 1).length;

  const regionStats = orders.reduce((acc, o) => {
    const region = o.region || "Unknown";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highestSpender = (() => {
    const totals: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.email) totals[o.email] = (totals[o.email] || 0) + o.total;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0] : null;
  })();

  const mostActiveCustomer = (() => {
    const freq: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.email) freq[o.email] = (freq[o.email] || 0) + 1;
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0] : null;
  })();

  const newCustomers30Days = customers.filter((c) => {
    const created = new Date(c.created_at);
    const now = new Date();
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  /* ───────────── Chart Data ───────────── */
  const chartData = [
    {
      name: "Registered Customers",
      Orders: ordersFromSignedUp.length,
      "Avg Order Value": avgOrderValueSignedUp,
    },
    {
      name: "Guest Customers",
      Orders: ordersFromGuests.length,
      "Avg Order Value": avgOrderValueGuests,
    },
  ];

  /* ───────────── Render ───────────── */
  return (
    <section className="bg-[#141414]/80 rounded-3xl border border-white/10 p-6 shadow-lg space-y-8">
      <h2 className="text-lg font-semibold text-[#B80013] mb-2">
        Customer Insights & Behavioral Analytics
      </h2>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <InsightCard
          title="Total Registered Customers"
          value={signedUpCount}
          description="All users with Supabase profiles or magic link logins."
        />
        <InsightCard
          title="Orders From Registered Customers"
          value={ordersFromSignedUp.length}
          description="Orders tied to verified profiles."
        />
        <InsightCard
          title="Orders From Guests"
          value={ordersFromGuests.length}
          description="Orders placed without login."
        />
        <InsightCard
          title="Repeat Customers"
          value={repeatCustomers}
          description="Customers with more than one order."
        />
        <InsightCard
          title="Average Order Value (Registered)"
          value={`R${avgOrderValueSignedUp.toFixed(2)}`}
          description="Average value per order for logged-in customers."
        />
        <InsightCard
          title="Average Order Value (Guests)"
          value={`R${avgOrderValueGuests.toFixed(2)}`}
          description="Average value per order for guest checkouts."
        />
        <InsightCard
          title="Most Active Customer"
          value={mostActiveCustomer ? mostActiveCustomer[0] : "—"}
          description={`Orders placed: ${
            mostActiveCustomer ? mostActiveCustomer[1] : 0
          }`}
        />
        <InsightCard
          title="Highest Total Spender"
          value={highestSpender ? highestSpender[0] : "—"}
          description={`Spent R${
            highestSpender ? highestSpender[1].toFixed(2) : 0
          } total`}
        />
        <InsightCard
          title="New Customers (Last 30 Days)"
          value={newCustomers30Days}
          description="Recent sign-ups within the last month."
        />
      </div>

      {/* Orders by Region */}
      <div>
        <h3 className="text-[#B80013] font-semibold mt-6 mb-3 text-sm uppercase">
          Orders by Region
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(regionStats).map(([region, count]) => (
            <div
              key={region}
              className="bg-white/5 rounded-lg border border-white/10 p-3 text-center hover:bg-white/10 transition"
            >
              <p className="text-white font-semibold">{region}</p>
              <p className="text-[#B80013] text-sm">{count} orders</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mt-10">
        <h3 className="text-[#B80013] font-semibold mb-3 text-sm uppercase">
          Orders & Avg Value — Registered vs Guests
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="Orders" fill="#B80013" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="Avg Order Value"
                fill="#FFD700"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Subcomponent ───────────── */
function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: unknown;
  description?: string;
}) {
  const displayValue =
    value === null || value === undefined
      ? "—"
      : typeof value === "string" || typeof value === "number"
      ? value
      : Array.isArray(value)
      ? value.join(", ")
      : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition">
      <h3 className="text-sm font-semibold text-[#B80013] mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">
        {String(displayValue)}
      </p>
      {description && (
        <p className="text-xs text-gray-400 leading-snug">{description}</p>
      )}
    </div>
  );
}
