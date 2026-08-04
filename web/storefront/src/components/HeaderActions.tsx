import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '../lib/cart';
import '../styles/islands.css';

export default function HeaderActions() {
  const { count, openCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartRef = useRef<HTMLButtonElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const btn = cartRef.current;
    if (!btn) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const d = Math.hypot(dx, dy);
        if (d < 110) {
          btn.style.setProperty('--mx', `${dx * 0.1}px`);
          btn.style.setProperty('--my', `${dy * 0.1}px`);
          btn.classList.add('magnetic-on');
        } else {
          btn.classList.remove('magnetic-on');
          btn.style.setProperty('--mx', '0px');
          btn.style.setProperty('--my', '0px');
        }
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (globeRef.current && !globeRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuOpen]);

  const logout = () => {
    try {
      localStorage.removeItem('delivery_customer');
      localStorage.removeItem('delivery_customer_token');
    } catch {
      // ignore
    }
    window.location.href = '/auth/login';
  };

  return (
    <div className="hdr-actions">
      <button ref={cartRef} className="hdr-icon hdr-cart" onClick={openCart} aria-label="Panier">
        <span className="hdr-glow" />
        <span className="hdr-spark h-s1" />
        <span className="hdr-spark h-s2" />
        <span className="hdr-spark h-s3" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="21" r="1.4" />
          <circle cx="19" cy="21" r="1.4" />
          <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H6" />
        </svg>
        {mounted && count > 0 ? (
          <span key={count} className="hdr-badge">
            {count}
          </span>
        ) : null}
      </button>

      <div className="hdr-user" ref={globeRef}>
        <button
          className={`hdr-icon hdr-globe${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Mon compte"
          aria-expanded={menuOpen}
        >
          <span className="hdr-glow" />
          <span className="hdr-spark h-s1" />
          <span className="hdr-spark h-s2" />
          <span className="hdr-spark h-s3" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9.4" opacity="0.4" />
            <circle cx="12" cy="7.8" r="3.9" />
            <path d="M5.4 19.4a6.6 6.6 0 0 1 13.2 0" />
          </svg>
        </button>
        {menuOpen ? (
          <div className="hdr-menu">
            <a href="/profile">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
              </svg>
              Mon compte
            </a>
            <a href="/track">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2.5" y="4.5" width="19" height="14" rx="2" />
                <path d="M8 14l3 3 5-6" />
              </svg>
              Suivi de commande
            </a>
            <button className="hdr-logout" onClick={logout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5" />
                <path d="M9 4.5h9a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H9" />
              </svg>
              Déconnexion
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
