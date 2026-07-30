import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';

export type AdminBg = { type: 'color' | 'image' | 'video'; value: string };
export type ThemeMode = 'dark' | 'light';

export type AdminTheme = {
  mode: ThemeMode;
  bg: AdminBg;
};

type Ctx = {
  theme: AdminTheme;
  setMode: (mode: ThemeMode) => void;
  setBg: (bg: AdminBg) => void;
};

const KEY = 'delivery_admin_theme';
const LIGHT: AdminTheme = { mode: 'light', bg: { type: 'color', value: '#f5f5f0' } };
const DARK: AdminTheme = { mode: 'dark', bg: { type: 'color', value: '#0a0a0a' } };

function load(): AdminTheme {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DARK;
}

function save(t: AdminTheme) {
  localStorage.setItem(KEY, JSON.stringify(t));
}

const DARK_VARS: Record<string, string> = {
  '--admin-bg': '#0a0a0a',
  '--admin-surface': 'rgba(17,17,17,0.55)',
  '--admin-surface2': '#1a1a1a',
  '--admin-surface3': '#222',
  '--admin-text': '#f5f1e8',
  '--admin-muted': '#8c8578',
  '--admin-muted2': '#555',
  '--admin-muted3': '#444',
  '--admin-border': 'rgba(191,162,78,0.16)',
  '--admin-border2': 'rgba(191,162,78,0.12)',
  '--admin-border3': 'rgba(191,162,78,0.1)',
  '--admin-gold': '#bfa24e',
  '--admin-gold-bg': 'rgba(191,162,78,0.15)',
  '--admin-gold-light': '#d4b96a',
  '--admin-danger': '#d9603b',
  '--admin-danger-bg': 'rgba(217,96,59,0.1)',
  '--admin-success': '#4caf50',
  '--admin-success-bg': 'rgba(76,175,80,0.15)',
  '--admin-warning': '#ff9800',
  '--admin-warning-bg': 'rgba(255,152,0,0.15)',
  '--admin-overlay': 'rgba(0,0,0,0.6)',
};

const LIGHT_VARS: Record<string, string> = {
  '--admin-bg': '#f5f5f0',
  '--admin-surface': '#ffffff',
  '--admin-surface2': '#ffffff',
  '--admin-surface3': '#e8e8e3',
  '--admin-text': '#111',
  '--admin-muted': '#5a5a5a',
  '--admin-muted2': '#666',
  '--admin-muted3': '#7a7a7a',
  '--admin-border': 'rgba(0,0,0,0.16)',
  '--admin-border2': 'rgba(0,0,0,0.1)',
  '--admin-border3': 'rgba(0,0,0,0.07)',
  '--admin-gold': '#8a7530',
  '--admin-gold-bg': 'rgba(138,117,48,0.12)',
  '--admin-gold-light': '#a68d44',
  '--admin-danger': '#d9603b',
  '--admin-danger-bg': 'rgba(217,96,59,0.08)',
  '--admin-success': '#4caf50',
  '--admin-success-bg': 'rgba(76,175,80,0.1)',
  '--admin-warning': '#ff9800',
  '--admin-warning-bg': 'rgba(255,152,0,0.1)',
  '--admin-overlay': 'rgba(0,0,0,0.3)',
};

const AdminThemeCtx = createContext<Ctx>({
  theme: DARK, setMode: () => {}, setBg: () => {},
});

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>(load);

  const applyTheme = useCallback((t: AdminTheme) => {
    const root = document.documentElement;
    const vars = t.mode === 'dark' ? DARK_VARS : LIGHT_VARS;
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
    root.style.setProperty('--admin-bg-actual', t.bg.type === 'color' ? t.bg.value : 'transparent');
    root.style.setProperty('--admin-mode', t.mode);
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme, applyTheme]);

  const setMode = useCallback((mode: ThemeMode) => {
    setTheme(prev => {
      const next = mode === 'dark' ? { ...DARK, bg: prev.bg.type !== 'color' ? prev.bg : DARK.bg } : LIGHT;
      save(next);
      return next;
    });
  }, []);

  const setBg = useCallback((bg: AdminBg) => {
    setTheme(prev => {
      const next = { ...prev, bg, mode: 'dark' as ThemeMode };
      save(next);
      return next;
    });
  }, []);

  return (
    <AdminThemeCtx.Provider value={useMemo(() => ({ theme, setMode, setBg }), [theme, setMode, setBg])}>
      {children}
    </AdminThemeCtx.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeCtx);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url);
}
