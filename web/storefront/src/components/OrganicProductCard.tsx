import { useState } from 'react';
import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { imgSrc } from '../lib/image';
import { formatPrice } from '../lib/format';
import type { Product } from '../lib/data';

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function Stars({ p }: { p: Product }) {
  const h = idHash(p.id);
  const filled = 4 + (h % 2);
  const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);
  const count = 120 + (h % 780);
  return (
    <div className="pi-rating">
      <span className="pi-stars" aria-label={`${filled} étoiles sur 5`}>{stars}</span>
      <span className="pi-count">({count})</span>
    </div>
  );
}

export default function OrganicProductCard({ p }: { p: Product }) {
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);

  return (
    <div className={`product-item card h-100 border-0 shadow-sm pi-card${p.oldPrice ? ' has-promo' : ''}`} data-cat={p.category || ''} data-edit-product={p.id}>
      <div className="pi-media">
        {p.oldPrice ? (
          <span className="pi-badge">Promo</span>
        ) : (
          <span className="pi-badge pi-badge-new">Nouveau</span>
        )}
        {p.imageUrl ? (
          <img src={imgSrc(p.imageUrl)} alt={p.name} loading="lazy" onClick={() => openProduct(p)} style={{ cursor: 'pointer' }} />
        ) : p.modelUrl ? (
          <div className="pi-3d">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
              <path d="M12 11l8-4.5M12 11L4 6.5M12 11v9" />
            </svg>
            <span>Modèle 3D</span>
          </div>
        ) : null}
      </div>
      <div className="pi-body">
        <span className="pi-cat">{p.category || 'Boutique'}</span>
        <h3 className="pi-name" onClick={() => openProduct(p)}>{p.name}</h3>
        <Stars p={p} />
        <div className="pi-price">
          {p.oldPrice ? <del className="pi-old">{formatPrice(p.oldPrice)} DA</del> : null}
          <span className="pi-now">{formatPrice(p.price)} DA</span>
        </div>
        <div className="pi-actions">
          <div className="pi-stepper">
            <button type="button" className="pi-qty" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Moins">−</button>
            <span className="pi-qty-val">{qty}</span>
            <button type="button" className="pi-qty" onClick={() => setQty((q) => q + 1)} aria-label="Plus">+</button>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm pi-add"
            onClick={() => addItem(p, qty)}
          >
            Add
          </button>
          <button
            type="button"
            className={`pi-fav${fav ? ' on' : ''}`}
            onClick={() => setFav((f) => !f)}
            aria-label="Favori"
            title="Favori"
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
