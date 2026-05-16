/**
 * CartContext.tsx — Global cart state for the marketplace
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

type Item = { id: string; name: string; quantity: number };
type Ctx  = {
  items:       Record<string, Item>;
  totalCount:  number;
  addItem:     (id: string, name: string) => void;
  removeItem:  (id: string) => void;
  clearCart:   () => void;
};

const CartCtx = createContext<Ctx | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Record<string, Item>>({});

  const totalCount = Object.values(items).reduce((a, i) => a + i.quantity, 0);

  const addItem = useCallback((id: string, name: string) => {
    setItems(p => ({ ...p, [id]: { id, name, quantity: (p[id]?.quantity || 0) + 1 } }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(p => {
      if (!p[id]) return p;
      if (p[id].quantity === 1) { const { [id]: _, ...r } = p; return r; }
      return { ...p, [id]: { ...p[id], quantity: p[id].quantity - 1 } };
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems({});
  }, []);

  return <CartCtx.Provider value={{ items, totalCount, addItem, removeItem, clearCart }}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart must be inside CartProvider');
  return c;
};
