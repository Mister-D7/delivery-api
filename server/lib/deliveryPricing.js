import supabase from './supabase.js';

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_PRICING = {
  shopLat: 36.7538,
  shopLng: 3.0588,
  baseFee: 200,
  baseKm: 5,
  extraPerKm: 50,
  freeThreshold: 3000,
  maxRadius: 30,
  shopName: 'Mon Magasin',
};

let cachedPricing = null;

export async function getDeliveryPricing() {
  if (cachedPricing) return cachedPricing;
  try {
    const { data } = await supabase
      .from('delivery_settings')
      .select('value')
      .eq('key', 'delivery_pricing')
      .maybeSingle();
    cachedPricing = { ...DEFAULT_PRICING, ...(data?.value || {}) };
  } catch {
    cachedPricing = { ...DEFAULT_PRICING };
  }
  return cachedPricing;
}

export function calcDeliveryFee(pricing, orderTotal, destLat, destLng) {
  if (orderTotal >= pricing.freeThreshold) return { fee: 0, distance: 0, outOfRange: false };

  const distance = haversine(pricing.shopLat, pricing.shopLng, destLat, destLng);

  if (distance > pricing.maxRadius) return { fee: -1, distance, outOfRange: true };

  let fee;
  if (distance <= pricing.baseKm) {
    fee = pricing.baseFee;
  } else {
    fee = Math.round(pricing.baseFee + pricing.extraPerKm * (distance - pricing.baseKm));
  }
  return { fee, distance, outOfRange: false };
}

export function invalidatePricingCache() {
  cachedPricing = null;
}
