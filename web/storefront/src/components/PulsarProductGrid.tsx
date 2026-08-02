import { useState } from 'react';
import { useStorefront } from '../lib/storefront';
import PulsarProductCard from './PulsarProductCard';

const FALLBACK_CATS = [{ name: 'Jeux vidéo' }, { name: 'Accessoires' }, { name: 'Téléphones' }, { name: 'PC' }];

export default function PulsarProductGrid({ initialFilter }: { initialFilter?: string }) {
  const { products, categories } = useStorefront();
  const [filter, setFilter] = useState(initialFilter ?? 'all');
  const cats = categories.length ? categories : FALLBACK_CATS;
  const shown = filter === 'all' ? products : products.filter((p) => p.category === filter);
  return (
    <>
      <div className="pills">
        <button className={`pill${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          Tous
        </button>
        {cats.map((c) => (
          <button key={c.id || c.name} className={`pill${filter === c.name ? ' active' : ''}`} onClick={() => setFilter(c.name)}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid">
        {shown.map((p) => (
          <PulsarProductCard key={p.id} p={p} />
        ))}
      </div>
    </>
  );
}
