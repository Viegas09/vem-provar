import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "vp-cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { restaurantSlug: null, items: [] };
  } catch {
    return { restaurantSlug: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  function addItem(restaurantSlug, item) {
    setCart((prev) => {
      if (prev.restaurantSlug && prev.restaurantSlug !== restaurantSlug && prev.items.length > 0) {
        const confirmSwap = window.confirm(
          "Seu carrinho tem itens de outro restaurante. Deseja limpar o carrinho e adicionar este item?"
        );
        if (!confirmSwap) return prev;
        return { restaurantSlug, items: [{ ...item, qty: 1 }] };
      }
      const existing = prev.items.find((i) => i.id === item.id);
      const items = existing
        ? prev.items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev.items, { ...item, qty: 1 }];
      return { restaurantSlug, items };
    });
  }

  function updateQty(itemId, qty) {
    setCart((prev) => {
      if (qty <= 0) {
        const items = prev.items.filter((i) => i.id !== itemId);
        return { restaurantSlug: items.length ? prev.restaurantSlug : null, items };
      }
      return { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, qty } : i)) };
    });
  }

  function clearCart() {
    setCart({ restaurantSlug: null, items: [] });
  }

  const totalItems = cart.items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
