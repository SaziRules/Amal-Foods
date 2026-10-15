"use client";

import { useEffect, useState } from "react";
import { X, Plus, Minus, Loader2, Trash2, Search, ChevronRight } from "lucide-react";
import Image from "next/image";
import { sanityClient } from "@/lib/sanityClient";

interface Product {
  _id: string;
  title: string;
  unit?: string;
  price?: number;
  pricing?: {
    durban?: number;
    joburg?: number;
  };
  imageUrl?: string;
}

interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  unit: string;
}

export default function CreateOrderModal({
  branch,
  onClose,
  onComplete,
}: {
  branch: string | null;
  onClose: () => void;
  onComplete: (items: OrderItem[]) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      if (!branch) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const normalizedBranch = branch.toLowerCase();

        const query = `
          *[_type == "product" && active == true]{
            _id,
            title,
            unit,
            pricing,
            "price": select(
              $region == "durban" => pricing.durban,
              $region == "joburg" => pricing.joburg,
              $region == "capetown" => pricing.durban
            ),
            "imageUrl": image.asset->url
          } | order(title asc)
        `;

        const result = await sanityClient.fetch(query, { region: normalizedBranch });

        const q: Record<string, number> = {};
        result.forEach((p: Product) => {
          q[p._id] = 1;
          if (!p.price && p.pricing) {
            if (normalizedBranch === "joburg" && p.pricing.joburg) {
              p.price = p.pricing.joburg;
            } else if (p.pricing.durban) {
              p.price = p.pricing.durban;
            }
          }
        });

        setQuantities(q);
        setProducts(result);
      } catch (error) {
        console.error("Error fetching products:", error);
        alert("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [branch]);

  function addToCart(product: Product) {
    const qty = quantities[product._id] || 1;
    const existingIndex = cart.findIndex((item) => item.product_id === product._id);

    if (existingIndex !== -1) {
      setCart((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          product_id: product._id,
          title: product.title,
          price: Number(product.price) || 0,
          quantity: qty,
          unit: product.unit || "",
        },
      ]);
    }

    setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
  }

  function updateCartQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  }

  function calculateTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryLetter = (title: string) => title.charAt(0).toUpperCase();

  /* ── Shared: product grid ── */
  const productGrid = (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {!branch ? (
        <p className="text-[13px] text-white/25 py-12 text-center">
          Branch information not available.
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-white/25 text-[13px]">
          <Loader2 size={14} className="animate-spin" />
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="text-[13px] text-white/25 py-12 text-center">
          No products found.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-[#111111] border border-white/[0.07] rounded-[8px] flex flex-col overflow-hidden"
            >
              {product.imageUrl ? (
                <div className="relative w-full aspect-[4/3] bg-[#1a1a1a]">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] bg-[#1a1a1a] flex items-center justify-center">
                  <span
                    className="text-[28px] text-white/10 font-bold"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {categoryLetter(product.title)}
                  </span>
                </div>
              )}

              <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="text-[13px] text-white leading-tight line-clamp-2">
                  {product.title}
                </p>
                <p
                  className="text-[14px] font-bold text-[#B80013]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {product.price ? `R${product.price.toFixed(2)}` : "—"}
                  {product.unit && (
                    <span className="text-[11px] text-white/25 ml-1 font-normal">
                      / {product.unit}
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex items-center border border-white/[0.1] rounded-[4px]">
                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product._id]: Math.max(1, (q[product._id] || 1) - 1),
                        }))
                      }
                      className="px-2 py-1.5 text-white/40 hover:text-white transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-[13px] text-white w-6 text-center">
                      {quantities[product._id] || 1}
                    </span>
                    <button
                      onClick={() =>
                        setQuantities((q) => ({
                          ...q,
                          [product._id]: (q[product._id] || 1) + 1,
                        }))
                      }
                      className="px-2 py-1.5 text-white/40 hover:text-white transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    disabled={!product.price}
                    className="flex-1 h-[30px] bg-[#B80013] text-white text-[11px] tracking-[0.08em] uppercase font-medium rounded-[4px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a30011] active:scale-[0.97] transition-colors"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {product.price ? "Add" : "N/A"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── Shared: cart items list ── */
  const cartItems = (
    <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {cart.length === 0 ? (
        <p className="text-[13px] text-white/25 text-center py-12">
          Cart is empty.
        </p>
      ) : (
        <div className="space-y-2">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="bg-[#0a0a0a] border border-white/[0.07] rounded-[8px] p-3"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[13px] text-white leading-tight line-clamp-2 flex-1">
                  {item.title}
                </p>
                <button
                  onClick={() => removeFromCart(item.product_id)}
                  className="text-white/20 hover:text-white/60 transition-colors mt-0.5 shrink-0 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center border border-white/[0.1] rounded-[4px]">
                  <button
                    onClick={() => updateCartQuantity(item.product_id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-[13px] text-white w-7 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product_id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <span
                  className="text-[15px] font-bold text-[#B80013]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  R{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col lg:flex-row overflow-hidden">

      {/* ── PRODUCT PANEL (shared) ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-[13px] font-medium tracking-[0.1em] uppercase text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Select Products
            </span>
            {branch && (
              <span className="text-[11px] text-white/25">
                — {branch}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white transition-colors rounded-[4px] hover:bg-white/[0.06]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/[0.07] shrink-0">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none pl-5 text-[16px] md:text-[13px] text-white placeholder-white/25 focus:outline-none"
              placeholder="Search products..."
            />
          </div>
        </div>

        {/* Product grid */}
        {productGrid}
      </div>

      {/* ── MOBILE: Cart trigger bar (shown when cart has items) ── */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartSheetOpen(true)}
          className="lg:hidden shrink-0 bg-[#111111] border-t border-white/[0.07] px-5 py-4 flex items-center justify-between active:bg-[#161616] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#B80013] rounded-full flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                {cart.length}
              </span>
            </div>
            <span className="text-[13px] text-white/70">View Cart</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              R{calculateTotal().toFixed(2)}
            </span>
            <ChevronRight size={14} className="text-white/30" />
          </div>
        </button>
      )}

      {/* ── MOBILE: Cancel bar (when cart empty) ── */}
      {cart.length === 0 && (
        <div className="lg:hidden shrink-0 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            className="w-full h-14 text-[11px] tracking-[0.1em] uppercase text-white/35 hover:text-white transition"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── MOBILE: Cart bottom sheet ── */}
      {cartSheetOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[51] bg-black/60"
            onClick={() => setCartSheetOpen(false)}
          />
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-[52] bg-[#0a0a0a] rounded-t-[20px] border-t border-white/[0.07] flex flex-col"
            style={{
              maxHeight: "85dvh",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/[0.1] rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] shrink-0">
              <span
                className="text-[13px] tracking-[0.1em] uppercase text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Cart
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-white/25">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </span>
                <button
                  onClick={() => setCartSheetOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] text-white/25 hover:text-white hover:bg-white/[0.06] transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Cart items */}
            {cartItems}

            {/* Total + actions */}
            <div className="border-t border-white/[0.07] shrink-0">
              <div className="flex items-baseline justify-between px-5 py-4">
                <span
                  className="text-[11px] text-white/25 tracking-[0.1em] uppercase"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Total
                </span>
                <span
                  className="text-[26px] font-bold text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <span className="text-[14px] text-white/40 mr-0.5">R</span>
                  {calculateTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex border-t border-white/[0.07]">
                <button
                  onClick={() => setCartSheetOpen(false)}
                  className="flex-1 h-[56px] text-[11px] tracking-[0.1em] uppercase text-white/40 hover:text-white border-r border-white/[0.07] transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Browse More
                </button>
                <button
                  onClick={() => { setCartSheetOpen(false); onComplete(cart); }}
                  disabled={cart.length === 0}
                  className="flex-1 h-[56px] text-[11px] tracking-[0.1em] uppercase bg-[#B80013] text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a30011] transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DESKTOP: Cart sidebar ── */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 bg-[#111111] border-l border-white/[0.07] flex-col shrink-0">

        {/* Cart header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <span
            className="text-[13px] tracking-[0.1em] uppercase text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Cart
          </span>
          <span className="text-[11px] text-white/25">
            {cart.length} {cart.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Cart items */}
        {cartItems}

        {/* Footer */}
        <div className="border-t border-white/[0.07] shrink-0">
          <div className="flex items-baseline justify-between px-6 py-4">
            <span
              className="text-[11px] text-white/25 tracking-[0.1em] uppercase"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Total
            </span>
            <span
              className="text-[24px] font-bold text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="text-[14px] text-white/40 mr-0.5">R</span>
              {calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="flex border-t border-white/[0.07]">
            <button
              onClick={onClose}
              className="flex-1 h-[52px] text-[11px] tracking-[0.1em] uppercase text-white/40 hover:text-white border-r border-white/[0.07] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => onComplete(cart)}
              disabled={cart.length === 0}
              className="flex-1 h-[52px] text-[11px] tracking-[0.1em] uppercase bg-[#B80013] text-white font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#a30011] transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
