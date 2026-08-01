import { useCart } from '../../context/CartContext';
import type { ThemeProduct } from '../index';
import { useThemeActions } from '../ThemeRoot';
import { da } from './Link';

export default function ProductCard({ product, delay = 0 }: {
  product: ThemeProduct;
  delay?: number;
}) {
  const { addItem } = useCart();
  const { viewProduct, contextMenu, editProduct } = useThemeActions();
  const off = product.oldPrice != null && product.oldPrice > product.price;
  const pct = off ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;

  return (
    <article
      className="th-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => viewProduct(product)}
      onContextMenu={e => {
        e.preventDefault();
        if (contextMenu) contextMenu(product, e.clientX, e.clientY);
        else if (editProduct) editProduct(product);
      }}
    >
      <div className="th-card-media">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} />
          : <div className="th-card-ph" />}
        {off && <span className="th-badge">-{pct}%</span>}
        {product.stockQty != null && product.stockQty <= 0 && (
          <div className="th-soldout">Rupture</div>
        )}
      </div>
      <div className="th-card-body">
        <h3 className="th-card-name">{product.name}</h3>
        {product.category && <p className="th-card-cat">{product.category}</p>}
        <div className="th-card-foot">
          <div className="th-price">
            <span className="th-now">{da(product.price)}</span>
            {off && <span className="th-old">{da(product.oldPrice!)}</span>}
          </div>
          <button
            className="th-add"
            aria-label="Ajouter au panier"
            onClick={e => {
              e.stopPropagation();
              if (product.stockQty == null || product.stockQty > 0) {
                addItem({ id: product.id, catalogId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
              }
            }}
          >+</button>
        </div>
      </div>
    </article>
  );
}
