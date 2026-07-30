import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { isVideoUrl } from './ThemeContext';

type AdminBg = {
  type: 'color' | 'image' | 'video';
  value: string;
};

type Ctx = {
  bg: AdminBg;
  setBg: (bg: AdminBg) => void;
};

const KEY = 'delivery_admin_bg';
const DEFAULT: AdminBg = { type: 'color', value: '#0a0a0a' };

function load(): AdminBg {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT;
}

function save(bg: AdminBg) {
  localStorage.setItem(KEY, JSON.stringify(bg));
}

const AdminBgContext = createContext<Ctx>({ bg: DEFAULT, setBg: () => {} });

export function AdminBackgroundProvider({ children }: { children: ReactNode }) {
  const [bg, setBgState] = useState<AdminBg>(load);

  const setBg = useCallback((b: AdminBg) => {
    setBgState(b);
    save(b);
  }, []);

  return <AdminBgContext.Provider value={useMemo(() => ({ bg, setBg }), [bg, setBg])}>{children}</AdminBgContext.Provider>;
}

export function useAdminBg() {
  return useContext(AdminBgContext);
}

export function adminBgStyle(bg: AdminBg): React.CSSProperties {
  if (bg.type === 'color') return { background: bg.value };
  return { background: 'transparent' };
}

export function adminShowVideo(bg: AdminBg): boolean {
  return bg.type === 'video' && !!bg.value && isVideoUrl(bg.value);
}

export function adminShowImage(bg: AdminBg): boolean {
  return bg.type === 'image' && !!bg.value;
}
