import { useCartStore, removeItem, updateQty, clearCart } from '../lib/cart';
import { formatPrice } from '../lib/format';
import '../styles/islands.css';

export default function CartDrawer() {
  const { items, total, isCartOpen, closeCart } = useCartStore();
  if (!isCartOpen) return null;
  return (
    <div className="iso-backdrop" onClick={closeCart}>
      <aside className="iso-drawer" role="dialog" aria-label="Panier" onClick={(e) => e.stopPropagation()}>
        <header className="iso-drawer-head">
          <span className="iso-eyebrow">Votre panier</span>
          <button className="iso-close" onClick={closeCart} aria-label="Fermer le panier">
            ×
          </button>
        </header>
        {items.length === 0 ? (
          <div className="iso-empty">
            <p>Votre panier est vide.</p>
            <a href="#play" className="btn btn-outline" onClick={closeCart}>
              Voir les PC
            </a>
          </div>
        ) : (
          <>
            <ul className="iso-items">
              {items.map((it) => (
                <li className="iso-item" key={it.id}>
                  <div className="iso-item-media">
                    {it.imageUrl ? <img src={it.imageUrl} alt={it.name} /> : null}
                  </div>
                  <div className="iso-item-body">
                    <div className="iso-item-name">{it.name}</div>
                    <div className="iso-item-line">
                      <button
                        className="iso-qty-btn"
                        onClick={() => updateQty(it.id, it.qty - 1)}
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span className="iso-qty-num">{it.qty}</span>
                      <button
                        className="iso-qty-btn"
                        onClick={() => updateQty(it.id, it.qty + 1)}
                        aria-label="Augmenter la quantité"
                      >
                        +
                      </button>
                      <button className="iso-remove" onClick={() => removeItem(it.id)}>
                        Retirer
                      </button>
                    </div>
                    <div className="iso-item-price">{formatPrice(it.price * it.qty)} DA</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="iso-clear">
              <button className="iso-remove" onClick={clearCart}>
                Vider le panier
              </button>
            </div>
          </>
        )}
        <footer className="iso-drawer-foot">
          <div className="iso-total-row">
            <span className="iso-total-label">Total</span>
            <span className="iso-total">{formatPrice(total)} DA</span>
          </div>
          <a className="btn btn-solid iso-checkout" href="/checkout" onClick={closeCart}>
            Passer la commande
          </a>
        </footer>
      </aside>
    </div>
  );
}
