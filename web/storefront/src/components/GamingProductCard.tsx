import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { imgSrc } from '../lib/image';
import { formatPrice } from '../lib/format';
import type { Product } from '../lib/data';

export default function GamingProductCard({ p }: { p: Product }) {
  return (
    <div className={`g-prod${p.oldPrice ? ' g-has-promo' : ''}`} data-cat={p.category || ''} data-edit-product={p.id}>
      <div className="g-prod-card">
        <div className="product-media" onClick={() => openProduct(p)} role="button" tabIndex={0} aria-label={p.name}>
          <span className={p.oldPrice ? 'badge-promo' : 'badge-stock'}>{p.oldPrice ? 'Promo' : 'En stock'}</span>
          {p.imageUrl ? <img src={imgSrc(p.imageUrl)} alt={p.name} loading="lazy" /> : null}
        </div>
        <div className="product-brand">{p.category || 'Gaming'}</div>
        <div className="product-title" onClick={() => openProduct(p)}>
          {p.name}
        </div>
        <div className="product-price-row">
          <span className="current-price">{formatPrice(p.price)} DA</span>
          {p.oldPrice ? <span className="old-price">{formatPrice(p.oldPrice)} DA</span> : null}
        </div>
        <button
          type="button"
          className="add-to-cart-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Ajouter « ${p.name} » au panier ?`)) {
              addItem(p);
            }
          }}
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
