import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, type ReactNode } from 'react';

export type ThemeSettings = {
  productOrder: string[];
  categoryOrder: string[];
  fontFamily: string;
  bgColor: string;
  surfaceColor: string;
  textColor: string;
  accentColor: string;
  glowEnabled: boolean;
  glowColor: string;
  animationEnabled: boolean;
  bannerText: string;
  heroImage: string;
  storeName: string;
  tagline: string;
  backgroundImage: string;
  backgroundType: 'color' | 'image' | 'video';
  glassEnabled: boolean;
};

export const DEFAULT_THEME: ThemeSettings = {
  productOrder: [],
  categoryOrder: [],
  fontFamily: "'Unbounded', sans-serif",
  bgColor: '#0a0a0a',
  surfaceColor: '#141414',
  textColor: '#f5f1e8',
  accentColor: '#bfa24e',
  glowEnabled: true,
  glowColor: '#bfa24e',
  animationEnabled: true,
  bannerText: 'Commandez, on vous livre',
  heroImage: '',
  storeName: 'MISTER-DR',
  tagline: 'Parcourez notre catalogue et recevez vos produits directement chez vous.',
  backgroundImage: '',
  backgroundType: 'color',
  glassEnabled: false,
};

const STORAGE_KEY = 'delivery_storefront_theme';

type ThemeContextValue = {
  theme: ThemeSettings;
  isLoading: boolean;
  setTheme: (settings: ThemeSettings) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadFromStorage(): ThemeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_THEME;
}

function saveToStorage(theme: ThemeSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSettings>(loadFromStorage);
  const [isLoading] = useState(false);

  const setTheme = useCallback((settings: ThemeSettings) => {
    setThemeState(settings);
    saveToStorage(settings);
  }, []);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const t = theme;
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', t.bgColor);
    root.style.setProperty('--theme-surface', t.surfaceColor);
    root.style.setProperty('--theme-text', t.textColor);
    root.style.setProperty('--theme-accent', t.accentColor);
    root.style.setProperty('--theme-glow-color', t.glowColor);
    root.style.setProperty('--theme-glow-enabled', t.glowEnabled ? '1' : '0');
    root.style.setProperty('--theme-font', t.fontFamily);
    root.style.setProperty('--theme-animations', t.animationEnabled ? '1' : '0');
    root.style.setProperty('--theme-glass', t.glassEnabled ? '1' : '0');

    if (t.backgroundType !== 'color' && t.backgroundImage) {
      root.style.setProperty('--theme-bg', 'transparent');
    }
  }, [theme]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setThemeState(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const value = useMemo(() => ({ theme, isLoading, setTheme }), [theme, isLoading, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url);
}
