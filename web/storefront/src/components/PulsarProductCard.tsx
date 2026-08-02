import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { formatPrice } from '../lib/format';
import type { Product } from '../lib/data';

export default function PulsarProductCard({ p }: { p: Product }) {
  return (
    <div className={`card${p.oldPrice ? ' has-promo' : ''}`} data-cat={p.category || ''} data-edit-product={p.id}>
      <div className="card-media">
        <span className={`badge${p.oldPrice ? ' badge-promo' : ''}`}>{p.oldPrice ? 'Promo' : 'En stock'}</span>
        {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : null}
      </div>
      <div className="card-body">
        <span className="card-cat">{p.category || 'Boutique'}</span>
        <h3 className="card-name">{p.name}</h3>
        <div className="card-price">
          <span className="now">{formatPrice(p.price)} DA</span>
          {p.oldPrice ? <span className="old">{formatPrice(p.oldPrice)} DA</span> : null}
        </div>
        <a
          href="#"
          className="btn btn-solid"
          onClick={(e) => {
            e.preventDefault();
            openProduct(p);
            addItem(p);
          }}
        >
          Ajouter au panier
        </a>
      </div>
    </div>
  );
}
