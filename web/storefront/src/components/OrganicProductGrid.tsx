import { useEffect, useMemo, useState } from 'react';
import { useStorefront } from '../lib/storefront';
import OrganicProductCard from './OrganicProductCard';

function norm(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function editDist(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function fuzzyOk(qn: string, text: string): boolean {
  if (!qn) return true;
  const threshold = Math.max(1, Math.floor(qn.length / 3));
  const wl = qn.length;
  for (let i = 0; i + wl <= text.length; i++) {
    if (editDist(qn, text.slice(i, i + wl)) <= threshold) return true;
  }
  return editDist(qn, text) <= threshold + 2;
}

function matches(p: { name: string; specs?: string[] | string }, q: string): boolean {
  const qn = norm(q);
  if (!qn) return true;
  const hay = norm(`${p.name} ${Array.isArray(p.specs) ? p.specs.join(' ') : (p.specs || '')}`);
  if (hay.includes(qn)) return true;
  return fuzzyOk(qn, hay);
}

export default function OrganicProductGrid({ initialFilter }: { initialFilter?: string }) {
  const { products } = useStorefront();
  const [filter, setFilter] = useState(initialFilter ?? 'all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'default' | 'low' | 'high'>('default');

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail;
      setFilter(detail?.name ?? 'all');
    };
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string; category?: string }>).detail;
      if (detail && typeof detail.query === 'string') setQuery(detail.query);
      if (detail && typeof detail.category === 'string') {
        setFilter(detail.category === 'all' || !detail.category ? 'all' : detail.category);
      }
    };
    window.addEventListener('category:filter', onFilter as EventListener);
    window.addEventListener('og:search', onSearch as EventListener);
    return () => {
      window.removeEventListener('category:filter', onFilter as EventListener);
      window.removeEventListener('og:search', onSearch as EventListener);
    };
  }, []);

  const clear = () => {
    setFilter('all');
    window.dispatchEvent(new CustomEvent('category:filter', { detail: { name: 'all' } }));
  };

  const shown = useMemo(() => {
    let list = products.filter((p) => (filter === 'all' || p.category === filter) && matches(p, query));
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, filter, query, sort]);

  return (
    <>
      <div className="grid-toolbar">
        <div className="grid-filters">
          {filter !== 'all' && (
            <span className="grid-filter-chip">
              <span className="grid-filter-chip-name">{filter}</span>
              <button type="button" className="grid-filter-clear" onClick={clear} aria-label="Retirer le filtre" title="Afficher tous les produits">
                ✕
              </button>
            </span>
          )}
          <label className="grid-sort">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 7h12M8 12h9M8 17h6" />
              <path d="M3.5 6.5l1.8 1.8 1.8-1.8M3.5 11.5l1.8 1.8 1.8-1.8M3.5 16.5l1.8 1.8 1.8-1.8" />
            </svg>
            <select value={sort} onChange={(e) => setSort(e.target.value as 'default' | 'low' | 'high')} aria-label="Trier par prix">
              <option value="default">Trier par prix</option>
              <option value="low">Prix : du plus bas au plus élevé</option>
              <option value="high">Prix : du plus élevé au plus bas</option>
            </select>
          </label>
        </div>
        <span className="grid-count">
          {shown.length} produit{shown.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit… (ex: pain, lait, fromage)"
          aria-label="Rechercher un produit"
        />
        {query ? (
          <button type="button" className="grid-search-clear" onClick={() => setQuery('')} aria-label="Effacer">
            ✕
          </button>
        ) : null}
      </div>
      <div className="grid">
        {shown.map((p) => (
          <OrganicProductCard key={p.id} p={p} />
        ))}
        {shown.length === 0 ? (
          <p className="grid-empty">
            Aucun produit trouvé pour « {query} ».{filter !== 'all' ? ` Vérifiez la catégorie « ${filter} ».` : ''}
          </p>
        ) : null}
      </div>
    </>
  );
}
