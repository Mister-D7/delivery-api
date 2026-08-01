import { useModalStore, closeProduct, setQty } from '../lib/store';
import { addItem } from '../lib/cart';
import { useStorefront } from '../lib/storefront';
import { formatPrice } from '../lib/format';
import '../styles/islands.css';

export default function ProductModal() {
  const { product, qty } = useModalStore();
  const { settings } = useStorefront();
  if (!product) return null;
  const specs = Array.isArray(product.specs)
    ? product.specs
    : product.specs
      ? String(product.specs).split(/\n|;/).map((s) => s.trim()).filter(Boolean)
      : [];
  const addToCart = () => {
    addItem(product, qty);
    closeProduct();
  };
  return (
    <div className="iso-backdrop iso-modal-backdrop" onClick={closeProduct}>
      <div className="iso-modal" role="dialog" aria-label={product.name} onClick={(e) => e.stopPropagation()}>
        <button className="iso-close iso-modal-close" onClick={closeProduct} aria-label="Fermer">
          ×
        </button>
        <div className="iso-modal-media">
          {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : null}
          <span className="badge">En stock</span>
        </div>
        <div className="iso-modal-body">
          <span className="iso-eyebrow">{settings.storeName || 'NEXUS'}</span>
          <h3 className="card-name">{product.name}</h3>
          {specs.length ? (
            <ul className="iso-specs">
              {specs.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : null}
          <div className="price-block">
            <div className="price-row">
              <span className="price-now">{formatPrice(product.price)} DA</span>
              {product.oldPrice ? (
                <span className="price-old">{formatPrice(product.oldPrice)} DA</span>
              ) : null}
            </div>
            <span className="price-month">dès {formatPrice(product.price / 12)} DA/mois</span>
          </div>
          <div className="iso-qty-row">
            <span className="iso-qty-label">Quantité</span>
            <div className="iso-stepper">
              <button
                className="iso-qty-btn"
                onClick={() => setQty(qty - 1)}
                aria-label="Diminuer la quantité"
              >
                −
              </button>
              <span className="iso-qty-num">{qty}</span>
              <button
                className="iso-qty-btn"
                onClick={() => setQty(qty + 1)}
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>
          </div>
          <button className="btn btn-solid iso-add" onClick={addToCart}>
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
