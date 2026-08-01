import { useCart } from '../../context/CartContext';
import { useThemeActions } from '../ThemeRoot';
import Link from './Link';

export default function Header({ storeName, links = [] }: {
  storeName: string;
  links?: { label: string; to: string }[];
}) {
  const { count } = useCart();
  const { openCart } = useThemeActions();

  return (
    <header className="th-head">
      <div className="th-head-inner">
        <a className="th-logo" href="#top"><span className="th-logo-mark" />{storeName}</a>
        {links.length > 0 && (
          <nav className="th-nav">
            {links.map(l => <Link key={l.label} to={l.to}>{l.label}</Link>)}
          </nav>
        )}
        <div className="th-head-actions">
          <button className="th-cart" onClick={openCart}>
            Panier{count > 0 && <span className="th-cart-badge">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
