import { useSyncExternalStore, useMemo } from 'react';
import ProductCard from './ProductCard';

const STORE_KEY = 'delivery_storefront_layout';

/* ── Subscribe to localStorage ── */
function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}
function getSnapshot() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.components?.length) return data;
  } catch {}
  return null;
}

type Product = { id: string; catalogId: string; name: string; salePrice: number; promoPrice?: number | null; imageUrl?: string | null; stockQty: number; category?: { id: string; name: string } | null; specs?: string | null; erpProductId?: string | null; customName?: string | null; customPrice?: number | null };
type Category = { id: string; name: string; imageUrl?: string | null };

/* ── Parse columns from inline grid style ── */
function gridColumns(html: string): number {
  const m = /grid-template-columns\s*:\s*repeat\((\d+)/.exec(html);
  return m ? Number(m[1]) : 3;
}

/* ── Render a single GrapesJS component ── */
function renderComponent(
  node: any,
  idx: number,
  products: Product[],
  categories: Category[],
  cat: string,
  q: string,
  accentColor: string,
  bgColor: string,
  surfaceColor: string,
  glass: boolean,
  setDetailProduct: (p: Product | null) => void,
): JSX.Element | null {
  const html = (node.content || '') as string;
  const children = node.components || [];

  /* ── Product grid ── */
  if (html.includes('gjs-product-grid')) {
    const cols = gridColumns(html);
    return (
      <section key={idx} className="px-4 pb-12" style={{ background: 'transparent' }}>
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#8c8578' }}>Aucun produit trouvé</p>
            </div>
          ) : (
            <div
              className="grid gap-3 md:gap-5"
              style={{
                gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)`,
              }}
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  catalogId={p.catalogId}
                  erpProductId={p.erpProductId}
                  customName={p.customName}
                  customPrice={p.customPrice}
                  name={p.name}
                  price={p.salePrice}
                  promoPrice={p.promoPrice}
                  imageUrl={p.imageUrl}
                  stockQty={p.stockQty}
                  specs={p.specs}
                  index={i}
                  glass={glass}
                  onClick={() => setDetailProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ── Category bar ── */
  if (html.includes('gjs-category-bar')) {
    return categories.length > 0 ? (
      <section key={idx} className="px-4 pb-6" style={{ background: 'transparent' }}>
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(c => (
            <span
              key={c.id}
              className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{ background: cat === c.name ? accentColor : 'rgba(191,162,78,0.1)', color: cat === c.name ? bgColor : '#8c8578', border: `1px solid ${accentColor}20` }}
            >
              {c.name}
            </span>
          ))}
        </div>
      </section>
    ) : null;
  }

  /* ── Render child components recursively ── */
  if (children.length > 0) {
    return (
      <div key={idx}>
        {children.map((c: any, i: number) =>
          renderComponent(c, i, products, categories, cat, q, accentColor, bgColor, surfaceColor, glass, setDetailProduct)
        )}
      </div>
    );
  }

  /* ── Render HTML as-is ── */
  if (html) {
    return <section key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return null;
}

/* ── StorefrontRenderer ── */
export default function StorefrontRenderer({
  products, categories, cat, q,
  accentColor, bgColor, surfaceColor, glass,
  setDetailProduct,
}: {
  products: Product[];
  categories: Category[];
  cat: string;
  q: string;
  accentColor: string;
  bgColor: string;
  surfaceColor: string;
  glass: boolean;
  setDetailProduct: (p: Product | null) => void;
}) {
  const layout = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const components = layout?.components ?? [];

  if (!components.length) return null;

  return (
    <>
      {components.map((node: any, i: number) =>
        renderComponent(node, i, products, categories, cat, q, accentColor, bgColor, surfaceColor, glass, setDetailProduct)
      )}
    </>
  );
}
