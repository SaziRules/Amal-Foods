"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { sanityClient } from "@/lib/sanityClient";

interface AddItemsModalProps {
  orderId: string;
  currentItems: string[];
  region: "durban" | "joburg" | "capetown";
  onClose: () => void;
  onItemAdded: () => void;
}

interface Product {
  _id: string;
  title: string;
  unit?: string;
  price?: number;
  imageUrl?: string;
}

export default function AddItemsModal({
  orderId,
  currentItems,
  region,
  onClose,
  onItemAdded,
}: AddItemsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // ───────────── FETCH PRODUCTS ─────────────
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const cleanRegion = (region || "durban").toLowerCase();
        const query = `
          *[
            _type == "product" &&
            active == true &&
            lower($region) in lower(coalesce(available_in, []))
          ]{
            _id,
            title,
            unit,
            "price": select(
              $region == "durban" => pricing.durban,
              $region == "joburg" => pricing.joburg,
              $region == "capetown" => pricing.durban,
              null
            ),
            "imageUrl": image.asset->url
          } | order(title asc)
        `;
        let result = await sanityClient.fetch(query, { region: cleanRegion });

        if (!result || result.length === 0) {
          result = await sanityClient.fetch(`
            *[_type == "product" && active == true]{
              _id, title, unit,
              "price": pricing.durban,
              "imageUrl": image.asset->url
            } | order(title asc)
          `);
        }

        const available = result.filter(
          (p: Product) =>
            !currentItems.includes(p._id) && !currentItems.includes(p.title)
        );

        const defaultQuantities: Record<string, number> = {};
        available.forEach((p: Product) => (defaultQuantities[p._id] = 1));
        setQuantities(defaultQuantities);
        setProducts(available);
        setFiltered(available);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [currentItems, region]);

  // ───────────── SEARCH ─────────────
  useEffect(() => {
    const f = products.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [search, products]);

  // ───────────── ADD PRODUCT ─────────────
  async function handleAdd(product: Product) {
    setAdding(product._id);
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("orders")
        .select("items,total")
        .eq("id", orderId)
        .single();
      if (fetchError) throw fetchError;

      const items = existing?.items || [];
      const qty = quantities[product._id] || 1;

      const newItem = {
        product_id: product._id,
        title: product.title,
        price: Number(product.price) || 0,
        quantity: qty,
        unit: product.unit || "",
      };

      const updated = [...items, newItem];
      const newTotal = updated.reduce(
        (sum: number, i: any) =>
          sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
        0
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({ items: updated, total: newTotal })
        .eq("id", orderId);
      if (updateError) throw updateError;
      onItemAdded();
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to add item. Please try again.");
    } finally {
      setAdding(null);
    }
  }

  // ───────────── UI ─────────────
  return (
    <div className="fixed inset-0 z-2000 bg-black/80 backdrop-blur-md flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-2001">
        <div className="flex justify-between items-center px-6 py-4 bg-[#B80013] text-white shadow-lg">
          <h2 className="text-lg font-semibold tracking-wide uppercase">
            Add Items
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 bg-[#111]/90 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full outline-none text-gray-200 bg-transparent text-sm placeholder-gray-500"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto bg-linear-to-b from-[#0b0b0b]/95 to-[#151515]/95 p-8 pb-24">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-[#B80013]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 text-sm">
            No available products found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-4">
                  {product.imageUrl && (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={60}
                      height={60}
                      className="rounded-xl object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-100 text-[14px] leading-tight mb-1">
                      {product.title}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {product.unit && `${product.unit} · `}
                      <span className="text-[#B80013] font-medium">
                        R{product.price?.toFixed(2) ?? "—"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Quantity + Add */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-full px-2 py-1">
                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product._id]: Math.max(1, (q[product._id] || 1) - 1),
                        }))
                      }
                      className="p-1 text-gray-400 hover:text-[#B80013]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantities[product._id] || 1}
                      onChange={(e) =>
                        setQuantities((q) => ({
                          ...q,
                          [product._id]: Math.max(1, Number(e.target.value)),
                        }))
                      }
                      className="w-10 text-center text-sm bg-transparent text-gray-200 outline-none"
                    />
                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product._id]: (q[product._id] || 1) + 1,
                        }))
                      }
                      className="p-1 text-gray-400 hover:text-[#B80013]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAdd(product)}
                    disabled={!!adding}
                    className="bg-[#B80013] text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-[#90000f] disabled:opacity-50 transition"
                  >
                    {adding === product._id ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Footer (buttons closer together) */}
      <div className="sticky bottom-0 z-2001 bg-[#0b0b0b]/90 backdrop-blur-md border-t border-white/10 px-6 py-4 flex justify-end items-center gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 font-medium text-sm transition"
        >
          Close
        </button>

        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-full bg-[#B80013] hover:bg-[#90000f] text-white font-semibold text-sm transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}
