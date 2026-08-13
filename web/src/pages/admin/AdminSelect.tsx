import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from '../../components/adminIcons';

type AdminOption = { value: string; label: string };
type MenuStyle = { top: number; left: number; width: number; maxHeight: number };

export default function AdminSelect({ value, onChange, options, placeholder, title, className, style }: {
  value: string;
  onChange: (v: string) => void;
  options: AdminOption[];
  placeholder?: string;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuStyle | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !rootRef.current) return;

    const btn = rootRef.current.getBoundingClientRect();
    const card = rootRef.current.closest('[class*="max-w-"]') as HTMLElement | null;
    const cardRect = card ? card.getBoundingClientRect() : null;

    const width = Math.max(cardRect ? cardRect.width : btn.width, 220);
    const left = Math.min(Math.max(8, cardRect ? cardRect.left : btn.left), Math.max(8, window.innerWidth - width - 8));
    const top = btn.bottom + 4;
    const maxHeight = Math.min(240, Math.max(120, window.innerHeight - top - 8));

    setMenu({ top, left, width: Math.min(width, window.innerWidth - 16), maxHeight });

    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (popupRef.current && popupRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className || ''}`} style={style}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title={title}
        className="w-full flex items-center justify-between gap-1 text-left"
        style={{
          background: 'var(--admin-bg)',
          color: selected ? 'var(--admin-text)' : 'var(--admin-muted2)',
          border: '1px solid var(--admin-border2)',
          padding: className && className.includes('py-1.5') ? '6px 8px' : '8px 12px',
          fontSize: className && className.includes('text-[10px]') ? '10px' : '12px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} style={{ color: 'var(--admin-muted2)', flexShrink: 0 }} />
      </button>
      {open && menu && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            top: menu.top,
            left: menu.left,
            width: menu.width,
            maxHeight: menu.maxHeight,
            overflow: 'auto',
            zIndex: 1000,
            background: '#ffffff',
            border: '1px solid #dddddd',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            borderRadius: '10px',
            padding: '4px 0',
          }}
        >
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              onMouseEnter={() => setHover(o.value)}
              onMouseLeave={() => setHover(v => (v === o.value ? null : v))}
              className="w-full px-3 py-2 text-left"
              style={{
                background: o.value === value
                  ? '#faf3de'
                  : hover === o.value ? '#f2f2f2' : '#ffffff',
                color: o.value === value ? '#8a7530' : '#111111',
                fontSize: className && className.includes('text-[10px]') ? '10px' : '12px',
                cursor: 'pointer',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
