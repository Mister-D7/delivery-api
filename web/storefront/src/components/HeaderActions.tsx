import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '../lib/cart';
import '../styles/islands.css';

export default function HeaderActions() {
  const { count, openCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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
      <button className="hdr-icon hdr-cart" onClick={openCart} aria-label="Panier">
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M5.757 1.071a.5.5 0 0 1 .172.686L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H.5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 .5 6h1.717L5.07 1.243a.5.5 0 0 1 .686-.172zM2.468 15.426.943 9h14.114l-1.525 6.426a.75.75 0 0 1-.729.574H3.197a.75.75 0 0 1-.729-.574z"/>
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
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"/>
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
