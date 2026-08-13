import { useEffect, useMemo, useState } from 'react';
import { useStorefront } from '../lib/storefront';
import GamingProductCard from './GamingProductCard';

const PRICE_RANGES = [
  { id: '0-25000', label: 'Moins de 25 000 DA', min: 0, max: 25000 },
  { id: '25000-60000', label: '25 000 – 60 000 DA', min: 25000, max: 60000 },
  { id: '60000-120000', label: '60 000 – 120 000 DA', min: 60000, max: 120000 },
  { id: '120000-999999999', label: 'Plus de 120 000 DA', min: 120000, max: Infinity },
];

export default function GamingProductGrid({ initialFilter }: { initialFilter?: string }) {
  const { products, settings } = useStorefront();
  const [filter, setFilter] = useState(initialFilter ?? 'all');
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [priceRange, setPriceRange] = useState('');

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail;
      setFilter(detail?.name ?? 'all');
    };
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent<{ q?: string }>).detail;
      if (typeof detail?.q === 'string') setQuery(detail.q);
    };
    const onBrand = (e: Event) => {
      const detail = (e as CustomEvent<{ brand?: string }>).detail;
      if (typeof detail?.brand === 'string') setBrand(detail.brand);
    };
    window.addEventListener('category:filter', onFilter as EventListener);
    window.addEventListener('brand:filter', onBrand as EventListener);
    window.addEventListener('storefront:search', onSearch as EventListener);
    return () => {
      window.removeEventListener('category:filter', onFilter as EventListener);
      window.removeEventListener('brand:filter', onBrand as EventListener);
      window.removeEventListener('storefront:search', onSearch as EventListener);
    };
  }, []);

  const norm = (s: string) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const shown = useMemo(() => {
    const qn = norm(query);
    const range = PRICE_RANGES.find((r) => r.id === priceRange);
    return products.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (brand && ((p as any).brand || '') !== brand) return false;
      if (range && (p.price < range.min || p.price >= range.max)) return false;
      if (!qn) return true;
      const hay = norm(`${p.name} ${p.category || ''} ${Array.isArray(p.specs) ? p.specs.join(' ') : (p.specs || '')}`);
      return hay.includes(qn);
    });
  }, [products, filter, query, brand, priceRange]);

  return (
    <div className="g-products" id="products">
      <h2 className="g-products-title" data-edit-text="productsTitle" data-text-key="productsTitle">
        {(settings.texts as any)?.productsTitle || 'Popular Products'}
      </h2>
      {filter !== 'all' || brand || priceRange ? (
        <div className="g-toolbar">
          {filter !== 'all' ? (
            <button
              type="button"
              className="g-chip"
              onClick={() => {
                setFilter('all');
                window.dispatchEvent(new CustomEvent('category:filter', { detail: { name: 'all' } }));
              }}
            >
              {filter} ✕
            </button>
          ) : null}
          {brand ? (
            <button
              type="button"
              className="g-chip"
              onClick={() => {
                setBrand('');
              }}
            >
              {brand} ✕
            </button>
          ) : null}
          {priceRange ? (
            <button
              type="button"
              className="g-chip"
              onClick={() => {
                setPriceRange('');
              }}
            >
              {PRICE_RANGES.find((r) => r.id === priceRange)?.label ?? priceRange} ✕
            </button>
          ) : null}
          <span className="g-count">{shown.length} produit{shown.length > 1 ? 's' : ''}</span>
        </div>
      ) : null}
      {filter !== 'all' || brand ? (
        <div className="g-price-chips">
          <span>Prix :</span>
          {PRICE_RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`g-price-chip${priceRange === r.id ? ' active' : ''}`}
              onClick={() => setPriceRange(priceRange === r.id ? '' : r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="g-prod-grid">
        {shown.map((p) => (
          <GamingProductCard key={p.id} p={p} />
        ))}
        {shown.length === 0 ? (
          <p className="g-prod-empty">
            Aucun produit trouvé pour « {query} ».{filter !== 'all' ? ` Vérifiez la catégorie « ${filter} ».` : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}
