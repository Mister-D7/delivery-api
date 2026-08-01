import type { ThemeProduct } from '../index';
import ProductCard from './ProductCard';

export default function ProductGrid({ title = 'Nos produits', products, columns = 4 }: {
  title?: string;
  products: ThemeProduct[];
  columns?: number;
}) {
  return (
    <section className="th-grid-sec" id="catalogue">
      <div className="th-grid-head">
        <h2 className="th-grid-title">{title}</h2>
        <span className="th-count">{products.length} réf.</span>
      </div>
      {products.length === 0 ? (
        <p className="th-empty">Aucun produit pour le moment.</p>
      ) : (
        <div className="th-grid" style={{ ['--cols' as any]: columns }}>
          {products.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 60} />)}
        </div>
      )}
    </section>
  );
}
