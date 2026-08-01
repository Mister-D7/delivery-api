import type { ThemeProduct } from '../index';
import { SeriesCard } from './SeriesCard';

export function SeriesGrid({ id, title, subtitle, products }: {
  id: string;
  title: string;
  subtitle?: string;
  products: ThemeProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="hpc-series" id={id}>
      <div className="th-wrap">
        <div className="hpc-series-head">
          <p className="hpc-kicker">Gaming PC</p>
          <h2 className="hpc-series-title">{title}</h2>
          {subtitle && <p className="hpc-series-sub">{subtitle}</p>}
        </div>
        <div className="hpc-grid">
          {products.map((p) => <SeriesCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  );
}
