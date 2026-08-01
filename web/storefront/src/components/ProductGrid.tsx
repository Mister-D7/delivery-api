import type { Product } from '../lib/data';
import { useStorefront } from '../lib/storefront';
import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { formatPrice } from '../lib/format';

interface Props {
  sectionTitle: string;
}

const DEFAULT_SPECS = ['Garantie: 12 mois', 'Testé: 48h'];

function partition(products: Product[], sectionTitle: string): Product[] {
  const isLumen = sectionTitle.toLowerCase().includes('lumen');
  if (!isLumen) {
    const play = products.filter((p) => /play/i.test(p.category || ''));
    return play.length ? play : products;
  }
  const lumen = products.filter((p) => /lumen/i.test(p.category || ''));
  if (lumen.length) return lumen;
  const promos = products.filter((p) => p.oldPrice);
  if (promos.length) return promos;
  return products.filter((p) => !/play/i.test(p.category || ''));
}

function parseSpecs(specs?: string[] | string): string[] {
  if (!specs) return DEFAULT_SPECS;
  const arr = Array.isArray(specs) ? specs : String(specs).split(/\n|;/);
  const out = arr.map((s) => String(s).trim()).filter(Boolean);
  return out.length ? out : DEFAULT_SPECS;
}

function SpecChip({ spec }: { spec: string }) {
  const idx = spec.indexOf(':');
  if (idx > 0) {
    const label = spec.slice(0, idx);
    const value = spec.slice(idx + 1).trim();
    return (
      <span className="spec-chip">
        {label} <b>{value}</b>
      </span>
    );
  }
  return <span className="spec-chip">{spec}</span>;
}

export default function ProductGrid({ sectionTitle }: Props) {
  const { products } = useStorefront();
  const shown = partition(products, sectionTitle);
  const isLumen = sectionTitle.toLowerCase().includes('lumen');
  return (
    <div className="grid">
      {shown.map((p) => (
        <div
          className={`card${isLumen ? ' lumen' : ''}`}
          key={p.id}
          onClick={() => openProduct(p)}
        >
          <div className="card-media">
            <span className="badge">En stock</span>
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" /> : null}
          </div>
          <div className="card-body">
            <h3 className="card-name">{p.name}</h3>
            <div className="spec-chips">
              {parseSpecs(p.specs).map((s, i) => (
                <SpecChip key={i} spec={s} />
              ))}
            </div>
            <div className="price-block">
              <span className="price-label">À partir de</span>
              <div className="price-row">
                <span className="price-now">{formatPrice(p.price)} DA</span>
                {p.oldPrice ? <span className="price-old">{formatPrice(p.oldPrice)} DA</span> : null}
              </div>
              <span className="price-month">dès {formatPrice(p.price / 12)} DA/mois</span>
            </div>
            <div className="card-actions">
              <a
                href="#"
                className="btn btn-solid"
                onClick={(e) => {
                  e.preventDefault();
                  openProduct(p);
                  addItem(p);
                }}
              >
                Configurer et acheter
              </a>
              <a
                href="#"
                className="details-link"
                onClick={(e) => {
                  e.preventDefault();
                  openProduct(p);
                }}
              >
                Détails
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
