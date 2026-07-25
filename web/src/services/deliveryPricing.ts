import api from './api';

export type DeliveryPricing = {
  shopLat: number;
  shopLng: number;
  baseFee: number;
  perKm: number;
  freeThreshold: number;
  maxRadius: number;
  shopName: string;
};

const DEFAULT_PRICING: DeliveryPricing = {
  shopLat: 36.7538,
  shopLng: 3.0588,
  baseFee: 200,
  perKm: 30,
  freeThreshold: 3000,
  maxRadius: 30,
  shopName: 'Mon Magasin',
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let cachedPricing: DeliveryPricing | null = null;

export async function getDeliveryPricing(): Promise<DeliveryPricing> {
  if (cachedPricing) return cachedPricing;
  try {
    const r = await api.get('/storefront/settings/delivery_pricing');
    cachedPricing = { ...DEFAULT_PRICING, ...r.data };
  } catch {
    cachedPricing = DEFAULT_PRICING;
  }
  return cachedPricing!;
}

export function calcDeliveryFee(pricing: DeliveryPricing, orderTotal: number, destLat: number, destLng: number): { fee: number; distance: number;超出: boolean } {
  if (orderTotal >= pricing.freeThreshold) return { fee: 0, distance: 0, 超出: false };

  const distance = haversine(pricing.shopLat, pricing.shopLng, destLat, destLng);

  if (distance > pricing.maxRadius) return { fee: -1, distance, 超出: true };

  const fee = Math.round(pricing.baseFee + pricing.perKm * distance);
  return { fee, distance, 超出: false };
}
