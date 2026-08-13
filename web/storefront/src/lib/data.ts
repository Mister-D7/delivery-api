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

export type SliderType = 'horizontal' | 'vertical' | 'fade' | 'cards' | 'coverflow' | 'cube' | 'flip' | 'grid';
export type SliderWidth = 'full' | 'three-quarters' | 'two-thirds' | 'half' | 'third' | 'quarter' | 'custom';

export type SlideLink =
  | { linkType: 'category'; categoryName: string }
  | { linkType: 'product'; productId: string }
  | { linkType: 'url'; url: string };

export interface SlideBlock {
  id: string;
  imageUrl: string;
  label?: string;
  link: SlideLink;
}

export interface SliderSection {
  id: string;
  kind: 'slider';
  type: SliderType;
  width: SliderWidth;
  widthPct?: number;
  hero?: boolean;
  slides: SlideBlock[];
}

export interface SpecialCategory {
  id: string;
  name: string;
  imageUrl?: string;
  sections: string[];
  products: string[];
}

export interface SpecialSection {
  id: string;
  kind: 'special';
  categoryId?: string;
  title?: string;
}

export type PageSectionKind =
  | 'slider' | 'hero'
  | 'features' | 'banners'
  | 'categories' | 'products' | 'combos'
  | 'promos' | 'popular' | 'recommended' | 'about'
  | 'spotlight' | 'marquee' | 'why' | 'stats' | 'newsletter'
  | 'special';

export type PageSection = SliderSection | SpecialSection | { id: string; kind: Exclude<PageSectionKind, 'slider' | 'special'> };

export const SLIDER_TYPE_LABELS: Record<SliderType, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  fade: 'Fondu',
  cards: 'Cartes',
  coverflow: 'Coverflow',
  cube: 'Cube',
  flip: 'Flip',
  grid: 'Grille',
};

export const SLIDER_WIDTH_LABELS: Record<SliderWidth, string> = {
  full: 'Pleine largeur',
  'three-quarters': '3/4',
  'two-thirds': '2/3',
  half: 'Moitié',
  third: '1/3',
  quarter: '1/4',
  custom: 'Personnalisé…',
};

export function uid(prefix = 's'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function productsOfSpecialCategory(cat: SpecialCategory | undefined, products: Product[]): Product[] {
  if (!cat) return [];
  return products.filter((p) => cat.products.includes(p.id));
}

export function defaultHeroSlide(): SlideBlock {
  return { id: 'slide-hero-1', imageUrl: '/images/banner-1.jpg', label: '', link: { linkType: 'url', url: '#shop' } };
}

export function defaultSliderSection(hero = false): SliderSection {
  return {
    id: hero ? 'default-hero' : `slider_${Math.random().toString(36).slice(2, 7)}`,
    kind: 'slider',
    type: hero ? 'fade' : 'horizontal',
    width: 'full',
    hero,
    slides: [defaultHeroSlide()],
  };
}

export type StorefrontVariant = 'greens' | 'gaming' | 'pulsar' | 'preorder';

export function defaultPageSections(variant: StorefrontVariant): PageSection[] {
  const hero: SliderSection = {
    id: 'default-hero',
    kind: 'slider',
    type: 'fade',
    width: 'full',
    hero: true,
    slides: [defaultHeroSlide()],
  };
  if (variant === 'greens') {
    return [
      hero,
      { id: 'sec-features', kind: 'features' },
      { id: 'sec-categories', kind: 'categories' },
      { id: 'sec-products', kind: 'products' },
      { id: 'sec-combos', kind: 'combos' },
      { id: 'sec-banners', kind: 'banners' },
    ];
  }
  if (variant === 'gaming') {
    return [
      hero,
      { id: 'sec-promos', kind: 'promos' },
      { id: 'sec-categories', kind: 'categories' },
      { id: 'sec-popular', kind: 'popular' },
      { id: 'sec-recommended', kind: 'recommended' },
      { id: 'sec-products', kind: 'products' },
      { id: 'sec-about', kind: 'about' },
      { id: 'sec-newsletter', kind: 'newsletter' },
    ];
  }
  return [
    hero,
    { id: 'sec-marquee', kind: 'marquee' },
    { id: 'sec-categories', kind: 'categories' },
    { id: 'sec-spotlight', kind: 'spotlight' },
    { id: 'sec-products', kind: 'products' },
    { id: 'sec-why', kind: 'why' },
    { id: 'sec-stats', kind: 'stats' },
    { id: 'sec-newsletter', kind: 'newsletter' },
  ];
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
  logoUrl?: string;
  pinned?: string[];
  theme?: string;
  model3d?: string;
  preorderStart?: string;
  preorderWindowDays?: number;
  preorderPrice?: number;
  preorderStrike?: number;
  texts?: StorefrontTexts;
  sections?: PageSection[];
  specialCategories?: SpecialCategory[];
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
