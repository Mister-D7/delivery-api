import type { MouseEvent } from 'react';
import { useThemeActions } from '../ThemeRoot';

export function da(n: number): string {
  return n.toLocaleString('fr-FR') + ' DA';
}

export default function Link({ to, className, children }: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { openCart } = useThemeActions();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    if (to === 'cart') { e.preventDefault(); openCart(); return; }
    if (to.startsWith('#')) {
      const el = document.querySelector(to);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    if (to.startsWith('http')) return;
    e.preventDefault();
    window.location.href = to;
  };

  return (
    <a href={to} className={className} onClick={handle}>{children}</a>
  );
}
