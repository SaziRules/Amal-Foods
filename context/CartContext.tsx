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
// ⚙️ Provider component
//
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  //
  // 🔄 Load persisted cart + region on mount
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
  // 💾 Save cart + region on change
  //
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (selectedRegion)
      localStorage.setItem("selectedRegion", selectedRegion);
  }, [selectedRegion]);

  //
  // ➕ Add item
  //
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
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
  // 🧹 Clear cart
  //
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  //
  // 💰 Totals
  //
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  //
  // 🚀 Return provider
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
