import { useEffect, useState } from 'react';
import { addItem, openCart } from '../lib/cart';
import { imgSrc } from '../lib/image';
import { formatPrice } from '../lib/format';
import '../styles/islands.css';

type ComboProduct = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  qty: number;
};

type Combo = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
  products: ComboProduct[];
  totalValue: number;
  savings: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function CombosSection() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/delivery/combos/active', {
          signal: AbortSignal.timeout(8000),
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (!alive) return;
        setCombos(Array.isArray(json?.combos) ? json.combos : []);
        setStatus('ok');
      } catch {
        if (!alive) return;
        setStatus('offline');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleAdd = (c: Combo) => {
    addItem(
      {
        id: `combo:${c.id}`,
        name: c.name,
        price: c.price,
        imageUrl: c.imageUrl || undefined,
      },
      1
    );
    openCart();
  };

  return (
    <div className="combos">
      <div className="combos-head">
        <span className="combos-eyebrow">Combo offers</span>
        <h2 className="combos-title">Offres combinées</h2>
        <p className="combos-sub">Des packs malins, jusqu'à 50% de remise.</p>
      </div>

      {status === 'loading' && <p className="combos-empty">Chargement des offres…</p>}
      {status === 'offline' && <p className="combos-empty">Impossible de charger les offres pour le moment.</p>}
      {status === 'ok' && combos.length === 0 && <p className="combos-empty">Aucune offre combinée disponible pour le moment.</p>}

      {combos.length > 0 && (
        <div className="combos-grid">
          {combos.map((c) => {
            const pct = c.totalValue > 0 ? Math.round((c.savings / c.totalValue) * 100) : 0;
            return (
              <article className="combo-card" key={c.id}>
                <div className="combo-media">
                  {c.imageUrl ? (
                    <img src={imgSrc(c.imageUrl)} alt={c.name} loading="lazy" />
                  ) : (
                    <span className="combo-media-fallback">🧺</span>
                  )}
                  {c.savings > 0 && (
                    <span className="combo-badge">-{pct}%</span>
                  )}
                </div>
                <div className="combo-body">
                  <h3 className="combo-name">{c.name}</h3>
                  {c.description ? <p className="combo-desc">{c.description}</p> : null}
                  <ul className="combo-products">
                    {c.products.map((p) => (
                      <li key={p.productId} className="combo-product">
                        <span className="combo-product-qty">{p.qty}×</span>
                        <span className="combo-product-name">{p.name}</span>
                        {p.price > 0 ? (
                          <span className="combo-product-price">{formatPrice(p.price * p.qty)} DA</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <div className="combo-prices">
                    {c.totalValue > 0 && (
                      <del className="combo-total">{formatPrice(c.totalValue)} DA</del>
                    )}
                    <span className="combo-price">{formatPrice(c.price)} DA</span>
                  </div>
                  {c.savings > 0 && (
                    <p className="combo-savings">Économisez {formatPrice(c.savings)} DA</p>
                  )}
                  <button type="button" className="combo-add" onClick={() => handleAdd(c)}>
                    Ajouter
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
