import { useState } from 'react';
import { useStorefront } from '../lib/storefront';
import { slugify } from '../lib/slug';
import PulsarProductCard from './PulsarProductCard';

export default function PulsarCategoryPage({ name }: { name?: string }) {
  const { products, categories } = useStorefront();
  const [slug] = useState(() => {
    if (typeof window === 'undefined') return '';
    return (window.location.pathname.split('/').filter(Boolean)[1] || '').toLowerCase();
  });
  const live = categories.find((c) => slugify(c.name) === slug) || (name ? { name } : undefined);
  const catName = live?.name || name || 'Catégorie';
  const shown = products.filter((p) => p.category === catName);
  return (
    <>
      <span className="eyebrow">Catégorie</span>
      <h2 className="section-title cat-page-title">{catName}</h2>
      <p className="section-desc">
        {shown.length} produit{shown.length > 1 ? 's' : ''} dans cette catégorie — livré chargé et prêt à être associé.
      </p>
      {shown.length ? (
        <div className="grid">
          {shown.map((p) => (
            <PulsarProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="cat-empty">
          Aucun produit dans cette catégorie pour le moment.
        </div>
      )}
    </>
  );
}
