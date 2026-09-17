import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';

const CartContext = createContext(null);

function unitPrice(product, unitType) {
  return unitType === 'pack'
    ? Number(product.price_per_pack || 0)
    : Number(product.price_per_unit || 0);
}

function unitCost(product, unitType) {
  return unitType === 'pack'
    ? Number(product.cost_per_pack || 0)
    : Number(product.cost_per_unit || 0);
}

function cartKey(product, unitType) {
  return `${product.id}|${unitType}`;
}

function makeItem(product, unitType, qty) {
  const key = cartKey(product, unitType);
  return {
    key,
    product_id: product.id,
    unit_type: unitType,
    unit_label: unitType === 'pack' ? 'Pack' : 'Biji',
    qty,
    price: unitPrice(product, unitType),
    cost: unitCost(product, unitType) * qty,
    name: product.name,
    category: product.category || 'Lainnya',
  };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});

  const addToCart = useCallback((product, unitType, qty = 1) => {
    setCart((prev) => {
      const key = cartKey(product, unitType);
      const existing = prev[key];
      return { ...prev, [key]: makeItem(product, unitType, (existing?.qty || 0) + qty) };
    });
  }, []);

  const changeQty = useCallback((key, delta) => {
    setCart((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const next = Math.max(0, (item.qty || 0) + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: { ...item, qty: next, cost: (item.cost / item.qty) * next } };
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartItems = useMemo(
    () =>
      Object.values(cart)
        .filter((c) => c.qty > 0)
        .map((c) => ({ ...c, subtotal: c.qty * c.price })),
    [cart]
  );

  const total = cartItems.reduce((s, c) => s + c.subtotal, 0);
  const count = cartItems.reduce((s, c) => s + c.qty, 0);

  const value = {
    cart,
    cartItems,
    total,
    count,
    addToCart,
    changeQty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
