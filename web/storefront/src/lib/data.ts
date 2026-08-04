export interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  costPrice?: number;
  imageUrl: string;
  modelUrl?: string;
  category?: string;
  specs?: string[] | string;
  stockQty?: number;
}

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'play-x-514',
    name: 'PLAY X 514',
    price: 289000,
    oldPrice: 329000,
    imageUrl: '/uploads/sample-1.jpg',
    category: 'PLAY',
    specs: ['GPU: RTX 4060', 'CPU: i5 13400F', 'RAM: 16 Go', 'SSD: 512 Go'],
    stockQty: 6,
  },
  {
    id: 'play-x-516',
    name: 'PLAY X 516',
    price: 339000,
    oldPrice: 379000,
    imageUrl: '/uploads/sample-2.jpg',
    category: 'PLAY',
    specs: ['GPU: RTX 4060 Ti', 'CPU: i5 13400F', 'RAM: 16 Go', 'SSD: 1 To'],
    stockQty: 5,
  },
  {
    id: 'play-x-532',
    name: 'PLAY X 532',
    price: 459000,
    oldPrice: 509000,
    imageUrl: '/uploads/sample-3.jpg',
    category: 'PLAY',
    specs: ['GPU: RTX 4070', 'CPU: i5 13600KF', 'RAM: 32 Go', 'SSD: 1 To'],
    stockQty: 4,
  },
  {
    id: 'play-x-716',
    name: 'PLAY X 716',
    price: 549000,
    oldPrice: 599000,
    imageUrl: '/uploads/sample-4.jpg',
    category: 'PLAY',
    specs: ['GPU: RTX 4070 Super', 'CPU: i7 13700KF', 'RAM: 32 Go', 'SSD: 1 To'],
    stockQty: 3,
  },
  {
    id: 'lumen-g-516',
    name: 'LUMEN G 516',
    price: 399000,
    oldPrice: 439000,
    imageUrl: '/uploads/sample-5.jpg',
    category: 'LUMEN',
    specs: ['GPU: RTX 4060 Ti', 'CPU: i5 14600KF', 'RAM: 16 Go RGB', 'SSD: 1 To'],
    stockQty: 4,
  },
  {
    id: 'lumen-g-726',
    name: 'LUMEN G 726',
    price: 679000,
    oldPrice: 739000,
    imageUrl: '/uploads/sample-6.jpg',
    category: 'LUMEN',
    specs: ['GPU: RTX 4070 Ti', 'CPU: i7 14700KF', 'RAM: 32 Go RGB', 'SSD: 2 To'],
    stockQty: 3,
  },
  {
    id: 'lumen-g-932',
    name: 'LUMEN G 932',
    price: 949000,
    oldPrice: 1029000,
    imageUrl: '/uploads/sample-7.jpg',
    category: 'LUMEN',
    specs: ['GPU: RTX 4080 Super', 'CPU: i9 14900KF', 'RAM: 32 Go RGB', 'SSD: 2 To'],
    stockQty: 2,
  },
  {
    id: 'lumen-g-4090',
    name: 'LUMEN G 4090',
    price: 1549000,
    oldPrice: 1699000,
    imageUrl: '/uploads/sample-8.jpg',
    category: 'LUMEN',
    specs: ['GPU: RTX 4090', 'CPU: i9 14900KS', 'RAM: 64 Go RGB', 'SSD: 4 To'],
    stockQty: 1,
  },
];

export interface CategoryInfo {
  id?: string;
  name: string;
  imageUrl?: string | null;
}

export const FALLBACK_CATEGORIES: CategoryInfo[] = [{ name: 'PLAY' }, { name: 'LUMEN' }];

export interface StorefrontTexts {
  storeName?: string;
  copyright?: string;
  tagline?: string;
  contactPhone?: string;
  contactEmail?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  [key: string]: unknown;
}

export interface StorefrontSettings {
  storeName?: string;
  bannerText?: string;
  tagline?: string;
  heroImage?: string;
  bgColor?: string;
  surfaceColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  pinned?: string[];
  theme?: string;
  model3d?: string;
  texts?: StorefrontTexts;
}

export function mapRawProduct(raw: any, storeType: string): Product | null {
  const rawType = raw?.storeType;
  if (rawType && rawType !== storeType) return null;
  const name = raw?.name || raw?.product?.name;
  if (!name) return null;
  return {
    id: String(raw?.id ?? name),
    name,
    price: raw?.promoPrice ?? raw?.salePrice ?? raw?.product?.salePrice ?? 0,
    oldPrice: raw?.promoPrice ? (raw?.salePrice ?? raw?.product?.salePrice) : undefined,
    costPrice: raw?.costPrice ?? raw?.product?.costPrice ?? 0,
    imageUrl: raw?.imageUrl || raw?.product?.imageUrl || '',
    modelUrl: raw?.modelUrl || null,
    category: raw?.category?.name,
    specs: raw?.specs,
    stockQty: raw?.stockQty ?? raw?.product?.stockQty ?? 0,
  };
}
