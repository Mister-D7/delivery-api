import { useSyncExternalStore } from 'react';
import type { Product } from './data';

let product: Product | null = null;
let qty = 1;
let modalListeners = new Set<() => void>();
let snapshot: { product: Product | null; qty: number } = { product, qty };

function emit() {
  snapshot = { product, qty };
  modalListeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  modalListeners.add(l);
  return () => {
    modalListeners.delete(l);
  };
}

export function openProduct(p: Product) {
  product = p;
  qty = 1;
  emit();
}

export function closeProduct() {
  product = null;
  emit();
}

export function setQty(n: number) {
  qty = Math.max(1, Math.floor(n) || 1);
  emit();
}

export function useModalStore() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  return { product: state.product, qty: state.qty, openProduct, closeProduct, setQty };
}
