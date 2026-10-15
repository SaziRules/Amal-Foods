"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "next-sanity";
import { Loader2, FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

export default function OrderPrepDisplay({
  orders,
  parseItems,
}: OrderPrepDisplayProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    products.forEach((p) => {
      if (p?.title) map[p.title.toLowerCase()] = p.category || "Uncategorized";
    });
    return map;
  }, [products]);

  const itemTotals = useMemo(() => {
    const activeOrders = orders.filter((o) =>
      ["pending", "processed", "packed"].includes(o.status)
    );

    const totals: Record<
      string,
      {
        qty: number;
        orders: number;
        statuses: Record<string, number>;
        payments: Record<string, number>;
      }
    > = {};

    activeOrders.forEach((order) => {
      const items = parseItems(order.items);
      items.forEach((item: any) => {
        const name = item.title || item.name || "Unnamed";
        const quantity = Number(item.quantity || 0);

        if (!totals[name]) {
          totals[name] = { qty: 0, orders: 0, statuses: {}, payments: {} };
        }

        totals[name].qty += quantity;
        totals[name].orders++;
        totals[name].statuses[order.status] =
          (totals[name].statuses[order.status] || 0) + 1;

        const p = order.payment_status || "unknown";
        totals[name].payments[p] = (totals[name].payments[p] || 0) + 1;
      });
    });

    return totals;
  }, [orders]);

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

  const generatePDF = (category: string, items: any[]) => {
    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;

    doc.setFontSize(14);
    doc.text(`Prep Report - ${category.replace(/-/g, " ")}`, 14, y);
    y += 6;

    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;

    const tableData = items.map((i: any) => {
      const statusSummary = Object.entries(i.statuses)
        .map(([s, v]) => `${s}: ${v}`)
        .join(", ");
      const paymentSummary = Object.entries(i.payments)
        .map(([s, v]) => `${s}: ${v}`)
        .join(", ");
      return [i.name, i.qty, i.orders, statusSummary || "-", paymentSummary || "-"];
    });

    autoTable(doc, {
      startY: y,
      head: [["Item", "Qty", "Orders", "Statuses", "Payments"]],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [184, 0, 19], textColor: 255 },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    doc.save(
      `Prep_Report_${category}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  const generateExcel = (category: string, items: any[]) => {
    const data = items.map((i: any) => {
      const statusSummary = Object.entries(i.statuses)
        .map(([s, v]) => `${s}: ${v}`)
        .join(", ");
      const paymentSummary = Object.entries(i.payments)
        .map(([s, v]) => `${s}: ${v}`)
        .join(", ");
      return {
        Item: i.name,
        "Total Qty": i.qty,
        Orders: i.orders,
        Statuses: statusSummary,
        Payments: paymentSummary,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, category);
    XLSX.writeFile(
      wb,
      `Prep_Report_${category}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-white/25 text-[13px]">
        <Loader2 size={14} className="animate-spin" />
        Loading product categories...
      </div>
    );
  }

  const categories = Object.entries(groupedByCategory);

  return (
    <section className="mt-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <p
          className="text-[11px] text-white/25 tracking-[0.14em] uppercase"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Order Prep by Category
        </p>
        {categories.length > 0 && (
          <span className="text-[10px] text-white/25 bg-white/[0.06] border border-white/[0.07] rounded-[4px] px-1.5 py-0.5">
            {categories.length}
          </span>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-[13px] text-white/25">
          No active items to prepare right now.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map(([category, items]) => {
            const isExpanded = expanded[category];
            const visibleItems = isExpanded ? items : items.slice(0, 5);

            const statusTotals = items.reduce((acc: any, i: any) => {
              Object.entries(i.statuses).forEach(([s, v]) => {
                acc[s] = (acc[s] || 0) + (v as number);
              });
              return acc;
            }, {});

            const paymentTotals = items.reduce((acc: any, i: any) => {
              Object.entries(i.payments).forEach(([s, v]) => {
                acc[s] = (acc[s] || 0) + (v as number);
              });
              return acc;
            }, {});

            const statusLine = Object.entries(statusTotals)
              .map(([s, v]) => `${s}: ${v}`)
              .join(" · ");

            const paymentLine = Object.entries(paymentTotals)
              .map(([s, v]) => `${s}: ${v}`)
              .join(" · ");

            return (
              <div
                key={category}
                className="bg-[#111111] border border-white/[0.07] rounded-[8px] p-4 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] text-white tracking-[0.1em] uppercase"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {category.replace(/-/g, " ")}
                    </span>
                    <span className="text-[10px] text-white/25 bg-white/[0.06] border border-white/[0.07] rounded-[4px] px-1.5 py-0.5">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => generatePDF(category, items)}
                      className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white transition-colors px-1.5 py-1 rounded-[4px] hover:bg-white/[0.06]"
                    >
                      <FileDown size={12} /> PDF
                    </button>
                    <button
                      onClick={() => generateExcel(category, items)}
                      className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white transition-colors px-1.5 py-1 rounded-[4px] hover:bg-white/[0.06]"
                    >
                      <FileSpreadsheet size={12} /> Excel
                    </button>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th
                        className="pb-2 text-left text-[11px] text-white/25 tracking-[0.1em] uppercase font-medium"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Item
                      </th>
                      <th
                        className="pb-2 text-right text-[11px] text-white/25 tracking-[0.1em] uppercase font-medium"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Qty
                      </th>
                      <th
                        className="pb-2 text-right text-[11px] text-white/25 tracking-[0.1em] uppercase font-medium"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((i, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-white/[0.05]"
                      >
                        <td className="py-2 text-[13px] text-white/70">
                          {i.name}
                        </td>
                        <td className="py-2 text-right text-[13px] text-[#B80013]"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {i.qty}
                        </td>
                        <td className="py-2 text-right text-[13px] text-white/25">
                          {i.orders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary + expand */}
                <div className="mt-3 pt-3 border-t border-white/[0.07] space-y-0.5">
                  {statusLine && (
                    <p className="text-[11px] text-white/25 truncate">
                      <span className="text-white/15 mr-1">Status</span>
                      {statusLine}
                    </p>
                  )}
                  {paymentLine && (
                    <p className="text-[11px] text-white/25 truncate">
                      <span className="text-white/15 mr-1">Payment</span>
                      {paymentLine}
                    </p>
                  )}
                  {items.length > 5 && (
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [category]: !isExpanded,
                        }))
                      }
                      className="text-[11px] text-white/25 hover:text-white transition-colors mt-1"
                    >
                      {isExpanded
                        ? "Show less"
                        : `+${items.length - 5} more`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
