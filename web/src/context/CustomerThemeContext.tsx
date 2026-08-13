import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import api from '../services/api';

export type CustomerTheme = 'pulsar' | 'greens' | 'gaming' | 'preorder';

type Palette = {
  '--pt-bg': string;
  '--pt-surface': string;
  '--pt-surface2': string;
  '--pt-surface3': string;
  '--pt-accent': string;
  '--pt-accent2': string;
  '--pt-grad': string;
  '--pt-grad-soft': string;
  '--pt-grad-text': string;
  '--pt-muted': string;
  '--pt-muted2': string;
  '--pt-success': string;
  '--pt-danger': string;
  '--pt-danger-soft': string;
  '--pt-border': string;
  '--pt-border-strong': string;
  '--pt-border-faint': string;
  '--pt-row-alt': string;
  '--pt-icon-dim': string;
  '--pt-text': string;
  '--pt-font': string;
  '--pt-mono': string;
};

type CustomerThemeCtx = {
  theme: CustomerTheme;
  isGreens: boolean;
  light: boolean;
  toggleLight: () => void;
  cssVars: React.CSSProperties;
  brand: { name: string; sub: string; logo?: string; mark?: string };
  contact: { phone: string; email: string; facebook: string; instagram: string };
};

function readText(v: unknown): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v
      .map((r) =>
        r && typeof r === 'object' && typeof (r as { text?: unknown }).text === 'string'
          ? (r as { text: string }).text
          : ''
      )
      .join(' ')
      .trim();
  }
  if (v && typeof v === 'object') {
    const runs = (v as { runs?: unknown }).runs;
    if (Array.isArray(runs)) {
      return runs
        .map((r) =>
          r && typeof r === 'object' && typeof (r as { text?: unknown }).text === 'string'
            ? (r as { text: string }).text
            : ''
        )
        .join(' ')
        .trim();
    }
    if (typeof (v as { text?: unknown }).text === 'string') return (v as { text: string }).text;
  }
  return '';
}

const FONT_PULSAR = "'Sora', 'Space Grotesk', 'Segoe UI', sans-serif";
const FONT_GREENS = "'Inter', 'Segoe UI', system-ui, sans-serif";
const FONT_GAMING = "'Barlow', 'Segoe UI', system-ui, sans-serif";
const FONT_PREORDER = "'Inter', 'Segoe UI', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

const PALETTES: Record<CustomerTheme, { dark: Palette; light: Palette }> = {
  pulsar: {
    dark: {
      '--pt-bg': '#050508',
      '--pt-surface': '#12121c',
      '--pt-surface2': '#0c0c14',
      '--pt-surface3': '#1a1a26',
      '--pt-accent': '#00e5ff',
      '--pt-accent2': '#8b5cf6',
      '--pt-grad': 'linear-gradient(120deg, #00e5ff, #8b5cf6)',
      '--pt-grad-soft': 'linear-gradient(120deg, #00e5ff20, #8b5cf620)',
      '--pt-grad-text': '#050508',
      '--pt-muted': '#8b8b9a',
      '--pt-muted2': '#54545f',
      '--pt-success': '#4ade80',
      '--pt-danger': '#d9603b',
      '--pt-danger-soft': 'rgba(217, 96, 59, 0.1)',
      '--pt-border': 'rgba(0, 229, 255, 0.12)',
      '--pt-border-strong': 'rgba(0, 229, 255, 0.18)',
      '--pt-border-faint': 'rgba(0, 229, 255, 0.08)',
      '--pt-row-alt': 'rgba(255, 255, 255, 0.02)',
      '--pt-icon-dim': '#2a2a36',
      '--pt-text': '#f2f2f7',
      '--pt-font': FONT_PULSAR,
      '--pt-mono': MONO,
    },
    light: {
      '--pt-bg': '#ffffff',
      '--pt-surface': '#fafaf6',
      '--pt-surface2': '#f4f4ee',
      '--pt-surface3': '#ecece6',
      '--pt-accent': '#00a8bd',
      '--pt-accent2': '#6d28d9',
      '--pt-grad': 'linear-gradient(120deg, #00a8bd, #6d28d9)',
      '--pt-grad-soft': 'linear-gradient(120deg, #00a8bd20, #6d28d920)',
      '--pt-grad-text': '#050508',
      '--pt-muted': '#6b6b74',
      '--pt-muted2': '#a2a2aa',
      '--pt-success': '#16a34a',
      '--pt-danger': '#d9603b',
      '--pt-danger-soft': 'rgba(217, 96, 59, 0.08)',
      '--pt-border': 'rgba(23, 23, 28, 0.09)',
      '--pt-border-strong': 'rgba(23, 23, 28, 0.18)',
      '--pt-border-faint': 'rgba(23, 23, 28, 0.06)',
      '--pt-row-alt': 'rgba(0, 0, 0, 0.03)',
      '--pt-icon-dim': '#c2c2ca',
      '--pt-text': '#17171c',
      '--pt-font': FONT_PULSAR,
      '--pt-mono': MONO,
    },
  },
  greens: {
    dark: {
      '--pt-bg': '#121212',
      '--pt-surface': '#2d2d2d',
      '--pt-surface2': '#1e1e1e',
      '--pt-surface3': '#262626',
      '--pt-accent': '#7bc35f',
      '--pt-accent2': '#364127',
      '--pt-grad': 'linear-gradient(120deg, #7bc35f, #364127)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(123, 195, 95, 0.2), rgba(54, 65, 39, 0.2))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#a0a0a0',
      '--pt-muted2': '#b0b0b0',
      '--pt-success': '#4ade80',
      '--pt-danger': '#f95f09',
      '--pt-danger-soft': 'rgba(249, 95, 9, 0.15)',
      '--pt-border': 'rgba(255, 255, 255, 0.1)',
      '--pt-border-strong': 'rgba(255, 255, 255, 0.16)',
      '--pt-border-faint': 'rgba(123, 195, 95, 0.15)',
      '--pt-row-alt': 'rgba(255, 255, 255, 0.02)',
      '--pt-icon-dim': '#3a3a3a',
      '--pt-text': '#f0f0f0',
      '--pt-font': FONT_GREENS,
      '--pt-mono': MONO,
    },
    light: {
      '--pt-bg': '#ffffff',
      '--pt-surface': '#ffffff',
      '--pt-surface2': '#f8f9fa',
      '--pt-surface3': '#f1f1ec',
      '--pt-accent': '#6bb252',
      '--pt-accent2': '#364127',
      '--pt-grad': 'linear-gradient(120deg, #6bb252, #364127)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(107, 178, 82, 0.2), rgba(54, 65, 39, 0.2))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#747474',
      '--pt-muted2': '#6c757d',
      '--pt-success': '#2e7d32',
      '--pt-danger': '#f95f09',
      '--pt-danger-soft': 'rgba(249, 95, 9, 0.1)',
      '--pt-border': 'rgba(0, 0, 0, 0.08)',
      '--pt-border-strong': 'rgba(0, 0, 0, 0.16)',
      '--pt-border-faint': 'rgba(107, 178, 82, 0.14)',
      '--pt-row-alt': 'rgba(0, 0, 0, 0.02)',
      '--pt-icon-dim': '#cfd5db',
      '--pt-text': '#222222',
      '--pt-font': FONT_GREENS,
      '--pt-mono': MONO,
    },
  },
  gaming: {
    dark: {
      '--pt-bg': '#ffffff',
      '--pt-surface': '#262626',
      '--pt-surface2': '#1d1d1d',
      '--pt-surface3': '#2f2f2f',
      '--pt-accent': '#0ea5e9',
      '--pt-accent2': '#0284c7',
      '--pt-grad': 'linear-gradient(120deg, #0ea5e9, #0284c7)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(14, 165, 233, 0.2), rgba(2, 132, 199, 0.2))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#71717a',
      '--pt-muted2': '#a1a1aa',
      '--pt-success': '#22c55e',
      '--pt-danger': '#ea580c',
      '--pt-danger-soft': 'rgba(234, 88, 12, 0.12)',
      '--pt-border': 'rgba(0, 0, 0, 0.09)',
      '--pt-border-strong': 'rgba(0, 0, 0, 0.18)',
      '--pt-border-faint': 'rgba(14, 165, 233, 0.16)',
      '--pt-row-alt': 'rgba(0, 0, 0, 0.03)',
      '--pt-icon-dim': '#d4d4d8',
      '--pt-text': '#18181b',
      '--pt-font': FONT_GAMING,
      '--pt-mono': MONO,
    },
    light: {
      '--pt-bg': '#ffffff',
      '--pt-surface': '#f4f4f5',
      '--pt-surface2': '#e4e4e7',
      '--pt-surface3': '#d4d4d8',
      '--pt-accent': '#0284c7',
      '--pt-accent2': '#0369a1',
      '--pt-grad': 'linear-gradient(120deg, #0ea5e9, #0284c7)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(14, 165, 233, 0.2), rgba(2, 132, 199, 0.2))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#52525b',
      '--pt-muted2': '#71717a',
      '--pt-success': '#16a34a',
      '--pt-danger': '#c2410c',
      '--pt-danger-soft': 'rgba(234, 88, 12, 0.1)',
      '--pt-border': 'rgba(0, 0, 0, 0.1)',
      '--pt-border-strong': 'rgba(0, 0, 0, 0.2)',
      '--pt-border-faint': 'rgba(14, 165, 233, 0.18)',
      '--pt-row-alt': 'rgba(0, 0, 0, 0.03)',
      '--pt-icon-dim': '#a1a1aa',
      '--pt-text': '#18181b',
      '--pt-font': FONT_GAMING,
      '--pt-mono': MONO,
    },
  },
  preorder: {
    dark: {
      '--pt-bg': '#0b0d11',
      '--pt-surface': '#12151c',
      '--pt-surface2': '#0b0d11',
      '--pt-surface3': '#1a1e28',
      '--pt-accent': '#2a7de1',
      '--pt-accent2': '#7c5cfc',
      '--pt-grad': 'linear-gradient(120deg, #2a7de1, #7c5cfc)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(42, 125, 225, 0.2), rgba(124, 92, 252, 0.2))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#9aa2b1',
      '--pt-muted2': '#5b6270',
      '--pt-success': '#4ade80',
      '--pt-danger': '#f87171',
      '--pt-danger-soft': 'rgba(248, 113, 113, 0.12)',
      '--pt-border': 'rgba(42, 125, 225, 0.14)',
      '--pt-border-strong': 'rgba(42, 125, 225, 0.2)',
      '--pt-border-faint': 'rgba(42, 125, 225, 0.08)',
      '--pt-row-alt': 'rgba(255, 255, 255, 0.02)',
      '--pt-icon-dim': '#262b36',
      '--pt-text': '#f0f2f6',
      '--pt-font': FONT_PREORDER,
      '--pt-mono': MONO,
    },
    light: {
      '--pt-bg': '#f6f7fb',
      '--pt-surface': '#ffffff',
      '--pt-surface2': '#eef1f8',
      '--pt-surface3': '#e6eaf4',
      '--pt-accent': '#2563eb',
      '--pt-accent2': '#7c5cfc',
      '--pt-grad': 'linear-gradient(120deg, #2563eb, #7c5cfc)',
      '--pt-grad-soft': 'linear-gradient(120deg, rgba(37, 99, 235, 0.15), rgba(124, 92, 252, 0.15))',
      '--pt-grad-text': '#ffffff',
      '--pt-muted': '#5b6270',
      '--pt-muted2': '#8a92a2',
      '--pt-success': '#16a34a',
      '--pt-danger': '#dc2626',
      '--pt-danger-soft': 'rgba(220, 38, 38, 0.08)',
      '--pt-border': 'rgba(23, 23, 28, 0.1)',
      '--pt-border-strong': 'rgba(23, 23, 28, 0.2)',
      '--pt-border-faint': 'rgba(37, 99, 235, 0.16)',
      '--pt-row-alt': 'rgba(0, 0, 0, 0.03)',
      '--pt-icon-dim': '#c3c9d4',
      '--pt-text': '#171a21',
      '--pt-font': FONT_PREORDER,
      '--pt-mono': MONO,
    },
  },
};

const BRANDS: Record<CustomerTheme, { name: string; sub: string; logo?: string; mark?: string }> = {
  pulsar: { name: 'PULSAR', sub: 'Designed by DjDr', mark: '▲' },
  greens: { name: 'Organic', sub: 'Le bio, livré chez vous', logo: '/images/logo.svg' },
  gaming: { name: 'Pulsar Gaming', sub: 'Designed By DjDr' },
  preorder: { name: 'Mister-D', sub: 'Software Engineering', mark: '◆' },
};

function themeKey(theme: CustomerTheme): string {
  if (theme === 'greens') return 'greens_theme';
  if (theme === 'gaming') return 'gaming_theme';
  if (theme === 'preorder') return 'preorder_theme';
  return 'pulsar_theme';
}

const CustomerThemeContext = createContext<CustomerThemeCtx>(null!);

function getInitialLight(theme: CustomerTheme): boolean {
  try {
    return localStorage.getItem(themeKey(theme)) === 'light';
  } catch {
    return theme === 'greens';
  }
}
export function CustomerThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CustomerTheme>('pulsar');
  const [light, setLight] = useState<boolean>(() => getInitialLight('pulsar'));
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  useEffect(() => {
    api
      .get('/storefront/settings/storefront')
      .then((r) => {
        const data = r.data && typeof r.data === 'object' ? (r.data as Record<string, unknown>) : {};
        setSettings(data);
        const t: CustomerTheme =
          data.theme === 'greens' ? 'greens' : data.theme === 'gaming' ? 'gaming' : data.theme === 'preorder' ? 'preorder' : 'pulsar';
        setTheme(t);
        setLight(getInitialLight(t));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const key = themeKey(theme);
    try {
      localStorage.setItem(key, light ? 'light' : 'dark');
    } catch {}
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  }, [light, theme]);

  const toggleLight = () => setLight((l) => !l);

  const value = useMemo<CustomerThemeCtx>(() => {
    const palette = PALETTES[theme][light ? 'light' : 'dark'];
    const texts = (settings.texts && typeof settings.texts === 'object' ? settings.texts : {}) as Record<
      string,
      unknown
    >;
    const contact = {
      phone: readText(texts.contactPhone) || readText(texts.phone),
      email: readText(texts.contactEmail) || readText(texts.email),
      facebook: readText(texts.socialFacebook),
      instagram: readText(texts.socialInstagram),
    };
    return {
      theme,
      isGreens: theme === 'greens',
      light,
      toggleLight,
      cssVars: palette as unknown as React.CSSProperties,
      brand: BRANDS[theme],
      contact,
    };
  }, [theme, light, settings]);

  return <CustomerThemeContext.Provider value={value}>{children}</CustomerThemeContext.Provider>;
}

export const useCustomerTheme = () => useContext(CustomerThemeContext);
