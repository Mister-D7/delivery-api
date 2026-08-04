import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { imgSrc } from '../lib/image';
import { formatPrice } from '../lib/format';
import type { Product } from '../lib/data';

export default function PulsarProductCard({ p }: { p: Product }) {
  return (
    <div className={`card${p.oldPrice ? ' has-promo' : ''}`} data-cat={p.category || ''} data-edit-product={p.id}>
      <div className="card-media" onClick={() => openProduct(p)}>
        <span className={`badge${p.oldPrice ? ' badge-promo' : ''}`}>{p.oldPrice ? 'Promo' : p.modelUrl ? '3D' : 'En stock'}</span>
        {p.imageUrl ? <img src={imgSrc(p.imageUrl)} alt={p.name} loading="lazy" />
          : p.modelUrl ? (
            <div className="card-3d">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                <path d="M12 11l8-4.5M12 11L4 6.5M12 11v9" />
              </svg>
              <span>Modèle 3D</span>
            </div>
          ) : null}
      </div>
      <div className="card-body">
        <span className="card-cat">{p.category || 'Boutique'}</span>
        <h3 className="card-name" onClick={() => openProduct(p)}>{p.name}</h3>
        <div className="card-price">
          <span className="now">{formatPrice(p.price)} DA</span>
          {p.oldPrice ? <span className="old">{formatPrice(p.oldPrice)} DA</span> : null}
        </div>
        <a
          href="#"
          className="btn btn-solid"
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm(`Ajouter « ${p.name} » au panier ?`)) {
              addItem(p);
            }
          }}
        >
          Ajouter au panier
        </a>
      </div>
    </div>
  );
}
