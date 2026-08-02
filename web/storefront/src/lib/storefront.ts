import { useSyncExternalStore } from 'react';
import {
  FALLBACK_PRODUCTS,
  FALLBACK_CATEGORIES,
  mapRawProduct,
  type Product,
  type CategoryInfo,
  type StorefrontSettings,
} from './data';

const POLL_MS = 8000;

export function storeTypeForTheme(theme?: string): string {
  switch (theme) {
    case 'pulsar':
      return 'tech';
    case 'claro':
      return 'general';
    case 'nexus-gaming':
      return 'gaming';
    default:
      return 'gaming';
  }
}

export interface StorefrontSnapshot {
  products: Product[];
  categories: CategoryInfo[];
  settings: StorefrontSettings;
  status: 'loading' | 'ok' | 'offline';
  lastSync: number;
}

const SERVER_SNAPSHOT: StorefrontSnapshot = {
  products: FALLBACK_PRODUCTS,
  categories: FALLBACK_CATEGORIES,
  settings: {},
  status: 'loading',
  lastSync: 0,
};

let snapshot: StorefrontSnapshot = SERVER_SNAPSHOT;
let listeners = new Set<() => void>();
let started = false;
let timer: ReturnType<typeof setInterval> | null = null;
let inflight = false;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!started) start();
  return () => {
    listeners.delete(l);
  };
}

function onWake() {
  if (document.visibilityState !== 'hidden') void refresh();
}

function start() {
  started = true;
  if (typeof window === 'undefined') return;
  timer = setInterval(refresh, POLL_MS);
  setTimeout(() => {
    void refresh();
  }, 1500);
  window.addEventListener('focus', onWake);
  document.addEventListener('visibilitychange', onWake);
}

function getServerSnapshot(): StorefrontSnapshot {
  return SERVER_SNAPSHOT;
}

function applyPinned(products: Product[], pinned?: string[]): Product[] {
  if (!pinned || pinned.length === 0) return products;
  const map = new Map(products.map((p) => [p.id, p]));
  const pinnedItems = pinned.map((id) => map.get(id)).filter((p): p is Product => Boolean(p));
  const rest = products.filter((p) => !pinned.includes(p.id));
  return [...pinnedItems, ...rest];
}

function hexToRgba(hex: string, alpha: number): string {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(255,59,48,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseFontFamily(value: string): string | null {
  const m = String(value).match(/'([^']+)'/);
  return m ? m[1] : null;
}

function ensureFont(family: string) {
  const linkId = 'storefront-font';
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
  if (link.getAttribute('href') !== url) link.setAttribute('href', url);
}

export function applySettings(s: StorefrontSettings) {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return;
  const accent = s.accentColor;
  if (accent) {
    root.style.setProperty('--red', accent);
    root.style.setProperty('--red-dim', accent);
    root.style.setProperty('--red-glow', hexToRgba(accent, 0.35));
    root.style.setProperty('--cyan', accent);
    root.style.setProperty('--violet', accent);
    root.style.setProperty('--grad', `linear-gradient(120deg, ${accent}, ${hexToRgba(accent, 0.55)})`);
  }
  if (s.bgColor) root.style.setProperty('--bg', s.bgColor);
  if (s.surfaceColor) {
    root.style.setProperty('--surface', s.surfaceColor);
    root.style.setProperty('--surface-2', s.surfaceColor);
    root.style.setProperty('--surface-3', s.surfaceColor);
  }
  if (s.textColor) root.style.setProperty('--text', s.textColor);
  if (s.fontFamily) {
    const fam = parseFontFamily(s.fontFamily);
    root.style.setProperty('--font-display', s.fontFamily);
    root.style.setProperty('--font-body', s.fontFamily);
    if (fam) ensureFont(fam);
  }
}

async function refresh() {
  if (inflight) return;
  inflight = true;
  try {
    const setRes = await fetch('/api/delivery/storefront/settings/storefront', { signal: AbortSignal.timeout(6000) });
    let settings: StorefrontSettings = {};
    if (setRes.ok) {
      const json = await setRes.json();
      if (json && typeof json === 'object') settings = json as StorefrontSettings;
    }
    const st = storeTypeForTheme(settings.theme);
    const [catRes, catsRes] = await Promise.all([
      fetch('/api/delivery/catalog', { signal: AbortSignal.timeout(6000) }),
      fetch(`/api/delivery/categories/public?storeType=${st}`, { signal: AbortSignal.timeout(6000) }),
    ]);
    let products: Product[] = [];
    if (catRes.ok) {
      const json = await catRes.json();
      const arr = Array.isArray(json) ? json : json?.data ?? json?.products ?? [];
      products = arr.map((r: any) => mapRawProduct(r, st)).filter((p: Product | null): p is Product => p !== null);
    }
    let categories: CategoryInfo[] = [];
    if (catsRes.ok) {
      const json = await catsRes.json();
      const arr = Array.isArray(json) ? json : json?.data ?? [];
      categories = arr
        .map((c: any) => {
          const name = c?.name ?? c;
          if (!name) return null;
          return { id: c?.id, name, imageUrl: c?.image_url || c?.imageUrl || null };
        })
        .filter((c: CategoryInfo | null): c is CategoryInfo => c !== null);
    }
    snapshot = {
      products: applyPinned(products, settings.pinned),
      categories,
      settings,
      status: products.length || categories.length ? 'ok' : 'offline',
      lastSync: Date.now(),
    };
    applySettings(settings);
  } catch (err) {
    snapshot = {
      ...snapshot,
      status: 'offline',
      lastSync: Date.now(),
    };
  }
  inflight = false;
  emit();
}

export function useStorefront(): StorefrontSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, getServerSnapshot);
}

export function ensureSync() {
  if (!started) start();
}

export function refreshNow() {
  void refresh();
}
