"use client";

import { useEffect, useState } from "react";
import { X, Plus, Minus, Loader2, Trash2, ShoppingCart, Search } from "lucide-react";
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

  // ───────── FETCH PRODUCTS FROM SANITY ─────────
  useEffect(() => {
    async function fetchProducts() {
      if (!branch) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Normalize branch to lowercase for query
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
        
        console.log("Fetched products:", result); // Debug log
        console.log("Branch:", branch, "Normalized:", normalizedBranch); // Debug log

        const q: Record<string, number> = {};
        result.forEach((p: Product) => {
          q[p._id] = 1;
          // Fallback: if price is not set, try to get it from pricing object
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

  // ───────── ADD ITEM TO CART ─────────
  function addToCart(product: Product) {
    const qty = quantities[product._id] || 1;
    
    const existingIndex = cart.findIndex(item => item.product_id === product._id);
    
    if (existingIndex !== -1) {
      // Update existing item
      setCart(prev => prev.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantity: item.quantity + qty }
          : item
      ));
    } else {
      // Add new item
      setCart(prev => [
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
    
    // Reset quantity selector to 1
    setQuantities(prev => ({ ...prev, [product._id]: 1 }));
  }

  // ───────── UPDATE CART ITEM QUANTITY ─────────
  function updateCartQuantity(productId: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }

  // ───────── REMOVE FROM CART ─────────
  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  }

  // ───────── CALCULATE TOTAL ─────────
  function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  // ───────── FILTER PRODUCTS ─────────
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="h-full flex flex-col lg:flex-row">
        
        {/* ═══════════ LEFT: PRODUCT SELECTION ═══════════ */}
        <div className="flex-1 flex flex-col bg-linear-to-br from-[#1a1a1a] to-[#0a0a0a]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white">Select Products</h2>
              <p className="text-sm text-gray-400 mt-1">
                Branch: <span className="text-[#B80013] font-semibold">{branch || "Unknown"}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#B80013] focus:bg-white/10 transition"
                placeholder="Search products..."
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!branch ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Branch information not available</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="animate-spin text-[#B80013] mb-4" size={48} />
                <p className="text-gray-400">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-[#B80013]/50 transition-all duration-200"
                  >
                    {/* Product Image & Info */}
                    <div className="flex flex-col items-center mb-4">
                      {product.imageUrl ? (
                        <div className="w-full h-32 relative mb-3 rounded-lg overflow-hidden bg-black/20">
                          <Image
                            src={product.imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 mb-3 rounded-lg bg-linear-to-br from-[#B80013]/20 to-[#B80013]/5 flex items-center justify-center">
                          <ShoppingCart size={32} className="text-[#B80013]/50" />
                        </div>
                      )}
                      
                      <h3 className="font-semibold text-white text-center text-sm line-clamp-2 mb-1">
                        {product.title}
                      </h3>
                      
                      <div className="text-center">
                        <p className="text-[#B80013] font-bold text-lg">
                          {product.price ? `R${product.price.toFixed(2)}` : "Price TBA"}
                        </p>
                        {product.unit && (
                          <p className="text-xs text-gray-400">per {product.unit}</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1.5">
                        <button
                          onClick={() =>
                            setQuantities((q) => ({
                              ...q,
                              [product._id]: Math.max(1, (q[product._id] || 1) - 1),
                            }))
                          }
                          className="text-white hover:text-[#B80013] transition p-1"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-white font-bold w-8 text-center">
                          {quantities[product._id] || 1}
                        </span>
                        <button
                          onClick={() =>
                            setQuantities((q) => ({
                              ...q,
                              [product._id]: (q[product._id] || 1) + 1,
                            }))
                          }
                          className="text-white hover:text-[#B80013] transition p-1"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.price}
                        className="flex-1 bg-[#B80013] hover:bg-[#960010] px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} />
                        {product.price ? "Add" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ RIGHT: CART SIDEBAR ═══════════ */}
        <div className="lg:w-96 xl:w-md bg-[#0a0a0a] border-l border-white/10 flex flex-col">
          
          {/* Cart Header */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#B80013]/20 rounded-lg">
                <ShoppingCart size={20} className="text-[#B80013]" />
              </div>
              <h3 className="text-xl font-bold text-white">Order Cart</h3>
            </div>
            <p className="text-sm text-gray-400">
              {cart.length} {cart.length === 1 ? 'item' : 'items'} added
            </p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-white/5 rounded-full mb-4">
                  <ShoppingCart size={48} className="text-gray-600" />
                </div>
                <p className="text-gray-400 mb-2">Your cart is empty</p>
                <p className="text-sm text-gray-500">
                  Add products from the left to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {item.price ? `R${item.price.toFixed(2)}` : "Price TBA"} {item.unit && `/ ${item.unit}`}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-500 hover:text-red-400 transition p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1">
                        <button
                          onClick={() => updateCartQuantity(item.product_id, -1)}
                          className="text-white hover:text-[#B80013] transition p-1"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-white font-bold w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product_id, 1)}
                          className="text-white hover:text-[#B80013] transition p-1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-[#B80013] font-bold">
                          R{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="border-t border-white/10 p-6 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-400 font-semibold">Total</span>
              <span className="text-[#B80013] font-bold text-2xl">
                R{calculateTotal().toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onComplete(cart)}
                disabled={cart.length === 0}
                className="flex-1 px-6 py-3 bg-[#B80013] hover:bg-[#960010] rounded-xl text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}