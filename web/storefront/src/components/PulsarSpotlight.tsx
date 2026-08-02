import { useStorefront } from '../lib/storefront';
import { openProduct } from '../lib/store';
import { addItem } from '../lib/cart';
import { formatPrice } from '../lib/format';

function parseSpecs(specs?: string[] | string): string[] {
  if (!specs) return [];
  const arr = Array.isArray(specs) ? specs : String(specs).split(/\n|;/);
  return arr.map((s) => String(s).trim()).filter(Boolean);
}

export default function PulsarSpotlight() {
  const { products } = useStorefront();
  const featured = products.find((p) => p.oldPrice) || products[0];
  if (!featured) return null;
  const specs = parseSpecs(featured.specs);
  return (
    <>
      <div>
        <span className="eyebrow">En vedette — {featured.category || 'Nouveauté'}</span>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          {featured.name}
        </h2>
        <p className="section-desc" style={{ marginTop: 16, maxWidth: 'none' }}>
          {specs.length ? specs.slice(0, 3).join(' · ') : 'En stock — expédition rapide et garantie incluse.'}
        </p>
        <div className="spot-specs">
          {specs.slice(0, 4).map((s, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                border: '1px solid var(--border)',
                padding: '6px 12px',
                borderRadius: 20,
                color: 'var(--muted)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="spot-price">
          <span className="now">{formatPrice(featured.price)} DA</span>
          {featured.oldPrice ? <span className="old">{formatPrice(featured.oldPrice)} DA</span> : null}
        </div>
        <a
          href="#"
          className="btn btn-solid"
          onClick={(e) => {
            e.preventDefault();
            openProduct(featured);
            addItem(featured);
          }}
        >
          Ajouter au panier
        </a>
      </div>
    </>
  );
}
