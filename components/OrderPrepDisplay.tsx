"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "next-sanity";
import { Loader2 } from "lucide-react";

/* ✅ Sanity client setup */
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: "production",
  apiVersion: "2025-11-03",
  useCdn: true,
});

interface OrderPrepDisplayProps {
  orders: any[];
  parseItems: (raw: any) => any[];
}

export default function OrderPrepDisplay({ orders, parseItems }: OrderPrepDisplayProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ───────────── Fetch Sanity products for mapping ───────────── */
  useEffect(() => {
    const fetchSanityProducts = async () => {
      try {
        const data = await sanity.fetch(`
          *[_type == "product" && active == true]{
            title,
            "category": category
          }
        `);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Sanity fetch error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSanityProducts();
  }, []);

  /* ───────────── Build category mapping ───────────── */
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      if (p?.title) map[p.title.toLowerCase()] = p.category || "Uncategorized";
    });
    return map;
  }, [products]);

  /* ───────────── Compute totals per item ───────────── */
  const itemTotals = useMemo(() => {
    const activeOrders = orders.filter((o) =>
      ["pending", "packed", "unpaid"].includes(o.status)
    );
    const totals: Record<
      string,
      { qty: number; orders: number; statuses: Record<string, number> }
    > = {};

    activeOrders.forEach((order) => {
      const items = parseItems(order.items);
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        const quantity = Number(item.quantity || 0);
        if (!totals[name])
          totals[name] = { qty: 0, orders: 0, statuses: {} };
        totals[name].qty += quantity;
        totals[name].orders++;
        totals[name].statuses[order.status] =
          (totals[name].statuses[order.status] || 0) + 1;
      });
    });
    return totals;
  }, [orders]);

  /* ───────────── Group totals by category ───────────── */
  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    Object.entries(itemTotals).forEach(([itemName, data]) => {
      const category =
        categoryMap[itemName.toLowerCase()] || "Uncategorized";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push({ name: itemName, ...data });
    });
    Object.keys(grouped).forEach((cat) =>
      grouped[cat].sort((a, b) => b.qty - a.qty)
    );
    return grouped;
  }, [itemTotals, categoryMap]);

  /* ───────────── UI ───────────── */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-gray-400">
        <Loader2 className="animate-spin mr-2" /> Loading product categories...
      </div>
    );
  }

  const categories = Object.entries(groupedByCategory);

  return (
    <section className="mt-10">
      <h2 className="text-3xl font-semibold text-[#B80013] mb-6">
        Order Prep by Category
      </h2>

      {categories.length === 0 ? (
        <p className="text-gray-400 text-sm italic">
          No active items to prepare right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map(([category, items]) => (
            <div
              key={category}
              className="bg-[#141414]/80 rounded-3xl border border-white/10 p-5 shadow-lg flex flex-col hover:bg-[#1b1b1b]/80 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                <h3 className="text-[#B80013] font-bold text-sm uppercase tracking-wider">
                  {category.replace(/-/g, " ")}
                </h3>
                <span className="text-xs text-gray-500">
                  {items.length} item{items.length !== 1 && "s"}
                </span>
              </div>

              {/* Table */}
              <table className="w-full text-xs md:text-sm text-gray-300 border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="py-2 px-2 text-left">Item</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-2 px-2">{i.name}</td>
                      <td className="py-2 px-2 text-right text-[#B80013] font-semibold">
                        {i.qty}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400">
                        {i.orders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Status Summary */}
              <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-gray-400">
                {items.length > 0 && (
                  <p>
                    <span className="text-gray-500">Statuses:</span>{" "}
                    {Object.entries(
                      items.reduce((acc: any, i: any) => {
                        Object.entries(i.statuses).forEach(([s, v]) => {
                          acc[s] = (acc[s] || 0) + v;
                        });
                        return acc;
                      }, {})
                    )
                      .map(([s, v]) => `${s}: ${v}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
