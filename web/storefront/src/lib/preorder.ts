import type { StorefrontSettings } from './data';

export const PREORDER_PRODUCT = {
  id: 'preorder-mister-d',
  name: 'Mister-D Ecosystem v2.0 — Pré-commande',
  price: 5500,
};

export interface PreorderTiming {
  start: number;
  end: number;
  status: 'upcoming' | 'live' | 'ended';
}

const DAY = 86_400_000;

let fallbackStart: number | null = null;
let fallbackFor: string | undefined;

export function preorderPrice(settings: StorefrontSettings, fallback = 5500): number {
  const n = Number(settings.preorderPrice);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function preorderStrike(settings: StorefrontSettings, fallback = 7500): number {
  const n = Number(settings.preorderStrike);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function preorderTiming(settings: StorefrontSettings, now = Date.now()): PreorderTiming {
  const raw = settings.preorderStart;
  let start: number;
  if (raw) {
    start = new Date(raw).getTime();
    fallbackFor = raw;
  } else if (fallbackFor !== raw || fallbackStart === null) {
    fallbackFor = raw;
    fallbackStart = now + 15 * DAY;
    start = fallbackStart;
  } else {
    start = fallbackStart;
  }
  const windowDays = Math.max(1, Number(settings.preorderWindowDays) || 6);
  const end = start + windowDays * DAY;
  const status = now < start ? 'upcoming' : now > end ? 'ended' : 'live';
  return { start, end, status };
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
