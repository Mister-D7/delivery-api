import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CartItem = {
  id: string;
  catalogId?: string;
  erpProductId?: string;
  customName?: string;
  customPrice?: number;
  name: string;
  price: number;
  promoPrice?: number | null;
  imageUrl?: string | null;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartCtx>(null!);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, qty }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) { setItems(prev => prev.filter(i => i.id !== id)); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + (i.promoPrice ?? i.price) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
