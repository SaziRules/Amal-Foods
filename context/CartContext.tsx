"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

//
// 🧱 Types
//
export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  region?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
}

//
// 🧠 Create context
//
const CartContext = createContext<CartContextType | undefined>(undefined);

//
// ⚙️ Provider
//
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null); // 🍞 message

  //
  // 🔄 Load persisted cart + region
  //
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cart");
      const storedRegion = localStorage.getItem("selectedRegion");
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedRegion) setSelectedRegion(storedRegion);
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);

  //
  // 💾 Persist
  //
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (selectedRegion)
      localStorage.setItem("selectedRegion", selectedRegion);
  }, [selectedRegion]);

  //
  // ➕ Add item (with region guard)
  //
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingRegion = prev.length > 0 ? prev[0].region : null;

      // 🛑 Restrict mixed regions
      if (existingRegion && item.region && existingRegion !== item.region) {
        setToast(
          `Cart locked to ${existingRegion.toUpperCase()} region — clear cart to add ${item.region.toUpperCase()} products.`
        );
        return prev;
      }

      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      // ✅ Assign region on first add
      if (!selectedRegion && item.region) {
        setSelectedRegion(item.region);
        localStorage.setItem("selectedRegion", item.region);
      }

      return [...prev, { ...item, quantity: 1 }];
    });
  };

  //
  // ➖ Remove item
  //
  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  //
  // 🔢 Update quantity
  //
  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) removeFromCart(id);
    else {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      );
    }
  };

  //
  // 🧹 Clear cart (unlock region)
  //
  const clearCart = () => {
    setCart([]);
    setSelectedRegion(null);
    localStorage.removeItem("cart");
    localStorage.removeItem("selectedRegion");
    setToast("Cart cleared — you can now shop any region.");
  };

  //
  // 💰 Totals
  //
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  //
  // 🕒 Auto-hide toast
  //
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  //
  // 🚀 Return
  //
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        selectedRegion,
        setSelectedRegion,
      }}
    >
      {children}

      {/* 🍞 Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-[0_0_25px_rgba(184,0,19,0.6)] text-sm font-medium z-[9999] border border-[#B80013]/40 flex items-center gap-4 animate-fade-in-out">
          <span>{toast}</span>
          <button
            onClick={clearCart}
            className="bg-[#B80013] text-white px-3 py-1 rounded-full text-xs font-semibold hover:bg-[#d81428] transition"
          >
            Clear Cart
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

//
// 🧩 Hook
//
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
