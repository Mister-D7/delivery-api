import { useCartStore } from '../lib/cart';

export default function CartButton() {
  const { count, openCart } = useCartStore();
  return (
    <button className="cart-btn" aria-label="Panier" onClick={openCart}>
      Panier <span className="cart-count">{count}</span>
    </button>
  );
}
