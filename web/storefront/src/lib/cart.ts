import { useSyncExternalStore } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  qty: number;
}

const STORAGE_KEY = 'dris_cart';

function load(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && typeof i.id === 'string' && typeof i.qty === 'number')
      : [];
  } catch {
    return [];
  }
}

function countOf(list: CartItem[]) {
  return list.reduce((s, i) => s + i.qty, 0);
}

function totalOf(list: CartItem[]) {
  return list.reduce((s, i) => s + i.qty * i.price, 0);
}

let items: CartItem[] = load();
let isCartOpen = false;
let cartListeners = new Set<() => void>();
let drawerListeners = new Set<() => void>();
let snapshot = { items, count: countOf(items), total: totalOf(items) };

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable
  }
}

function commit() {
  snapshot = { items, count: countOf(items), total: totalOf(items) };
  cartListeners.forEach((l) => l());
}

function subscribeCart(l: () => void) {
  cartListeners.add(l);
  return () => {
    cartListeners.delete(l);
  };
}

function subscribeDrawer(l: () => void) {
  drawerListeners.add(l);
  return () => {
    drawerListeners.delete(l);
  };
}

export function addItem(item: { id: string; name: string; price: number; imageUrl?: string }, qty = 1) {
  const ex = items.find((i) => i.id === item.id);
  if (ex) {
    items = items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
  } else {
    items = items.concat([{ ...item, qty }]);
  }
  persist();
  commit();
}

export function removeItem(id: string) {
  items = items.filter((i) => i.id !== id);
  persist();
  commit();
}

export function updateQty(id: string, qty: number) {
  if (qty <= 0) {
    removeItem(id);
    return;
  }
  items = items.map((i) => (i.id === id ? { ...i, qty } : i));
  persist();
  commit();
}

export function clearCart() {
  items = [];
  persist();
  commit();
}

export function openCart() {
  isCartOpen = true;
  drawerListeners.forEach((l) => l());
}

export function closeCart() {
  isCartOpen = false;
  drawerListeners.forEach((l) => l());
}

export function useCartStore() {
  const itemsSnapshot = useSyncExternalStore(subscribeCart, () => snapshot.items, () => snapshot.items);
  const count = useSyncExternalStore(subscribeCart, () => snapshot.count, () => snapshot.count);
  const total = useSyncExternalStore(subscribeCart, () => snapshot.total, () => snapshot.total);
  const isCartOpenValue = useSyncExternalStore(subscribeDrawer, () => isCartOpen, () => isCartOpen);
  return {
    items: itemsSnapshot,
    count,
    total,
    isCartOpen: isCartOpenValue,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    openCart,
    closeCart,
  };
}
