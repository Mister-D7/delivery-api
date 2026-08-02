import { useStorefront } from '../lib/storefront';

const ICONS: [RegExp, string][] = [
  [/jeu|game|play|console|playstation|xbox|switch/i, '🎮'],
  [/télé|phone|smart|mobile|samsung|iphone/i, '📱'],
  [/charge|power|batterie|chargeur/i, '⚡'],
  [/pc|ordinateur|laptop|portable|écran|gaming pc/i, '💻'],
  [/écoute|audio|casque|enceinte/i, '🎧'],
  [/vêt|mode|chemise|t-shirt|robe|chaussure/i, '👕'],
  [/livre|book/i, '📚'],
];

function iconFor(name: string): string {
  for (const [re, ic] of ICONS) if (re.test(name)) return ic;
  return '🛒';
}

const FALLBACK_CATS = [
  { name: 'Jeux vidéo', imageUrl: null },
  { name: 'Accessoires', imageUrl: null },
  { name: 'Téléphones', imageUrl: null },
  { name: 'PC', imageUrl: null },
];

function slug(name: string): string {
  return encodeURIComponent(name.toLowerCase());
}

export default function PulsarCategories() {
  const { categories } = useStorefront();
  const cats = categories.length ? categories.slice(0, 4) : FALLBACK_CATS;
  const isEdit = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('edit');
  const slots = Math.max(0, 4 - cats.length);
  return (
    <div className="cat-grid" id="catGrid">
      {cats.map((c) => (
        <a
          key={c.id || c.name}
          href={`/categorie/${slug(c.name)}`}
          className="cat-card"
          data-tilt
          data-edit-category={c.id || ''}
          data-cat-name={c.name}
        >
          <div className="cat-icon">
            {c.imageUrl ? <img src={c.imageUrl} alt={c.name} loading="lazy" /> : <span className="cat-emoji">{iconFor(c.name)}</span>}
          </div>
          <div>
            <h3>{c.name}</h3>
            <p>VOIR LA COLLECTION</p>
          </div>
          <span className="cat-arrow">↗</span>
        </a>
      ))}
      {isEdit &&
        Array.from({ length: slots }).map((_, i) => (
          <button
            key={`add-${i}`}
            type="button"
            className="cat-card cat-add"
            onClick={() => window.dispatchEvent(new CustomEvent('category:edit', { detail: { id: null } }))}
          >
            <div className="cat-icon cat-add-icon">
              <span>+</span>
            </div>
            <div>
              <h3>Ajouter</h3>
              <p>NOUVELLE CATÉGORIE</p>
            </div>
            <span className="cat-arrow">↗</span>
          </button>
        ))}
    </div>
  );
}
