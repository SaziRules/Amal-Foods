"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "next-sanity";
import { Loader2, FileDown, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  /* ───────────── PDF + Excel Generators ───────────── */
  const generatePDF = (category: string, items: any[]) => {
    const doc = new jsPDF("p", "mm", "a4");
    let y = 15;
    doc.setFontSize(14);
    doc.text(`Prep Report — ${category.replace(/-/g, " ")}`, 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;

    const tableData = items.map((i: any) => [i.name, i.qty, i.orders]);
    autoTable(doc, {
      startY: y,
      head: [["Item", "Total Qty", "Orders"]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [184, 0, 19], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      theme: "grid",
      margin: { left: 14 },
    });
    doc.save(`Prep_Report_${category}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const generateExcel = (category: string, items: any[]) => {
    const data = items.map((i) => ({
      Item: i.name,
      "Total Qty": i.qty,
      Orders: i.orders,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, category);
    XLSX.writeFile(wb, `Prep_Report_${category}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
          {categories.map(([category, items]) => {
            const isExpanded = expanded[category];
            const visibleItems = isExpanded ? items : items.slice(0, 5);

            return (
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
                    {visibleItems.map((i, idx) => (
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

                {/* View All + Download Buttons Row */}
                <div className="flex justify-between items-center gap-2 mt-5 border-t border-white/10 pt-4">
                  <button
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [category]: !isExpanded,
                      }))
                    }
                    className="flex-1 text-xs font-semibold text-[#B80013] border border-[#B80013] rounded-lg py-2 hover:bg-[#B80013] hover:text-white transition text-center"
                  >
                    {isExpanded ? "Collapse" : "View All"}
                  </button>
                  <button
                    onClick={() => generatePDF(category, items)}
                    className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-gray-200"
                  >
                    <FileDown size={14} /> PDF
                  </button>
                  <button
                    onClick={() => generateExcel(category, items)}
                    className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition text-gray-200"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
