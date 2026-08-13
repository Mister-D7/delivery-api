import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function HScroll({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });
  const drag = useRef<{ startX: number; scrollLeft: number; scrolling: boolean; moved: boolean } | null>(null);

  const update = () => {
    const el = viewportRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScroll(max > 1);
    if (max <= 1) {
      setThumb({ left: 0, width: 0 });
      return;
    }
    const width = Math.max((el.clientWidth / el.scrollWidth) * 100, 10);
    const left = (el.scrollLeft / max) * (100 - width);
    setThumb({ left, width });
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [children]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const suppressClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      el.removeEventListener('click', suppressClick, true);
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      if (!d.scrolling && Math.abs(dx) > 6) {
        d.scrolling = true;
        el.classList.add('hs-dragging');
      }
      if (d.scrolling) {
        d.moved = true;
        el.scrollLeft = d.scrollLeft - dx;
        e.preventDefault();
      }
    };
    const onUp = () => {
      const d = drag.current;
      drag.current = null;
      el.classList.remove('hs-dragging');
      if (d?.moved) el.addEventListener('click', suppressClick, true);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointerleave', onUp);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
    };
  }, []);

  const onViewDown = (e: React.PointerEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, scrollLeft: el.scrollLeft, scrolling: false, moved: false };
  };

  const onThumbDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = viewportRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    const startX = e.clientX;
    const startScroll = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    const move = (ev: PointerEvent) => {
      el.scrollLeft = startScroll + (ev.clientX - startX) * (max / bar.clientWidth);
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  return (
    <div className={'hs' + (className ? ' ' + className : '')}>
      <div
        className="hs-viewport"
        ref={viewportRef}
        onPointerDown={onViewDown}
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      {canScroll ? (
        <div className="hs-scrollbar" ref={barRef}>
          <div
            className="hs-thumb"
            style={{ left: thumb.left + '%', width: thumb.width + '%' }}
            onPointerDown={onThumbDown}
          />
        </div>
      ) : null}
    </div>
  );
}
