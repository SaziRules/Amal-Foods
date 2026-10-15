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
import { Loader2 } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-white/25 text-[13px]">
        <Loader2 size={14} className="animate-spin" />
        Loading analytics...
      </div>
    );
  }

  /* ── Computations ── */
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
      if (order.email) map.set(order.email, (map.get(order.email) || 0) + 1);
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
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  const insights: { title: string; value: string | number }[] = [
    { title: "Total Registered Customers", value: signedUpCount },
    { title: "Orders From Registered", value: ordersFromSignedUp.length },
    { title: "Orders From Guests", value: ordersFromGuests.length },
    { title: "Repeat Customers", value: repeatCustomers },
    {
      title: "Avg Order Value (Registered)",
      value: `R${avgOrderValueSignedUp.toFixed(2)}`,
    },
    {
      title: "Avg Order Value (Guests)",
      value: `R${avgOrderValueGuests.toFixed(2)}`,
    },
    {
      title: "Most Active Customer",
      value: mostActiveCustomer ? mostActiveCustomer[0] : "—",
    },
    {
      title: "Highest Spender",
      value: highestSpender ? highestSpender[0] : "—",
    },
    { title: "New Customers (30 days)", value: newCustomers30Days },
  ];

  const chartData = [
    {
      name: "Registered",
      Orders: ordersFromSignedUp.length,
      "Avg Value": Math.round(avgOrderValueSignedUp),
    },
    {
      name: "Guests",
      Orders: ordersFromGuests.length,
      "Avg Value": Math.round(avgOrderValueGuests),
    },
  ];

  return (
    <section className="space-y-8">

      {/* Section label */}
      <p
        className="text-[11px] text-white/25 tracking-[0.14em] uppercase"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Customer Insights
      </p>

      {/* Insight rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {insights.map(({ title, value }, idx) => (
          <div
            key={title}
            className="border-b border-white/[0.07] py-4 pr-4"
          >
            <p className="text-[11px] text-white/25 mb-1.5">{title}</p>
            <p
              className="text-[18px] font-bold text-white leading-none truncate"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {String(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Orders by Region */}
      <div>
        <p
          className="text-[11px] text-white/25 tracking-[0.14em] uppercase mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Orders by Region
        </p>
        <div className="space-y-0">
          {Object.entries(regionStats)
            .sort((a, b) => b[1] - a[1])
            .map(([region, count], idx, arr) => (
              <div
                key={region}
                className={`flex items-center justify-between py-2.5 ${
                  idx < arr.length - 1 ? "border-b border-white/[0.07]" : ""
                }`}
              >
                <span className="text-[13px] text-white/70">{region}</span>
                <span
                  className="text-[13px] font-bold text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {count}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Bar chart */}
      <div>
        <p
          className="text-[11px] text-white/25 tracking-[0.14em] uppercase mb-4"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Orders & Avg Value — Registered vs Guests
        </p>
        <div className="h-[260px] w-full">
          <ResponsiveContainer>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 12 }} />
              <YAxis stroke="rgba(255,255,255,0.25)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }} />
              <Bar dataKey="Orders" fill="#B80013" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Avg Value" fill="#c9a227" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
