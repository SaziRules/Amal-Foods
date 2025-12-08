"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function useOrderPrepExport(orders: any[], parseItems: any, branch: string) {
  
  /* ---------------------- PDF EXPORT (portrait) ---------------------- */
  const generateOrderPrepPDF = () => {
    if (!orders.length) return alert("No orders available.");

    const doc = new jsPDF("p", "mm", "a4");
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setTextColor(184, 0, 19);
    doc.text(`Prep Report — ${branch}`, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 12;

    // Orders
    orders.forEach((order, index) => {
      const items = parseItems(order.items);
      if (!items.length) return;

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Order header
      doc.setFontSize(12);
      doc.setTextColor(184, 0, 19);
      doc.text(`Order ${index + 1}: ${order.order_number || order.id}`, 14, y);
      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Customer: ${order.customer_name || "N/A"}`, 14, y);
      doc.text(`Status: ${order.status || "-"}`, 150, y);
      y += 5;

      doc.text(`Payment: ${order.payment_status || "unpaid"}`, 150, y);
      y += 6;

      // Table
      const tableData = items.map((i: any) => [
        i.title || i.name || "-",
        i.quantity || 0,
        `R${Number(i.price || 0).toFixed(2)}`,
        `R${(Number(i.price || 0) * Number(i.quantity || 0)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Item", "Qty", "Price", "Subtotal"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [184, 0, 19],
          textColor: 255,
        },
        styles: {
          fontSize: 9,
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* ---------------------- EXCEL EXPORT (matrix-style) ---------------------- */
  const generateOrderPrepExcel = () => {
    if (!orders.length) return alert("No orders available.");

    // 1. Collect all unique item names across all orders
    const allItems = new Set<string>();
    orders.forEach((o) => {
      parseItems(o.items).forEach((i: any) => {
        allItems.add(i.title || i.name || "Unnamed");
      });
    });

    const itemColumns = Array.from(allItems);

    // 2. Build matrix rows
    const rows = orders.map((order) => {
      const row: any = {
        "Order Number": order.order_number || order.id,
        Customer: order.customer_name || "N/A",
        "Cell Number": order.cell_number || order.phone_number || "",
      };

      // Set all item columns to 0
      itemColumns.forEach((col) => {
        row[col] = 0;
      });

      // Fill actual quantities
      parseItems(order.items).forEach((i: any) => {
        const name = i.title || i.name || "Unnamed";
        row[name] = i.quantity || 0;
      });

      // Final fields
      row["Total Value"] = `R${Number(order.total).toFixed(2)}`;
      row["Status"] = order.status || "-";
      row["Payment"] = order.payment_status || "unpaid";

      return row;
    });

    // 3. Export
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Detailed Prep Report");
    XLSX.writeFile(
      wb,
      `Prep_Report_${branch}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return { generateOrderPrepPDF, generateOrderPrepExcel };
}
