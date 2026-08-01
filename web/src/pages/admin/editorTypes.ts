export type RawCatalog = { id: string; name?: string; barcode?: string; productId?: string; isActive?: boolean; salePrice?: number | null; promoPrice?: number | null; costPrice?: number | null; stockQty?: number; imageUrl?: string | null; displayOrder?: number; customName?: string | null; customPrice?: number | null; customDescription?: string | null; specs?: string | null; description?: string | null; product?: { id: string; name: string; salePrice: number; barcode?: string | null; imageUrl?: string | null; stockQty: number; description?: string | null } | null; category?: { id: string; name: string; imageUrl?: string | null } | null; storeType?: string | null };

export type CatalogProduct = { id: string; name: string; salePrice: number; imageUrl?: string | null; stockQty: number; category?: { id: string; name: string } | null; barcode?: string | null; displayOrder?: number; isActive?: boolean; promoPrice?: number | null; costPrice?: number | null; customName?: string | null; customPrice?: number | null; customDescription?: string | null; productId?: string | null; specs?: string | null; description?: string | null; storeType?: string | null };

export type Category = { id: string; name: string; imageUrl?: string | null; position?: number; storeType?: string };

export type ThemeSettings = {
  productOrder: string[]; categoryOrder: string[]; fontFamily: string;
  bgColor: string; surfaceColor: string; textColor: string; accentColor: string;
  glowEnabled: boolean; glowColor: string; animationEnabled: boolean;
  bannerText: string; heroImage: string; storeName: string; tagline: string;
  backgroundImage: string; backgroundType: 'color' | 'image' | 'video';
  glassEnabled: boolean;
};

export type SelectedElement = { type: 'product' | 'category' | 'theme' | 'section'; id: string; data: any };

export const THEME_DEFAULTS: ThemeSettings = {
  productOrder: [], categoryOrder: [], fontFamily: "'Unbounded', sans-serif",
  bgColor: '#0a0a0a', surfaceColor: '#141414', textColor: '#f5f1e8', accentColor: '#bfa24e',
  glowEnabled: true, glowColor: '#bfa24e', animationEnabled: true,
  bannerText: 'Commandez, on vous livre', heroImage: '', storeName: 'MISTER-DR', tagline: 'Parcourez notre catalogue et recevez vos produits directement chez vous.',
  backgroundImage: '', backgroundType: 'color',
  glassEnabled: false,
};

export const FONTS = [
  { label: 'Unbounded', value: "'Unbounded', sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'Manrope', value: "'Manrope', sans-serif" },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'Sora', value: "'Sora', sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Nunito', value: "'Nunito', sans-serif" },
  { label: 'Work Sans', value: "'Work Sans', sans-serif" },
];

export const PRESETS = [
  { name: 'Noir & Or', bg: '#0a0a0a', surface: '#141414', text: '#f5f1e8', accent: '#bfa24e', glow: '#bfa24e' },
  { name: 'Bleu Tech', bg: '#0a0f1a', surface: '#111827', text: '#e2e8f0', accent: '#3b82f6', glow: '#3b82f6' },
  { name: 'Vert Sombre', bg: '#0a1a0f', surface: '#111f15', text: '#e2f0e5', accent: '#22c55e', glow: '#22c55e' },
  { name: 'Violet', bg: '#120a1a', surface: '#1a1127', text: '#e8e2f0', accent: '#a855f7', glow: '#a855f7' },
  { name: 'Rouge & Noir', bg: '#1a0a0a', surface: '#271111', text: '#f0e2e2', accent: '#ef4444', glow: '#ef4444' },
  { name: 'Rose Gold', bg: '#1a0f12', surface: '#27151a', text: '#f0e2e6', accent: '#f472b6', glow: '#f472b6' },
];

export function getOrdered<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;
  const map = new Map(items.map(i => [i.id, i]));
  return order.map(id => map.get(id)).filter(Boolean) as T[];
}
