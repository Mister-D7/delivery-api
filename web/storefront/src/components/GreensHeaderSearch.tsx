import { useEffect, useState } from 'react';
import { useStorefront } from '../lib/storefront';

export default function GreensHeaderSearch() {
  const { categories } = useStorefront();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail;
      setCategory(detail?.name && detail.name !== 'all' ? detail.name : '');
    };
    window.addEventListener('category:filter', onFilter as EventListener);
    return () => window.removeEventListener('category:filter', onFilter as EventListener);
  }, []);

  const sync = (q: string, cat: string) => {
    window.dispatchEvent(new CustomEvent('og:search', { detail: { query: q, category: cat } }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    sync(query, category);
    const el = document.getElementById('lineup');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <form className="og-search" id="ogSearchForm" onSubmit={submit}>
      <select
        aria-label="Catégorie"
        value={category}
        onChange={(e) => {
          const next = e.target.value;
          setCategory(next);
          sync(query, next);
          window.dispatchEvent(new CustomEvent('category:filter', { detail: { name: next || 'all' } }));
        }}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id || c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search products..."
        aria-label="Rechercher"
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          sync(next, category);
        }}
      />
      <button type="submit" className="og-search-btn" aria-label="Rechercher">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      </button>
    </form>
  );
}
