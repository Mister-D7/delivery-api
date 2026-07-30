import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ContextMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  color?: string;
  divider?: boolean;
  disabled?: boolean;
};

type Props = {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onClose: () => void;
};

export default function ContextMenu({ items, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) onClose();
  }, [onClose]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!position) return;
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [position, handleClickOutside, handleKey]);

  if (!position) return null;

  const adjustedX = Math.min(position.x, window.innerWidth - 200);
  const adjustedY = Math.min(position.y, window.innerHeight - items.length * 40 - 10);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.1 }}
      className="fixed z-[100] py-1.5 rounded-xl shadow-2xl min-w-[180px]"
      style={{
        left: adjustedX,
        top: adjustedY,
        background: '#1a1a1a',
        border: '1px solid rgba(191,162,78,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {items.map((item, i) => {
        if (item.divider) {
          return <div key={i} className="my-1 mx-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />;
        }
        return (
          <button
            key={i}
            onClick={() => { if (!item.disabled) { item.onClick(); onClose(); } }}
            disabled={item.disabled}
            className="w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: item.disabled ? '#555' : (item.color || '#ccc'),
              cursor: item.disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(191,162,78,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {item.icon && <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>}
            {item.label}
          </button>
        );
      })}
    </motion.div>
  );
}

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  return { menu, onContextMenu, closeMenu };
}
