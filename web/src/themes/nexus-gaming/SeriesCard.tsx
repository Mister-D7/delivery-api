import { useState, type MouseEvent } from 'react';
import type { ThemeProduct } from '../index';
import { useThemeActions } from '../ThemeRoot';
import { useCart } from '../../context/CartContext';

export function formatDA(n: number): string {
  return n.toLocaleString('fr-FR') + ' DA';
}

export function SeriesCard({ product }: { product: ThemeProduct }) {
  const actions = useThemeActions();
  const { addItem } = useCart();
  const [imgErr, setImgErr] = useState(false);

  const specs = (product.specs || '')
    .split(/\n|;|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  const monthly = Math.round(product.price / 12);

  const onAdd = (e: MouseEvent) => {
    e.stopPropagation();
    addItem({ id: product.id, catalogId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
  };

  return (
    <article className="hpc-card" onClick={() => actions.viewProduct(product)}>
      <div className="hpc-card-media">
        {product.imageUrl && !imgErr ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setImgErr(true)} />
        ) : (
          <span className="hpc-ph">{product.name}</span>
        )}
        <span className="hpc-stock">En stock</span>
        <button className="hpc-add" onClick={onAdd} aria-label="Ajouter au panier">+</button>
      </div>
      <div className="hpc-card-body">
        <h3 className="hpc-title">{product.name}</h3>
        {specs.length > 0 && (
          <div className="hpc-specs">
            {specs.slice(0, 6).map((s, i) => <span key={i + s} className="hpc-chip">{s}</span>)}
          </div>
        )}
        <div className="hpc-price-row">
          <div className="hpc-price-box">
            <span className="hpc-from">À partir de</span>
            <span className="hpc-price">{formatDA(product.price)}</span>
            {product.oldPrice ? <span className="hpc-old">{formatDA(product.oldPrice)}</span> : null}
          </div>
          <span className="hpc-monthly">dès {formatDA(monthly)}/mois</span>
        </div>
        <div className="hpc-cta">
          <button className="hpc-btn" onClick={(e) => { e.stopPropagation(); actions.viewProduct(product); }}>
            Configurer et acheter
          </button>
          <button className="hpc-link" onClick={(e) => { e.stopPropagation(); actions.viewProduct(product); }}>
            Détails →
          </button>
        </div>
      </div>
    </article>
  );
}
