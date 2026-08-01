import { useState } from 'react';
import { useStorefront } from '../lib/storefront';
import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { formatPrice } from '../lib/format';

const FALLBACK_CATS = ['Jeux vidéo', 'Accessoires', 'Téléphones', 'PC'];

export default function PulsarProductGrid() {
  const { products, categories } = useStorefront();
  const [filter, setFilter] = useState('all');
  const cats = categories.length ? categories : FALLBACK_CATS;
  const shown = filter === 'all' ? products : products.filter((p) => p.category === filter);
  return (
    <>
      <div className="pills">
        <button className={`pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          Tous
        </button>
        {cats.map((c) => (
          <button key={c} className={`pill${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid">
        {shown.map((p) => (
          <div className="card" key={p.id} data-cat={p.category || ''}>
            <div className="card-media">
              <span className="badge">{p.oldPrice ? 'Promo' : 'En stock'}</span>
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
        ))}
      </div>
    </>
  );
}
