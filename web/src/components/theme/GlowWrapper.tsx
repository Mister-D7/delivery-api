import type { ReactNode } from 'react';
import { useTheme } from '../../context/ThemeContext';

type GlowTarget = 'productCards' | 'categories' | 'hero';

export default function GlowWrapper({ target, children, className = '' }: { target: GlowTarget; children: ReactNode; className?: string }) {
  const { theme } = useTheme();
  const shouldGlow = theme.glowEnabled;

  if (!shouldGlow) return <>{children}</>;

  return <div className={`glow-active ${className}`}>{children}</div>;
}
