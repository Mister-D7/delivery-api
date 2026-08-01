import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import type { ThemeProduct, ThemeSettings } from './index';
import { scopeSkinCss } from './index';

export interface ThemeActions {
  viewProduct: (p: ThemeProduct) => void;
  editProduct?: (p: ThemeProduct) => void;
  contextMenu?: (p: ThemeProduct, x: number, y: number) => void;
  openCart: () => void;
  catFilter: string | null;
  setCatFilter: (cat: string | null) => void;
}

const SettingsCtx = createContext<ThemeSettings>(null!);
const ActionsCtx = createContext<ThemeActions>(null!);

export const useTheme = () => useContext(SettingsCtx);
export const useThemeActions = () => useContext(ActionsCtx);

export function ThemeRoot({ settings, actions, children }: {
  settings: ThemeSettings;
  actions: ThemeActions;
  children: ReactNode;
}) {
  const css = {
    '--accent': settings.accent,
    '--bg': settings.bg,
    '--surface': settings.surface,
    '--ink': settings.ink,
    '--radius': settings.radius,
    '--glow': settings.glow ? settings.accent : 'transparent',
    fontFamily: settings.font,
  } as CSSProperties;

  return (
    <SettingsCtx.Provider value={settings}>
      <ActionsCtx.Provider value={actions}>
        <div
          className={'theme-root' + (settings.glass ? ' theme-glass' : '') + (settings.animation ? ' theme-animate' : '')}
          style={css}
        >
          {settings.skinCss && <style>{scopeSkinCss(settings.skinCss)}</style>}
          {settings.backgroundImage && settings.backgroundType === 'video' && (
            <video className="theme-bg-video" src={settings.backgroundImage} autoPlay muted loop playsInline />
          )}
          {settings.backgroundImage && settings.backgroundType !== 'video' && (
            <div className="theme-bg" style={{ backgroundImage: `url(${settings.backgroundImage})` }} />
          )}
          {children}
        </div>
      </ActionsCtx.Provider>
    </SettingsCtx.Provider>
  );
}
