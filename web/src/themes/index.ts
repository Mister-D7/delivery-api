import type { ComponentType } from 'react';
import pulsar from './pulsar';
import greens from './greens';
import DefaultPage from './ui/DefaultPage';

export const CUSTOM_THEMES_KEY = 'delivery_custom_themes';

export type StoreType = 'tech' | 'gaming' | 'clothes' | 'grocery' | 'food';

export interface ThemeSettings {
  accent: string;
  bg: string;
  surface: string;
  ink: string;
  font: string;
  radius: string;
  glow: boolean;
  glass: boolean;
  animation: boolean;
  skinCss?: string;
  backgroundImage?: string;
  backgroundType?: 'color' | 'image' | 'video';
}

export interface ThemeProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  imageUrl?: string;
  category?: string;
  specs?: string;
  stockQty: number;
  storeType?: string | null;
}

export interface ThemeCategory {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface ThemeData {
  storeName: string;
  tagline: string;
  bannerText: string;
  products: ThemeProduct[];
  categories: ThemeCategory[];
}

export interface ThemePage {
  id: string;
  name: string;
  storeType: StoreType;
  description: string;
  preview: string;
  defaults: ThemeSettings;
  skinCss?: string;
  Component: ComponentType<ThemeData>;
}

export interface CustomTheme {
  id: string;
  name: string;
  storeType: StoreType;
  description: string;
  css: string;
}

export const STORE_TYPES: { type: StoreType; label: string; emoji: string }[] = [
  { type: 'tech', label: 'Tech', emoji: '🖥️' },
  { type: 'gaming', label: 'Gaming', emoji: '🎮' },
  { type: 'clothes', label: 'Vêtements & Mode', emoji: '👔' },
  { type: 'grocery', label: 'Épicerie & Bio', emoji: '🛒' },
  { type: 'food', label: 'Food & Agro', emoji: '🍽️' },
];

export function getStoreType(): StoreType {
  try {
    const t = localStorage.getItem('delivery_store_type');
    if (t && STORE_TYPES.some(s => s.type === t)) return t as StoreType;
  } catch {}
  return 'tech';
}

export function storeTypeForTheme(theme?: string): StoreType {
  if (theme) {
    const t = registry.find(p => p.id === theme);
    if (t) return t.storeType;
  }
  return 'tech';
}

export function themeSettingsKey(id: string): string {
  return `delivery_storefront_theme_${id}`;
}

export function loadSavedSettings(id: string): Record<string, any> {
  try {
    const perTheme = localStorage.getItem(themeSettingsKey(id));
    if (perTheme) return JSON.parse(perTheme);
    const legacy = localStorage.getItem('delivery_storefront_theme');
    if (legacy) return JSON.parse(legacy);
  } catch {}
  return {};
}

export function saveSettingsForTheme(id: string, settings: Record<string, any>) {
  try { localStorage.setItem(themeSettingsKey(id), JSON.stringify(settings)); } catch {}
}

export function scopeSkinCss(css: string): string {
  return css
    .replace(/(^|[\s,])html([\s,{])/g, '$1.theme-root$2')
    .replace(/(^|[\s,])body([\s,{])/g, '$1.theme-root$2')
    .replace(/(^|[\s,])body\s+/g, '$1.theme-root ')
    .replace(/:root\b/g, '.theme-root');
}

export function storeTypeLabel(type: string): string {
  return STORE_TYPES.find(s => s.type === type)?.label || type;
}

export function filterProductsForStore<T extends { storeType?: string | null }>(products: T[], storeType: StoreType): T[] {
  return products.filter(p => !p.storeType || p.storeType === storeType);
}

const registry: ThemePage[] = [pulsar, greens];

const CUSTOM_BASE_DEFAULTS: ThemeSettings = {
  accent: '#2563eb',
  bg: '#ffffff',
  surface: '#f4f4f5',
  ink: '#18181b',
  font: "'Inter', system-ui, sans-serif",
  radius: '12px',
  glow: false,
  glass: false,
  animation: true,
};

function getCustomThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (raw) return JSON.parse(raw) as CustomTheme[];
  } catch {}
  return [];
}

function saveCustomThemes(list: CustomTheme[]) {
  try { localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(list)); } catch {}
}

function customToThemePage(c: CustomTheme): ThemePage {
  return {
    id: c.id,
    name: c.name,
    storeType: c.storeType,
    description: c.description,
    preview: '',
    defaults: { ...CUSTOM_BASE_DEFAULTS, ...{ skinCss: c.css } },
    skinCss: c.css,
    Component: DefaultPage,
  };
}

export function getThemePages(storeType?: StoreType): ThemePage[] {
  const customs = getCustomThemes().map(customToThemePage);
  const all = [...registry, ...customs];
  if (!storeType) return all;
  return all.filter(t => t.storeType === storeType);
}

export function getThemePage(id: string): ThemePage | undefined {
  const custom = getCustomThemes().find(c => c.id === id);
  if (custom) return customToThemePage(custom);
  return registry.find(t => t.id === id);
}

export function getActiveTheme(storeType: StoreType): ThemePage | undefined {
  try {
    const saved = localStorage.getItem('delivery_selected_template');
    if (saved) {
      const t = getThemePage(saved);
      if (t) return t;
    }
  } catch {}
  return getThemePages(storeType)[0];
}

export function selectTheme(id: string) {
  try { localStorage.setItem('delivery_selected_template', id); } catch {}
}

export function importCustomTheme(name: string, storeType: StoreType, description: string, css: string): CustomTheme {
  const id = `custom-${Date.now().toString(36)}`;
  const t: CustomTheme = { id, name, storeType, description, css };
  saveCustomThemes([...getCustomThemes(), t]);
  return t;
}

export function deleteCustomTheme(id: string) {
  saveCustomThemes(getCustomThemes().filter(c => c.id !== id));
}

export function mergeSettings(defaults: ThemeSettings, saved: Record<string, any> | undefined | null): ThemeSettings {
  const s = saved || {};
  return {
    accent: s.accentColor || defaults.accent,
    bg: s.bgColor || defaults.bg,
    surface: s.surfaceColor || defaults.surface,
    ink: s.textColor || defaults.ink,
    font: s.fontFamily || defaults.font,
    radius: defaults.radius,
    glow: s.glowEnabled ?? defaults.glow,
    glass: s.glassEnabled ?? defaults.glass,
    animation: s.animationEnabled ?? defaults.animation,
    skinCss: s.skinCss ?? defaults.skinCss,
    backgroundImage: s.backgroundImage ?? defaults.backgroundImage,
    backgroundType: s.backgroundType ?? defaults.backgroundType,
  };
}
